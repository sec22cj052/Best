"""
Retrieval Agent — Semantic search using FAISS + SentenceTransformers.
Model: all-MiniLM-L6-v2 (~80MB, 384-dim embeddings, 14K sent/sec on CPU)
"""

import time
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

_model = None
_index = None
_ticket_store = []  # list of dicts: {id, text, category, timestamp}


def _get_model():
    global _model
    if _model is None:
        print("[RetrievalAgent] Loading embedding model (first run downloads ~80MB)...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("[RetrievalAgent] Model loaded.")
    return _model


def get_model():
    """Public accessor for the embedding model (used by other agents)."""
    return _get_model()


def _ensure_index():
    global _index
    if _index is None:
        _index = faiss.IndexFlatIP(384)  # inner product (cosine after normalization)


def add_ticket(ticket_id: int, text: str, category: str = "", timestamp: str = ""):
    """Add a ticket to the vector store."""
    model = _get_model()
    _ensure_index()

    embedding = model.encode([text], normalize_embeddings=True)
    _index.add(np.array(embedding, dtype=np.float32))
    _ticket_store.append({
        "id": ticket_id,
        "text": text,
        "category": category,
        "timestamp": timestamp,
    })


def search_similar(text: str, top_k: int = 5) -> dict:
    """Find top-K similar tickets from the FAISS index."""
    start = time.time()
    model = _get_model()
    _ensure_index()

    if _index.ntotal == 0:
        return {
            "agent": "RetrievalAgent",
            "similar_tickets": [],
            "total_indexed": 0,
            "execution_time_ms": 0,
            "status": "completed",
        }

    query_vec = model.encode([text], normalize_embeddings=True)
    k = min(top_k, _index.ntotal)
    scores, indices = _index.search(np.array(query_vec, dtype=np.float32), k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < len(_ticket_store):
            ticket = _ticket_store[idx]
            results.append({
                "ticket_id": ticket["id"],
                "text": ticket["text"][:120] + ("..." if len(ticket["text"]) > 120 else ""),
                "category": ticket["category"],
                "similarity": round(float(score), 4),
            })

    elapsed = round(time.time() - start, 3)
    return {
        "agent": "RetrievalAgent",
        "similar_tickets": results,
        "total_indexed": _index.ntotal,
        "execution_time_ms": int(elapsed * 1000),
        "status": "completed",
    }


def get_all_tickets():
    """Return all stored tickets."""
    return list(_ticket_store)


def get_ticket_count():
    """Return the number of indexed tickets."""
    _ensure_index()
    return _index.ntotal


def rebuild_index(tickets: list):
    """Rebuild the entire FAISS index from a list of ticket dicts."""
    global _index, _ticket_store
    model = _get_model()
    _index = faiss.IndexFlatIP(384)
    _ticket_store = []

    if not tickets:
        return

    texts = [t["text"] for t in tickets]
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    _index.add(np.array(embeddings, dtype=np.float32))

    for t in tickets:
        _ticket_store.append({
            "id": t.get("id", 0),
            "text": t["text"],
            "category": t.get("category", ""),
            "timestamp": t.get("timestamp", ""),
        })
