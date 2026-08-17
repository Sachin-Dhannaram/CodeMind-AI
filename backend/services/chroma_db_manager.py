import hashlib
import chromadb
from pathlib import Path
from typing import List, Dict, Any
from utils.logger import logger

class ChromaDbManager:
    """
    Handles connection lifecycle and CRUD transactions against the persistent ChromaDB instance.
    """
    def __init__(self, persistent_path: Path):
        self.persistent_path = persistent_path
        self.persistent_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Initializing Persistent ChromaDB client at {self.persistent_path}")
        self.client = chromadb.PersistentClient(path=str(self.persistent_path))

    def _get_clean_collection_name(self, repo_id: str) -> str:
        # Guarantee valid collection name structure for SQLite storage
        hashed = hashlib.md5(repo_id.encode('utf-8')).hexdigest()[:16]
        return f"col_{hashed}"

    def get_or_create_collection(self, repo_id: str):
        clean_name = self._get_clean_collection_name(repo_id)
        return self.client.get_or_create_collection(name=clean_name, metadata={"hnsw:space": "cosine"})

    def add_documents(self, repo_id: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
        if not chunks or not embeddings:
            return
        try:
            collection = self.get_or_create_collection(repo_id)
            
            ids = [c["id"] for c in chunks]
            documents = [c["code"] for c in chunks]
            metadatas = []
            for c in chunks:
                m = c["metadata"].copy()
                if m.get("symbol_name") is None:
                    m["symbol_name"] = "unknown"
                metadatas.append(m)

            batch_size = 500
            for i in range(0, len(ids), batch_size):
                collection.add(
                    ids=ids[i:i+batch_size],
                    embeddings=embeddings[i:i+batch_size],
                    documents=documents[i:i+batch_size],
                    metadatas=metadatas[i:i+batch_size]
                )
            logger.info(f"Successfully added {len(ids)} chunks to Chroma collection {repo_id}")
        except Exception as e:
            logger.error(f"Failed to add documents to Chroma collection {repo_id}: {str(e)}")
            raise RuntimeError(f"ChromaDB insert error: {str(e)}")

    def delete_collection(self, repo_id: str):
        try:
            clean_name = self._get_clean_collection_name(repo_id)
            # Check if collection exists
            try:
                self.client.delete_collection(name=clean_name)
                logger.info(f"Deleted Chroma collection: {clean_name} for repo {repo_id}")
            except Exception:
                # Collection might not exist, ignore
                pass
        except Exception as e:
            logger.error(f"Failed to delete Chroma collection for repo {repo_id}: {str(e)}")
            raise RuntimeError(f"ChromaDB deletion error: {str(e)}")

    def search(self, repo_id: str, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        try:
            collection = self.get_or_create_collection(repo_id)
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )

            retrieved = []
            if results and results.get("documents") and len(results["documents"]) > 0:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
                distances = results["distances"][0] if results.get("distances") else [0.0] * len(docs)

                for doc, meta, dist in zip(docs, metas, distances):
                    retrieved.append({
                        "code": doc,
                        "metadata": meta,
                        "distance": dist
                    })
            return retrieved
        except Exception as e:
            logger.error(f"Failed to search Chroma collection {repo_id}: {str(e)}")
            raise RuntimeError(f"ChromaDB search error: {str(e)}")
