from git import Repo
from collections import defaultdict


def analyze_code_ownership(repo_path):

    repo = Repo(repo_path)

    ownership = defaultdict(lambda: defaultdict(int))

    for commit in repo.iter_commits():

        author = commit.author.name

        for file in commit.stats.files:
            ownership[file][author] += 1

    result = {}

    for file in ownership:
        top_author = max(ownership[file], key=ownership[file].get)
        result[file] = top_author

    return result