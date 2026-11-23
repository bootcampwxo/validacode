# DEMO-WXGOV-001 — AI Governance + AgentOps

**Built with IBM watsonx** · AI Governance · watsonx Orchestrate · AgentOps · OpenTelemetry

> ⚠️ **All data is synthetic. No real client data or PII is used.**

---

## What this demo shows

A customer complaint triage agent operating under full AI governance — every decision
logged, monitored for bias/drift, and auditable under EU AI Act requirements.

| Layer | IBM Technology | What it shows |
|-------|---------------|---------------|
| **Agent** | watsonx Orchestrate (ADK) | 4 tools + 1 governance skill → complaint classification, customer lookup, response drafting, escalation |
| **Governance** | watsonx.governance | AI FactSheets, drift monitoring, bias detection, EU AI Act compliance |
| **Observability** | OpenTelemetry → wxO AgentOps | Full trace of every agent execution: tool calls, latency, tokens, decisions |
| **Dashboard** | Carbon React v11 + FastAPI | Executive KPIs, compliance charts, complaint log, trace explorer |

---

## Quick Start (Local — Mock Mode)

### Prerequisites
- Python 3.11+
- Node.js 20+
- `ibm-watsonx-orchestrate` installed (for agent import)

### 1. Backend
```bash
cd demo-wxgov-001/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
DEMO_MODE=mock uvicorn main:app --port 8000
# → http://localhost:8000/api/health → {"status":"ok","mode":"mock"}
```

### 2. Frontend
```bash
cd demo-wxgov-001/frontend
npm install
npm run dev
# → http://localhost:5173
```

### 3. Import the Orchestrate Agent (requires wxO credentials)
```bash
cd demo-wxgov-001
source .bob/skills/watsonx-orchestrate/references/setup-venv.sh
orchestrate env add -n my-wxo -u https://api.<region>.watson-orchestrate.cloud.ibm.com/instances/<ID>
orchestrate env activate my-wxo --api-key "$IBM_CLOUD_API_KEY"
chmod +x import-all.sh && ./import-all.sh
```

---

## Pages

| URL | Page | What to show |
|-----|------|-------------|
| `/` | Executive Dashboard | KPI tiles, compliance strip, volume chart, category donut |
| `/governance` | AI FactSheet | Model identity, drift/bias gauges, 30-day trend chart, policy constraints |
| `/agentops` | AgentOps Traces | Metrics strip, tool latency breakdown, trace explorer, trace detail JSON |
| `/complaints` | Complaint Log | 500 synthetic complaints, filtered by priority/status/governance flag |
| `/architecture` | Architecture | Mermaid diagram + component inventory |

---

## Environment Variables (.env.example → .env)

```
DEMO_MODE=mock|live

# watsonx.ai
WATSONX_API_KEY=
WATSONX_PROJECT_ID=
WATSONX_URL=https://us-south.ml.cloud.ibm.com

# watsonx Orchestrate (ADK)
WXO_ENV_URL=
IBM_CLOUD_API_KEY=

# Frontend embed
VITE_WXO_HOST_URL=
VITE_WXO_ORCHESTRATION_ID=
VITE_WXO_CRN=
VITE_WXO_AGENT_ID=
```

---

## Docker (Apple Silicon → amd64)
```bash
# Build for amd64 (required for cloud targets)
docker build --platform linux/amd64 -t demo-wxgov-frontend -f Dockerfile.frontend ./frontend
docker build --platform linux/amd64 -t demo-wxgov-backend -f Dockerfile.backend ./backend

# Or with docker-compose
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker compose build
docker compose up
# → frontend: http://localhost:3000  backend: http://localhost:8000
```

---

## Project Structure
```
demo-wxgov-001/
├── agents/              governance_agent.yaml (kind: native)
├── tools/               classify_complaint.py, lookup_customer.py, response_tools.py
├── skills/              governance-protocol/SKILL.md
├── import-all.sh        Deploy all resources to Orchestrate
├── delete-all.sh        Remove all resources
├── frontend/            Carbon React v11 (5 pages)
├── backend/             FastAPI + 500 synthetic complaints + 200 agent traces
├── Dockerfile.frontend  alpine multi-stage (DEPLOY_TARGET: local)
├── Dockerfile.backend   python:3.11-slim
├── docker-compose.yml
└── .env.example
```

---

## Compliance Notes
- All emails: @example.com or @demo.ibm.com
- All companies: fictional (Apex Manufacturing, NovaTech, etc.)
- Faker seed=42 — reproducible synthetic data
- DemoBanner visible on every page
- No hardcoded API keys anywhere
