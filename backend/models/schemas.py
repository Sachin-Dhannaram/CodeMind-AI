from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class CloneRepoRequest(BaseModel):
    url: str = Field(..., description="GitHub repository clone URL")

class IndexRepoRequest(BaseModel):
    repo_id: str = Field(..., description="Unique repository identifier")

class ChatRequest(BaseModel):
    repo_id: str = Field(..., description="Repository ID to query against")
    question: str = Field(..., description="User query in natural language")
    top_k: Optional[int] = Field(5, description="Number of context chunks to retrieve")
    api_key: Optional[str] = Field(None, description="Optional Gemini API key override")
    history: Optional[List[Dict[str, str]]] = Field(None, description="Past conversation message history (last 10 messages)")

class SettingsUpdateRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    embedding_model: Optional[str] = "BAAI/bge-small-en-v1.5"
    chunk_size: Optional[int] = 500
    top_k: Optional[int] = 5
    temperature: Optional[float] = 0.2

class CodeChunkMeta(BaseModel):
    repo_name: str
    file_path: str
    language: str
    symbol_name: Optional[str] = None
    start_line: int
    end_line: int

class CodeChunk(BaseModel):
    id: str
    code: str
    metadata: CodeChunkMeta

class ChatResponse(BaseModel):
    answer: str
    retrieved_chunks: List[Dict[str, Any]]
    model_used: str

class RepoInfo(BaseModel):
    id: str
    name: str
    source_type: str  # 'github' or 'zip'
    url_or_filename: str
    indexed: bool
    total_files: int
    total_chunks: int
    created_at: str

class HealthStatus(BaseModel):
    status: str
    version: str
    chroma_ready: bool
    embedding_model: str
