import axios from 'axios';

const TOKEN_KEY = 'cyeza_token';

// localStorage can throw (private mode, blocked storage), so every access is guarded.
export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ }
};
export const clearToken = () => {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

// In development Vite proxies /api to the Express server (see vite.config.js).
// For production, set VITE_API_URL (e.g. https://api.yourdomain.com/api).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or invalid token logs the user out everywhere.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && getToken() && !isLogin) {
      clearToken();
      window.dispatchEvent(new Event('cyeza:logout'));
    }
    return Promise.reject(err);
  }
);

export default api;