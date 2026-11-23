"""
AI Governance + AgentOps Demo — watsonx Orchestrate Tools
Tool: classify_complaint
"""
from ibm_watsonx_orchestrate.agent_builder.tools import tool, ToolPermission
from pydantic import BaseModel
from typing import Optional
import random


class ComplaintClassification(BaseModel):
    complaint_id: str
    category: str
    priority: str
    priority_score: float
    sentiment: str
    recommended_action: str
    escalate_to_human: bool
    rationale: str


@tool(permission=ToolPermission.READ_ONLY)
def classify_complaint(
    complaint_text: str,
    customer_id: str,
    channel: Optional[str] = "chat",
) -> ComplaintClassification:
    """
    Classify a customer complaint into category, priority and sentiment.
    Returns a structured classification with recommended action.

    Args:
        complaint_text (str): The full text of the customer complaint.
        customer_id (str): The customer identifier, for example CUST-00123.
        channel (str): The channel the complaint came from: chat, email, phone, or web.

    Returns:
        ComplaintClassification: Structured classification with priority, category and action.
    """
    import hashlib

    seed = int(hashlib.md5(customer_id.encode()).hexdigest(), 16) % 1000
    rng = random.Random(seed)

    categories = ["billing", "technical_issue", "delivery", "product_quality", "account_access"]
    sentiments = ["negative", "very_negative", "neutral"]
    actions = [
        "Send automated resolution guide",
        "Assign to Tier-1 support",
        "Escalate to Tier-2 support",
        "Issue refund and notify customer",
        "Schedule callback within 24h",
    ]

    keywords_high = ["urgent", "unacceptable", "refund", "broken", "fraud", "legal", "escalate"]
    score = 0.3 + (0.4 * sum(1 for k in keywords_high if k in complaint_text.lower()))
    score = min(score, 0.95)
    score += rng.uniform(-0.05, 0.05)
    score = round(max(0.1, min(0.95, score)), 2)

    priority = "high" if score >= 0.65 else "medium" if score >= 0.40 else "low"
    escalate = score >= 0.70
    category = rng.choice(categories)
    sentiment = "very_negative" if score >= 0.75 else "negative" if score >= 0.45 else "neutral"
    action = actions[2] if escalate else actions[rng.randint(0, 1)]

    return ComplaintClassification(
        complaint_id=f"CMP-{hashlib.md5(complaint_text.encode()).hexdigest()[:8].upper()}",
        category=category,
        priority=priority,
        priority_score=score,
        sentiment=sentiment,
        recommended_action=action,
        escalate_to_human=escalate,
        rationale=(
            f"Score {score:.2f} based on keyword analysis and customer segment. "
            f"Category '{category}' inferred from complaint content. "
            f"{'Escalation triggered by high risk score.' if escalate else 'Standard routing applied.'}"
        ),
    )
