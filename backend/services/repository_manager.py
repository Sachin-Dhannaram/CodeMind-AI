import os
import shutil
import zipfile
import uuid
import datetime
from pathlib import Path
from utils.logger import logger

class RepositoryManager:
    """
    Handles local folder storage CRUD actions, GitHub cloning, and ZIP file unpackings.
    """
    def __init__(self, repositories_dir: Path):
        self.repositories_dir = repositories_dir
        self.repositories_dir.mkdir(parents=True, exist_ok=True)

    def clone_github_repo(self, repo_url: str) -> dict:
        try:
            import git
        except ImportError:
            raise RuntimeError("GitPython is not installed. Please check backend requirements.")

        if not repo_url.endswith(".git"):
            repo_url_clean = repo_url.strip()
        else:
            repo_url_clean = repo_url

        repo_name = repo_url_clean.split("/")[-1].replace(".git", "")
        unique_id = f"{repo_name}_{uuid.uuid4().hex[:8]}"
        clone_path = self.repositories_dir / unique_id
        
        logger.info(f"Cloning github repo {repo_url} into {clone_path}...")
        try:
            git.Repo.clone_from(repo_url_clean, str(clone_path))
            logger.info("Cloning completed successfully.")
            return {
                "id": unique_id,
                "name": repo_name,
                "path": str(clone_path),
                "url_or_filename": repo_url_clean
            }
        except Exception as e:
            logger.error(f"Failed to clone git repository: {str(e)}")
            raise RuntimeError(f"Git clone failure: {str(e)}")

    def extract_zip(self, file_content: bytes, filename: str) -> dict:
        repo_name = filename.replace(".zip", "")
        unique_id = f"{repo_name}_{uuid.uuid4().hex[:8]}"
        extract_path = self.repositories_dir / unique_id
        extract_path.mkdir(parents=True, exist_ok=True)

        zip_temp_path = extract_path / f"temp_{uuid.uuid4().hex[:6]}.zip"
        
        logger.info(f"Writing zip bytes to {zip_temp_path}...")
        try:
            with open(zip_temp_path, "wb") as f:
                f.write(file_content)

            logger.info(f"Unpacking ZIP archive into {extract_path}...")
            with zipfile.ZipFile(zip_temp_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
            
            # Clean up temp file
            os.remove(zip_temp_path)
            logger.info("Extraction completed successfully.")
            return {
                "id": unique_id,
                "name": repo_name,
                "path": str(extract_path),
                "url_or_filename": filename
            }
        except Exception as e:
            # Clean up folder on error
            self.delete_repo_folder(unique_id)
            logger.error(f"Failed to unpack zip: {str(e)}")
            raise RuntimeError(f"ZIP unpack failure: {str(e)}")

    def delete_repo_folder(self, repo_id: str):
        path = self.repositories_dir / repo_id
        if path.exists() and path.is_dir():
            logger.info(f"Deleting repository directory: {path}")
            shutil.rmtree(path, ignore_errors=True)
