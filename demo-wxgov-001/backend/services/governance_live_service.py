"""
DEMO-WXGOV-001 — watsonx.governance Live Service
Reads real FactSheets and monitoring data from the watsonx.governance REST API.
Falls back to synthetic data on any error so the demo never crashes live.
"""
import logging
import httpx
from services.watsonx_service import get_iam_token
from services.synthetic_data_service import get_factsheet, get_governance_timeline

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Factsheet — reads from watsonx.governance FactSheets API
# ---------------------------------------------------------------------------

def fetch_factsheet_live(api_key: str, space_id: str, base_url: str) -> dict:
    """
    Fetch the most recent model FactSheet entry from watsonx.governance.
    API: GET /v2/assets?space_id=<id>&type_name=modelfacts_lifecycle
    Falls back to synthetic factsheet on any error.
    """
    try:
        token = get_iam_token(api_key)
        url = f"{base_url.rstrip('/')}/v2/assets"
        params = {
            "space_id": space_id,
            "type_name": "modelfacts_lifecycle",
            "limit": 1,
        }
        resp = httpx.get(
            url,
            params=params,
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        resources = data.get("resources", [])
        if not resources:
            logger.warning("governance: no FactSheet resources found in space %s — using synthetic", space_id)
            return _synthetic_fallback()

        asset = resources[0]
        meta = asset.get("metadata", {})
        entity = asset.get("entity", {}).get("modelfacts_lifecycle", {})

        # Map governance API fields → demo schema
        return {
            "model_name": entity.get("model_id") or meta.get("name", "governance-model"),
            "version": entity.get("model_version", "1.0.0"),
            "status": entity.get("state", "approved"),
            "created_by": entity.get("training_data_reference", {}).get("connection", {}).get("username", "data-scientist@demo.ibm.com"),
            "approved_by": "AI Review Board",
            "approved_at": meta.get("updated_at", ""),
            "eu_ai_act_article": entity.get("eu_risk_level", "Limited Risk"),
            "risk_level": entity.get("model_risk_level", "medium"),
            "policy_constraints": entity.get("restrictions", [
                "Approved for complaint triage only",
                "Not for financial decisions",
                "Human review required for governance-flagged cases",
            ]),
            "training_data": {
                "dataset": entity.get("training_data_reference", {}).get("name", "complaints-training-v2"),
                "records": entity.get("training_data_rows", 48500),
                "balanced": True,
                "demographic_coverage": "age, region, gender",
            },
            "monitoring": _build_monitoring(entity),
            "performance": {
                "f1_score": entity.get("f1", 0.874),
                "auc_roc": entity.get("auc_roc", 0.941),
                "precision": entity.get("precision", 0.882),
                "recall": entity.get("recall", 0.867),
            },
            "source": "live",
        }

    except Exception as exc:
        logger.warning("governance live fetch failed (%s) — falling back to synthetic", exc)
        return _synthetic_fallback()


def _build_monitoring(entity: dict) -> dict:
    """Extract drift/bias from entity or return safe defaults."""
    drift = entity.get("drift_score")
    bias = entity.get("fairness_score")
    return {
        "drift_current": float(drift) if drift is not None else 0.12,
        "drift_threshold": 0.20,
        "bias_current": float(bias) if bias is not None else 0.08,
        "bias_threshold": 0.15,
        "last_evaluated": entity.get("last_evaluated_at", ""),
    }


def _synthetic_fallback() -> dict:
    """Return synthetic factsheet with source flag."""
    fs = get_factsheet()
    fs["source"] = "synthetic"
    return fs


# ---------------------------------------------------------------------------
# Monitoring timeline — drift/bias over time
# ---------------------------------------------------------------------------

def fetch_timeline_live(api_key: str, space_id: str, base_url: str) -> list:
    """
    Fetch drift/bias time series from watsonx.governance monitors.
    API: GET /v2/assets?space_id=<id>&type_name=modelfacts_metrics
    Falls back to synthetic timeline on any error.
    """
    try:
        token = get_iam_token(api_key)
        url = f"{base_url.rstrip('/')}/v2/assets"
        params = {
            "space_id": space_id,
            "type_name": "modelfacts_metrics",
            "limit": 30,
        }
        resp = httpx.get(
            url,
            params=params,
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        resources = data.get("resources", [])

        if not resources:
            logger.warning("governance: no metrics resources — using synthetic timeline")
            return get_governance_timeline()

        timeline = []
        for r in resources:
            entity = r.get("entity", {}).get("modelfacts_metrics", {})
            meta = r.get("metadata", {})
            timeline.append({
                "date": meta.get("created_at", ""),
                "drift_score": entity.get("drift_score", 0.10),
                "bias_score": entity.get("fairness_score", 0.08),
                "source": "live",
            })

        # Sort ascending by date
        timeline.sort(key=lambda x: x["date"])
        return timeline if timeline else get_governance_timeline()

    except Exception as exc:
        logger.warning("governance timeline live fetch failed (%s) — falling back to synthetic", exc)
        return get_governance_timeline()
