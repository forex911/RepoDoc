"""
Bug Prone File Prediction
Identify risky modules using weighted metrics.
"""

import os
from typing import List, Dict, Any


def predict_risky_files(
    repo_path: str,
    complexity_report: List[Dict],
    churn: List,
    contributors: Dict,
    large_modules: List[Dict],
    top_n: int = 10
) -> List[Dict[str, Any]]:
    """
    Combine multiple metrics into a per-file risk score.

    risk_score = complexity * 0.4 + churn * 0.3 + contributors * 0.2 + size_factor * 0.1

    All factors are normalized to [0, 1] before weighting.

    Returns top N risky files as [{file, risk_score, details}].
    """

    # Gather all known files
    all_files = set()

    # --- Complexity per file ---
    complexity_map = {}
    for item in complexity_report:
        f = item.get("file", "")
        rel = _make_relative(f, repo_path)
        all_files.add(rel)
        complexity_map[rel] = max(complexity_map.get(rel, 0), item.get("complexity", 0))

    # --- Churn per file ---
    churn_map = {}
    if isinstance(churn, list):
        for entry in churn:
            if isinstance(entry, (list, tuple)) and len(entry) >= 2:
                f, count = entry[0], entry[1]
                all_files.add(f)
                churn_map[f] = count
    elif isinstance(churn, dict):
        for f, count in churn.items():
            all_files.add(f)
            churn_map[f] = count

    # --- File size (line count) ---
    size_map = {}
    for item in large_modules:
        f = item.get("file", "")
        rel = _make_relative(f, repo_path)
        all_files.add(rel)
        size_map[rel] = item.get("lines", 0)

    # Walk repo for files not yet in size_map
    try:
        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in (
                'node_modules', 'venv', '__pycache__', '.git'
            )]
            for file in files:
                if file.endswith(".py"):
                    path = os.path.join(root, file)
                    rel = os.path.relpath(path, repo_path)
                    if rel not in size_map:
                        try:
                            with open(path, "r", encoding="utf-8") as fh:
                                size_map[rel] = len(fh.readlines())
                            all_files.add(rel)
                        except Exception:
                            pass
    except Exception:
        pass

    # --- Contributor count per file (from git blame approximation) ---
    # Use total contributor count as a proxy (higher = more risk)
    total_contributors = len(contributors) if isinstance(contributors, dict) else 1
    contributor_factor = min(total_contributors / 10.0, 1.0)  # normalize

    if not all_files:
        return []

    # --- Normalize values ---
    max_complexity = max(complexity_map.values()) if complexity_map else 1
    max_churn = max(churn_map.values()) if churn_map else 1
    max_size = max(size_map.values()) if size_map else 1

    # --- Calculate risk scores ---
    risk_scores = []

    for f in all_files:
        if not f.endswith(".py"):
            continue

        c = complexity_map.get(f, 0) / max(max_complexity, 1)
        ch = churn_map.get(f, 0) / max(max_churn, 1)
        sz = size_map.get(f, 0) / max(max_size, 1)

        risk_score = (
            c * 0.4 +
            ch * 0.3 +
            contributor_factor * 0.2 +
            sz * 0.1
        )

        if risk_score > 0.05:  # filter out near-zero
            risk_scores.append({
                "file": f,
                "risk_score": round(risk_score, 2),
                "complexity": round(c, 2),
                "churn": round(ch, 2),
                "size": round(sz, 2)
            })

    # Sort and return top N
    risk_scores.sort(key=lambda x: x["risk_score"], reverse=True)

    return risk_scores[:top_n]


def _make_relative(path: str, repo_path: str) -> str:
    """Convert absolute path to relative if it's under repo_path."""
    try:
        return os.path.relpath(path, repo_path)
    except ValueError:
        return path
