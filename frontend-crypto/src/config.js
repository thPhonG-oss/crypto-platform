/**
 * Application Configuration
 */

const API_GATEWAY_URL = "http://localhost:8080";

export const CONFIG = {
  API: {
    GATEWAY: API_GATEWAY_URL,
    MARKET_SERVICE: `${API_GATEWAY_URL}/market-service`,
    CRAWLER_SERVICE: `${API_GATEWAY_URL}/crawler-service`,
    ANALYSIS_SERVICE: `${API_GATEWAY_URL}/analysis-service`,
    IDENTITY_SERVICE: `${API_GATEWAY_URL}/identity-service`,
  },
  WS: {
    MARKET: `ws://localhost:8080/market-service/ws`,
    SOCKJS: `http://localhost:8080/market-service/ws`,
  },
  TIMEOUT: 10000,
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes

  // Auth configuration
  AUTH: {
    TOKEN_KEY: "crypto_access_token",
    ACCESS_TOKEN_KEY: "crypto_access_token", // Alias for consistency
    REFRESH_TOKEN_KEY: "crypto_refresh_token",
    USER_KEY: "crypto_user",
  },

  // User roles
  ROLES: {
    REGULAR: "REGULAR",
    VIP: "VIP",
    ADMIN: "ADMIN",
  },
};
