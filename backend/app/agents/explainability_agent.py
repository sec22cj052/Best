"""
Explainability Agent — Builds a structured decision trace explaining AI reasoning.
Combines outputs from all other agents into a comprehensive explanation.
"""

import time


def build_decision_trace(
    ticket_text: str,
    classification: dict,
    retrieval: dict,
    resolution: dict,
    incident: dict,
) -> dict:
    """Build a comprehensive decision trace explaining the AI reasoning pipeline."""
    start = time.time()

    # Classification reasoning
    classification_trace = {
        "step": "1. Text Classification",
        "agent": "ClassifierAgent",
        "input": ticket_text[:200],
        "method": "Zero-shot NLI (DistilBERT-MNLI)",
        "predicted_category": classification.get("category", "unknown"),
        "confidence": classification.get("confidence", 0),
        "top_alternatives": classification.get("all_predictions", [])[:3],
        "reasoning": _explain_classification(classification),
    }

    # Retrieval reasoning
    similar = retrieval.get("similar_tickets", [])
    retrieval_trace = {
        "step": "2. Semantic Search",
        "agent": "RetrievalAgent",
        "method": "FAISS + all-MiniLM-L6-v2 embeddings",
        "total_indexed": retrieval.get("total_indexed", 0),
        "matches_found": len(similar),
        "top_match_similarity": similar[0]["similarity"] if similar else 0,
        "reasoning": _explain_retrieval(similar),
    }

    # Resolution reasoning
    resolution_trace = {
        "step": "3. Resolution Generation",
        "agent": "ResolutionAgent",
        "method": "Template-based RAG over Knowledge Base",
        "source": resolution.get("source", "unknown"),
        "confidence": resolution.get("confidence", 0),
        "auto_resolve": resolution.get("auto_resolve", False),
        "kb_match": resolution.get("kb_match"),
        "reasoning": _explain_resolution(resolution),
    }

    # Incident reasoning
    incident_trace = {
        "step": "4. Incident Detection",
        "agent": "IncidentAgent",
        "method": "Sliding time-window category clustering",
        "incident_detected": incident.get("incident_detected", False),
        "severity": incident.get("severity", "none"),
        "reasoning": _explain_incident(incident),
    }

    # Final decision
    auto_resolve = resolution.get("auto_resolve", False)
    confidence = classification.get("confidence", 0)

    final_decision = {
        "step": "5. Final Decision",
        "action": "auto_resolve" if auto_resolve else "human_review",
        "classification_confidence": confidence,
        "resolution_confidence": resolution.get("confidence", 0),
        "requires_human": not auto_resolve,
        "incident_escalation": incident.get("incident_detected", False),
        "reasoning": _explain_final_decision(auto_resolve, confidence, incident),
    }

    elapsed = round(time.time() - start, 3)

    return {
        "agent": "ExplainabilityAgent",
        "decision_trace": {
            "classification": classification_trace,
            "semantic_search": retrieval_trace,
            "resolution": resolution_trace,
            "incident_detection": incident_trace,
            "final_decision": final_decision,
        },
        "summary": _build_summary(classification, resolution, incident, auto_resolve),
        "execution_time_ms": int(elapsed * 1000),
        "status": "completed",
    }


def _explain_classification(clf: dict) -> str:
    cat = clf.get("category", "unknown")
    conf = clf.get("confidence", 0)
    if conf >= 0.8:
        return f"High confidence classification as '{cat}' ({conf:.0%}). The model strongly associates the input text with this category."
    elif conf >= 0.5:
        return f"Moderate confidence classification as '{cat}' ({conf:.0%}). The input has some ambiguity but this is the most likely category."
    else:
        return f"Low confidence classification as '{cat}' ({conf:.0%}). The input may span multiple categories; human verification recommended."


def _explain_retrieval(similar: list) -> str:
    if not similar:
        return "No similar tickets found in the database. This appears to be a novel issue."
    top_sim = similar[0]["similarity"]
    if top_sim >= 0.8:
        return f"Found {len(similar)} similar tickets. Top match has {top_sim:.0%} similarity — this is a frequently reported issue."
    elif top_sim >= 0.5:
        return f"Found {len(similar)} somewhat similar tickets (top: {top_sim:.0%}). Related issues exist but may not be identical."
    else:
        return f"Found {len(similar)} loosely related tickets (top: {top_sim:.0%}). This may be a relatively unique issue."


def _explain_resolution(res: dict) -> str:
    source = res.get("source", "unknown")
    conf = res.get("confidence", 0)
    if source == "knowledge_base" and conf >= 0.65:
        return f"Matched a knowledge base article with {conf:.0%} confidence. Auto-resolution is recommended."
    elif source == "knowledge_base":
        return f"Found a partial KB match ({conf:.0%}). The solution may apply but human verification is advisable."
    else:
        return "No confident knowledge base match found. This ticket requires human expert resolution."


def _explain_incident(inc: dict) -> str:
    if inc.get("incident_detected"):
        size = inc.get("incident_size", 0)
        severity = inc.get("severity", "unknown")
        return f"INCIDENT DETECTED: {size} similar tickets in the time window. Severity: {severity}. This may indicate a systemic issue."
    return "No incident pattern detected. Ticket volume for this category is within normal range."


def _explain_final_decision(auto_resolve: bool, confidence: float, incident: dict) -> str:
    if incident.get("incident_detected"):
        return "Escalating due to active incident. Even if auto-resolution is possible, incident cases should be reviewed by the operations team."
    if auto_resolve:
        return f"Auto-resolving: high-confidence KB match found. Classification confidence: {confidence:.0%}."
    return "Routing to human agent for review. Either classification confidence is low or no strong KB match was found."


def _build_summary(clf: dict, res: dict, inc: dict, auto_resolve: bool) -> str:
    parts = []
    parts.append(f"Classified as '{clf.get('category', '?')}' ({clf.get('confidence', 0):.0%} confidence).")

    if res.get("source") == "knowledge_base":
        parts.append(f"KB match found ({res.get('confidence', 0):.0%} similarity).")
    else:
        parts.append("No KB match — needs human resolution.")

    if inc.get("incident_detected"):
        parts.append(f"⚠️ Active incident: {inc.get('severity', 'unknown')} severity.")

    action = "Auto-resolved" if auto_resolve else "Pending human review"
    parts.append(f"Action: {action}.")

    return " ".join(parts)
