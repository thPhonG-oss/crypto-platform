/**
 * News Service - Handle all API calls to Crawler Service
 * Base URL: http://localhost:8080/crawler-service/api/v1
 */

import axios from "axios";
import { CONFIG } from "../config";

const BASE_URL = `${CONFIG.API.CRAWLER_SERVICE}/api/v1`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log(
      `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
      config.params,
    );
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(
      "[API Response Error]",
      error.response?.data || error.message,
    );
    return Promise.reject(error);
  },
);

/**
 * News Service Object
 */
const newsService = {
  /**
   * Get list of news articles with filters
   * @param {Object} params - Query parameters
   * @param {string} params.source - Filter by source (e.g., "coindesk")
   * @param {string} params.symbols - Filter by symbols (comma-separated: "BTC,ETH")
   * @param {string} params.from_date - Filter from date (ISO format)
   * @param {number} params.limit - Number of items (default: 50, max: 100)
   * @param {number} params.offset - Pagination offset (default: 0)
   * @returns {Promise<Object>} { total, items, offset, limit }
   */
  async getNews(params = {}) {
    try {
      const response = await apiClient.get("/news", { params });
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Get single news article by ID
   * @param {number} newsId - News article ID
   * @returns {Promise<Object>} News article object
   */
  async getNewsById(newsId) {
    try {
      const response = await apiClient.get(`/news/${newsId}`);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Get list of available news sources
   * @returns {Promise<Object>} { configured_sources, active_sources, ... }
   */
  async getSources() {
    try {
      const response = await apiClient.get("/sources");
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Manually trigger crawl for a specific URL
   * @param {Object} data
   * @param {string} data.url - Article URL to crawl
   * @param {string} data.source - Source name
   * @param {boolean} data.force_gemini - Force use Gemini parser
   * @returns {Promise<Object>} Crawl job response
   */
  async triggerCrawl(data) {
    try {
      const response = await apiClient.post("/crawl", data);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Get scheduler status
   * @returns {Promise<Object>} Scheduler status
   */
  async getSchedulerStatus() {
    try {
      const response = await apiClient.get("/scheduler/status");
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Manually trigger scheduler to crawl all sources
   * @returns {Promise<Object>} Trigger response
   */
  async triggerScheduler() {
    try {
      const response = await apiClient.post("/scheduler/trigger");
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  },

  /**
   * Helper: Handle API errors
   * @private
   */
  _handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        message:
          error.response.data?.detail ||
          error.response.data?.message ||
          "Server error",
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: "Network error - No response from server",
        status: 0,
        data: null,
      };
    } else {
      // Something else happened
      return {
        message: error.message || "Unknown error",
        status: -1,
        data: null,
      };
    }
  },
};

export default newsService;

/**
 * USAGE EXAMPLES:
 *
 * // Get all news
 * const allNews = await newsService.getNews();
 *
 * // Get BTC-related news
 * const btcNews = await newsService.getNews({ symbols: 'BTC' });
 *
 * // Get news from CoinDesk
 * const coinDeskNews = await newsService.getNews({ source: 'coindesk' });
 *
 * // Get recent news (last 24h)
 * const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
 * const recentNews = await newsService.getNews({ from_date: yesterday });
 *
 * // Pagination
 * const page2 = await newsService.getNews({ limit: 20, offset: 20 });
 *
 * // Get single article
 * const article = await newsService.getNewsById(123);
 *
 * // Trigger manual crawl
 * const result = await newsService.triggerCrawl({
 *   url: 'https://coindesk.com/article/...',
 *   source: 'coindesk',
 *   force_gemini: false
 * });
 */
