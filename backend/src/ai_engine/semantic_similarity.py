"""
AI Semantic Code Understanding
Detect semantically similar functions using CodeBERT embeddings.
"""

import os
import ast
import hashlib
from typing import List, Dict, Any

from src.ai_engine.embeddings import embed_code
from src.ai_engine.similarity_detection import detect_similarity


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

    # Limit to 2000 files for performance
    file_count = 0

    for root, dirs, files in os.walk(repo_path):
        # Skip hidden dirs and common non-source dirs
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in (
            'node_modules', 'venv', '.venv', '__pycache__', '.git',
            'dist', 'build', '.tox', '.eggs'
        )]

        for file in files:
            if not file.endswith(".py"):
                continue

            file_count += 1
            if file_count > 2000:
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

        if file_count > 2000:
            break

    if len(all_embeddings) < 2:
        return []

    # Find similar pairs
    similar_indices = detect_similarity(all_embeddings)

    results = []
    for i, j in similar_indices:
        fi = all_functions[i]
        fj = all_functions[j]

        # Skip same-file, same-function matches
        if fi["file"] == fj["file"] and fi["name"] == fj["name"]:
            continue

        from sklearn.metrics.pairwise import cosine_similarity
        sim_score = float(cosine_similarity(
            all_embeddings[i], all_embeddings[j]
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

    return results[:max_results]
