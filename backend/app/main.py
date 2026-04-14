"""
Multi-Agent AI Support Platform — FastAPI Application.
All endpoints for ticket analysis, HITL approval, learning, and demo.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import time

app = FastAPI(
    title="Multi-Agent AI Support Platform",
    description="Enterprise AI support system with multi-agent pipeline, self-learning, and incident detection.",
    version="1.0.0",
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ────────────────────────────────────────────
# Request / Response Models
# ────────────────────────────────────────────

class TicketRequest(BaseModel):
    text: str
    urgency: Optional[str] = "Low"


class ReplyRequest(BaseModel):
    text: str
    sender: str = "user"


class HITLResolveRequest(BaseModel):
    step_by_step_resolution: str
    created_by: str = "human_agent"


class ApprovalRequest(BaseModel):
    correct_category: Optional[str] = None
    human_resolution: Optional[str] = None


class RetrainRequest(BaseModel):
    force: bool = False


# ────────────────────────────────────────────
# Startup — Load models and KB
# ────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    print("\nStarting Multi-Agent AI Support Platform...")
    start = time.time()

    # Load embedding model (triggers download on first run)
    from app.agents.retrieval_agent import get_model
    model = get_model()

    # Initialize knowledge base
    from app.services.knowledge_base import initialize_kb
    initialize_kb(model)

    # Pre-warm classifier (triggers download on first run)
    from app.agents.classifier_agent import classify_ticket
    classify_ticket("warm up the model")

    elapsed = round(time.time() - start, 1)
    print(f"Platform ready in {elapsed}s\n")


# ────────────────────────────────────────────
# Health
# ────────────────────────────────────────────

@app.get("/api/health")
def health():
    from app.agents.retrieval_agent import get_ticket_count
    return {
        "status": "healthy",
        "service": "Multi-Agent AI Support Platform",
        "indexed_tickets": get_ticket_count(),
    }


# ────────────────────────────────────────────
# Ticket Operations (Client & General)
# ────────────────────────────────────────────

@app.post("/api/tickets/submit")
@app.post("/api/tickets/analyze")
def submit_ticket(req: TicketRequest):
    """Run the full multi-agent pipeline on a new support ticket."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Ticket text cannot be empty.")

    from app.agents.orchestrator import process_ticket
    result = process_ticket(req.text, req.urgency)
    return result


