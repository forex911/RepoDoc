from git import Repo
import os

def clone_repo(repo_url):

    base_path = "data/repos"

    os.makedirs(base_path, exist_ok=True)

    repo_name = repo_url.split("/")[-1].replace(".git", "")

    repo_path = os.path.join(base_path, repo_name)

    if not os.path.exists(repo_path):

        print("Cloning repo...")
        Repo.clone_from(repo_url, repo_path)

    else:
        print("Repo already exists")

    return repo_path