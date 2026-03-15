import matplotlib.pyplot as plt
from git import Repo
from collections import Counter
import datetime


def analyze_commit_history(repo_path):

    repo = Repo(repo_path)

    commits = list(repo.iter_commits())

    dates = []

    for commit in commits:
        commit_date = datetime.datetime.fromtimestamp(commit.committed_date)
        dates.append(commit_date.date())

    date_counts = Counter(dates)

    sorted_dates = sorted(date_counts)

    commits_per_day = [date_counts[d] for d in sorted_dates]

    # Convert dates to strings and map counts
    history_data = [{"date": str(d), "commits": date_counts[d]} for d in sorted_dates]

    return history_data