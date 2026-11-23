import React, { useState } from 'react';
import {
  Grid, Column, Tile, Tag, Button, InlineNotification,
  StructuredListWrapper, StructuredListBody,
  StructuredListRow, StructuredListCell,
  ProgressIndicator, ProgressStep,
} from '@carbon/react';
import {
  Launch, Checkmark, Warning, Time, DocumentBlank,
} from '@carbon/icons-react';

// Real OpenPages counts (au-syd, inspected 2026-11)
const OPENPAGES_URL = 'https://9db7b90d-3499-487e-9b94-7d72663b27e5.au-syd.openpages.cloud.ibm.com/app/jspview/react/grc/dashboard/Home';

const STAGES = [
  {
    id: 0,
    label: 'Proposed',
    shortLabel: 'Proposto',
    description: 'Um novo caso de uso de IA é registrado e aguarda avaliação de risco inicial.',
    status: 'current',
    tagType: 'blue',
    realCount: 1,
    realLabel: '1 Use Case',
    realNote: 'Estado atual: 1 use case em "Proposed" — oportunidade de mostrar o início do fluxo.',
    details: [
      ['Use Cases totais', '33'],
      ['Em estado Proposed', '1'],
      ['Em estado Approved for Dev', '32'],
      ['Próximo passo', 'Risk Assessment'],
    ],
    openPagesPath: '/app/jspview/react/grc/dashboard/Home',
    openPagesLabel: 'Ver Use Cases no OpenPages',
    highlight: false,
  },
  {
    id: 1,
    label: 'Risk Assessment',
    shortLabel: 'Avaliação de Risco',
    description: 'Classificação obrigatória: EU AI Act risk tier, nível de risco e restrições de uso.',
    status: 'current',
    tagType: 'purple',
    realCount: 33,
    realLabel: '33 Use Cases',
    realNote: '⚠️ EU AI Risk Level = "Not Determined" em 100% dos casos — oportunidade de executar a classificação ao vivo.',
    details: [
      ['Use Cases avaliados', '33'],
      ['EU AI Risk Level "Not Determined"', '33 / 33 (100%)'],
      ['Risk Tier 1 (alto)', '16 modelos'],
      ['Risk Tier 2 (médio)', '12 modelos'],
      ['Risk Tier 3 (baixo)', '5 modelos'],
    ],
    openPagesPath: '/app/jspview/react/grc/dashboard/Home',
    openPagesLabel: 'Ver Risk Assessment no OpenPages',
    highlight: true, // "Before" moment — show the gap
  },
  {
    id: 2,
    label: 'Awaiting Approval',
    shortLabel: 'Aprovação',
    description: 'Review board analisa o modelo: métricas de desempenho, viés, e conformidade regulatória.',
    status: 'current',
    tagType: 'warm-gray',
    realCount: 3,
    realLabel: '3 Foundation Models',
    realNote: '3 Foundation Models em "Awaiting Approval"; 37 Model Reviews no total (1 awaiting, 13 in progress, 22 complete).',
    details: [
      ['Model Reviews total', '37'],
      ['Awaiting Assignment', '1'],
      ['In Progress', '13'],
      ['Complete', '22'],
      ['Foundation Models aguardando', '3'],
      ['Change Requests abertas', '41 (todos "Proposed")'],
    ],
    openPagesPath: '/app/jspview/react/grc/dashboard/Home',
    openPagesLabel: 'Ver Model Reviews no OpenPages',
    highlight: false,
  },
  {
    id: 3,
    label: 'Deploy',
    shortLabel: 'Implantação',
    description: 'Modelos aprovados passam por um gate de deployment: ambiente, versão, e registro de auditoria.',
    status: 'current',
    tagType: 'green',
    realCount: 27,
    realLabel: '27 Aprovados',
    realNote: '27 modelos aprovados; 25 em produção, 15 em não-produção. Total de 45 deployments registrados.',
    details: [
      ['Modelos aprovados', '27 / 36'],
      ['Deployments em produção', '25'],
      ['Deployments não-produção', '15'],
      ['Total deployments', '45'],
      ['Foundation Models approved', '9 (Approved for Deployment)'],
      ['Foundation Models under dev', '8'],
    ],
    openPagesPath: '/app/jspview/react/grc/dashboard/Home',
    openPagesLabel: 'Ver Deployments no OpenPages',
    highlight: false,
  },
  {
    id: 4,
    label: 'Monitor',
    shortLabel: 'Monitoramento',
    description: 'Monitoramento contínuo de drift, viés e performance. Alertas automáticos quando métricas excedem thresholds.',
    status: 'current',
    tagType: 'teal',
    realCount: 135,
    realLabel: '135 Métricas',
    realNote: '135 métricas registradas (Quality: 81, Drift: 27, Fairness: 18) — todas "Not Determined". Próximo passo: configurar live monitoring.',
    details: [
      ['Métricas de Quality', '81'],
      ['Métricas de Drift', '27'],
      ['Métricas de Fairness', '18'],
      ['Status atual', '"Not Determined" — 100%'],
      ['Issues abertas', '25 (2 High, 1 Not Det.)'],
      ['Próximo passo', 'Conectar watsonx.ai para live scoring'],
    ],
    openPagesPath: '/app/jspview/react/grc/dashboard/Home',
    openPagesLabel: 'Ver Métricas no OpenPages',
    highlight: true, // "After" opportunity — show what live monitoring looks like
  },
];

