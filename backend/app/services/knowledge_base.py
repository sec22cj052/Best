"""
Knowledge Base — Pre-loaded solutions for common support categories.
Uses FAISS for semantic search over KB entries.
"""

import numpy as np
import faiss

_kb_entries = []
_kb_index = None
_kb_initialized = False

# Pre-loaded knowledge base articles
KB_DATA = [
    {
        "title": "Password Reset Procedure",
        "category": "login",
        "description": "User cannot login or has forgotten their password",
        "steps": [
            "Navigate to the login page and click 'Forgot Password'",
            "Enter the registered email address",
            "Check email for the reset link (expires in 24 hours)",
            "Click the link and set a new password (min 8 chars, 1 uppercase, 1 number)",
            "Clear browser cache and cookies, then try logging in again",
        ],
        "notes": "If the reset email is not received within 5 minutes, check spam folder. Contact IT if issue persists.",
    },
    {
        "title": "Account Lockout Resolution",
        "category": "login",
        "description": "Account locked due to multiple failed login attempts",
        "steps": [
            "Wait 15 minutes for automatic unlock",
            "If still locked, contact IT Help Desk for manual unlock",
            "Reset password after unlock",
            "Enable 2FA to prevent future lockouts",
        ],
        "notes": "Accounts lock after 5 failed attempts. Consider using a password manager.",
    },
    {
        "title": "WiFi Connectivity Troubleshooting",
        "category": "network",
        "description": "WiFi keeps disconnecting or is unstable",
        "steps": [
            "Restart your device's WiFi adapter (disable/enable)",
            "Forget the network and reconnect with credentials",
            "Move closer to the access point to improve signal",
            "Check if other devices have the same issue (may indicate AP problem)",
            "Run 'ipconfig /release' then 'ipconfig /renew' on Windows",
        ],
        "notes": "If multiple users are affected, this may be an infrastructure issue. Report to network team.",
    },
    {
        "title": "VPN Connection Troubleshooting",
        "category": "network",
        "description": "VPN connection failing or dropping",
        "steps": [
            "Ensure your VPN client is updated to the latest version",
            "Check your internet connection independently of VPN",
            "Try connecting to a different VPN server/region",
            "Temporarily disable firewall/antivirus and retry",
            "Clear VPN client cache and reconfigure the connection",
        ],
        "notes": "VPN issues after OS updates may require reinstalling the VPN client.",
    },
    {
        "title": "Database Connection Timeout",
        "category": "database",
        "description": "Applications experiencing database connection timeouts",
        "steps": [
            "Check database server status and resource utilization",
            "Verify connection pool settings (max connections, timeout values)",
            "Check network connectivity between app server and database",
            "Review recent schema changes or heavy queries",
            "Restart the connection pool or application if needed",
        ],
        "notes": "Connection timeouts often indicate resource exhaustion. Monitor CPU/memory on db server.",
    },
    {
        "title": "Slow Query Performance",
        "category": "database",
        "description": "Database queries executing extremely slowly",
        "steps": [
            "Identify the slow query using database monitoring tools",
            "Run EXPLAIN ANALYZE on the query to check execution plan",
            "Add appropriate indexes for frequently queried columns",
            "Check for table bloat and run maintenance (VACUUM/ANALYZE)",
            "Consider query optimization or caching strategies",
        ],
        "notes": "Long-running queries may lock tables. Schedule maintenance during off-peak hours.",
    },
    {
        "title": "Hardware — Keyboard Issues",
        "category": "hardware",
        "description": "Laptop or desktop keyboard not functioning",
        "steps": [
            "Check if it's a physical or software issue (try external keyboard)",
            "Update or reinstall keyboard drivers via Device Manager",
            "Check for stuck keys or debris under keys",
            "Run hardware diagnostics from BIOS if available",
            "Submit a hardware replacement request if defective",
        ],
        "notes": "External USB keyboards can be used as temporary workaround.",
    },
    {
        "title": "Printer Offline Resolution",
        "category": "hardware",
        "description": "Printer showing offline status",
        "steps": [
            "Check printer power and network/USB connections",
            "Restart the Print Spooler service on your computer",
            "Remove and re-add the printer in Settings > Printers",
            "Update printer drivers from manufacturer website",
            "Check if the printer has a paper jam or low ink/toner",
        ],
        "notes": "Network printers may need a static IP. Check with IT for correct printer setup.",
    },
    {
        "title": "Billing — Invoice Correction",
        "category": "billing",
        "description": "Invoice generated with incorrect amounts or details",
        "steps": [
            "Verify the billing period and line items in the invoice",
            "Compare with the service agreement or subscription plan",
            "Submit a billing dispute through the billing portal",
            "Provide supporting documentation (contract, previous correct invoices)",
            "Finance team will review and issue a corrected invoice within 2-3 business days",
        ],
        "notes": "For recurring discrepancies, request a billing audit from the finance department.",
    },
    {
        "title": "Payment Method Update",
        "category": "billing",
        "description": "Unable to update payment method in the system",
        "steps": [
            "Log into the billing portal with admin credentials",
            "Navigate to Payment Methods section",
            "Remove the expired/invalid payment method",
            "Add new payment details and verify with a micro-transaction",
            "Set the new method as default for future charges",
        ],
        "notes": "Payment processing changes may take 24-48 hours to reflect.",
    },
    {
        "title": "Admin Dashboard Access",
        "category": "access",
        "description": "User cannot access administrative features",
        "steps": [
            "Verify user role in the admin management panel",
            "Check if the user's account has the Admin or Superadmin role",
            "If role is missing, submit an access request to the manager",
            "Manager approval grants access within 1-2 hours",
            "Clear browser cache and re-login after role assignment",
        ],
        "notes": "Access requests require manager approval per company policy.",
    },
    {
        "title": "Shared Folder Permissions",
        "category": "access",
        "description": "Permission denied error when accessing shared resources",
        "steps": [
            "Check if you're logged into the correct domain account",
            "Verify folder permissions with the folder owner",
            "Request access through the IT self-service portal",
            "If inherited permissions, check parent folder ACL",
            "Contact Active Directory team for group policy issues",
        ],
        "notes": "Shared folder access follows the principle of least privilege.",
    },
]


