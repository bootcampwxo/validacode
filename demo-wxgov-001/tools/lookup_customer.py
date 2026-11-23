"""
AI Governance + AgentOps Demo — watsonx Orchestrate Tools
Tool: lookup_customer
"""
from ibm_watsonx_orchestrate.agent_builder.tools import tool, ToolPermission
from pydantic import BaseModel
from typing import Optional
import random
import hashlib


class CustomerProfile(BaseModel):
    customer_id: str
    name: str
    tier: str
    account_age_months: int
    total_complaints_ytd: int
    csat_score: float
    churn_risk: str
    preferred_channel: str
    contract_value_usd: int


@tool(permission=ToolPermission.READ_ONLY)
def lookup_customer(customer_id: str) -> CustomerProfile:
    """
    Look up a customer profile by customer ID to retrieve account history and risk indicators.

    Args:
        customer_id (str): The customer identifier, for example CUST-00123.

    Returns:
        CustomerProfile: Full customer profile including tier, CSAT score, and churn risk.
    """
    # Deterministic synthetic data keyed by customer_id — seed=42 for reproducibility
    seed = int(hashlib.md5(customer_id.encode()).hexdigest(), 16) % 10000
    rng = random.Random(seed)

    names = [
        "Alex Johnson", "Maria Silva", "Robert Chen", "Emma Williams",
        "Carlos Mendes", "Sophie Dubois", "James Okafor", "Priya Patel",
        "Lucas Andrade", "Nina Kowalski",
    ]
    tiers = ["enterprise", "business", "standard", "trial"]
    tier_weights = [0.15, 0.30, 0.45, 0.10]
    channels = ["email", "chat", "phone", "web"]
    churn_levels = ["low", "medium", "high"]

    tier = rng.choices(tiers, weights=tier_weights)[0]
    csat = round(rng.uniform(2.5, 5.0), 1)
    churn_risk = "high" if csat < 3.2 else "medium" if csat < 4.0 else "low"
    contract = {"enterprise": 95000, "business": 25000, "standard": 5000, "trial": 0}[tier]
    contract += rng.randint(-2000, 2000)

    return CustomerProfile(
        customer_id=customer_id,
        name=rng.choice(names),
        tier=tier,
        account_age_months=rng.randint(2, 84),
        total_complaints_ytd=rng.randint(0, 12),
        csat_score=csat,
        churn_risk=churn_risk,
        preferred_channel=rng.choice(channels),
        contract_value_usd=max(0, contract),
    )
