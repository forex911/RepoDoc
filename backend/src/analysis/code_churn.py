from git import Repo
from collections import Counter


def analyze_code_churn(repo_path):

    repo = Repo(repo_path)

    file_changes = Counter()

    for commit in repo.iter_commits():

        for file in commit.stats.files:
            file_changes[file] += 1

    return file_changes.most_common(10)