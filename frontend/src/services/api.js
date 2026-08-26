import axios from 'axios';

/**
 * Axios instance pre-configured for the MPSC Prep AI backend.
 * Vercel deployments use the same-origin /api proxy. Other deployments use
 * VITE_API_URL, falling back to the local Vite proxy when it is unset.
 */
const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const isVercelDeployment = window.location.hostname.endsWith('.vercel.app');

const api = axios.create({
  // Vercel routes /api to Render, avoiding browser-to-API CORS requests.
  baseURL: isVercelDeployment || !configuredApiUrl ? '/api' : `${configuredApiUrl}/api`,
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
