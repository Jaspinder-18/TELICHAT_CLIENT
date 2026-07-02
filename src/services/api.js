import axios from 'axios';
import { store } from '../redux/store.js';
import { logoutUser, updateAccessToken } from '../redux/authSlice.js';
import { setGlobalLoading } from '../redux/uiSlice.js';

let defaultBaseURL = 'https://telichat-server.onrender.com/api';
if (typeof window !== 'undefined') {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    defaultBaseURL = 'http://localhost:5000/api';
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http') || filePath.startsWith('blob:') || filePath.startsWith('data:')) return filePath;
  const baseUrl = (api.defaults.baseURL || '').replace('/api', '');
  return `${baseUrl}${filePath}`;
};

// Global active request tracker
let activeRequests = 0;
const updateLoadingState = (delta) => {
  activeRequests += delta;
  if (activeRequests < 0) activeRequests = 0;
  
  // Update store state
  store.dispatch(setGlobalLoading(activeRequests > 0));
};

// Request interceptor: add bearer token header
api.interceptors.request.use(
  (config) => {
    const isBackgroundRequest = config.url && (
      config.url.includes('/message') ||
      config.url.includes('/post') ||
      config.url.includes('/reaction') ||
      config.url.includes('/typing') ||
      config.url.includes('/vote')
    );
    if (config.method !== 'get' && !isBackgroundRequest) {
      updateLoadingState(1);
    }
    const state = store.getState();
    const token = state.auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    const isBackgroundRequest = error.config && error.config.url && (
      error.config.url.includes('/message') ||
      error.config.url.includes('/post') ||
      error.config.url.includes('/reaction') ||
      error.config.url.includes('/typing') ||
      error.config.url.includes('/vote')
    );
    if (error.config && error.config.method !== 'get' && !isBackgroundRequest) {
      updateLoadingState(-1);
    }
    return Promise.reject(error);
  }
);

// Response interceptor: handle token refresh transparently
api.interceptors.response.use(
  (response) => {
    const isBackgroundRequest = response.config && response.config.url && (
      response.config.url.includes('/message') ||
      response.config.url.includes('/post') ||
      response.config.url.includes('/reaction') ||
      response.config.url.includes('/typing') ||
      response.config.url.includes('/vote')
    );
    if (response.config && response.config.method !== 'get' && !isBackgroundRequest) {
      updateLoadingState(-1);
    }
    return response;
  },
  async (error) => {
    const isBackgroundRequest = error.config && error.config.url && (
      error.config.url.includes('/message') ||
      error.config.url.includes('/post') ||
      error.config.url.includes('/reaction') ||
      error.config.url.includes('/typing') ||
      error.config.url.includes('/vote')
    );
    if (error.config && error.config.method !== 'get' && !isBackgroundRequest) {
      updateLoadingState(-1);
    }
    const originalRequest = error.config;

    // Check if error is 401 and not already retried
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const state = store.getState();
        const refresh = state.auth.refreshToken;

        if (!refresh) {
          store.dispatch(logoutUser());
          return Promise.reject(error);
        }

        // Call backend to refresh access token
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, { token: refresh });
        const { accessToken } = res.data;

        // Save new token in Redux store
        store.dispatch(updateAccessToken(accessToken));

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token itself expired or is invalid
        store.dispatch(logoutUser());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
