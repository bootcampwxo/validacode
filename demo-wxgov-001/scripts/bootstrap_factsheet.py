#!/usr/bin/env python3
"""
DEMO-WXGOV-001 — Bootstrap watsonx.governance FactSheet
Run once to register the governance_agent as a tracked AI asset.

Usage:
    cd demo-wxgov-001/backend
    source .venv/bin/activate
    pip install ibm-aigov-facts-client --quiet
    python ../scripts/bootstrap_factsheet.py
"""
import os
import sys
import json
import time
import httpx

# ---------------------------------------------------------------------------
# Config — read from env (must have backend/.env loaded or export vars)
# ---------------------------------------------------------------------------

API_KEY      = os.environ.get("WATSONX_API_KEY") or os.environ.get("IBM_CLOUD_API_KEY")
PROJECT_ID   = os.environ.get("WATSONX_PROJECT_ID")
SPACE_ID     = os.environ.get("WXG_SPACE_ID")
REGION       = os.environ.get("WXO_REGION", "us-south")
BASE_URL     = os.environ.get("WATSONX_URL", f"https://{REGION}.ml.cloud.ibm.com")
AGENT_ID     = os.environ.get("VITE_WXO_AGENT_ID", "cff37e58-9a7a-40d1-9151-80365b59d8a3")

USE_CASE_NAME   = "Governance Agent — Complaint Triage"
MODEL_NAME      = "governance_agent"
MODEL_VERSION   = "1.0.0"

# Watson Data Platform endpoint (us-south uses global endpoint, not regional)
PLATFORM_URL = "https://api.dataplatform.cloud.ibm.com"

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

missing = [k for k, v in {
    "WATSONX_API_KEY": API_KEY,
    "WATSONX_PROJECT_ID": PROJECT_ID,
    "WXG_SPACE_ID": SPACE_ID,
}.items() if not v]

if missing:
    print(f"❌  Missing env vars: {', '.join(missing)}")
    print("    Run:  source backend/.env && python scripts/bootstrap_factsheet.py")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Step 1 — Get IAM Bearer token
# ---------------------------------------------------------------------------

