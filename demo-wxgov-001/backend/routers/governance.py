"""Governance router — FactSheets, drift, bias, compliance"""
from fastapi import APIRouter
from config import settings
from services.synthetic_data_service import get_factsheet, get_governance_timeline

router = APIRouter()

# Use live service when credentials are present
_live_enabled = bool(settings.watsonx_api_key and settings.wxg_space_id)

if _live_enabled:
    from services.governance_live_service import fetch_factsheet_live, fetch_timeline_live
    import logging
    logging.getLogger(__name__).info(
        "governance router: LIVE mode (space_id=%s)", settings.wxg_space_id
    )


def _get_factsheet():
    if _live_enabled:
        return fetch_factsheet_live(
            api_key=settings.watsonx_api_key,
            space_id=settings.wxg_space_id,
            base_url=settings.watsonx_url,
        )
    return get_factsheet()


def _get_timeline():
    if _live_enabled:
        return fetch_timeline_live(
            api_key=settings.watsonx_api_key,
            space_id=settings.wxg_space_id,
            base_url=settings.watsonx_url,
        )
    return get_governance_timeline()


@router.get("/factsheet")
def factsheet():
    return _get_factsheet()


@router.get("/timeline")
def timeline():
    return _get_timeline()


@router.get("/summary")
def governance_summary():
    fs = _get_factsheet()
    return {
        "drift_score": fs["monitoring"]["drift_current"],
        "drift_threshold": fs["monitoring"]["drift_threshold"],
        "drift_status": "normal" if fs["monitoring"]["drift_current"] < fs["monitoring"]["drift_threshold"] else "alert",
        "bias_score": fs["monitoring"]["bias_current"],
        "bias_threshold": fs["monitoring"]["bias_threshold"],
        "bias_status": "normal" if fs["monitoring"]["bias_current"] < fs["monitoring"]["bias_threshold"] else "alert",
        "eu_ai_act_risk_level": fs.get("eu_ai_act_article", ""),
        "model_status": fs.get("status", ""),
        "approved_by": fs.get("approved_by", ""),
        "approved_date": fs.get("approved_at", ""),
        "policy_constraints": fs.get("policy_constraints", []),
        "source": fs.get("source", "synthetic"),
        "disclaimer": "Demo environment. Synthetic data where live data unavailable.",
    }
