import hashlib
from typing import List, Dict, Any
from services.chroma_db_manager import ChromaDbManager
from services.embedding_manager import EmbeddingManager
from services.prompt_service import PromptService
from services.gemini_driver import GeminiDriver
from utils.logger import logger

class ChatOrchestrator:
    """
    Orchestrates Vector Retrieval and Gemini content generation logic.
    Uses constructor dependency injection.
    """
    def __init__(
        self,
        chroma_db_manager: ChromaDbManager,
        embedding_manager: EmbeddingManager,
        prompt_service: PromptService,
        gemini_driver: GeminiDriver
    ):
        self.chroma_db_manager = chroma_db_manager
        self.embedding_manager = embedding_manager
        self.prompt_service = prompt_service
        self.gemini_driver = gemini_driver

    def answer_query(
        self,
        repo_id: str,
        question: str,
        file_list: List[str],
        top_k: int = 5,
        api_key_override: str = None,
        history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Coordinates embedding generation, cosine similarity retrieval, deduplication,
        prompt rendering, and Gemini generation in a clean, state-free pipeline.
        """
        logger.info(f"Querying repo {repo_id} with query: '{question}' (top_k={top_k})")
        
        # 1. Generate query embedding
        query_vec = self.embedding_manager.generate_query_embedding(question)
        
        # 2. Retrieve oversampled candidates for deduplication safety
        oversample_count = max(top_k * 2, 15)
        raw_chunks = self.chroma_db_manager.search(repo_id, query_vec, top_k=oversample_count)
        
        # 3. Deduplicate chunks using MD5 content hashing
        unique_chunks = []
        seen_hashes = set()
        for chunk in raw_chunks:
            code_content = chunk.get("code", "").strip()
            if not code_content:
                continue
            
            content_hash = hashlib.md5(code_content.encode('utf-8')).hexdigest()
            if content_hash not in seen_hashes:
                seen_hashes.add(content_hash)
                unique_chunks.append(chunk)
                
        # 4. Rank and sort by cosine similarity score
        for chunk in unique_chunks:
            distance = float(chunk.get("distance", 0.0))
            chunk["similarity_score"] = round(1.0 - distance, 4)
            
        unique_chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
        final_chunks = unique_chunks[:top_k]
        
        # 5. Build prompt
        prompt = self.prompt_service.build_prompt(question, final_chunks, file_list, history=history)
        
        # 6. Generate answer using Gemini
        answer = self.gemini_driver.generate_response(prompt, api_key_override)
        
        return {
            "answer": answer,
            "retrieved_chunks": final_chunks,
            "model_used": self.gemini_driver.model_name
        }
    
    def fetch_raw_file_content(self, repo_path: str, filepath: str) -> str:
        """
        Retrieves the raw source code of a file within a repository.
        """
        target_path = Path(repo_path) / filepath
        # Ensure path security (prevent folder traversal)
        if not target_path.resolve().is_relative_to(Path(repo_path).resolve()):
            raise ValueError("Directory traversal attempt blocked.")
            
        if not target_path.exists():
            raise FileNotFoundError(f"File not found: {filepath}")
            
        with open(target_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read().replace('\x00', '')
            
from pathlib import Path
