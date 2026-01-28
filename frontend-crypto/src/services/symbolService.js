/**
 * Symbol Service - Handle symbol-related API calls
 * Base URL: /market-service/api/v1/market/symbols
 */

import apiClient from "./apiClient";

const SYMBOL_BASE = "/market-service/api/v1/market/symbols";

const symbolService = {
  /**
   * Get all symbols
   * @param {boolean} activeOnly - Only get active symbols
   * @returns {Promise<Array>} List of symbols
   */
  async getSymbols(activeOnly = false) {
    try {
      const response = await apiClient.get(SYMBOL_BASE, {
        params: { activeOnly },
      });
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching symbols:", error);
      throw this._handleError(error);
    }
  },

  /**
   * Get active symbols only
   * @returns {Promise<Array>} List of active symbols
   */
  async getActiveSymbols() {
    try {
      const response = await apiClient.get(`${SYMBOL_BASE}/active`);
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching active symbols:", error);
      throw this._handleError(error);
    }
  },

  /**
   * Get single symbol by name
   * @param {string} symbol - Symbol name (e.g., "BTCUSDT")
   * @returns {Promise<Object>} Symbol data
   */
  async getSymbol(symbol) {
    try {
      const response = await apiClient.get(`${SYMBOL_BASE}/${symbol}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching symbol ${symbol}:`, error);
      throw this._handleError(error);
    }
  },

  /**
   * Create new symbol
   * @param {Object} data - Symbol data
   * @param {string} data.symbol - Symbol name (e.g., "BTCUSDT")
   * @param {string} data.name - Display name (e.g., "Bitcoin")
   * @param {string} data.icon - Icon character (e.g., "₿")
   * @param {string} data.description - Description
   * @param {number} data.displayOrder - Display order
   * @returns {Promise<Object>} Created symbol
   */
  async createSymbol(data) {
    try {
      const response = await apiClient.post(SYMBOL_BASE, data);
      return response.data.data;
    } catch (error) {
      console.error("Error creating symbol:", error);
      throw this._handleError(error);
    }
  },

  /**
   * Update symbol
   * @param {string} symbol - Symbol name
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated symbol
   */
  async updateSymbol(symbol, data) {
    try {
      const response = await apiClient.put(`${SYMBOL_BASE}/${symbol}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating symbol ${symbol}:`, error);
      throw this._handleError(error);
    }
  },

  /**
   * Delete symbol
   * @param {string} symbol - Symbol name
   * @returns {Promise<void>}
   */
  async deleteSymbol(symbol) {
    try {
      await apiClient.delete(`${SYMBOL_BASE}/${symbol}`);
    } catch (error) {
      console.error(`Error deleting symbol ${symbol}:`, error);
      throw this._handleError(error);
    }
  },

  /**
   * Toggle symbol active status
   * @param {string} symbol - Symbol name
   * @returns {Promise<Object>} Updated symbol
   */
  async toggleSymbol(symbol) {
    try {
      const response = await apiClient.patch(`${SYMBOL_BASE}/${symbol}/toggle`);
      return response.data.data;
    } catch (error) {
      console.error(`Error toggling symbol ${symbol}:`, error);
      throw this._handleError(error);
    }
  },

  /**
   * Sync symbols from Binance Exchange API
   * @returns {Promise<Object>} Sync result
   */
  async syncFromBinance() {
    try {
      const response = await apiClient.post(`${SYMBOL_BASE}/sync`);
      return response.data.data;
    } catch (error) {
      console.error("Error syncing from Binance:", error);
      throw this._handleError(error);
    }
  },

  /**
   * Helper: Handle API errors
   * @private
   */
  _handleError(error) {
    if (error.response) {
      return {
        message:
          error.response.data?.message ||
          error.response.data?.error ||
          `Error: ${error.response.status}`,
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      return {
        message: "Network error - No response from server",
        status: 0,
        data: null,
      };
    } else {
      return {
        message: error.message || "Unknown error",
        status: -1,
        data: null,
      };
    }
  },
};

export default symbolService;

/**
 * USAGE EXAMPLES:
 *
 * // Get all active symbols
 * const symbols = await symbolService.getActiveSymbols();
 *
 * // Get all symbols (including inactive)
 * const allSymbols = await symbolService.getSymbols(false);
 *
 * // Create new symbol
 * const newSymbol = await symbolService.createSymbol({
 *   symbol: 'ADAUSDT',
 *   name: 'Cardano',
 *   icon: '₳',
 *   description: 'Cardano to USDT',
 *   displayOrder: 5
 * });
 *
 * // Toggle symbol
 * await symbolService.toggleSymbol('ADAUSDT');
 */