function openConsole(path) {
  const base = OPENPAGES_URL.split('/app/')[0];
  window.open(base + path, '_blank', 'noopener,noreferrer');
}

export default function ModelLifecyclePage() {
  const [activeStage, setActiveStage] = useState(1); // Default: Risk Assessment (the gap)

  const stage = STAGES[activeStage];

  return (
    <div className="demo-page">
      <h2 className="demo-section-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        Model Lifecycle — watsonx.governance + OpenPages
      </h2>
      <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Jornada completa de um modelo de IA: da proposta ao monitoramento contínuo.
        Dados reais do ambiente OpenPages (au-syd) — ambiente de demonstração.
      </p>

      {/* OpenPages live link banner */}
      <InlineNotification
        kind="info"
        title="Ambiente Real:"
        subtitle="Os contadores abaixo refletem dados reais do OpenPages (au-syd). Clique em 'Ver no console' para abrir o painel real durante a demo."
        hideCloseButton
        lowContrast
        style={{ marginBottom: '1.5rem', maxWidth: '100%' }}
      />

      {/* Progress Indicator — the 5 stages */}
      <ProgressIndicator
        currentIndex={activeStage}
        spaceEqually
        style={{ marginBottom: '2rem' }}
      >
        {STAGES.map((s, i) => (
          <ProgressStep
            key={s.id}
            label={s.label}
            description={s.shortLabel}
            onClick={() => setActiveStage(i)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </ProgressIndicator>

      {/* Stage detail */}
      <Grid>
        {/* Left: stage info */}
        <Column sm={4} md={4} lg={8}>
          <Tile style={{ marginBottom: '1rem', minHeight: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Tag type={stage.tagType} size="lg">
                Stage {stage.id + 1} / 5
              </Tag>
              <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>{stage.label}</span>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {stage.description}
            </p>

            {/* Real OpenPages count badge */}
            <div style={{
              background: 'var(--cds-layer-02, #393939)',
              padding: '1rem',
              marginBottom: '1.25rem',
              borderLeft: `4px solid ${stage.highlight ? 'var(--cds-support-warning, #f1c21b)' : 'var(--cds-link-primary, #78a9ff)'}`,
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: stage.highlight ? 'var(--cds-support-warning, #f1c21b)' : 'var(--cds-text-primary)' }}>
                {stage.realCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                {stage.realLabel} — OpenPages ao vivo
              </div>
            </div>

            {/* Highlight note */}
            {stage.highlight && (
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start',
                padding: '0.75rem',
                background: 'rgba(241, 194, 27, 0.1)',
                border: '1px solid rgba(241, 194, 27, 0.3)',
                marginBottom: '1rem',
              }}>
                <Warning size={16} style={{ color: 'var(--cds-support-warning, #f1c21b)', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--cds-support-warning, #f1c21b)', lineHeight: 1.5 }}>
                  {stage.realNote}
                </span>
              </div>
            )}

            {/* Open in console button */}
            <Button
              kind="tertiary"
              size="sm"
              renderIcon={Launch}
              onClick={() => openConsole(stage.openPagesPath)}
              style={{ marginTop: '0.5rem' }}
            >
              {stage.openPagesLabel}
            </Button>
          </Tile>
        </Column>

        {/* Right: data table */}
        <Column sm={4} md={4} lg={8}>
          <Tile style={{ marginBottom: '1rem', minHeight: '320px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              Dados OpenPages — {stage.label}
            </h3>
            <StructuredListWrapper>
              <StructuredListBody>
                {stage.details.map(([k, v]) => (
                  <StructuredListRow key={k}>
                    <StructuredListCell noWrap style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', width: '55%' }}>
                      {k}
                    </StructuredListCell>
                    <StructuredListCell style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      {v}
                    </StructuredListCell>
                  </StructuredListRow>
                ))}
              </StructuredListBody>
            </StructuredListWrapper>

            {/* Stage-specific note */}
            {!stage.highlight && (
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '1rem', lineHeight: 1.5 }}>
                {stage.realNote}
              </p>
            )}
          </Tile>
        </Column>
      </Grid>

      {/* All-stages summary strip */}
      <Grid style={{ marginTop: '1rem' }}>
        {STAGES.map((s, i) => (
          <Column key={s.id} sm={4} md={2} lg={3}>
            <Tile
              onClick={() => setActiveStage(i)}
              style={{
                cursor: 'pointer',
                borderTop: `3px solid ${i === activeStage ? 'var(--cds-link-primary, #78a9ff)' : 'transparent'}`,
                opacity: i === activeStage ? 1 : 0.6,
                transition: 'all 0.15s ease',
                marginBottom: '1rem',
                padding: '0.75rem',
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{s.realCount}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>{s.label}</div>
              <Tag type={s.tagType} size="sm" style={{ marginTop: '0.5rem' }}>{s.realLabel}</Tag>
            </Tile>
          </Column>
        ))}
      </Grid>
    </div>
  );
}
