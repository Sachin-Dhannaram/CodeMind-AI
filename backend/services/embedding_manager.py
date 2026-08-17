from typing import List
from sentence_transformers import SentenceTransformer
from utils.logger import logger

class EmbeddingManager:
    """
    Manages vector embedding operations using the SentenceTransformers model.
    """
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model_name = model_name
        self._model = None

    def _load_model(self):
        if self._model is None:
            logger.info(f"Loading embedding model: {self.model_name}...")
            # Load locally or download via HuggingFace
            self._model = SentenceTransformer(self.model_name)
            logger.info("Embedding model loaded successfully.")
        return self._model

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        try:
            model = self._load_model()
            embeddings = model.encode(texts, normalize_embeddings=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {str(e)}")
            raise RuntimeError(f"Embedding generation error: {str(e)}")

    def generate_query_embedding(self, query: str) -> List[float]:
        try:
            model = self._load_model()
            embedding = model.encode(query, normalize_embeddings=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Failed to generate query embedding: {str(e)}")
            raise RuntimeError(f"Query embedding generation error: {str(e)}")
