"""Health router — reports live service connectivity status"""
from fastapi import APIRouter
from config import settings

router = APIRouter()


@router.get("/health")
def health():
    services = {
        "watsonx_ai": "configured" if settings.watsonx_api_key and settings.watsonx_project_id else "not_configured",
        "watsonx_governance": "configured" if settings.watsonx_api_key and settings.wxg_space_id else "not_configured",
        "orchestrate_embed": "configured" if settings.ibm_cloud_api_key else "not_configured",
    }
    return {
        "status": "ok",
        "mode": "live" if any(v == "configured" for v in services.values()) else "synthetic",
        "version": "1.0.0",
        "services": services,
        "disclaimer": "Demo environment. Synthetic data used where live data is unavailable.",
    }
