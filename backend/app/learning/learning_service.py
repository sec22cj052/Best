"""
Learning Service — Self-learning model improvement based on feedback.
Handles retraining triggers and model version tracking.
"""

from datetime import datetime
from app.learning.feedback_store import get_feedback_count, get_accuracy_stats
from app.learning.training_dataset import build_training_dataset, get_dataset_stats

# Model version tracking
_model_state = {
    "version": "v1.0",
    "version_number": 1,
    "last_retrained": None,
    "retrain_trigger_threshold": 20,
}

AUTO_RETRAIN_THRESHOLD = 20


def get_learning_stats() -> dict:
    """Get current learning/training statistics."""
    feedback_count = get_feedback_count()
    accuracy = get_accuracy_stats()
    dataset = get_dataset_stats()

    return {
        "feedback_entries": feedback_count,
        "model_version": _model_state["version"],
        "last_retrained": _model_state["last_retrained"],
        "retrain_threshold": AUTO_RETRAIN_THRESHOLD,
        "retrain_ready": feedback_count >= AUTO_RETRAIN_THRESHOLD,
        "accuracy": accuracy,
        "dataset": dataset,
    }


def retrain_classifier() -> dict:
    """
    Trigger classifier retraining.
    In production, this would fine-tune the model. Here we update tracking
    and rebuild the vector index (the zero-shot model doesn't need fine-tuning
    since it works on any category set).
    """
    dataset = build_training_dataset()

    # Update model version
    _model_state["version_number"] += 1
    _model_state["version"] = f"v1.{_model_state['version_number']}"
    _model_state["last_retrained"] = datetime.utcnow().isoformat()

    # Rebuild the vector index with corrected data
    update_vector_index()

    return {
        "status": "completed",
        "new_version": _model_state["version"],
        "retrained_at": _model_state["last_retrained"],
        "dataset_size": len(dataset),
        "message": "Vector index rebuilt with corrected labels. Zero-shot classifier uses dynamic categories (no fine-tuning needed).",
    }


def update_vector_index() -> dict:
    """Rebuild the FAISS vector index incorporating feedback corrections."""
    from app.agents.retrieval_agent import rebuild_index, get_all_tickets
    from app.learning.feedback_store import get_all_feedback

    # Get all existing tickets
    tickets = get_all_tickets()

    # Apply corrections from feedback
    feedback = get_all_feedback()
    corrections = {f["ticket_id"]: f["correct_category"] for f in feedback}

    for ticket in tickets:
        if ticket["id"] in corrections:
            ticket["category"] = corrections[ticket["id"]]

    # Rebuild index
    rebuild_index(tickets)

    return {
        "status": "rebuilt",
        "total_tickets": len(tickets),
        "corrections_applied": len(corrections),
    }


def check_auto_retrain() -> bool:
    """Check if auto-retraining should be triggered."""
    count = get_feedback_count()
    if count >= AUTO_RETRAIN_THRESHOLD and count % AUTO_RETRAIN_THRESHOLD == 0:
        retrain_classifier()
        return True
    return False
