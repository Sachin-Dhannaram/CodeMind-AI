import datetime
from typing import Callable
from services.parser_service import ParserService
from services.chunker_service import ChunkerService
from services.embedding_manager import EmbeddingManager
from services.chroma_db_manager import ChromaDbManager
from utils.logger import logger

class IndexingOrchestrator:
    """
    Orchestrates the entire repository indexing pipeline.
    Uses constructor dependency injection.
    """
    def __init__(
        self,
        parser_service: ParserService,
        chunker_service: ChunkerService,
        embedding_manager: EmbeddingManager,
        chroma_db_manager: ChromaDbManager
    ):
        self.parser_service = parser_service
        self.chunker_service = chunker_service
        self.embedding_manager = embedding_manager
        self.chroma_db_manager = chroma_db_manager

    def run_indexing(self, repo_meta: dict, save_callback: Callable[[], None]):
        repo_id = repo_meta["id"]
        start_time = datetime.datetime.now()
        
        try:
            repo_meta["indexing_started_at"] = start_time.strftime("%Y-%m-%d %H:%M:%S")
            repo_meta["current_file"] = ""
            repo_meta["time_taken"] = 0.0
            
            # 1. Reading & Parsing Files
            repo_meta["status"] = "Indexing: Reading files..."
            save_callback()
            
            repo_meta["status"] = "Indexing: Parsing files..."
            save_callback()
            parsed_files = self.parser_service.parse_repository(repo_meta["path"])
            repo_meta["total_files"] = len(parsed_files)
            
            # 2. Chunking
            all_chunks = []
            for idx, f in enumerate(parsed_files, 1):
                rel_path = f["relative_path"]
                repo_meta["current_file"] = rel_path
                repo_meta["status"] = f"Indexing: Chunking ({idx}/{len(parsed_files)}) - {rel_path}"
                save_callback()
                
                file_chunks = self.chunker_service.chunk_file(f, repo_meta["name"])
                all_chunks.extend(file_chunks)
                
            repo_meta["total_chunks"] = len(all_chunks)
            repo_meta["current_file"] = ""
            
            # 3. Generating Embeddings
            repo_meta["status"] = "Indexing: Generating embeddings..."
            save_callback()
            
            texts = [c["code"] for c in all_chunks]
            embeddings = self.embedding_manager.generate_embeddings(texts)
            
            # 4. Saving to ChromaDB
            repo_meta["status"] = "Indexing: Saving to ChromaDB..."
            save_callback()
            self.chroma_db_manager.add_documents(repo_id, all_chunks, embeddings)
            
            # 5. Completion
            duration = (datetime.datetime.now() - start_time).total_seconds()
            repo_meta["time_taken"] = round(duration, 2)
            repo_meta["indexed"] = True
            repo_meta["status"] = "Completed"
            save_callback()
            logger.info(f"Indexing completed successfully for repo {repo_id} in {repo_meta['time_taken']}s")
            
        except Exception as e:
            logger.error(f"Error during indexing of repo {repo_id}: {str(e)}", exc_info=True)
            duration = (datetime.datetime.now() - start_time).total_seconds()
            repo_meta["time_taken"] = round(duration, 2)
            repo_meta["status"] = f"Failed: {str(e)}"
            save_callback()
            raise
