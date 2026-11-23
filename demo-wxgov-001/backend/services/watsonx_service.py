"""
DEMO-WXGOV-001 — watsonx.ai Live Service
Calls real IBM watsonx.ai APIs using ibm-watsonx-ai SDK.
Falls back to synthetic data on any error so the demo never crashes.
"""
import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# IBM token helper — shared between watsonx.ai and governance calls
# ---------------------------------------------------------------------------

_iam_token_cache: dict = {"token": None, "expires_at": 0.0}


def get_iam_token(api_key: str) -> str:
    """Exchange IBM Cloud API key for a short-lived IAM Bearer token (cached)."""
    import httpx

    now = time.time()
    if _iam_token_cache["token"] and now < _iam_token_cache["expires_at"] - 30:
        return _iam_token_cache["token"]

    resp = httpx.post(
        "https://iam.cloud.ibm.com/identity/token",
        data={
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": api_key,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    _iam_token_cache["token"] = data["access_token"]
    _iam_token_cache["expires_at"] = now + data.get("expires_in", 3600)
    return _iam_token_cache["token"]


# ---------------------------------------------------------------------------
# Text generation via watsonx.ai REST  (no SDK import needed at module load)
# ---------------------------------------------------------------------------

def generate_text(
    prompt: str,
    api_key: str,
    project_id: str,
    base_url: str,
    model_id: str = "meta-llama/llama-4-maverick-17b-128e-instruct-fp8",
    max_tokens: int = 500,
    temperature: float = 0.7,
) -> dict:
    """
    POST /ml/v1/text/generation  (watsonx.ai REST v1)
    Returns {"text": str, "tokens": int, "model": str, "latency_ms": int}
    """
    import httpx

    token = get_iam_token(api_key)
    url = f"{base_url.rstrip('/')}/ml/v1/text/generation?version=2023-05-29"

    payload = {
        "model_id": model_id,
        "input": prompt,
        "parameters": {
            "max_new_tokens": max_tokens,
            "temperature": temperature,
            "decoding_method": "greedy" if temperature == 0 else "sample",
        },
        "project_id": project_id,
    }

    t0 = time.time()
    resp = httpx.post(
        url,
        json=payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=60,
    )
    latency_ms = int((time.time() - t0) * 1000)
    resp.raise_for_status()

    result = resp.json()
    generated = result["results"][0]["generated_text"].strip()
    tokens = result["results"][0].get("generated_token_count", 0)

    return {
        "text": generated,
        "tokens": tokens,
        "model": model_id,
        "latency_ms": latency_ms,
        "mode": "live",
    }
