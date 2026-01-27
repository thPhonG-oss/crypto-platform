/**
 * API Client with Authentication
 * Axios instance that automatically adds auth token to requests
 */

import axios from "axios";
import { CONFIG } from "../config";
import authService from "./authService";

// Create axios instance
const apiClient = axios.create({
  baseURL: CONFIG.API.GATEWAY,
  timeout: CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug logging
    console.log(
      `[API] ${config.method?.toUpperCase()} ${config.url}`,
      config.params || "",
    );

    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  },
);

// Response interceptor - handle auth errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        await authService.refreshToken();

        // Retry original request with new token
        const token = authService.getAccessToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        console.error("Token refresh failed:", refreshError);
        authService.logout();

        // Optionally redirect to login
        window.dispatchEvent(new CustomEvent("auth:logout"));

        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden (VIP required)
    if (error.response?.status === 403) {
      const message = error.response.data?.message || "Access denied";

      if (message.includes("VIP")) {
        // Dispatch event for VIP upgrade prompt
        window.dispatchEvent(new CustomEvent("auth:vip-required"));
      }
    }

    console.error(
      "[API Error]",
      error.response?.status,
      error.response?.data || error.message,
    );

    return Promise.reject(error);
  },
);

export default apiClient;

/**
 * Helper functions for common API calls
 */

export const api = {
  // GET request
  get: (url, params = {}) => apiClient.get(url, { params }),

  // POST request
  post: (url, data = {}) => apiClient.post(url, data),

  // PUT request
  put: (url, data = {}) => apiClient.put(url, data),

  // PATCH request
  patch: (url, data = {}) => apiClient.patch(url, data),

  // DELETE request
  delete: (url) => apiClient.delete(url),
};