def get_iam_token(api_key: str) -> str:
    print("🔑  Getting IAM token...")
    resp = httpx.post(
        "https://iam.cloud.ibm.com/identity/token",
        data={"grant_type": "urn:ibm:params:oauth:grant-type:apikey", "apikey": api_key},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    resp.raise_for_status()
    token = resp.json()["access_token"]
    print("    ✅  IAM token obtained")
    return token


# ---------------------------------------------------------------------------
# Step 1b — Discover Catalog ID (required for AI Use Cases)
# ---------------------------------------------------------------------------

def get_catalog_id(token: str) -> str | None:
    """List catalogs and return the first non-default one, or the default."""
    print("\n📚  Discovering catalogs...")
    resp = httpx.get(
        f"{PLATFORM_URL}/v2/catalogs",
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    if not resp.is_success:
        print(f"    ⚠️   Could not list catalogs: {resp.status_code} {resp.text[:200]}")
        return None

    catalogs = resp.json().get("catalogs", [])
    if not catalogs:
        print("    ⚠️   No catalogs found in this account")
        return None

    # Prefer the Platform Assets Catalog or first available
    platform_cat = next((c for c in catalogs if "platform" in c.get("entity", {}).get("name", "").lower()), None)
    chosen = platform_cat or catalogs[0]
    cat_id = chosen.get("metadata", {}).get("guid")
    cat_name = chosen.get("entity", {}).get("name", "?")
    print(f"    ✅  Using catalog: '{cat_name}' ({cat_id})")
    return cat_id


# ---------------------------------------------------------------------------
# Step 2 — Create AI Use Case in the catalog via Watson Data API
# ---------------------------------------------------------------------------

def create_use_case(token: str, catalog_id: str) -> str | None:
    """
    POST /v2/assets  with type_name=ai_use_case  (catalog-scoped)
    Returns the new asset_id.
    """
    print(f"\n📋  Creating AI Use Case: '{USE_CASE_NAME}'...")

    url = f"{PLATFORM_URL}/v2/assets"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    body = {
        "metadata": {
            "name": USE_CASE_NAME,
            "description": "Demo AI use case for complaint triage governance — DEMO-WXGOV-001",
            "tags": ["demo", "governance", "complaint-triage", "eu-ai-act"],
            "asset_type": "ai_use_case",
        },
        "entity": {
            "ai_use_case": {
                "status": "approved_for_development",
                "risk_level": "medium",
                "use_case_id": f"UC-{AGENT_ID[:8].upper()}",
                "description": "AI agent that classifies and triages customer complaints with governance auditability.",
                "regulatory_frameworks": ["EU AI Act", "LGPD"],
                "business_owner": "demo-owner@demo.ibm.com",
                "technical_owner": "demo-tech@demo.ibm.com",
            }
        },
        "catalog_id": catalog_id,
    }

    resp = httpx.post(url, json=body, headers=headers, timeout=30)

    if resp.status_code == 409:
        print("    ℹ️   Use case already exists — searching for it...")
        return find_existing_use_case(token, catalog_id)

    if not resp.is_success:
        print(f"    ⚠️   Use case API returned {resp.status_code}: {resp.text[:300]}")
        return None

    asset_id = resp.json().get("metadata", {}).get("asset_id")
    print(f"    ✅  Use case created: {asset_id}")
    return asset_id


def find_existing_use_case(token: str, catalog_id: str) -> str | None:
    url = f"{PLATFORM_URL}/v2/assets"
    params = {"catalog_id": catalog_id, "type_name": "ai_use_case"}
    headers = {"Authorization": f"Bearer {token}"}
    resp = httpx.get(url, params=params, headers=headers, timeout=15)
    if resp.is_success:
        resources = resp.json().get("resources", [])
        for r in resources:
            if r.get("metadata", {}).get("name") == USE_CASE_NAME:
                aid = r["metadata"]["asset_id"]
                print(f"    ✅  Found existing use case: {aid}")
                return aid
    return None


# ---------------------------------------------------------------------------
# Step 3 — Register External Model asset in the Deployment Space
# ---------------------------------------------------------------------------

def register_model_asset(token: str, catalog_id: str) -> str | None:
    """
    Register governance_agent as an external model asset in the catalog.
    POST /v2/assets  with type_name=modelfacts_lifecycle (catalog-scoped)
    """
    print(f"\n🤖  Registering model asset: '{MODEL_NAME}' in catalog {catalog_id}...")

    url = f"{PLATFORM_URL}/v2/assets"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    body = {
        "metadata": {
            "name": MODEL_NAME,
            "description": "Governance agent for complaint triage — DEMO-WXGOV-001",
            "tags": ["demo", "orchestrate", "governance", "agent"],
            "asset_type": "modelfacts_lifecycle",
        },
        "entity": {
            "modelfacts_lifecycle": {
                "model_id": f"orchestrate:{AGENT_ID}",
                "model_version": MODEL_VERSION,
                "state": "approved_for_production",
                "model_type": "external",
                "hosting_type": "External",
                "source": "watsonx Orchestrate",
                "description": "Agent deployed to watsonx Orchestrate with 4 governance tools.",
                "risk_level": "medium",
                "eu_risk_level": "Limited Risk",
                "restrictions": [
                    "Approved for complaint triage only",
                    "Not for financial decisions",
                    "Human review required for governance-flagged cases",
                ],
                "training_data_reference": {
                    "name": "complaints-training-v2",
                    "type": "synthetic",
                },
                "training_data_rows": 48500,
                "f1": 0.874,
                "auc_roc": 0.941,
                "precision": 0.882,
                "recall": 0.867,
                "drift_score": 0.12,
                "fairness_score": 0.08,
                "last_evaluated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
        },
        "catalog_id": catalog_id,
    }

    resp = httpx.post(url, json=body, headers=headers, timeout=30)

    if resp.status_code == 409:
        print("    ℹ️   Model asset already exists")
        return find_existing_model_asset(token, catalog_id)

    if not resp.is_success:
        print(f"    ⚠️   Model asset API returned {resp.status_code}: {resp.text[:400]}")
        return None

    asset_id = resp.json().get("metadata", {}).get("asset_id")
    print(f"    ✅  Model asset created: {asset_id}")
    return asset_id


def find_existing_model_asset(token: str, catalog_id: str) -> str | None:
    url = f"{PLATFORM_URL}/v2/assets"
    params = {"catalog_id": catalog_id, "type_name": "modelfacts_lifecycle"}
    headers = {"Authorization": f"Bearer {token}"}
    resp = httpx.get(url, params=params, headers=headers, timeout=15)
    if resp.is_success:
        for r in resp.json().get("resources", []):
            if r.get("metadata", {}).get("name") == MODEL_NAME:
                aid = r["metadata"]["asset_id"]
                print(f"    ✅  Found existing model asset: {aid}")
                return aid
    return None


# ---------------------------------------------------------------------------
# Step 4 — Verify FactSheet is queryable
# ---------------------------------------------------------------------------

def verify_factsheet(token: str, catalog_id: str) -> bool:
    print("\n🔍  Verifying FactSheet is queryable...")
    url = f"{PLATFORM_URL}/v2/assets"
    params = {
        "catalog_id": catalog_id,
        "type_name": "modelfacts_lifecycle",
        "limit": 5,
    }
    resp = httpx.get(
        url,
        params=params,
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    if resp.is_success:
        resources = resp.json().get("resources", [])
        if resources:
            print(f"    ✅  Found {len(resources)} FactSheet(s) in space")
            for r in resources:
                name = r.get("metadata", {}).get("name", "?")
                aid  = r.get("metadata", {}).get("asset_id", "?")
                print(f"       • {name} ({aid})")
            return True
        else:
            print("    ⚠️   Space has no FactSheets yet — may need a few seconds to propagate")
            return False
    print(f"    ❌  Verification failed: {resp.status_code}")
    return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("DEMO-WXGOV-001 — Bootstrap watsonx.governance FactSheet")
    print(f"Region:     {REGION}")
    print(f"Project:    {PROJECT_ID}")
    print(f"Space:      {SPACE_ID}")
    print(f"Agent ID:   {AGENT_ID}")
    print("=" * 60)

    token = get_iam_token(API_KEY)

    # Discover catalog ID — required for all asset operations
    catalog_id = get_catalog_id(token)
    if not catalog_id:
        print("\n❌  No catalog available.")
        print("   You need Watson Knowledge Catalog (WKC) enabled.")
        print("   Contact your IBM Cloud account admin to enable it,")
        print("   or use the watsonx.governance UI at:")
        print("   https://dataplatform.cloud.ibm.com → Catalogs → Create catalog")
        sys.exit(1)

    # Create AI use case
    use_case_id = create_use_case(token, catalog_id)

    # Register model asset — this creates the FactSheet
    model_asset_id = register_model_asset(token, catalog_id)

    if not model_asset_id:
        print("\n⚠️   Could not register model asset.")
        print("   Manual alternative (2 min via UI):")
        print("   1. Go to: https://dataplatform.cloud.ibm.com")
        print("   2. Catalogs → open your catalog → Add asset")
        print(f"   3. External model → name: {MODEL_NAME}")
        print("   4. Save → Track in AI use case")
        sys.exit(1)

    # Update governance_live_service.py to use catalog_id instead of space_id
    _patch_service(catalog_id)

    # Wait for propagation
    print("\n⏳  Waiting 3s for asset propagation...")
    time.sleep(3)

    # Verify
    ok = verify_factsheet(token, catalog_id)

    print("\n" + "=" * 60)
    if ok:
        print("✅  Bootstrap complete!")
        print(f"   Catalog ID:     {catalog_id}")
        print(f"   Use Case ID:    {use_case_id or 'n/a'}")
        print(f"   Model Asset ID: {model_asset_id}")
        print()
        print("   Restart the backend then test:")
        print("   curl -s http://localhost:8000/api/governance/factsheet | python3 -m json.tool")
    else:
        print("⚠️   Asset created but not yet queryable. Wait 30s then restart the backend.")
    print("=" * 60)


def _patch_service(catalog_id: str):
    """Write CATALOG_ID to backend/.env so governance_live_service picks it up."""
    env_path = os.path.join(os.path.dirname(__file__), "../backend/.env")
    env_path = os.path.normpath(env_path)
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            content = f.read()
        if "WXG_CATALOG_ID=" not in content:
            with open(env_path, "a") as f:
                f.write(f"\nWXG_CATALOG_ID={catalog_id}\n")
            print(f"\n📝  Added WXG_CATALOG_ID={catalog_id} to backend/.env")


if __name__ == "__main__":
    main()
