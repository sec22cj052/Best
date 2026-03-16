"""
Feedback Store — Stores human feedback for the self-learning loop.
Uses JSON file for persistence (no external DB needed).
"""

import json
import os
from datetime import datetime

FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "feedback.json")

_feedback_entries = []
_loaded = False


def _ensure_dir():
    os.makedirs(os.path.dirname(FEEDBACK_FILE), exist_ok=True)


def _load():
    global _feedback_entries, _loaded
    if _loaded:
        return
    _ensure_dir()
    if os.path.exists(FEEDBACK_FILE):
        try:
            with open(FEEDBACK_FILE, "r") as f:
                _feedback_entries = json.load(f)
        except (json.JSONDecodeError, IOError):
            _feedback_entries = []
    _loaded = True


def _save():
    _ensure_dir()
    with open(FEEDBACK_FILE, "w") as f:
        json.dump(_feedback_entries, f, indent=2, default=str)


def store_feedback(
    ticket_id: int,
    original_prediction: str,
    correct_category: str,
    original_confidence: float,
    human_resolution: str = "",
) -> dict:
    """Store a feedback entry from human-in-the-loop review."""
    _load()

    entry = {
        "ticket_id": ticket_id,
        "original_prediction": original_prediction,
        "correct_category": correct_category,
        "was_correct": original_prediction == correct_category,
        "original_confidence": round(original_confidence, 4),
        "human_resolution": human_resolution,
        "timestamp": datetime.utcnow().isoformat(),
    }

    _feedback_entries.append(entry)
    _save()
    return entry


def get_all_feedback() -> list:
    _load()
    return list(_feedback_entries)


def get_feedback_count() -> int:
    _load()
    return len(_feedback_entries)


def get_accuracy_stats() -> dict:
    """Calculate accuracy statistics from feedback."""
    _load()
    if not _feedback_entries:
        return {"total": 0, "correct": 0, "accuracy": 0.0}

    total = len(_feedback_entries)
    correct = sum(1 for e in _feedback_entries if e.get("was_correct", False))
    return {
        "total": total,
        "correct": correct,
        "accuracy": round(correct / total, 4) if total > 0 else 0.0,
    }


def clear_feedback():
    global _feedback_entries
    _feedback_entries = []
    _save()
