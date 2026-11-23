#!/usr/bin/env bash
# delete-all.sh — Remove all DEMO-WXGOV-001 resources from watsonx Orchestrate
# Tested with: ADK 2.11.0
set -euo pipefail

echo "▶ Removing agent..."
orchestrate agents delete -n governance_agent || true

echo "▶ Removing tools..."
orchestrate tools delete -n classify_complaint || true
orchestrate tools delete -n lookup_customer || true
orchestrate tools delete -n draft_response || true
orchestrate tools delete -n escalate_to_human || true

echo "✓ All resources removed."
echo ""
echo "  You can now re-import with:"
echo "    bash import-all.sh"
