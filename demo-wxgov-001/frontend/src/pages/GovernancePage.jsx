import React, { useEffect, useState } from 'react';
import { Grid, Column, Tile, Tag, Loading, InlineNotification, StructuredListWrapper,
  StructuredListHead, StructuredListRow, StructuredListCell, StructuredListBody,
  ProgressBar } from '@carbon/react';
import { LineChart } from '@carbon/charts-react';
import '@carbon/charts-react/styles.css';
import { fetchGovernanceFactsheet, fetchGovernanceTimeline } from '../services/dataService';

const CHART_OPTIONS = {
  title: 'Drift & Bias Scores — Last 30 Days',
  axes: { bottom: { mapsTo: 'date', scaleType: 'time' }, left: { mapsTo: 'value', title: 'Score' } },
  height: '300px',
  theme: 'g90',
  toolbar: { enabled: false },
  color: { scale: { 'Drift': '#ff832b', 'Bias': '#be95ff' } },
};

export default function GovernancePage() {
  const [factsheet, setFactsheet] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchGovernanceFactsheet(), fetchGovernanceTimeline()])
      .then(([fs, tl]) => { setFactsheet(fs); setTimeline(tl); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="demo-page"><Loading description="Loading governance data..." withOverlay={false} /></div>;
  if (error) return <div className="demo-page"><InlineNotification kind="error" title="Error" subtitle={error} hideCloseButton /></div>;

  const lineData = timeline.flatMap((d) => [
    { date: new Date(d.date), value: d.drift_score, group: 'Drift' },
    { date: new Date(d.date), value: d.bias_score, group: 'Bias' },
  ]);

  const driftPct = factsheet ? (factsheet.monitoring.drift_current / factsheet.monitoring.drift_threshold) * 100 : 0;
  const biasPct = factsheet ? (factsheet.monitoring.bias_current / factsheet.monitoring.bias_threshold) * 100 : 0;

  return (
    <div className="demo-page">
      <h2 className="demo-section-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        AI FactSheet — Governance Dashboard
      </h2>
      <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>
        watsonx.governance — continuous monitoring for bias, drift, and regulatory compliance
      </p>

      <Grid style={{ marginBottom: '2rem' }}>
        {/* Model identity */}
        <Column sm={4} md={8} lg={8}>
          <Tile style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Model Identity</h3>
            <StructuredListWrapper>
              <StructuredListBody>
                {[
                  ['Model Name', factsheet?.model_name],
                  ['Version', factsheet?.version],
                  ['Status', factsheet?.status?.replace(/_/g, ' ')],
                  ['Created By', factsheet?.created_by],
                  ['Approved By', factsheet?.approved_by],
                  ['EU AI Act', factsheet?.eu_ai_act_article],
                  ['Risk Level', factsheet?.risk_level?.toUpperCase()],
                ].map(([k, v]) => (
                  <StructuredListRow key={k}>
                    <StructuredListCell noWrap style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', width: '40%' }}>{k}</StructuredListCell>
                    <StructuredListCell style={{ fontWeight: 500 }}>{v}</StructuredListCell>
                  </StructuredListRow>
                ))}
              </StructuredListBody>
            </StructuredListWrapper>
          </Tile>
        </Column>

        {/* Monitoring gauges */}
        <Column sm={4} md={8} lg={8}>
          <Tile style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>Live Monitoring</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Drift Score</span>
                <Tag type={driftPct > 80 ? 'red' : driftPct > 60 ? 'warm-gray' : 'green'}>
                  {factsheet?.monitoring?.drift_current?.toFixed(2)} / {factsheet?.monitoring?.drift_threshold}
                </Tag>
              </div>
              <ProgressBar value={driftPct} max={100} label="Drift" hideLabel status={driftPct > 80 ? 'error' : 'active'} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Bias Score</span>
                <Tag type={biasPct > 80 ? 'red' : biasPct > 60 ? 'warm-gray' : 'green'}>
                  {factsheet?.monitoring?.bias_current?.toFixed(2)} / {factsheet?.monitoring?.bias_threshold}
                </Tag>
              </div>
              <ProgressBar value={biasPct} max={100} label="Bias" hideLabel status={biasPct > 80 ? 'error' : 'active'} />
            </div>
            <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Tag type="green">Model Approved</Tag>
              <Tag type="blue">Audit Trail Active</Tag>
              <Tag type="teal">EU AI Act Compliant</Tag>
            </div>
          </Tile>
        </Column>
      </Grid>

      {/* Trend chart */}
      <Grid style={{ marginBottom: '2rem' }}>
        <Column sm={4} md={8} lg={16}>
          <div style={{ background: 'var(--cds-layer)', padding: '1rem' }}>
            {lineData.length > 0 && <LineChart data={lineData} options={CHART_OPTIONS} />}
          </div>
        </Column>
      </Grid>

      {/* Policy constraints */}
      <Grid>
        <Column sm={4} md={8} lg={8}>
          <Tile>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Policy Constraints</h3>
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.8 }}>
              {(factsheet?.policy_constraints || []).map((p, i) => (
                <li key={i} style={{ fontSize: '0.875rem' }}>{p}</li>
              ))}
            </ul>
          </Tile>
        </Column>
        <Column sm={4} md={8} lg={8}>
          <Tile>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Training Data</h3>
            <StructuredListWrapper>
              <StructuredListBody>
                {Object.entries(factsheet?.training_data || {}).map(([k, v]) => (
                  <StructuredListRow key={k}>
                    <StructuredListCell noWrap style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', width: '45%' }}>
                      {k.replace(/_/g, ' ')}
                    </StructuredListCell>
                    <StructuredListCell style={{ fontSize: '0.875rem' }}>{String(v)}</StructuredListCell>
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
