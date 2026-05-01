import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30-second timeout
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Session expired
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    // Network error or timeout — attach a human-readable message
    if (!err.response) {
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        err.message = 'Request timed out. The server is taking too long to respond.';
      } else {
        err.message = 'Network error. Please check your connection and try again.';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
