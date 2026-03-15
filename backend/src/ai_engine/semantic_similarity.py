"""
AI Semantic Code Understanding
Detect semantically similar functions using CodeBERT embeddings.
"""

import os
import ast
import hashlib
import logging
from typing import List, Dict, Any
from itertools import combinations
from sklearn.metrics.pairwise import cosine_similarity

from src.ai_engine.embeddings import embed_code
from src.ai_engine.similarity_detection import detect_similarity

MAX_FILES = 30
MAX_FUNCTIONS = 120
MAX_FILE_SIZE = 15000


# In-memory embedding cache: hash(file_content) -> {func_name: embedding}
_embedding_cache: Dict[str, Dict[str, Any]] = {}


def _file_hash(file_path: str) -> str:
    """Compute MD5 hash of a file for cache invalidation."""
    with open(file_path, "r", encoding="utf-8") as f:
        return hashlib.md5(f.read().encode()).hexdigest()


def extract_functions(file_path: str) -> List[Dict[str, str]]:
    """
    Extract all Python function definitions from a file using AST.
    Returns list of {name, source, file} dicts.
    """
    functions = []

    # Skip dunder/trivial method names
    SKIP_NAMES = {
        '__init__', '__str__', '__repr__', '__len__', '__eq__', '__hash__',
        '__lt__', '__gt__', '__le__', '__ge__', '__ne__', '__bool__',
        '__enter__', '__exit__', '__iter__', '__next__', '__getitem__',
        '__setitem__', '__delitem__', '__contains__', '__call__',
        'setUp', 'tearDown', 'setUpClass', 'tearDownClass',
    }

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            source = f.read()

        tree = ast.parse(source)
        lines = source.splitlines()

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                # Skip dunder and trivial methods
                if node.name in SKIP_NAMES or node.name.startswith('__'):
                    continue

                start = node.lineno - 1
                end = node.end_lineno if hasattr(node, "end_lineno") and node.end_lineno else start + 1
                func_source = "\n".join(lines[start:end])

                # Require substantial function bodies (at least 3 lines / 50 chars)
                if len(func_source.strip()) > 50 and (end - start) >= 3:
                    functions.append({
                        "name": node.name,
                        "source": func_source,
                        "file": file_path
                    })

    except Exception:
        pass

    return functions


def find_semantic_duplicates(repo_path: str, threshold: float = 0.95, max_results: int = 20) -> List[Dict[str, Any]]:
    """
    Walk the repo, extract functions, embed with CodeBERT,
    and find semantically similar pairs above the threshold.

    Returns list of:
    {
        "file1": str, "function1": str,
        "file2": str, "function2": str,
        "similarity": float
    }
    """
    global _embedding_cache

    all_functions = []
    all_embeddings = []

    # Limit to smaller set for performance
    file_count = 0

    logging.info("Semantic analysis started")

    for root, dirs, files in os.walk(repo_path):
        # Skip hidden dirs, common non-source dirs, and test dirs
        dirs[:] = [d for d in dirs if not d.startswith('.') and not any(skip in d.lower() for skip in [
            'node_modules', 'venv', '.venv', '__pycache__', '.git',
            'dist', 'build', '.tox', '.eggs', 'test', 'spec', 'tests'
        ])]

        for file in files:
            if not file.endswith(".py"):
                continue

            path = os.path.join(root, file)
            
            # Skip large files to save CPU
            if os.path.getsize(path) > MAX_FILE_SIZE:
                continue

            file_count += 1
            if file_count > MAX_FILES:
                break

            path = os.path.join(root, file)
            rel_path = os.path.relpath(path, repo_path)

            try:
                fhash = _file_hash(path)
            except Exception:
                continue

            # Check cache
            if fhash in _embedding_cache:
                cached = _embedding_cache[fhash]
                for func_name, embedding in cached.items():
                    all_functions.append({
                        "name": func_name,
                        "file": rel_path
                    })
                    all_embeddings.append(embedding)
                continue

            # Extract and embed functions
            funcs = extract_functions(path)
            file_cache = {}

            for func in funcs:
                try:
                    embedding = embed_code(func["source"])
                    all_functions.append({
                        "name": func["name"],
                        "file": rel_path
                    })
                    all_embeddings.append(embedding)
                    file_cache[func["name"]] = embedding
                except Exception:
                    continue

            # Cache embeddings for this file
            if file_cache:
                _embedding_cache[fhash] = file_cache

            if len(all_functions) >= MAX_FUNCTIONS:
                all_functions = all_functions[:MAX_FUNCTIONS]
                all_embeddings = all_embeddings[:MAX_FUNCTIONS]
                break

        if file_count > MAX_FILES or len(all_functions) >= MAX_FUNCTIONS:
            break

    logging.info(f"Functions analyzed: {len(all_functions)}")

    if len(all_embeddings) < 2:
        logging.info("Semantic analysis completed (insufficient functions)")
        return []

    # Find similar pairs bounding length
    results = []
    
    # Custom fast bounded pairing fallback if detect_similarity is too slow
    # but for now we'll do direct pairwise since combinations is faster on <120 N
    # We sample combinations limiting to the subset
    
    for i, j in combinations(range(len(all_embeddings)), 2):
        fi = all_functions[i]
        fj = all_functions[j]

        # Skip same-file, same-function matches
        if fi["file"] == fj["file"] and fi["name"] == fj["name"]:
            continue

        sim_score = float(cosine_similarity(
            all_embeddings[i].reshape(1, -1),
            all_embeddings[j].reshape(1, -1)
        )[0][0])

        if sim_score >= threshold:
            results.append({
                "file1": fi["file"],
                "function1": fi["name"],
                "file2": fj["file"],
                "function2": fj["name"],
                "similarity": round(sim_score, 2)
            })

    # Sort by similarity descending, cap at max_results
    results.sort(key=lambda x: x["similarity"], reverse=True)
    
    logging.info("Semantic analysis completed")

    return results[:max_results]
