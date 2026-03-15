import os
import shutil
import logging

logger = logging.getLogger("repodoc-api.repo_loader")

def clone_repo(repo_url):

    base_path = os.getenv("REPO_CLONE_PATH", "data/repos")

    os.makedirs(base_path, exist_ok=True)

    repo_name = repo_url.split("/")[-1].replace(".git", "")

    repo_path = os.path.join(base_path, repo_name)

    if not os.path.exists(repo_path):
        logger.info(f"Cloning repo: {repo_url} into {repo_path}")
        try:
            from git import Repo
            Repo.clone_from(repo_url, repo_path)
            logger.info("Clone completed")
        except Exception as e:
            logger.error(f"Failed to clone {repo_url}: {e}")
            raise
    else:
        logger.info(f"Repo already exists locally at: {repo_path}")

    return repo_path


def cleanup_repo(repo_path):
    """Delete the cloned repository to free up disk space."""
    if os.path.exists(repo_path):
        logger.info(f"Cleaning up repository: {repo_path}")
        try:
            shutil.rmtree(repo_path)
            logger.info("Cleanup completed")
        except Exception as e:
            logger.error(f"Failed to cleanup {repo_path}: {e}")