@app.post("/api/tickets/{ticket_id}/reply")
def reply_ticket(ticket_id: int, req: ReplyRequest):
    """Add a message to an ongoing ticket thread."""
    from app.agents.orchestrator import get_ticket_by_id
    from datetime import datetime
    
    ticket = get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found.")
        
    ticket["messages"].append({
        "sender": req.sender,
        "text": req.text,
        "timestamp": datetime.utcnow().isoformat()
    })

    # If the user replies, the AI should respond
    if req.sender == "user":
        from app.agents.resolution_agent import resolve_ticket
        # Resolve using the entire context (or just the latest text for simplicity)
        resolution = resolve_ticket(req.text, ticket["classification"])
        ai_msg_text = resolution["solution"]
        
        ticket["messages"].append({
            "sender": "agent",
            "text": ai_msg_text,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    return ticket


@app.get("/api/tickets")
def list_tickets():
    """List all processed tickets."""
    from app.agents.orchestrator import get_all_processed_tickets, get_stats
    tickets = get_all_processed_tickets()
    stats = get_stats()

    ticket_list = []
    for t in tickets:
        ticket_list.append({
            "ticket_id": t["ticket_id"],
            "urgency": t.get("urgency", "Low"),
            "text": t["text"][:150] + ("..." if len(t["text"]) > 150 else ""),
            "classification": t["classification"],
            "confidence": t["confidence"],
            "status": t["status"],
            "auto_resolved": t["auto_resolved"],
            "requires_human": t["requires_human"],
            "resolution_source": t["resolution_source"],
            "messages": t.get("messages", []),
            "incident_alert": t["incident_alert"],
            "timestamp": t["timestamp"],
            "total_pipeline_time_ms": t["total_pipeline_time_ms"],
            "human_resolution": t.get("human_resolution", ""),
            "ai_resolution": t.get("agent_results", {}).get("resolution", {}).get("solution", "")
        })

    # Sort tickets descending by urgency for the dashboard
    urgency_order = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
    ticket_list.sort(key=lambda x: (urgency_order.get(x["urgency"], 0), x["timestamp"]), reverse=True)

    return {"tickets": ticket_list, "stats": stats}


@app.get("/api/tickets/{ticket_id}")
def get_ticket(ticket_id: int):
    """Get full details of a processed ticket including decision trace and messages."""
    from app.agents.orchestrator import get_ticket_by_id
    ticket = get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found.")
    return ticket


# ────────────────────────────────────────────
# Human-in-the-Loop Admin Operations
# ────────────────────────────────────────────

@app.post("/api/tickets/{ticket_id}/hitl-resolve")
def hitl_resolve_ticket(ticket_id: int, req: HITLResolveRequest):
    """Admin provides a step-by-step resolution which trains the RAG system instantly."""
    from app.agents.orchestrator import get_ticket_by_id
    from app.services.solutions_db import add_solution
    from app.services.knowledge_base import add_human_solution_to_kb
    from app.agents.retrieval_agent import get_model
    from app.learning.feedback_store import store_feedback
    from app.learning.learning_service import check_auto_retrain
    from datetime import datetime
    
    ticket = get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found.")

    # 1. Update ticket thread and status
    ticket["messages"].append({
        "sender": "human",
        "text": req.step_by_step_resolution,
        "timestamp": datetime.utcnow().isoformat()
    })
    ticket["status"] = "human_resolved"
    ticket["requires_human"] = False
    
    # Send feedback to training module
    feedback = store_feedback(
        ticket_id=ticket_id,
        original_prediction=ticket["classification"],
        correct_category=ticket["classification"],
        original_confidence=ticket["confidence"],
        human_resolution=req.step_by_step_resolution,
    )
    auto_retrained = check_auto_retrain()

    # 2. Add to separate solutions DB
    new_solution = add_solution(
        ticket_text=ticket["text"],
        category=ticket["classification"],
        steps=req.step_by_step_resolution,
        created_by=req.created_by
    )
    
    # 3. Add to live FAISS RAG Index
    embedding_model = get_model()
    add_human_solution_to_kb(
        ticket_text=ticket["text"],
        solution_entry=new_solution,
        embedding_model=embedding_model
    )
    
    return {
        "status": "success",
        "ticket_id": ticket_id,
        "solution_id": new_solution["id"],
        "rag_updated": True,
        "auto_retrained": auto_retrained,
        "ticket": ticket
    }


@app.post("/api/tickets/{ticket_id}/approve")
def approve_ticket(ticket_id: int, req: ApprovalRequest):
    """Legacy approval endpoint for pure classification corrections."""
    from app.agents.orchestrator import get_ticket_by_id
    from app.learning.feedback_store import store_feedback
    from app.learning.learning_service import check_auto_retrain

    ticket = get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found.")

    correct_category = req.correct_category or ticket["classification"]
    human_resolution = req.human_resolution or ""

    feedback = store_feedback(
        ticket_id=ticket_id,
        original_prediction=ticket["classification"],
        correct_category=correct_category,
        original_confidence=ticket["confidence"],
        human_resolution=human_resolution,
    )

    ticket["status"] = "human_resolved"
    ticket["requires_human"] = False
    if req.correct_category:
        ticket["classification"] = correct_category

    auto_retrained = check_auto_retrain()

    return {
        "status": "approved",
        "ticket_id": ticket_id,
        "feedback_stored": True,
        "auto_retrained": auto_retrained,
    }


# ────────────────────────────────────────────
# Learning / Self-Improvement
# ────────────────────────────────────────────

@app.get("/api/learning/stats")
def learning_stats():
    """Get self-learning statistics."""
    from app.learning.learning_service import get_learning_stats
    return get_learning_stats()


@app.post("/api/learning/retrain")
def trigger_retrain(req: RetrainRequest = RetrainRequest()):
    """Trigger manual model retraining."""
    from app.learning.learning_service import retrain_classifier
    result = retrain_classifier()
    return result


# ────────────────────────────────────────────
# Demo Seed
# ────────────────────────────────────────────

@app.post("/api/demo/seed")
def seed_demo():
    """Generate and process 20 demo tickets through the pipeline."""
    from app.agents.orchestrator import process_ticket, clear_all, get_stats
    from app.agents.incident_agent import clear_incidents
    from app.demo.test_tickets import generate_demo_tickets

    # Reset state
    clear_all()
    clear_incidents()

    tickets = generate_demo_tickets()
    results = []

    for i, ticket in enumerate(tickets):
        result = process_ticket(ticket["text"], ticket_id=i + 1)
        results.append({
            "ticket_id": result["ticket_id"],
            "text": ticket["text"][:80],
            "classification": result["classification"],
            "confidence": result["confidence"],
            "auto_resolved": result["auto_resolved"],
            "incident": result["incident_alert"]["incident_detected"],
        })

    stats = get_stats()
    return {
        "tickets_processed": stats["total_tickets"],
        "auto_resolved": stats["auto_resolved"],
        "hitl_required": stats["hitl_required"],
        "incidents_detected": stats["incidents_detected"],
        "results": results,
    }


# ────────────────────────────────────────────
# Incidents
# ────────────────────────────────────────────

@app.get("/api/incidents")
def list_incidents():
    """Get all active incidents."""
    from app.agents.incident_agent import get_active_incidents
    return {"incidents": get_active_incidents()}


# ────────────────────────────────────────────
# Kaggle Dataset Integration
# ────────────────────────────────────────────

@app.post("/api/demo/seed-kaggle")
def seed_kaggle(count: int = 20):
    """Seed demo from the Kaggle Customer Support Tickets dataset."""
    from app.agents.orchestrator import process_ticket, clear_all, get_stats
    from app.agents.incident_agent import clear_incidents
    from app.services.dataset_loader import get_sample_tickets, is_dataset_available

    if not is_dataset_available():
        raise HTTPException(
            status_code=404,
            detail="Kaggle dataset not found. Please download the CSV from "
                   "https://www.kaggle.com/datasets/mirzayasirabdullah07/customer-support-tickets-dataset-200k-records "
                   "and place it at backend/data/customer_support_tickets.csv"
        )

    # Reset state
    clear_all()
    clear_incidents()

    tickets = get_sample_tickets(n=count, include_incident=True)
    results = []

    for i, ticket in enumerate(tickets):
        result = process_ticket(ticket["text"], ticket_id=i + 1)
        results.append({
            "ticket_id": result["ticket_id"],
            "text": ticket["text"][:80],
            "kaggle_category": ticket.get("kaggle_category", ""),
            "classification": result["classification"],
            "confidence": result["confidence"],
            "auto_resolved": result["auto_resolved"],
            "incident": result["incident_alert"]["incident_detected"],
        })

    stats = get_stats()
    return {
        "source": "kaggle_dataset",
        "tickets_processed": stats["total_tickets"],
        "auto_resolved": stats["auto_resolved"],
        "hitl_required": stats["hitl_required"],
        "incidents_detected": stats["incidents_detected"],
        "results": results,
    }


@app.get("/api/dataset/stats")
def dataset_stats():
    """Get statistics about the loaded Kaggle dataset."""
    from app.services.dataset_loader import get_dataset_stats
    return get_dataset_stats()
