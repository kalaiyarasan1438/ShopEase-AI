import axios from 'axios';

let store;
export const injectStore = (_store) => {
  store = _store;
};

// ── Base Instance ─────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request Interceptor — attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — handle 401 / token refresh ────────────────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only intercept 401 responses on non-refresh, non-retried requests
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/api/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue concurrent requests until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }).catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing    = true;

      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        // No refresh token — force logout via Redux (no hard redirect)
        if (store) store.dispatch({ type: 'auth/logout' });
        processQueue(new Error('No refresh token'), null);
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          { refreshToken: refreshTokenValue },
          { headers: { 'Content-Type': 'application/json' } }
        );
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        // Refresh truly failed — log user out via Redux
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (store) store.dispatch({ type: 'auth/logout' });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Retry logic for GET requests (up to 8 retries on network error or 5xx for Render server wake-up)
    const isGetMethod = original?.method?.toLowerCase() === 'get';
    const isNetworkOrServerError = !error.response || (error.response.status >= 500 && error.response.status < 600) || error.code === 'ECONNABORTED';

    if (isGetMethod && isNetworkOrServerError) {
      original._retryCount = (original._retryCount || 0) + 1;
      if (original._retryCount <= 8) {
        const delay = 3000;
        await new Promise((res) => setTimeout(res, delay));
        return api(original);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
