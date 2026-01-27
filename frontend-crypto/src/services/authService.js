/**
 * Authentication Service - Handle all auth-related API calls
 */

import axios from "axios";
import { CONFIG } from "../config";

const BASE_URL = `${CONFIG.API.IDENTITY_SERVICE}/api/v1/auth`;

// Create axios instance for auth
const authClient = axios.create({
  baseURL: BASE_URL,
  timeout: CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Auth Service Object
 */
const authService = {
  /**
   * Register a new user
   * @param {Object} data - Registration data
   * @param {string} data.email - User email
   * @param {string} data.password - User password
   * @param {string} data.fullName - User full name
   * @returns {Promise<Object>} Auth response with tokens and user
   */
  async register(data) {
    try {
      const response = await authClient.post("/register", data);
      if (response.data.success) {
        this._saveTokens(response.data.data);
        return response.data.data;
      }
      throw new Error(response.data.message || "Registration failed");
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Login user
   * @param {Object} data - Login credentials
   * @param {string} data.email - User email
   * @param {string} data.password - User password
   * @returns {Promise<Object>} Auth response with tokens and user
   */
  async login(data) {
    try {
      const response = await authClient.post("/login", data);
      if (response.data.success) {
        this._saveTokens(response.data.data);
        return response.data.data;
      }
      throw new Error(response.data.message || "Login failed");
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Refresh access token
   * @returns {Promise<Object>} New auth response
   */
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await authClient.post("/refresh", { refreshToken });
      if (response.data.success) {
        this._saveTokens(response.data.data);
        return response.data.data;
      }
      throw new Error(response.data.message || "Token refresh failed");
    } catch (error) {
      // Clear tokens on refresh failure
      this.logout();
      throw this._handleError(error);
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      const token = this.getAccessToken();
      if (token) {
        // Call logout endpoint to invalidate token server-side
        await axios.post(
          `${BASE_URL}/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }
    } catch (error) {
      console.warn("Logout API call failed:", error.message);
    } finally {
      // Always clear local storage
      this._clearTokens();
    }
  },

  /**
   * Get stored access token
   * @returns {string|null} Access token
   */
  getAccessToken() {
    return localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
  },

  /**
   * Get stored refresh token
   * @returns {string|null} Refresh token
   */
  getRefreshToken() {
    return localStorage.getItem(CONFIG.AUTH.REFRESH_TOKEN_KEY);
  },

  /**
   * Get stored user data
   * @returns {Object|null} User data
   */
  getUser() {
    const userData = localStorage.getItem(CONFIG.AUTH.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = this.getAccessToken();
    if (!token) return false;

    // Check if token is expired (basic check)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  /**
   * Check if user has VIP role
   * @returns {boolean}
   */
  isVip() {
    const user = this.getUser();
    return user?.role === CONFIG.ROLES.VIP || user?.role === CONFIG.ROLES.ADMIN;
  },

  /**
   * Check if user has Admin role
   * @returns {boolean}
   */
  isAdmin() {
    const user = this.getUser();
    return user?.role === CONFIG.ROLES.ADMIN;
  },

  /**
   * Get user role from token
   * @returns {string|null}
   */
  getRoleFromToken() {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.role;
    } catch {
      return null;
    }
  },

  // Private methods

  /**
   * Save tokens and user to localStorage
   */
  _saveTokens(authData) {
    if (authData.accessToken) {
      localStorage.setItem(CONFIG.AUTH.TOKEN_KEY, authData.accessToken);
    }
    if (authData.refreshToken) {
      localStorage.setItem(
        CONFIG.AUTH.REFRESH_TOKEN_KEY,
        authData.refreshToken,
      );
    }
    if (authData.user) {
      localStorage.setItem(CONFIG.AUTH.USER_KEY, JSON.stringify(authData.user));
    }
  },

  /**
   * Clear all stored tokens
   */
  _clearTokens() {
    localStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
    localStorage.removeItem(CONFIG.AUTH.REFRESH_TOKEN_KEY);
    localStorage.removeItem(CONFIG.AUTH.USER_KEY);
  },

  /**
   * Handle API errors
   */
  _handleError(error) {
    if (error.response) {
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        `Error: ${error.response.status}`;
      return new Error(message);
    }
    if (error.request) {
      return new Error("Network error. Please check your connection.");
    }
    return error;
  },
};

export default authService;
