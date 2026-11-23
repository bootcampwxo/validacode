import React, { useEffect, useState } from 'react';
import { Grid, Column, Loading, InlineNotification } from '@carbon/react';
import { AreaChart, DonutChart } from '@carbon/charts-react';
import '@carbon/charts-react/styles.css';
import KPICard from '../components/KPICard';
import { fetchDashboard } from '../services/dataService';

const CHART_OPTIONS_AREA = {
  title: 'Complaint Volume — Last 30 Days',
  axes: { bottom: { mapsTo: 'date', scaleType: 'time' }, left: { mapsTo: 'value', title: 'Complaints' } },
  height: '280px',
  theme: 'g90',
  toolbar: { enabled: false },
  color: { scale: { 'Complaints': '#78a9ff' } },
};

const CHART_OPTIONS_DONUT = {
  title: 'Complaints by Category',
  resizable: true,
  height: '280px',
  theme: 'g90',
  toolbar: { enabled: false },
  legend: { alignment: 'center' },
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="demo-page"><Loading description="Loading dashboard..." withOverlay={false} /></div>;
  if (error) return (
    <div className="demo-page">
      <InlineNotification kind="error" title="Error loading dashboard" subtitle={error} hideCloseButton />
    </div>
  );

  const areaData = (data?.volume_chart || []).map((d) => ({ date: new Date(d.date), value: d.value, group: 'Complaints' }));
  const donutData = (data?.category_chart || []).map((d) => ({ group: d.group, value: d.value }));

  return (
    <div className="demo-page">
      <h2 className="demo-section-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
        AI Governance + AgentOps — Executive Dashboard
      </h2>

      {/* KPI Grid */}
      <Grid style={{ marginBottom: '2rem' }}>
        {(data?.kpis || []).map((kpi, i) => (
          <Column key={i} sm={2} md={4} lg={4} xlg={4}>
            <KPICard
              title={kpi.title}
              value={kpi.value}
              unit={kpi.unit}
              trend={kpi.trend}
              trendDirection={kpi.trend_direction}
              status={kpi.status}
            />
          </Column>
        ))}
      </Grid>

      {/* Governance health strip */}
      <Grid style={{ marginBottom: '2rem' }}>
        <Column sm={4} md={8} lg={16}>
          <div style={{
            background: 'var(--cds-layer, #262626)',
            padding: '1rem 1.5rem',
            display: 'flex',
            gap: '2.5rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Drift Score</span>
              <span className={
                data?.governance?.drift_score < data?.governance?.drift_threshold
                  ? 'governance-status-normal' : 'governance-status-alert'
              } style={{ fontSize: '1.25rem', fontWeight: 600, marginLeft: '0.5rem' }}>
                {data?.governance?.drift_score?.toFixed(2)}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--cds-text-secondary)', marginLeft: '0.25rem' }}>
                / {data?.governance?.drift_threshold} threshold
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Bias Score</span>
              <span className="governance-status-normal" style={{ fontSize: '1.25rem', fontWeight: 600, marginLeft: '0.5rem' }}>
                {data?.governance?.bias_score?.toFixed(2)}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>EU AI Act Risk</span>
              <span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: '0.5rem', color: 'var(--cds-link-primary)' }}>
                {data?.governance?.eu_ai_act_risk_level?.toUpperCase()}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Compliance Rate</span>
              <span className="governance-status-normal" style={{ fontSize: '1.25rem', fontWeight: 600, marginLeft: '0.5rem' }}>
                {data?.governance?.compliance_rate}%
              </span>
            </div>
          </div>
        </Column>
      </Grid>

      {/* Charts */}
      <Grid>
        <Column sm={4} md={8} lg={8} xlg={8}>
          <div style={{ background: 'var(--cds-layer)', padding: '1rem' }}>
            {areaData.length > 0 && <AreaChart data={areaData} options={CHART_OPTIONS_AREA} />}
          </div>
        </Column>
        <Column sm={4} md={8} lg={8} xlg={8}>
          <div style={{ background: 'var(--cds-layer)', padding: '1rem' }}>
            {donutData.length > 0 && <DonutChart data={donutData} options={CHART_OPTIONS_DONUT} />}
          </div>
        </Column>
      </Grid>
    </div>
  );
}
