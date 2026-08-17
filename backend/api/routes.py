import os
import json
import datetime
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks

from models.schemas import (
    CloneRepoRequest, IndexRepoRequest, ChatRequest, SettingsUpdateRequest,
    ChatResponse, RepoInfo, HealthStatus
)

# Import new clean architecture managers and services
from services.embedding_manager import EmbeddingManager
from services.chroma_db_manager import ChromaDbManager
from services.repository_manager import RepositoryManager
from services.parser_service import ParserService
from services.chunker_service import ChunkerService
from services.prompt_service import PromptService
from services.gemini_driver import GeminiDriver
from services.indexing_orchestrator import IndexingOrchestrator
from services.chat_orchestrator import ChatOrchestrator

from utils.logger import logger

router = APIRouter(prefix="/api")

BASE_DIR = Path(__file__).resolve().parent.parent
REPOS_DIR = BASE_DIR / "repositories"
CHROMA_DIR = BASE_DIR / "chroma_db"
META_FILE = REPOS_DIR / "metadata.json"

REPOS_DB: Dict[str, Dict[str, Any]] = {}

def _save_repos_db():
    try:
        REPOS_DIR.mkdir(parents=True, exist_ok=True)
        with open(META_FILE, "w", encoding="utf-8") as f:
            json.dump(REPOS_DB, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save REPOS_DB: {e}")

def _load_repos_db():
    global REPOS_DB
    if META_FILE.exists():
        try:
            with open(META_FILE, "r", encoding="utf-8") as f:
                REPOS_DB = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load META_FILE: {e}")
            REPOS_DB = {}

_load_repos_db()

GLOBAL_SETTINGS = {
    "gemini_api_key": os.environ.get("GEMINI_API_KEY", ""),
    "embedding_model": "BAAI/bge-small-en-v1.5",
    "chunk_size": 500,
    "top_k": 10,
    "temperature": 0.2
}

# Instantiate Core components and perform Dependency Injection
embedding_manager = EmbeddingManager(GLOBAL_SETTINGS["embedding_model"])
chroma_db_manager = ChromaDbManager(CHROMA_DIR)
repository_manager = RepositoryManager(REPOS_DIR)
parser_service = ParserService()
chunker_service = ChunkerService()
prompt_service = PromptService()
gemini_driver = GeminiDriver()

indexing_orchestrator = IndexingOrchestrator(
    parser_service=parser_service,
    chunker_service=chunker_service,
    embedding_manager=embedding_manager,
    chroma_db_manager=chroma_db_manager
)

chat_orchestrator = ChatOrchestrator(
    chroma_db_manager=chroma_db_manager,
    embedding_manager=embedding_manager,
    prompt_service=prompt_service,
    gemini_driver=gemini_driver
)

@router.get("/health", response_model=HealthStatus)
def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "chroma_ready": True,
        "embedding_model": GLOBAL_SETTINGS["embedding_model"]
    }

@router.get("/status")
def get_status():
    return {
        "active_repositories": len(REPOS_DB),
        "settings": GLOBAL_SETTINGS,
        "repos": list(REPOS_DB.values())
    }

