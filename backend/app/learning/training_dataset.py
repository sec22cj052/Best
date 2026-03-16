"""
Training Dataset — Aggregates historical and human-corrected tickets into training format.
"""

from app.learning.feedback_store import get_all_feedback
from app.agents.retrieval_agent import get_all_tickets


def build_training_dataset() -> list:
    """Build a training dataset from feedback entries and historical tickets."""
    dataset = []

    # Add feedback entries (human-corrected)
    feedback = get_all_feedback()
    for entry in feedback:
        if entry.get("correct_category"):
            dataset.append({
                "text": entry.get("human_resolution", ""),
                "label": entry["correct_category"],
                "source": "human_feedback",
                "confidence": 1.0,  # human-verified
            })

    # Add historical tickets with high-confidence classifications
    tickets = get_all_tickets()
    for ticket in tickets:
        if ticket.get("category"):
            dataset.append({
                "text": ticket["text"],
                "label": ticket["category"],
                "source": "auto_classified",
                "confidence": 0.0,  # unknown confidence from storage
            })

    return dataset


def get_dataset_stats() -> dict:
    """Get statistics about the training dataset."""
    dataset = build_training_dataset()
    human = sum(1 for d in dataset if d["source"] == "human_feedback")
    auto = sum(1 for d in dataset if d["source"] == "auto_classified")

    # Label distribution
    label_counts = {}
    for d in dataset:
        label = d["label"]
        label_counts[label] = label_counts.get(label, 0) + 1

    return {
        "total_entries": len(dataset),
        "human_verified": human,
        "auto_classified": auto,
        "label_distribution": label_counts,
    }
