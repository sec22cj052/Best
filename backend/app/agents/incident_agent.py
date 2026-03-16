"""
Incident Agent — Detects emerging incidents by analyzing ticket clusters.
If N similar tickets appear within a time window, triggers an incident alert.
"""

import time
from datetime import datetime, timedelta
from collections import defaultdict

# Configuration
INCIDENT_THRESHOLD = 5       # minimum tickets to trigger incident
TIME_WINDOW_MINUTES = 30     # sliding window size
SEVERITY_LEVELS = {
    5: "medium",
    8: "high",
    12: "critical",
}

# In-memory ticket tracking
_recent_tickets = []  # list of {category, timestamp, ticket_id}
_active_incidents = []


def _calculate_severity(count: int) -> str:
    severity = "low"
    for threshold, level in sorted(SEVERITY_LEVELS.items()):
        if count >= threshold:
            severity = level
    return severity


def check_incident(category: str, ticket_id: int, timestamp: str = None) -> dict:
    """Check if the current ticket is part of an emerging incident."""
    start = time.time()

    now = datetime.utcnow()
    if timestamp:
        try:
            now = datetime.fromisoformat(timestamp.replace("Z", "+00:00")).replace(tzinfo=None)
        except (ValueError, AttributeError):
            pass

    # Record the ticket
    _recent_tickets.append({
        "category": category,
        "timestamp": now,
        "ticket_id": ticket_id,
    })

    # Clean old tickets outside the window
    cutoff = now - timedelta(minutes=TIME_WINDOW_MINUTES)
    active_tickets = [t for t in _recent_tickets if t["timestamp"] >= cutoff]

    # Group by category
    category_counts = defaultdict(list)
    for t in active_tickets:
        category_counts[t["category"]].append(t["ticket_id"])

    # Check for incidents
    current_count = len(category_counts.get(category, []))
    incident_detected = current_count >= INCIDENT_THRESHOLD
    severity = _calculate_severity(current_count) if incident_detected else "none"

    # Track active incidents
    incident_info = None
    if incident_detected:
        incident_info = {
            "category": category,
            "incident_size": current_count,
            "severity": severity,
            "affected_tickets": category_counts[category][:10],
            "time_window_minutes": TIME_WINDOW_MINUTES,
            "detected_at": now.isoformat(),
        }
        # Only add if not already tracking this category
        existing = [i for i in _active_incidents if i["category"] == category]
        if not existing:
            _active_incidents.append(incident_info)
        else:
            # Update existing
            existing[0].update(incident_info)

    elapsed = round(time.time() - start, 3)

    return {
        "agent": "IncidentAgent",
        "incident_detected": incident_detected,
        "incident_size": current_count if incident_detected else 0,
        "severity": severity,
        "category_counts": {k: len(v) for k, v in category_counts.items()},
        "incident_details": incident_info,
        "execution_time_ms": int(elapsed * 1000),
        "status": "completed",
    }


def get_active_incidents() -> list:
    """Return all currently active incidents."""
    return list(_active_incidents)


def clear_incidents():
    """Clear all tracked incidents and recent tickets."""
    global _recent_tickets, _active_incidents
    _recent_tickets = []
    _active_incidents = []
