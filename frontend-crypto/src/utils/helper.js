/**
 * Utility Helper Functions
 */

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

/**
 * Format price
 */
export const formatPrice = (price, decimals = 2) => {
  if (price === null || price === undefined) return "$0.00";
  return `$${Number(price).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

/**
 * Format percentage
 */
export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined) return "0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/**
 * Get color for sentiment
 */
export const getSentimentColor = (score) => {
  if (!score && score !== 0) return "gray";
  if (score > 0.3) return "green";
  if (score < -0.3) return "red";
  return "yellow";
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if service is available
 */
export const checkServiceHealth = async (serviceUrl) => {
  try {
    const response = await fetch(`${serviceUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Parse symbol from pair
 */
export const parseSymbol = (pair) => {
  // BTCUSDT -> BTC
  return pair.replace("USDT", "").replace("BUSD", "");
};
