"""
Solutions Database — Separate storage for Human-in-the-Loop (HITL) step-by-step solutions.
These are added dynamically and complement the fixed KB_DATA.
"""

import json
import os
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

SOLUTIONS_FILE = os.path.join(DATA_DIR, "solutions_db.json")

def load_solutions() -> list:
    """Load all human-provided solutions from JSON."""
    if not os.path.exists(SOLUTIONS_FILE):
        return []
    try:
        with open(SOLUTIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[SolutionsDB] Error loading solutions: {e}")
        return []

def save_solutions(solutions: list):
    """Save solutions to JSON."""
    try:
        with open(SOLUTIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(solutions, f, indent=2)
    except Exception as e:
        print(f"[SolutionsDB] Error saving solutions: {e}")

def add_solution(ticket_text: str, category: str, steps: str, created_by: str = "human_agent") -> dict:
    """Add a new human solution to the database and return it."""
    solutions = load_solutions()
    
    # Format steps into a list if it's a block of text
    step_list = [s.strip() for s in steps.split("\n") if s.strip()]
    
    new_solution = {
        "id": f"sol_{len(solutions) + 1}_{int(datetime.utcnow().timestamp())}",
        "ticket_text": ticket_text,
        "title": f"Resolution for {category.title()} Ticket",
        "category": category,
        "description": ticket_text[:100] + ("..." if len(ticket_text) > 100 else ""),
        "steps": step_list,
        "notes": f"HITL generated solution by {created_by}",
        "created_at": datetime.utcnow().isoformat()
    }
    
    solutions.append(new_solution)
    save_solutions(solutions)
    
    return new_solution
