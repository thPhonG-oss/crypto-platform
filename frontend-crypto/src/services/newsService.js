/**
 * News Service - Handle all API calls to Crawler Service
 * Base URL: http://localhost:8080/crawler-service/api/v1
 */

import apiClient from "./apiClient";
import { CONFIG } from "../config";

const CRAWLER_BASE = "/crawler-service/api/v1";
const ANALYSIS_BASE = "/analysis-service/api/v1";

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
      // Use Analysis Service for reading news (includes sentiment)
      // Note: Analysis Service returns { news: [], total: ... }
      // The frontend expects { items: [], total: ... }

      const response = await apiClient.get(`${ANALYSIS_BASE}/news`, { params });

      return {
        items: response.data.news || [],
        total: response.data.total || 0,
        offset: response.data.offset || 0,
        limit: response.data.limit || 0,
      };
    } catch (error) {
      // Fallback to Crawler Service if Analysis Service is down
      console.warn("Analysis service failed, falling back to crawler...");
      try {
        return await this.getRawNews(params);
      } catch (fallbackError) {
        throw this._handleError(error);
      }
    }
  },

  /**
   * Get raw news from crawler service (fallback)
   */
  async getRawNews(params = {}) {
    try {
      const response = await apiClient.get(`${CRAWLER_BASE}/news`, { params });
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
      const response = await apiClient.get(`${CRAWLER_BASE}/news/${newsId}`);
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
      const response = await apiClient.get(`${CRAWLER_BASE}/sources`);
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
      const response = await apiClient.post(`${CRAWLER_BASE}/crawl`, data);
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
      const response = await apiClient.get(`${CRAWLER_BASE}/scheduler/status`);
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
      const response = await apiClient.post(
        `${CRAWLER_BASE}/scheduler/trigger`,
      );
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
