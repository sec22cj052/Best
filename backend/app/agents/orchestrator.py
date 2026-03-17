"""
Orchestrator — Central AI pipeline controller.
Coordinates all agents in sequence: classify → retrieve → resolve → incident → explain.
"""

import time
from datetime import datetime

from app.agents.classifier_agent import classify_ticket
from app.agents.retrieval_agent import search_similar, add_ticket
from app.agents.resolution_agent import resolve_ticket
from app.agents.incident_agent import check_incident
from app.agents.explainability_agent import build_decision_trace

# In-memory ticket store with results
_processed_tickets = []
_next_ticket_id = 1


def process_ticket(text: str, urgency: str = "Low", ticket_id: int = None) -> dict:
    """Run the full multi-agent pipeline on a support ticket."""
    global _next_ticket_id

    pipeline_start = time.time()
    timestamp = datetime.utcnow().isoformat()

    if ticket_id is None:
        ticket_id = _next_ticket_id
        _next_ticket_id += 1

    # Initialize conversation thread
    messages = [
        {"sender": "user", "text": text, "timestamp": timestamp}
    ]

    # 1. Classification
    classification = classify_ticket(text)

    # 2. Semantic Retrieval
    retrieval = search_similar(text, top_k=5)

    # 3. Resolution (RAG)
    resolution = resolve_ticket(text, classification["category"])

    # 4. Incident Detection
    incident = check_incident(classification["category"], ticket_id, timestamp)

    # 5. Explainability
    trace = build_decision_trace(text, classification, retrieval, resolution, incident)

    # Add ticket to index for future retrieval
    add_ticket(ticket_id, text, classification["category"], timestamp)

    total_elapsed = round(time.time() - pipeline_start, 3)

    # Determine if auto-resolve or HITL based on 0.75 threshold
    confidence = resolution.get("confidence", 0)
    auto_resolve = confidence >= 0.75

    # If incident detected, force human review regardless of confidence
    if incident.get("incident_detected", False):
        auto_resolve = False

    new_status = "ai_resolved" if auto_resolve else "requires_human"

    # Add AI response to thread if resolved, or draft response if requires human
    ai_msg_text = resolution["solution"]
    if not auto_resolve:
         ai_msg_text = "[DRAFT - Requires Human Review]\n\n" + ai_msg_text

    messages.append({
        "sender": "agent",
        "text": ai_msg_text,
        "timestamp": datetime.utcnow().isoformat()
    })

    result = {
        "ticket_id": ticket_id,
        "text": text,
        "urgency": urgency,
        "timestamp": timestamp,
        "classification": classification["category"],
        "confidence": classification["confidence"],
        "messages": messages,
        "resolution_source": resolution["source"],
        "resolution_confidence": confidence,
        "auto_resolved": auto_resolve,
        "requires_human": not auto_resolve,
        "status": new_status,
        "incident_alert": {
            "incident_detected": incident["incident_detected"],
            "incident_size": incident.get("incident_size", 0),
            "severity": incident.get("severity", "none"),
        },
        "decision_trace": trace,
        "agent_results": {
            "classifier": classification,
            "retrieval": retrieval,
            "resolution": resolution,
            "incident": incident,
            "explainability": trace,
        },
        "total_pipeline_time_ms": int(total_elapsed * 1000),
    }

    _processed_tickets.append(result)
    return result


def get_all_processed_tickets() -> list:
    """Return all processed ticket results."""
    return list(_processed_tickets)


def get_ticket_by_id(ticket_id: int) -> dict | None:
    """Find a processed ticket by ID."""
    for t in _processed_tickets:
        if t["ticket_id"] == ticket_id:
            return t
    return None


def get_stats() -> dict:
    """Return pipeline statistics."""
    total = len(_processed_tickets)
    auto_resolved = sum(1 for t in _processed_tickets if t.get("auto_resolved"))
    hitl_required = total - auto_resolved
    incidents = sum(1 for t in _processed_tickets if t.get("incident_alert", {}).get("incident_detected"))

    return {
        "total_tickets": total,
        "auto_resolved": auto_resolved,
        "hitl_required": hitl_required,
        "incidents_detected": incidents,
    }


def clear_all():
    """Reset all processed tickets."""
    global _processed_tickets, _next_ticket_id
    _processed_tickets = []
    _next_ticket_id = 1
