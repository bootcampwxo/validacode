"""
AI Governance + AgentOps Demo — watsonx Orchestrate Tools
Tool: draft_response + escalate_to_human
"""
from ibm_watsonx_orchestrate.agent_builder.tools import tool, ToolPermission
from pydantic import BaseModel
from typing import Optional


class DraftResponse(BaseModel):
    draft_id: str
    subject: str
    body: str
    tone: str
    estimated_resolution_hours: int
    sla_compliant: bool


class EscalationTicket(BaseModel):
    ticket_id: str
    escalation_level: str
    assigned_team: str
    priority: str
    reason: str
    expected_callback_hours: int
    governance_flag: bool
    governance_note: Optional[str]


@tool(permission=ToolPermission.READ_WRITE)
def draft_response(
    complaint_id: str,
    complaint_summary: str,
    priority: str,
    customer_tier: str,
) -> DraftResponse:
    """
    Draft a customer response for a classified complaint.
    Returns a ready-to-send response body with SLA compliance check.

    Args:
        complaint_id (str): The complaint identifier returned by classify_complaint.
        complaint_summary (str): A one-sentence summary of the complaint.
        priority (str): The priority level: low, medium, or high.
        customer_tier (str): The customer tier: trial, standard, business, or enterprise.

    Returns:
        DraftResponse: A draft email response with tone, body, and SLA compliance status.
    """
    import hashlib

    draft_id = f"DFT-{hashlib.md5(complaint_id.encode()).hexdigest()[:8].upper()}"

    sla_hours = {"enterprise": 2, "business": 8, "standard": 24, "trial": 48}.get(customer_tier, 24)
    priority_mult = {"high": 0.5, "medium": 1.0, "low": 2.0}.get(priority, 1.0)
    resolution_hours = max(1, int(sla_hours * priority_mult))
    sla_compliant = resolution_hours <= sla_hours

    tones = {"high": "apologetic and urgent", "medium": "professional and empathetic", "low": "friendly and informative"}
    tone = tones.get(priority, "professional")

    body = (
        f"Dear Valued Customer,\n\n"
        f"Thank you for bringing this matter to our attention. "
        f"We sincerely apologize for the inconvenience regarding: {complaint_summary}\n\n"
        f"Our team has reviewed your case (Ref: {complaint_id}) and we are committed to resolving "
        f"this within {resolution_hours} hour(s). "
        f"{'As an {customer_tier} customer, you are our highest priority.' if customer_tier in ('enterprise', 'business') else ''}\n\n"
        f"We will keep you updated at every step.\n\n"
        f"Best regards,\nCustomer Experience Team"
    )

    return DraftResponse(
        draft_id=draft_id,
        subject=f"Re: Your Recent Complaint [{complaint_id}]",
        body=body,
        tone=tone,
        estimated_resolution_hours=resolution_hours,
        sla_compliant=sla_compliant,
    )


@tool(permission=ToolPermission.READ_WRITE)
def escalate_to_human(
    complaint_id: str,
    reason: str,
    priority: str,
    customer_tier: str,
    governance_flag: Optional[bool] = False,
) -> EscalationTicket:
    """
    Escalate a complaint to a human agent and create a support ticket.
    Sets governance flag when the case may require regulatory review.

    Args:
        complaint_id (str): The complaint identifier.
        reason (str): A brief explanation of why escalation is needed.
        priority (str): The priority level: low, medium, or high.
        customer_tier (str): The customer tier: trial, standard, business, or enterprise.
        governance_flag (bool): Set to True if the case may have regulatory or compliance implications.

    Returns:
        EscalationTicket: A created escalation ticket with team assignment and callback SLA.
    """
    import hashlib

    ticket_id = f"ESC-{hashlib.md5((complaint_id + reason).encode()).hexdigest()[:8].upper()}"

    team_map = {"enterprise": "VIP Support - L3", "business": "Business Support - L2", "standard": "Support - L1", "trial": "Support - L1"}
    callback_map = {"high": 1, "medium": 4, "low": 24}
    escalation_map = {"high": "P1-Critical", "medium": "P2-Major", "low": "P3-Minor"}

    gov_note = None
    if governance_flag:
        gov_note = (
            "⚠️ GOVERNANCE FLAG: This case has been flagged for compliance review. "
            "AI decision rationale has been captured in watsonx.governance FactSheet. "
            "Regulatory audit trail preserved per EU AI Act Article 12."
        )

    return EscalationTicket(
        ticket_id=ticket_id,
        escalation_level=escalation_map.get(priority, "P3-Minor"),
        assigned_team=team_map.get(customer_tier, "Support - L1"),
        priority=priority,
        reason=reason,
        expected_callback_hours=callback_map.get(priority, 24),
        governance_flag=governance_flag,
        governance_note=gov_note,
    )
