import React from 'react';
import { Tile, SkeletonText } from '@carbon/react';

export default function KPICard({ title, value, unit, trend, trendDirection, status, loading }) {
  const borderClass =
    status === 'success' ? 'kpi-card-left-border-success'
    : status === 'warning' ? 'kpi-card-left-border-warning'
    : 'kpi-card-left-border-info';

  if (loading) {
    return (
      <Tile className={borderClass} style={{ minHeight: '110px' }}>
        <SkeletonText width="60%" />
        <SkeletonText width="40%" heading />
      </Tile>
    );
  }

  const trendColor = trendDirection === 'up' ? 'var(--cds-support-success, #42be65)' : 'var(--cds-support-warning, #f1c21b)';

  return (
    <Tile className={borderClass} style={{ minHeight: '110px' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary, #c6c6c6)', marginBottom: '0.25rem' }}>
        {title}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1.1 }}>
        {value}
        {unit && <span style={{ fontSize: '1rem', marginLeft: '0.25rem', fontWeight: 400 }}>{unit}</span>}
      </p>
      {trend && (
        <p style={{ fontSize: '0.75rem', color: trendColor, marginTop: '0.25rem' }}>
          {trendDirection === 'up' ? '▲' : '▼'} {trend}
        </p>
      )}
    </Tile>
  );
}
