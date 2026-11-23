#!/usr/bin/env bash
# =============================================================================
# import-all.sh — Import all watsonx Orchestrate resources for DEMO-WXGOV-001
#
# Tested with: orchestrate ADK 2.11.0
#
# Prerequisites:
#   source /Users/rsaragio/WXO_DEVELOPER/wxo/bin/activate
#   orchestrate env activate my-wxo --api-key "$IBM_CLOUD_API_KEY"
#
# Then run from demo-wxgov-001/:
#   cd demo-wxgov-001 && bash import-all.sh
# =============================================================================
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   DEMO-WXGOV-001 — AI Governance + AgentOps Demo    ║"
echo "║   Import all resources to watsonx Orchestrate        ║"
echo "║   ADK version: 2.11.0                                ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# -----------------------------------------------------------------
# Sanity check: orchestrate CLI must be in PATH
# -----------------------------------------------------------------
if ! command -v orchestrate &>/dev/null; then
  echo "ERROR: 'orchestrate' not found in PATH."
  echo ""
  echo "  Activate the venv first:"
  echo "    source /Users/rsaragio/WXO_DEVELOPER/wxo/bin/activate"
  echo ""
  echo "  Then activate your environment:"
  echo "    orchestrate env activate my-wxo --api-key \"\$IBM_CLOUD_API_KEY\""
  echo ""
  exit 1
fi

# Print ADK version for diagnosis
echo "▶ ADK version: $(orchestrate --version 2>/dev/null || echo 'unknown')"
echo ""

# -----------------------------------------------------------------
# Verify active environment
# -----------------------------------------------------------------
echo "▶ Checking active environment..."
ENV_LIST_OUTPUT=$(orchestrate env list 2>&1)
echo "$ENV_LIST_OUTPUT"

# ADK 2.11.0 marks active env with "(active)" at end of line
if ! echo "$ENV_LIST_OUTPUT" | grep -qiE '\(active\)|active environment'; then
  echo ""
  echo "⚠  Could not confirm an active environment."
  echo "   Run: orchestrate env activate my-wxo --api-key \"\$IBM_CLOUD_API_KEY\""
  echo "   Then re-run this script."
  exit 1
fi
echo "  ✓ Active environment confirmed"
echo ""

# -----------------------------------------------------------------
# Step 1 — Tools
# ADK 2.11.0: no --upsert flag; use plain import (errors if already
# exists; delete first with: orchestrate tools delete -n <name>)
# -----------------------------------------------------------------
echo "▶ [1/3] Importing tools..."
echo "  (If a tool already exists, delete it first with:"
echo "   orchestrate tools delete -n <tool_name>)"
echo ""

orchestrate tools import -k python -f tools/classify_complaint.py
echo "  ✓ classify_complaint"

orchestrate tools import -k python -f tools/lookup_customer.py
echo "  ✓ lookup_customer"

orchestrate tools import -k python -f tools/response_tools.py
echo "  ✓ draft_response + escalate_to_human"

echo ""

# -----------------------------------------------------------------
# Step 2 — Agent
# ADK 2.11.0: no --upsert flag; plain import
# -----------------------------------------------------------------
echo "▶ [2/3] Importing agent..."
echo "  (If the agent already exists, delete it first with:"
echo "   orchestrate agents delete -n governance_agent)"
echo ""

orchestrate agents import -f agents/governance_agent.yaml
echo "  ✓ governance_agent"
echo ""

# -----------------------------------------------------------------
# Step 3 — Verify
# -----------------------------------------------------------------
echo "▶ [3/3] Verifying import..."
echo ""

echo "Tools:"
orchestrate tools list | grep -E "classify_complaint|lookup_customer|draft_response|escalate_to_human" \
  || echo "  ⚠ Some tools not found — check import output above"
echo ""

echo "Agents:"
orchestrate agents list | grep "governance_agent" \
  || echo "  ⚠ Agent not found — check import output above"
echo ""

echo "╔══════════════════════════════════════════════════════╗"
echo "║   Import complete!                                   ║"
echo "║                                                      ║"
echo "║   Next steps:                                        ║"
echo "║                                                      ║"
echo "║   1. Chat-test the agent:                            ║"
echo "║      orchestrate chat ask -n governance_agent \\      ║"
echo "║        \"My customer ID is CUST-00042. I was charged  ║"
echo "║         twice this month and demand a refund.\" -r    ║"
echo "║                                                      ║"
echo "║   2. Deploy the agent:                               ║"
echo "║      orchestrate agents deploy -n governance_agent   ║"
echo "║                                                      ║"
echo "║   3. Get embed IDs for the UI shell:                 ║"
echo "║      Fill VITE_WXO_* vars in .env                    ║"
echo "╚══════════════════════════════════════════════════════╝"
