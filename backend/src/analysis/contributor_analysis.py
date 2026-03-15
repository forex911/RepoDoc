from git import Repo
from collections import Counter


def analyze_contributors(repo_path):

    repo = Repo(repo_path)

    commits = list(repo.iter_commits())

    authors = []

    for commit in commits:
        authors.append(commit.author.name)

    contributor_counts = Counter(authors)

    return dict(contributor_counts)