import axios from 'axios';

/**
 * Axios instance pre-configured for the MPSC Prep AI backend.
 * Base URL is picked from the Vite env variable VITE_API_URL,
 * falling back to the Vite dev proxy (/api) if unset.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ─── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Network error';
    console.error('[API Error]', message);
    return Promise.reject(error);
  }
);

export default api;
