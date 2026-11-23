"""
DEMO-WXGOV-001 — Configuration via Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    demo_mode: str = "live"  # "mock" or "live" — default is now live

    # watsonx.ai
    watsonx_api_key: Optional[str] = None
    watsonx_project_id: Optional[str] = None
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    watsonx_model_id: str = "meta-llama/llama-4-maverick-17b-128e-instruct-fp8"

    # watsonx.governance / deployment space
    wxg_space_id: Optional[str] = None  # deployment space for FactSheets

    # IBM Cloud (Orchestrate ADK + AgentOps API)
    ibm_cloud_api_key: Optional[str] = None

    # watsonx Orchestrate AgentOps
    wxo_instance_id: Optional[str] = None   # = VITE_WXO_ORCHESTRATION_ID
    wxo_region: str = "us-south"

    # Instana
    instana_api_url: Optional[str] = None
    instana_api_token: Optional[str] = None

    # OpenTelemetry
    otel_exporter_otlp_endpoint: str = "http://localhost:4318"
    otel_service_name: str = "ai-governance-agent"
    wxo_tenant_id: Optional[str] = None
    wxo_environment_name: str = "live"

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
