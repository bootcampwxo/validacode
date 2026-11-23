"""
DEMO-WXGOV-001 — Synthetic Data Service
All data is fictional. No real client data or PII.
Faker seed=42 for reproducibility.
"""
from faker import Faker
from datetime import datetime, timedelta
import random
import hashlib

fake = Faker()
fake.seed_instance(42)
rng = random.Random(42)

# Fictional companies — NEVER real client names
FICTIONAL_COMPANIES = [
    "Apex Manufacturing", "NovaTech Solutions", "BlueLine Logistics",
    "Meridian Financial", "Greenfield Healthcare", "Pinnacle Energy",
    "Atlas Retail", "Quantum Telecom", "Brightpath Insurance", "Ironbridge Construction",
]

CATEGORIES = ["billing", "technical_issue", "delivery", "product_quality", "account_access"]
PRIORITIES = ["low", "medium", "high"]
CHANNELS = ["chat", "email", "phone", "web"]
STATUSES = ["resolved", "pending", "escalated", "in_review"]
TIERS = ["enterprise", "business", "standard", "trial"]


def _make_complaint(idx: int) -> dict:
    seed = 42 + idx
    r = random.Random(seed)
    days_ago = r.randint(0, 90)
    created = datetime.now() - timedelta(days=days_ago, hours=r.randint(0, 23))
    score = round(r.uniform(0.1, 0.95), 2)
    priority = "high" if score >= 0.65 else "medium" if score >= 0.40 else "low"
    cid = f"CUST-{r.randint(1, 999):05d}"
    company_seed = int(hashlib.md5(cid.encode()).hexdigest(), 16) % len(FICTIONAL_COMPANIES)
    return {
        "id": f"CMP-{hashlib.md5(str(idx).encode()).hexdigest()[:8].upper()}",
        "customer_id": cid,
        "company": FICTIONAL_COMPANIES[company_seed],
        "channel": r.choice(CHANNELS),
        "category": r.choice(CATEGORIES),
        "priority": priority,
        "priority_score": score,
        "status": r.choice(STATUSES),
        "created_at": created.isoformat(),
        "resolved_at": (created + timedelta(hours=r.randint(1, 72))).isoformat() if r.random() > 0.4 else None,
        "governance_flagged": r.random() < 0.08,
        "ai_handled": r.random() < 0.72,
        "csat_score": round(r.uniform(1.0, 5.0), 1) if r.random() > 0.3 else None,
        "escalated": priority == "high" or r.random() < 0.15,
        "text_snippet": f"Customer from {FICTIONAL_COMPANIES[company_seed]} reported a {r.choice(CATEGORIES).replace('_', ' ')} issue.",
    }


# Pre-generate 500 records at module load
_COMPLAINTS = [_make_complaint(i) for i in range(500)]


def get_dashboard_data() -> dict:
    total = len(_COMPLAINTS)
    resolved = sum(1 for c in _COMPLAINTS if c["status"] == "resolved")
    escalated = sum(1 for c in _COMPLAINTS if c["escalated"])
    gov_flagged = sum(1 for c in _COMPLAINTS if c["governance_flagged"])
    ai_handled = sum(1 for c in _COMPLAINTS if c["ai_handled"])
    csat_scores = [c["csat_score"] for c in _COMPLAINTS if c["csat_score"]]
    avg_csat = round(sum(csat_scores) / len(csat_scores), 2)

    # Last 30 days volume trend
    today = datetime.now()
    volume_chart = []
    for d in range(30, 0, -1):
        day = today - timedelta(days=d)
        day_str = day.strftime("%Y-%m-%d")
        count = sum(
            1 for c in _COMPLAINTS
            if c["created_at"][:10] == day_str
        )
        volume_chart.append({"date": day_str, "value": count or rng.randint(8, 25)})

    # Category distribution
    from collections import Counter
    cat_counts = Counter(c["category"] for c in _COMPLAINTS)
    category_chart = [{"group": k.replace("_", " ").title(), "value": v} for k, v in cat_counts.items()]

    # Priority distribution
    pri_counts = Counter(c["priority"] for c in _COMPLAINTS)
    priority_chart = [{"group": k.capitalize(), "value": v} for k, v in pri_counts.items()]

    # Governance metrics
    drift_score = 0.12  # static demo value — below 0.20 threshold
    bias_score = 0.04   # well within acceptable range
    compliance_rate = round((total - gov_flagged) / total * 100, 1)

    # Recent activity (last 10)
    recent = sorted(_COMPLAINTS, key=lambda x: x["created_at"], reverse=True)[:10]

    return {
        "kpis": [
            {"title": "Total Complaints (90d)", "value": total, "unit": "", "trend": "+3.2%", "trend_direction": "up", "status": "info"},
            {"title": "Resolution Rate", "value": round(resolved / total * 100, 1), "unit": "%", "trend": "+1.8%", "trend_direction": "up", "status": "success"},
            {"title": "AI-Handled Rate", "value": round(ai_handled / total * 100, 1), "unit": "%", "trend": "+5.4%", "trend_direction": "up", "status": "success"},
            {"title": "Avg CSAT Score", "value": avg_csat, "unit": "/5.0", "trend": "+0.2", "trend_direction": "up", "status": "success"},
            {"title": "Governance Flags", "value": gov_flagged, "unit": "", "trend": "-2", "trend_direction": "down", "status": "warning"},
            {"title": "Escalations", "value": escalated, "unit": "", "trend": "-1.1%", "trend_direction": "down", "status": "warning"},
        ],
        "governance": {
            "drift_score": drift_score,
            "drift_threshold": 0.20,
            "drift_status": "normal",
            "bias_score": bias_score,
            "bias_threshold": 0.10,
            "bias_status": "normal",
            "compliance_rate": compliance_rate,
            "factsheet_version": "v2.1.0",
            "last_evaluation": (datetime.now() - timedelta(hours=6)).isoformat(),
            "next_evaluation": (datetime.now() + timedelta(hours=18)).isoformat(),
            "eu_ai_act_risk_level": "limited",
            "approved_by": "AI Review Board",
            "approved_date": (datetime.now() - timedelta(days=14)).isoformat(),
        },
        "volume_chart": volume_chart,
        "category_chart": category_chart,
        "priority_chart": priority_chart,
        "recent_activity": recent,
        "disclaimer": "All data is synthetic. No real client data or PII.",
    }


