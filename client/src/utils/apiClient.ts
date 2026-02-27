/**
 * API Client
 * Axios client with automatic token refresh
 */

import axios, { AxiosInstance } from 'axios';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
          baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true, // Send cookies with requests
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Response interceptor for automatic token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Check if this is an auth endpoint
      const url = originalRequest.url || '';
      const isAuthEndpoint = url.includes('/auth/login') ||
                            url.includes('/auth/register') ||
                            url.includes('/auth/verify-email') ||
                            url.includes('/auth/forgot-password') ||
                            url.includes('/auth/reset-password') ||
                            url.includes('/auth/me');

      const isRefreshEndpoint = url.includes('/auth/refresh-token');

      // If 401 and not already retried and not a login/register endpoint
      if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        originalRequest._retry = true;

        // Don't try to refresh if the refresh endpoint itself failed
        if (isRefreshEndpoint) {
          console.log('[API Client] Refresh token failed, redirecting to login');
          window.location.href = '/';
          return Promise.reject(error);
        }

        try {
          console.log('[API Client] Access token expired, refreshing...');
          // Try to refresh the token
          await axios.post('/api/auth/refresh-token', {}, {
            baseURL: '',
            withCredentials: true,
          });
          console.log('[API Client] Token refreshed successfully, retrying request');

          // Retry the original request
          return client(originalRequest);
        } catch (refreshError) {
          console.log('[API Client] Token refresh failed, user needs to log in again');
          // Refresh failed, redirect to login
          window.location.href = '/';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();

// ========================================
// Auth API
// ========================================

export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    apiClient.post('/auth/register', data),

  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    apiClient.post('/auth/login', data),

  logout: () => apiClient.post('/auth/logout'),

  getCurrentUser: () => apiClient.get('/auth/me'),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),

  refreshToken: () => apiClient.post('/auth/refresh-token'),
};

// ========================================
// Platform API
// ========================================

export const platformApi = {
  getConnectedPlatforms: () => apiClient.get('/platforms/connected'),

  disconnectPlatform: (platform: string) =>
    apiClient.delete(`/platforms/${platform}/disconnect`),

  refreshPlatform: (platform: string) =>
    apiClient.post(`/platforms/${platform}/refresh`),

  getSyncStatus: (platform: string) =>
    apiClient.get(`/platforms/${platform}/sync-status`),
};

// ========================================
// OAuth API
// ========================================

export const oauthApi = {
  /**
   * Initiate OAuth flow for a platform
   * Redirects the browser to the OAuth provider
   */
  initiateOAuth: (platform: 'youtube' | 'tiktok' | 'instagram') => {
    window.location.href = `/api/oauth/${platform}/authorize`;
  },
};
