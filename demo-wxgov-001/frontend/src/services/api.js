import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    console.error('[API Error]', err.response?.status, err.message);
    throw err;
  }
);

export default client;
