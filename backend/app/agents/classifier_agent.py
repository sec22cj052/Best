"""
Classifier Agent — Zero-shot text classification using DistilBERT NLI.
Model: typeform/distilbert-base-uncased-mnli (~260MB, runs on CPU)
"""

import time
from transformers import pipeline

CANDIDATE_LABELS = [
    "login", "network", "database", "hardware",
    "billing", "access", "software", "email",
    "security", "performance", "refund", "subscription",
]

_classifier = None


def _get_classifier():
    global _classifier
    if _classifier is None:
        print("[ClassifierAgent] Loading zero-shot model (first run downloads ~260MB)...")
        _classifier = pipeline(
            "zero-shot-classification",
            model="typeform/distilbert-base-uncased-mnli",
            device=-1,  # CPU
        )
        print("[ClassifierAgent] Model loaded.")
    return _classifier


def classify_ticket(text: str) -> dict:
    """Classify a support ticket into a category using zero-shot NLI."""
    start = time.time()
    clf = _get_classifier()
    result = clf(text, CANDIDATE_LABELS, multi_label=False)
    elapsed = round(time.time() - start, 3)

    top_label = result["labels"][0]
    top_score = round(result["scores"][0], 4)

    # Build ranked list of all predictions
    all_predictions = [
        {"label": label, "score": round(score, 4)}
        for label, score in zip(result["labels"], result["scores"])
    ]

    return {
        "agent": "ClassifierAgent",
        "category": top_label,
        "confidence": top_score,
        "all_predictions": all_predictions[:5],
        "execution_time_ms": int(elapsed * 1000),
        "status": "completed",
    }
