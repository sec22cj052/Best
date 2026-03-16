"""
Dataset Loader — Loads the Kaggle Customer Support Tickets Dataset (200K+ Records).
CSV file: customer_support_tickets.csv

Expected columns:
  - issue_description: Customer problem narrative
  - resolution_notes: Support team response details
  - ticket_category: Category label (Login Issue, Payment Problem, etc.)
  - ticket_priority: Priority level
  - ticket_status: Status
  - customer_satisfaction: Satisfaction score
  ... and more metadata fields

Dataset categories:
  Login Issue, Payment Problem, Account Suspension, Bug Report,
  Feature Request, Performance Issue, Refund Request,
  Subscription Cancellation, Security Concern, Data Sync Issue

Usage:
  1. Download the CSV from Kaggle: https://www.kaggle.com/datasets/mirzayasirabdullah07/customer-support-tickets-dataset-200k-records
  2. Place the CSV file at: backend/data/customer_support_tickets.csv
  3. Call load_dataset() or the /api/demo/seed-kaggle endpoint
"""

import csv
import os
import random

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
CSV_FILE = os.path.join(DATA_DIR, "customer_support_tickets.csv")

# Map Kaggle categories to our agent categories
CATEGORY_MAP = {
    "Login Issue": "login",
    "Payment Problem": "billing",
    "Account Suspension": "access",
    "Bug Report": "software",
    "Feature Request": "software",
    "Performance Issue": "database",
    "Refund Request": "billing",
    "Subscription Cancellation": "billing",
    "Security Concern": "access",
    "Data Sync Issue": "database",
}


def is_dataset_available() -> bool:
    """Check if the Kaggle CSV file exists."""
    return os.path.exists(CSV_FILE)


def load_dataset(max_rows: int = 0) -> list:
    """
    Load the Kaggle customer support tickets CSV.
    Returns list of dicts with {text, category, resolution, priority, ...}.
    """
    if not is_dataset_available():
        return []

    tickets = []
    try:
        with open(CSV_FILE, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if max_rows > 0 and i >= max_rows:
                    break

                text = row.get("issue_description", "").strip()
                if not text:
                    continue

                kaggle_cat = row.get("ticket_category", "").strip()
                mapped_cat = CATEGORY_MAP.get(kaggle_cat, "software")

                tickets.append({
                    "text": text,
                    "category": mapped_cat,
                    "kaggle_category": kaggle_cat,
                    "resolution_notes": row.get("resolution_notes", "").strip(),
                    "priority": row.get("ticket_priority", "").strip(),
                    "status": row.get("ticket_status", "").strip(),
                    "satisfaction": row.get("customer_satisfaction", "").strip(),
                })
    except Exception as e:
        print(f"[DatasetLoader] Error loading CSV: {e}")
        return []

    return tickets


def get_sample_tickets(n: int = 20, include_incident: bool = True) -> list:
    """
    Get N random sample tickets from the Kaggle dataset.
    If include_incident=True, ensures at least 6 tickets of the same category
    to trigger incident detection.
    """
    all_tickets = load_dataset(max_rows=50000)  # limit for memory

    if not all_tickets:
        return []

    if include_incident and n >= 10:
        # Pick a category for incident simulation
        login_tickets = [t for t in all_tickets if t["category"] == "login"]
        other_tickets = [t for t in all_tickets if t["category"] != "login"]

        incident_batch = random.sample(login_tickets, min(6, len(login_tickets))) if login_tickets else []
        remaining = n - len(incident_batch)
        normal_batch = random.sample(other_tickets, min(remaining, len(other_tickets))) if other_tickets else []

        return incident_batch + normal_batch
    else:
        return random.sample(all_tickets, min(n, len(all_tickets)))


def get_dataset_stats() -> dict:
    """Get statistics about the loaded dataset."""
    if not is_dataset_available():
        return {"available": False, "path": CSV_FILE}

    tickets = load_dataset(max_rows=0)
    categories = {}
    for t in tickets:
        cat = t.get("kaggle_category", "unknown")
        categories[cat] = categories.get(cat, 0) + 1

    return {
        "available": True,
        "total_records": len(tickets),
        "categories": categories,
        "path": CSV_FILE,
    }
