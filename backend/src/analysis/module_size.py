import os


def analyze_module_sizes(repo_path):

    large_files = []

    for root, dirs, files in os.walk(repo_path):

        for file in files:

            if file.endswith(".py"):

                path = os.path.join(root, file)

                with open(path, "r", encoding="utf-8") as f:

                    lines = len(f.readlines())

                if lines > 500:

                    large_files.append({
                        "file": path,
                        "lines": lines
                    })

    return large_files