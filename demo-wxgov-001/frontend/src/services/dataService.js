import api from './api';

export const fetchDashboard = () => api.get('/data/dashboard');
export const fetchComplaints = (params) => api.get('/data/complaints', { params });
export const fetchGovernanceFactsheet = () => api.get('/governance/factsheet');
export const fetchGovernanceTimeline = () => api.get('/governance/timeline');
export const fetchGovernanceSummary = () => api.get('/governance/summary');
export const fetchAgentOpsTraces = (params) => api.get('/agentops/traces', { params });
export const fetchAgentOpsTrace = (traceId) => api.get(`/agentops/traces/${traceId}`);
export const fetchAgentOpsMetrics = () => api.get('/agentops/metrics');
