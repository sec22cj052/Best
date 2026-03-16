"""
Test Tickets — 20 realistic support tickets for demo and testing.
Includes an incident scenario with clustered login tickets.
"""

from datetime import datetime, timedelta


def generate_demo_tickets() -> list:
    """Generate 20 realistic support tickets across 6 categories."""
    now = datetime.utcnow()

    tickets = [
        # === LOGIN ISSUES (6 tickets in short window → trigger incident) ===
        {
            "text": "User cannot login after password reset. Getting 'invalid credentials' error.",
            "expected_category": "login",
            "timestamp": (now - timedelta(minutes=10)).isoformat(),
        },
        {
            "text": "Multiple failed login attempts have locked my account. Need immediate access.",
            "expected_category": "login",
            "timestamp": (now - timedelta(minutes=9)).isoformat(),
        },
        {
            "text": "SSO login redirects to a blank page. Cannot access any company applications.",
            "expected_category": "login",
            "timestamp": (now - timedelta(minutes=8)).isoformat(),
        },
        {
            "text": "Two-factor authentication code is not being accepted. Tried multiple times.",
            "expected_category": "login",
            "timestamp": (now - timedelta(minutes=7)).isoformat(),
        },
        {
            "text": "Login page shows 'session expired' immediately after entering credentials.",
            "expected_category": "login",
            "timestamp": (now - timedelta(minutes=6)).isoformat(),
        },
        {
            "text": "Cannot sign in to the employee portal. Error: 'Authentication service unavailable'.",
            "expected_category": "login",
            "timestamp": (now - timedelta(minutes=5)).isoformat(),
        },

        # === NETWORK ISSUES ===
        {
            "text": "Office WiFi keeps disconnecting every 5 minutes. Signal strength shows full bars.",
            "expected_category": "network",
            "timestamp": (now - timedelta(minutes=25)).isoformat(),
        },
        {
            "text": "VPN connection failing after the latest Windows update. Error code 807.",
            "expected_category": "network",
            "timestamp": (now - timedelta(minutes=20)).isoformat(),
        },
        {
            "text": "Internet speed extremely slow on wired connection. Speedtest shows 2 Mbps instead of 100.",
            "expected_category": "network",
            "timestamp": (now - timedelta(minutes=15)).isoformat(),
        },

        # === DATABASE ISSUES ===
        {
            "text": "Database connection timeout error on the production server. Application is down.",
            "expected_category": "database",
            "timestamp": (now - timedelta(minutes=30)).isoformat(),
        },
        {
            "text": "SQL query execution extremely slow. Reports page taking 45 seconds to load.",
            "expected_category": "database",
            "timestamp": (now - timedelta(minutes=28)).isoformat(),
        },

        # === HARDWARE ISSUES ===
        {
            "text": "Laptop keyboard not working. Some keys are completely unresponsive.",
            "expected_category": "hardware",
            "timestamp": (now - timedelta(minutes=45)).isoformat(),
        },
        {
            "text": "Printer showing offline even though it's powered on and connected to the network.",
            "expected_category": "hardware",
            "timestamp": (now - timedelta(minutes=40)).isoformat(),
        },
        {
            "text": "External monitor not detected by laptop. Tried different cables and ports.",
            "expected_category": "hardware",
            "timestamp": (now - timedelta(minutes=35)).isoformat(),
        },

        # === BILLING ISSUES ===
        {
            "text": "Invoice generated with incorrect amount. Shows double charge for March subscription.",
            "expected_category": "billing",
            "timestamp": (now - timedelta(minutes=60)).isoformat(),
        },
        {
            "text": "Unable to update payment method. System rejects the new credit card.",
            "expected_category": "billing",
            "timestamp": (now - timedelta(minutes=55)).isoformat(),
        },
        {
            "text": "Subscription auto-renewed at wrong price. Should be $49/month but charged $99.",
            "expected_category": "billing",
            "timestamp": (now - timedelta(minutes=50)).isoformat(),
        },

        # === ACCESS ISSUES ===
        {
            "text": "Cannot access admin dashboard. Getting 'Permission Denied' error since this morning.",
            "expected_category": "access",
            "timestamp": (now - timedelta(minutes=70)).isoformat(),
        },
        {
            "text": "Permission denied for shared folder. Was working yesterday, suddenly can't access.",
            "expected_category": "access",
            "timestamp": (now - timedelta(minutes=65)).isoformat(),
        },
        {
            "text": "New employee needs access to Jira, Confluence, and GitHub. Start date is Monday.",
            "expected_category": "access",
            "timestamp": (now - timedelta(minutes=62)).isoformat(),
        },
    ]

    return tickets
