from typing import List, Optional

# In-memory storage for query embeddings to reduce redundant model calls
embedding_cache = {}

def get_cached_embedding(query: str) -> Optional[List[float]]:
    """
    Retrieves a stored embedding from the dictionary if the query matches exactly.
    Returns None if no cache entry is found.
    """
    return embedding_cache.get(query)

def store_embedding(query: str, embedding: List[float]) -> None:
    """
    Saves an embedding vector into the dictionary using the query text as the key.
    """
    embedding_cache[query] = embedding
