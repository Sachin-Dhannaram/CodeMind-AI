import os
from pathlib import Path
from typing import List, Dict, Any
from utils.logger import logger

IGNORED_DIRS = {
    "node_modules", ".git", "dist", "build", "target", "__pycache__",
    ".venv", "venv", ".idea", ".vscode", ".next", ".nuxt", "bin", "obj", "vendor"
}

SUPPORTED_EXTENSIONS = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".java": "java",
    ".cpp": "cpp",
    ".c": "c",
    ".h": "c",
    ".hpp": "cpp",
    ".cs": "csharp",
    ".go": "go",
    ".rs": "rust",
    ".html": "html",
    ".css": "css",
    ".json": "json",
    ".xml": "xml",
    ".md": "markdown"
}

class ParserService:
    @staticmethod
    def parse_repository(repo_path: str) -> List[Dict[str, Any]]:
        """Traverses repository directory and returns list of supported source file objects."""
        base_path = Path(repo_path)
        parsed_files = []

        if not base_path.exists():
            logger.error(f"Repository path does not exist: {repo_path}")
            return parsed_files

        # Auto un-nest single subfolder extractions (e.g. Drought_prediction-main)
        subdirs = [p for p in base_path.iterdir() if p.is_dir() and p.name not in IGNORED_DIRS and not p.name.startswith('.')]
        subfiles = [p for p in base_path.iterdir() if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS]
        if len(subdirs) == 1 and len(subfiles) == 0:
            base_path = subdirs[0]

        for root, dirs, files in os.walk(base_path):
            dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith('.')]

            for file_name in files:
                file_path = Path(root) / file_name
                ext = file_path.suffix.lower()

                if ext in SUPPORTED_EXTENSIONS:
                    try:
                        rel_path = file_path.relative_to(base_path).as_posix()
                        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                            content = f.read().replace('\x00', '')

                        if content.strip():
                            parsed_files.append({
                                "relative_path": rel_path,
                                "full_path": str(file_path),
                                "language": SUPPORTED_EXTENSIONS[ext],
                                "content": content,
                                "line_count": len(content.splitlines())
                            })
                    except Exception as e:
                        logger.warning(f"Failed to read file {file_path}: {str(e)}")

        logger.info(f"Parsed {len(parsed_files)} source files from {base_path}")
        return parsed_files
