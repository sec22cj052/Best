"""
Resolution Agent — RAG-based ticket resolution using knowledge base matching.
Uses template-based resolution (no generative LLM needed = zero cost).
"""

import time
import numpy as np
import faiss
from app.services.knowledge_base import get_kb_entries, get_kb_index, get_kb_embeddings

# Minimum similarity threshold to consider a KB match valid
MATCH_THRESHOLD = 0.35


def resolve_ticket(text: str, category: str) -> dict:
    """Generate a resolution for the ticket using RAG over the knowledge base."""
    start = time.time()

    # Import here to avoid circular imports
    from app.agents.retrieval_agent import get_model

    model = get_model()
    kb_entries = get_kb_entries()
    kb_index = get_kb_index()

    if kb_index is None or kb_index.ntotal == 0:
        elapsed = round(time.time() - start, 3)
        return {
            "agent": "ResolutionAgent",
            "solution": "No knowledge base available. Escalating to human agent.",
            "source": "escalation",
            "confidence": 0.0,
            "kb_match": None,
            "execution_time_ms": int(elapsed * 1000),
            "status": "completed",
        }

    # Embed the ticket text
    query_vec = model.encode([text], normalize_embeddings=True)
    k = min(3, kb_index.ntotal)
    scores, indices = kb_index.search(np.array(query_vec, dtype=np.float32), k)

    best_score = float(scores[0][0])
    best_idx = int(indices[0][0])

    if best_score >= MATCH_THRESHOLD and best_idx < len(kb_entries):
        entry = kb_entries[best_idx]
        confidence = round(best_score, 4)

        # Determine source
        source_tag = "human_solution" if "id" in entry else "knowledge_base"

        # Build structured resolution
        solution = _format_resolution(entry, category, confidence)

        elapsed = round(time.time() - start, 3)
        return {
            "agent": "ResolutionAgent",
            "solution": solution,
            "source": source_tag,
            "confidence": confidence,
            "kb_match": {
                "title": entry["title"],
                "category": entry["category"],
                "similarity": confidence,
            },
            "auto_resolve": confidence >= 0.75,  # Updated threshold to 0.75
            "execution_time_ms": int(elapsed * 1000),
            "status": "completed",
        }
    else:
        elapsed = round(time.time() - start, 3)
        return {
            "agent": "ResolutionAgent",
            "solution": f"No confident KB match found (best: {round(best_score, 2)}). Requires human review.",
            "source": "escalation",
            "confidence": round(best_score, 4),
            "kb_match": None,
            "auto_resolve": False,
            "execution_time_ms": int(elapsed * 1000),
            "status": "completed",
        }


def _format_resolution(entry: dict, category: str, confidence: float) -> str:
    """Format a knowledge base entry into a human-readable resolution."""
    steps = entry.get("steps", [])
    steps_text = "\n".join(f"  {i+1}. {step}" for i, step in enumerate(steps))

    return (
        f"**Issue Category:** {category.title()}\n"
        f"**Matched KB Article:** {entry['title']}\n"
        f"**Confidence:** {confidence:.0%}\n\n"
        f"**Recommended Steps:**\n{steps_text}\n\n"
        f"**Additional Notes:** {entry.get('notes', 'N/A')}"
    )
