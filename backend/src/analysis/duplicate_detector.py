import os
import hashlib


def detect_duplicates(repo_path):

    seen_hashes = {}
    duplicates = []

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in (
            'node_modules', 'venv', '.venv', '__pycache__', '.git',
            'dist', 'build', '.tox', '.eggs'
        )]

        for file in files:

            if file.endswith(".py"):
                if file == "__init__.py":
                    continue
                path = os.path.join(root, file)

                try:

                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()

                    file_hash = hashlib.md5(content.encode()).hexdigest()

                    if file_hash in seen_hashes:

                        duplicates.append({
                            "file1": path,
                            "file2": seen_hashes[file_hash]
                        })

                    else:
                        seen_hashes[file_hash] = path

                except:
                    pass

    return duplicates