@router.post("/clone")
def clone_repository(payload: CloneRepoRequest):
    try:
        info = repository_manager.clone_github_repo(payload.url)
        repo_id = info["id"]
        REPOS_DB[repo_id] = {
            "id": repo_id,
            "name": info["name"],
            "path": info["path"],
            "source_type": "github",
            "url_or_filename": info["url_or_filename"],
            "indexed": False,
            "total_files": 0,
            "total_chunks": 0,
            "status": "Cloned (Ready for Indexing)",
            "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        _save_repos_db()
        return REPOS_DB[repo_id]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload")
async def upload_repository(file: UploadFile = File(...)):
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP archives are supported.")
    try:
        content = await file.read()
        info = repository_manager.extract_zip(content, file.filename)
        repo_id = info["id"]
        REPOS_DB[repo_id] = {
            "id": repo_id,
            "name": info["name"],
            "path": info["path"],
            "source_type": "zip",
            "url_or_filename": info["url_or_filename"],
            "indexed": False,
            "total_files": 0,
            "total_chunks": 0,
            "status": "Uploaded (Ready for Indexing)",
            "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        _save_repos_db()
        return REPOS_DB[repo_id]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/index")
def index_repository(payload: IndexRepoRequest, background_tasks: BackgroundTasks):
    repo_id = payload.repo_id
    if repo_id not in REPOS_DB:
        raise HTTPException(status_code=404, detail="Repository not found.")
    
    repo = REPOS_DB[repo_id]
    if repo.get("status", "").startswith("Indexing:"):
        return repo
        
    repo["status"] = "Indexing: Initiating..."
    repo["indexed"] = False
    _save_repos_db()
    
    background_tasks.add_task(indexing_orchestrator.run_indexing, repo, _save_repos_db)
    return repo

@router.get("/repositories")
def list_repositories():
    _load_repos_db()
    return list(REPOS_DB.values())

@router.delete("/repository/{repo_id}")
def delete_repository(repo_id: str):
    target_id = repo_id
    if target_id not in REPOS_DB:
        for r_id in REPOS_DB:
            if repo_id in r_id or r_id in repo_id:
                target_id = r_id
                break

    if target_id in REPOS_DB:
        try:
            chroma_db_manager.delete_collection(target_id)
        except Exception as e:
            logger.warning(f"Chroma delete collection warning: {e}")
        try:
            repository_manager.delete_repo_folder(target_id)
        except Exception as e:
            logger.warning(f"Folder deletion warning: {e}")
            
        del REPOS_DB[target_id]
        _save_repos_db()
        return {"message": f"Repository {target_id} deleted successfully."}
    raise HTTPException(status_code=404, detail="Repository not found in backend database.")

@router.post("/chat", response_model=ChatResponse)
def chat_with_repo(payload: ChatRequest):
    try:
        repo_id = payload.repo_id
        if repo_id not in REPOS_DB:
            matched = None
            for r_id in REPOS_DB:
                if repo_id in r_id or r_id in repo_id:
                    matched = r_id
                    break
            if matched:
                repo_id = matched
            else:
                raise HTTPException(status_code=404, detail=f"Repository {repo_id} not found in backend registry.")
        
        repo_meta = REPOS_DB[repo_id]
        if not repo_meta.get("indexed"):
            logger.info(f"Auto-triggering indexing for {repo_id}...")
            # Run synchronously for initial setup if auto-triggered
            indexing_orchestrator.run_indexing(repo_meta, _save_repos_db)

        # Get repository file structure for holistic project awareness
        parsed = parser_service.parse_repository(repo_meta["path"])
        file_list = [f["relative_path"] for f in parsed]

        top_k = payload.top_k or GLOBAL_SETTINGS.get("top_k", 10)
        api_key = payload.api_key
        if not api_key or "..." in api_key:
            api_key = GLOBAL_SETTINGS.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY")
        
        result = chat_orchestrator.answer_query(
            repo_id=repo_id,
            question=payload.question,
            file_list=file_list,
            top_k=top_k,
            api_key_override=api_key,
            history=payload.history
        )

        return {
            "answer": result["answer"],
            "retrieved_chunks": result["retrieved_chunks"],
            "model_used": "Gemini 2.5 Flash"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat_with_repo: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@router.get("/repository/{repo_id}/tree")
def get_repo_tree(repo_id: str):
    if repo_id not in REPOS_DB:
        raise HTTPException(status_code=404, detail="Repository not found.")
    
    repo_path = Path(REPOS_DB[repo_id]["path"])
    parsed_files = parser_service.parse_repository(str(repo_path))
    
    tree = []
    for f in parsed_files:
        tree.append({
            "path": f["relative_path"],
            "language": f["language"],
            "line_count": f["line_count"]
        })
    return tree

@router.get("/repository/{repo_id}/file")
def get_repo_file(repo_id: str, filepath: str):
    if repo_id not in REPOS_DB:
        raise HTTPException(status_code=404, detail="Repository not found.")
    
    repo_path = REPOS_DB[repo_id]["path"]
    try:
        content = chat_orchestrator.fetch_raw_file_content(repo_path, filepath)
        return {"filepath": filepath, "content": content}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings")
def update_settings(payload: SettingsUpdateRequest):
    if payload.gemini_api_key is not None:
        GLOBAL_SETTINGS["gemini_api_key"] = payload.gemini_api_key
    if payload.top_k is not None:
        GLOBAL_SETTINGS["top_k"] = payload.top_k
    if payload.chunk_size is not None:
        GLOBAL_SETTINGS["chunk_size"] = payload.chunk_size
    if payload.temperature is not None:
        GLOBAL_SETTINGS["temperature"] = payload.temperature
    return GLOBAL_SETTINGS

@router.get("/settings")
def get_settings():
    masked = GLOBAL_SETTINGS.copy()
    key = masked.get("gemini_api_key", "")
    if key and len(key) > 8:
        masked["gemini_api_key"] = key[:4] + "..." + key[-4:]
    return masked
