/**
 * Authentication Context Provider
 * Manages global auth state and provides auth methods to components
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import authService from "../services/authService";
import { CONFIG } from "../config";

// Create context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        console.log("[AuthContext] Initializing auth...");
        console.log(
          "[AuthContext] Token exists:",
          !!authService.getAccessToken(),
        );
        console.log(
          "[AuthContext] isAuthenticated:",
          authService.isAuthenticated(),
        );

        if (authService.isAuthenticated()) {
          const storedUser = authService.getUser();
          const role = authService.getRoleFromToken();
          console.log("[AuthContext] Stored user:", storedUser);
          console.log("[AuthContext] Role from token:", role);
          setUser(storedUser ? { ...storedUser, role } : null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user) return;

    const token = authService.getAccessToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiresIn = payload.exp * 1000 - Date.now();

      // Refresh 1 minute before expiry
      const refreshTime = expiresIn - 60000;

      if (refreshTime > 0) {
        const timeout = setTimeout(async () => {
          try {
            const authData = await authService.refreshToken();
            setUser({ ...authData.user, role: authService.getRoleFromToken() });
          } catch (err) {
            console.error("Token refresh failed:", err);
            // Clear user state on refresh failure
            authService.logout();
            setUser(null);
            setError(null);
          }
        }, refreshTime);

        return () => clearTimeout(timeout);
      }
    } catch (err) {
      console.error("Token parse error:", err);
    }
  }, [user]);

  /**
   * Register new user
   */
  const register = useCallback(async (email, password, fullName) => {
    setLoading(true);
    setError(null);
    try {
      const authData = await authService.register({
        email,
        password,
        fullName,
      });
      const role = authService.getRoleFromToken();
      setUser({ ...authData.user, role });
      return authData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const authData = await authService.login({ email, password });
      const role = authService.getRoleFromToken();
      setUser({ ...authData.user, role });
      return authData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, []);

  /**
   * Clear any auth errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Login with OAuth tokens (from Google OAuth callback)
   */
  const loginWithTokens = useCallback(async (accessToken, refreshToken) => {
    setLoading(true);
    setError(null);
    try {
      console.log("[AuthContext] loginWithTokens called");
      console.log(
        "[AuthContext] ACCESS_TOKEN_KEY:",
        CONFIG.AUTH.ACCESS_TOKEN_KEY,
      );

      // Store tokens
      localStorage.setItem(CONFIG.AUTH.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(CONFIG.AUTH.REFRESH_TOKEN_KEY, refreshToken);

      // Parse user from token
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      console.log("[AuthContext] Token payload:", payload);

      const userData = {
        id: payload.userId,
        email: payload.sub,
        role: payload.role,
        fullName: payload.fullName || payload.sub,
      };

      console.log("[AuthContext] Setting user:", userData);
      localStorage.setItem(CONFIG.AUTH.USER_KEY, JSON.stringify(userData));
      setUser({ ...userData, role: payload.role });

      return { user: userData, accessToken, refreshToken };
    } catch (err) {
      console.error("[AuthContext] loginWithTokens error:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initiate Google OAuth login
   */
  const loginWithGoogle = useCallback(() => {
    // Redirect to identity service OAuth endpoint
    window.location.href = `${CONFIG.API.IDENTITY_SERVICE}/oauth2/authorization/google`;
  }, []);

  /**
   * Check if user has VIP access
   */
  const isVip =
    user?.role === CONFIG.ROLES.VIP || user?.role === CONFIG.ROLES.ADMIN;

  /**
   * Check if user is admin
   */
  const isAdmin = user?.role === CONFIG.ROLES.ADMIN;

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isVip,
    isAdmin,
    register,
    login,
    logout,
    clearError,
    loginWithTokens,
    loginWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
