import axios from 'axios';
import { handleMockRequest } from './mockData';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the API is unreachable (network error, CORS, 404 on deployed static host),
    // serve from in-browser mock data so the app works without a backend.
    if (!error.response || error.code === 'ERR_NETWORK' || error.response?.status === 404) {
      const method = (originalRequest.method || 'get').toUpperCase();
      const url = originalRequest.baseURL + (originalRequest.url || '');
      const fullUrl = originalRequest.params
        ? url + '?' + new URLSearchParams(originalRequest.params).toString()
        : url;
      const body = originalRequest.data ? (typeof originalRequest.data === 'string' ? JSON.parse(originalRequest.data) : originalRequest.data) : undefined;

      const mock = handleMockRequest(method, fullUrl, body);

      if (mock) {
        // For login with wrong creds, reject with proper error
        if (mock.status === 401) {
          return Promise.reject({ response: { status: 401, data: mock.data } });
        }
        return { data: mock.data, status: mock.status || 200, headers: {}, config: originalRequest, statusText: 'OK (mock)' };
      }
    }

    // Token refresh logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
          const newToken = data.data?.accessToken || data.accessToken;
          localStorage.setItem('token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
