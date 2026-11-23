import React, { useEffect, useState } from 'react';
import { Grid, Column, Tag, Loading, InlineNotification,
  DataTable, Table, TableHead, TableRow, TableHeader, TableBody,
  TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  Pagination } from '@carbon/react';
import { fetchComplaints } from '../services/dataService';

const PRIORITY_COLORS = { high: 'red', medium: 'warm-gray', low: 'green' };
const STATUS_COLORS = { resolved: 'green', escalated: 'red', pending: 'warm-gray', in_review: 'blue' };

const HEADERS = [
  { key: 'id', header: 'Complaint ID' },
  { key: 'customer_id', header: 'Customer ID' },
  { key: 'company', header: 'Company' },
  { key: 'category', header: 'Category' },
  { key: 'priority', header: 'Priority' },
  { key: 'status', header: 'Status' },
  { key: 'governance_flagged', header: 'Gov. Flag' },
  { key: 'ai_handled', header: 'AI Handled' },
  { key: 'created_at', header: 'Created' },
];

export default function ComplaintsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchComplaints({ page, page_size: pageSize, search: search || undefined })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, pageSize, search]);

  if (loading) return <div className="demo-page"><Loading description="Loading complaints..." withOverlay={false} /></div>;
  if (error) return <div className="demo-page"><InlineNotification kind="error" title="Error" subtitle={error} hideCloseButton /></div>;

  const rows = (data?.items || []).map((r) => ({ ...r, id: r.id }));

  return (
    <div className="demo-page">
      <h2 className="demo-section-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Complaints Log</h2>
      <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>
        {data?.total} total complaints — governance-flagged cases are highlighted
      </p>

      <Grid>
        <Column sm={4} md={8} lg={16}>
          <DataTable rows={rows} headers={HEADERS}>
            {({ rows: tableRows, headers, getHeaderProps, getTableProps }) => (
              <>
                <TableToolbar>
                  <TableToolbarContent>
                    <TableToolbarSearch
                      placeholder="Search complaint ID, customer, company..."
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
                    {tableRows.map((row) => (
                      <TableRow key={row.id} style={row.cells.find(c => c.info?.header === 'governance_flagged')?.value ? { background: 'rgba(250,77,86,0.08)' } : {}}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.info.header === 'priority' ? (
                              <Tag type={PRIORITY_COLORS[cell.value] || 'gray'} size="sm">{cell.value}</Tag>
                            ) : cell.info.header === 'status' ? (
                              <Tag type={STATUS_COLORS[cell.value] || 'gray'} size="sm">{cell.value?.replace(/_/g,' ')}</Tag>
                            ) : cell.info.header === 'governance_flagged' ? (
                              cell.value ? <Tag type="red" size="sm">⚠ Flagged</Tag> : null
                            ) : cell.info.header === 'ai_handled' ? (
                              cell.value ? <Tag type="teal" size="sm">AI</Tag> : <Tag type="gray" size="sm">Human</Tag>
                            ) : cell.info.header === 'created_at' ? (
                              new Date(cell.value).toLocaleDateString()
                            ) : cell.info.header === 'category' ? (
                              String(cell.value || '').replace(/_/g, ' ')
                            ) : String(cell.value ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </DataTable>
          <Pagination
            totalItems={data?.total || 0}
            pageSize={pageSize}
            pageSizes={[10, 20, 50]}
            page={page}
            onChange={({ page: p, pageSize: ps }) => { setPage(p); setPageSize(ps); }}
          />
        </Column>
      </Grid>
    </div>
  );
}
