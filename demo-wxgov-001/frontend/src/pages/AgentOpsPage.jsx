import React, { useEffect, useState } from 'react';
import { Grid, Column, Tile, Tag, Loading, InlineNotification,
  DataTable, Table, TableHead, TableRow, TableHeader, TableBody,
  TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  Pagination } from '@carbon/react';
import { fetchAgentOpsMetrics, fetchAgentOpsTraces } from '../services/dataService';

const PRIORITY_TAG = { high: 'red', medium: 'warm-gray', low: 'green' };
const STATUS_TAG = { ok: 'green', error: 'red' };

export default function AgentOpsPage() {
  const [metrics, setMetrics] = useState(null);
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [selectedTrace, setSelectedTrace] = useState(null);

  useEffect(() => {
    Promise.all([fetchAgentOpsMetrics(), fetchAgentOpsTraces({ limit: 100 })])
      .then(([m, t]) => { setMetrics(m); setTraces(t.items || []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="demo-page"><Loading description="Loading AgentOps data..." withOverlay={false} /></div>;
  if (error) return <div className="demo-page"><InlineNotification kind="error" title="Error" subtitle={error} hideCloseButton /></div>;

  const filtered = traces.filter((t) =>
    !searchText || t.trace_id.includes(searchText) || t.customer_id.includes(searchText) || t.priority_decision.includes(searchText)
  );
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const headers = [
    { key: 'trace_id', header: 'Trace ID' },
    { key: 'timestamp', header: 'Timestamp' },
    { key: 'priority_decision', header: 'Priority' },
    { key: 'total_duration_ms', header: 'Duration (ms)' },
    { key: 'tokens_total', header: 'Tokens' },
    { key: 'status', header: 'Status' },
    { key: 'governance_flagged', header: 'Gov. Flag' },
  ];

  return (
    <div className="demo-page">
      <h2 className="demo-section-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>AgentOps — Execution Traces</h2>
      <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>
        Every agent run is traced end-to-end via OpenTelemetry → watsonx Orchestrate AgentOps
      </p>

      {/* Metrics strip */}
      <Grid style={{ marginBottom: '2rem' }}>
        {[
          ['Total Runs', metrics?.total_runs],
          ['Error Rate', `${metrics?.error_rate_pct}%`],
          ['Governance Flags', `${metrics?.governance_flag_rate_pct}%`],
          ['Escalation Rate', `${metrics?.escalation_rate_pct}%`],
          ['P50 Latency', `${metrics?.latency?.p50_ms}ms`],
          ['P95 Latency', `${metrics?.latency?.p95_ms}ms`],
          ['Avg Tokens/Run', metrics?.avg_tokens_per_run],
        ].map(([title, val], i) => (
          <Column key={i} sm={2} md={2} lg={2} xlg={2}>
            <Tile style={{ padding: '0.75rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>{title}</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{val}</p>
            </Tile>
          </Column>
        ))}
      </Grid>

      {/* Tool latency table */}
      <Grid style={{ marginBottom: '2rem' }}>
        <Column sm={4} md={8} lg={16}>
          <Tile>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Tool Latency Breakdown</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {Object.entries(metrics?.tool_latencies || {}).map(([name, m]) => (
                <div key={name} style={{
                  background: 'var(--cds-background, #161616)',
                  padding: '0.75rem 1rem', minWidth: '180px',
                }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>{name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Avg: {m.avg_ms}ms · P95: {m.p95_ms}ms</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Calls: {m.calls} · Errors: {m.error_rate}%</p>
                </div>
              ))}
            </div>
          </Tile>
        </Column>
      </Grid>

      {/* Traces table */}
      <Grid style={{ marginBottom: '1.5rem' }}>
        <Column sm={4} md={8} lg={16}>
          <DataTable rows={pageData.map((t) => ({ ...t, id: t.trace_id }))} headers={headers}>
            {({ rows, headers, getHeaderProps, getTableProps }) => (
              <>
                <TableToolbar>
                  <TableToolbarContent>
                    <TableToolbarSearch
                      placeholder="Search trace ID, customer..."
                      onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
                    />
                  </TableToolbarContent>
                </TableToolbar>
                <Table {...getTableProps()} size="sm">
                  <TableHead>
                    <TableRow>
                      {headers.map((h) => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const trace = pageData.find((t) => t.trace_id === row.id);
                      return (
                        <TableRow
                          key={row.id}
                          onClick={() => setSelectedTrace(trace)}
                          style={{ cursor: 'pointer' }}
                        >
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>
                              {cell.info.header === 'priority_decision' ? (
                                <Tag type={PRIORITY_TAG[cell.value] || 'gray'} size="sm">{cell.value}</Tag>
                              ) : cell.info.header === 'status' ? (
                                <Tag type={STATUS_TAG[cell.value] || 'gray'} size="sm">{cell.value}</Tag>
                              ) : cell.info.header === 'governance_flagged' ? (
                                cell.value ? <Tag type="red" size="sm">Flagged</Tag> : <Tag type="gray" size="sm">Clear</Tag>
                              ) : cell.info.header === 'timestamp' ? (
                                new Date(cell.value).toLocaleString()
                              ) : String(cell.value)}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
            )}
          </DataTable>
          <Pagination
            totalItems={filtered.length}
            pageSize={pageSize}
            pageSizes={[10, 20, 50]}
            page={page}
            onChange={({ page: p, pageSize: ps }) => { setPage(p); setPageSize(ps); }}
          />
        </Column>
      </Grid>

      {/* Trace detail panel */}
      {selectedTrace && (
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <Tile>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem' }}>Trace Detail — {selectedTrace.trace_id}</h3>
                <button
                  onClick={() => setSelectedTrace(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--cds-link-primary)', cursor: 'pointer' }}
                >
                  Close ✕
                </button>
              </div>
              <div className="trace-panel">
                {JSON.stringify(selectedTrace, null, 2)}
              </div>
            </Tile>
          </Column>
        </Grid>
      )}
    </div>
  );
}