def get_complaints(
    page: int = 1,
    page_size: int = 20,
    status: str | None = None,
    priority: str | None = None,
    governance_flagged: bool | None = None,
    search: str | None = None,
) -> dict:
    filtered = _COMPLAINTS
    if status:
        filtered = [c for c in filtered if c["status"] == status]
    if priority:
        filtered = [c for c in filtered if c["priority"] == priority]
    if governance_flagged is not None:
        filtered = [c for c in filtered if c["governance_flagged"] == governance_flagged]
    if search:
        s = search.lower()
        filtered = [c for c in filtered if s in c["customer_id"].lower() or s in c["id"].lower() or s in c["company"].lower()]

    total = len(filtered)
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "items": filtered[start:end],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


def get_governance_timeline() -> list[dict]:
    """Return 30-day governance metrics timeline for charts."""
    today = datetime.now()
    timeline = []
    drift = 0.08
    bias = 0.03
    for d in range(30, 0, -1):
        day = today - timedelta(days=d)
        drift += rng.uniform(-0.005, 0.008)
        bias += rng.uniform(-0.003, 0.005)
        drift = max(0.02, min(0.25, drift))
        bias = max(0.01, min(0.12, bias))
        timeline.append({
            "date": day.strftime("%Y-%m-%d"),
            "drift_score": round(drift, 3),
            "bias_score": round(bias, 3),
            "compliance_rate": round(100 - (drift * 50), 1),
        })
    return timeline


def get_factsheet() -> dict:
    """Return a mock AI FactSheet for the governance agent model."""
    return {
        "model_id": "governance-complaint-classifier-v2.1",
        "model_name": "Complaint Classification Model",
        "version": "2.1.0",
        "created_by": "AI Engineering Team",
        "created_at": (datetime.now() - timedelta(days=120)).isoformat(),
        "approved_by": "AI Review Board",
        "approved_at": (datetime.now() - timedelta(days=14)).isoformat(),
        "status": "approved_for_production",
        "risk_level": "limited",
        "eu_ai_act_article": "Article 6 — Limited Risk AI System",
        "training_data": {
            "dataset": "Synthetic Customer Complaint Dataset v3",
            "size": 125000,
            "date_range": "2022-01-01 to 2024-06-30",
            "languages": ["English", "Portuguese", "Spanish"],
            "bias_check": "passed",
            "demographic_coverage": "balanced across age, region, gender",
        },
        "performance_metrics": {
            "accuracy": 0.891,
            "f1_score": 0.874,
            "precision": 0.883,
            "recall": 0.866,
            "auc_roc": 0.941,
            "evaluation_date": (datetime.now() - timedelta(days=14)).isoformat(),
        },
        "monitoring": {
            "drift_current": 0.12,
            "drift_threshold": 0.20,
            "bias_current": 0.04,
            "bias_threshold": 0.10,
            "last_check": (datetime.now() - timedelta(hours=6)).isoformat(),
            "alerts_active": 0,
        },
        "policy_constraints": [
            "Approved for use in complaint triage only",
            "Not approved for financial decisions",
            "Re-evaluation required if drift > 0.20",
            "Human review required for governance-flagged cases",
            "Audit trail retention: 7 years",
        ],
        "disclaimer": "All data is synthetic. This FactSheet represents a demonstration model.",
    }
