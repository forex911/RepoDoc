import os
from radon.complexity import cc_visit


def analyze_complexity(repo_path):

    report = []

    for root, dirs, files in os.walk(repo_path):

        for file in files:

            if file.endswith(".py"):

                path = os.path.join(root, file)

                try:

                    with open(path, "r", encoding="utf-8") as f:
                        code = f.read()

                    results = cc_visit(code)

                    for r in results:

                        if r.complexity > 10:

                            report.append({
                                "file": path,
                                "function": r.name,
                                "complexity": r.complexity
                            })

                except:
                    pass

    return report