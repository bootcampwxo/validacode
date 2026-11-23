import React, { useEffect, useRef } from 'react';
import { Grid, Column, Tile, StructuredListWrapper, StructuredListBody,
  StructuredListRow, StructuredListCell } from '@carbon/react';
import mermaid from 'mermaid';

const DIAGRAM = `graph TB
  subgraph Client Layer
    UI[Carbon React UI]
    WXO_EMBED[watsonx Orchestrate\\nWeb Chat Embed]
  end

  subgraph Agent Layer
    AGENT[governance_agent\\nnative · groq/gpt-oss-120b]
    T1[classify_complaint]
    T2[lookup_customer]
    T3[draft_response]
    T4[escalate_to_human]
    SKILL[ai-governance-protocol\\nAgent Skill]
    AGENT --> T1
    AGENT --> T2
    AGENT --> T3
    AGENT --> T4
    AGENT --> SKILL
  end

  subgraph Governance Layer
    WXG[watsonx.governance]
    FACTSHEET[AI FactSheets]
    DRIFT[Drift Monitor]
    BIAS[Bias Detection]
    EUAI[EU AI Act\\nCompliance]
    WXG --> FACTSHEET
    WXG --> DRIFT
    WXG --> BIAS
    WXG --> EUAI
  end

  subgraph Observability Layer
    OTEL[OpenTelemetry Collector]
    AGENTOPS[wxO AgentOps v3\\nTrace API]
    INSTANA[Instana APM\\nDynamic Graph]
    OTEL --> AGENTOPS
    OTEL --> INSTANA
  end

  subgraph API Layer
    API[FastAPI Backend]
    SDS[Synthetic Data Service]
    API --> SDS
  end

  UI --> API
  UI --> WXO_EMBED
  WXO_EMBED --> AGENT
  AGENT --> OTEL
  AGENT --> WXG
  API --> WXG

  style AGENT fill:#0f62fe,color:#fff
  style WXG fill:#005d5d,color:#fff
  style INSTANA fill:#6929c4,color:#fff
  style OTEL fill:#198038,color:#fff
`;

const COMPONENTS = [
  ['watsonx Orchestrate', 'AI Agent runtime (SaaS)', 'governance_agent + 4 tools + 1 skill'],
  ['watsonx.governance', 'AI FactSheets + drift/bias monitoring', 'Continuous compliance + EU AI Act'],
  ['OpenTelemetry', 'Agent execution tracing', 'Every run → spans → AgentOps + Instana'],
  ['Instana', 'Full-stack APM + Dynamic Graph', 'Agent performance + infrastructure'],
  ['FastAPI', 'Dashboard data API (backend)', 'Mock data: 500 complaints, 200 traces'],
  ['Carbon React v11', 'IBM UI shell (frontend)', '5 pages: Dashboard, Governance, AgentOps, Complaints, Architecture'],
];

export default function ArchitecturePage() {
  const diagramRef = useRef(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
    if (diagramRef.current) {
      mermaid.render('arch-diagram', DIAGRAM).then(({ svg }) => {
        if (diagramRef.current) diagramRef.current.innerHTML = svg;
      });
    }
  }, []);

  return (
    <div className="demo-page">
      <h2 className="demo-section-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Solution Architecture</h2>
      <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>
        DEMO-WXGOV-001 — AI Governance + AgentOps with IBM watsonx
      </p>

      <Grid style={{ marginBottom: '2rem' }}>
        <Column sm={4} md={8} lg={16}>
          <Tile>
            <div ref={diagramRef} style={{ overflowX: 'auto', textAlign: 'center' }} />
          </Tile>
        </Column>
      </Grid>

      <Grid>
        <Column sm={4} md={8} lg={16}>
          <Tile>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Component Inventory</h3>
            <StructuredListWrapper>
              <StructuredListBody>
                {COMPONENTS.map(([name, role, detail]) => (
                  <StructuredListRow key={name}>
                    <StructuredListCell noWrap style={{ fontWeight: 600, width: '20%' }}>{name}</StructuredListCell>
                    <StructuredListCell style={{ width: '35%', color: 'var(--cds-text-secondary)' }}>{role}</StructuredListCell>
                    <StructuredListCell style={{ fontSize: '0.8rem', color: 'var(--cds-text-secondary)' }}>{detail}</StructuredListCell>
                  </StructuredListRow>
                ))}
              </StructuredListBody>
            </StructuredListWrapper>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}