def initialize_kb(embedding_model):
    """Build the FAISS index for knowledge base entries + human solutions."""
    global _kb_entries, _kb_index, _kb_initialized

    if _kb_initialized:
        return

    from app.services.solutions_db import load_solutions
    human_solutions = load_solutions()

    _kb_entries = KB_DATA.copy()
    _kb_entries.extend(human_solutions)

    # Create searchable text for each entry
    texts = []
    for entry in _kb_entries:
        if "ticket_text" in entry:
            # For human solutions, embed the original problematic ticket text
            search_text = entry["ticket_text"]
        else:
            # For standard KB, embed title, desc, and steps
            search_text = f"{entry['title']}. {entry['description']}. {' '.join(entry['steps'])}"
        texts.append(search_text)

    # Encode and index
    embeddings = embedding_model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    _kb_index = faiss.IndexFlatIP(384)
    _kb_index.add(np.array(embeddings, dtype=np.float32))

    _kb_initialized = True
    print(f"[KnowledgeBase] Indexed {len(KB_DATA)} standard KB articles and {len(human_solutions)} human solutions.")


def add_human_solution_to_kb(ticket_text: str, solution_entry: dict, embedding_model):
    """Dynamically embed a ticket's text and insert the solution into the live RAG index."""
    global _kb_entries, _kb_index

    # Add to in-memory list
    _kb_entries.append(solution_entry)
    
    # Embed the original ticket text that caused the problem
    embedding = embedding_model.encode([ticket_text], normalize_embeddings=True, show_progress_bar=False)
    
    # Add to FAISS index
    if _kb_index is not None:
        _kb_index.add(np.array(embedding, dtype=np.float32))
    
    print(f"[KnowledgeBase] Live RAG update: added solution '{solution_entry['id']}' to index.")


def get_kb_entries():
    return _kb_entries


def get_kb_index():
    return _kb_index


def get_kb_embeddings():
    return None  # Not stored separately; index is sufficient
