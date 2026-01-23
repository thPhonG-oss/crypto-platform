/**
 * useNews - Custom Hook for News Management
 * Handles fetching, filtering, and state management for news
 */

import { useState, useEffect, useCallback } from "react";
import newsService from "../services/newsService";

/**
 * Custom hook for news data
 * @param {Object} options - Hook options
 * @param {string} options.symbol - Filter by symbol (e.g., "BTC")
 * @param {string} options.source - Filter by source
 * @param {number} options.limit - Items per page
 * @param {boolean} options.autoFetch - Auto-fetch on mount
 * @param {number} options.refreshInterval - Auto-refresh interval (ms), 0 = disabled
 */
export const useNews = (options = {}) => {
  const {
    symbol = null,
    source = null,
    limit = 20,
    autoFetch = true,
    refreshInterval = 0, // 0 = no auto-refresh
  } = options;

  // State
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  /**
   * Fetch news from API
   */
  const fetchNews = useCallback(
    async (customParams = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          limit,
          offset,
          ...customParams,
        };

        // Add filters if provided
        if (symbol) params.symbols = symbol;
        if (source) params.source = source;

        const response = await newsService.getNews(params);

        setNews(response.items || []);
        setTotal(response.total || 0);
        setHasMore(offset + limit < (response.total || 0));

        console.log(`✅ Fetched ${response.items?.length || 0} news articles`);
      } catch (err) {
        console.error("❌ Error fetching news:", err);
        setError(err.message || "Failed to fetch news");
        setNews([]);
      } finally {
        setLoading(false);
      }
    },
    [symbol, source, limit, offset],
  );

  /**
   * Refresh news (reset to page 1)
   */
  const refresh = useCallback(() => {
    setOffset(0);
    fetchNews({ offset: 0 });
  }, [fetchNews]);

  /**
   * Load more news (pagination)
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const newOffset = offset + limit;
      setOffset(newOffset);
      fetchNews({ offset: newOffset });
    }
  }, [loading, hasMore, offset, limit, fetchNews]);

  /**
   * Change filter
   */
  const setFilter = useCallback(
    (newSymbol, newSource) => {
      setOffset(0);
      fetchNews({
        offset: 0,
        symbols: newSymbol || undefined,
        source: newSource || undefined,
      });
    },
    [fetchNews],
  );

  /**
   * Auto-fetch on mount or when dependencies change
   */
  useEffect(() => {
    if (autoFetch) {
      fetchNews();
    }
  }, [autoFetch]); // Only run on mount if autoFetch is true

  /**
   * Auto-refresh interval
   */
  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => {
        console.log("🔄 Auto-refreshing news...");
        refresh();
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, refresh]);

  return {
    // Data
    news,
    loading,
    error,
    total,
    offset,
    hasMore,

    // Actions
    fetchNews,
    refresh,
    loadMore,
    setFilter,
  };
};

/**
 * Hook for single news article
 */
export const useSingleNews = (newsId) => {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchArticle = useCallback(async () => {
    if (!newsId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await newsService.getNewsById(newsId);
      setArticle(data);
    } catch (err) {
      console.error("❌ Error fetching article:", err);
      setError(err.message || "Failed to fetch article");
      setArticle(null);
    } finally {
      setLoading(false);
    }
  }, [newsId]);

  useEffect(() => {
    if (newsId) {
      fetchArticle();
    }
  }, [newsId, fetchArticle]);

  return {
    article,
    loading,
    error,
    refetch: fetchArticle,
  };
};

/**
 * Hook for news sources
 */
export const useNewsSources = () => {
  const [sources, setSources] = useState({
    configured: [],
    active: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await newsService.getSources();
      setSources({
        configured: data.configured_sources || [],
        active: data.active_sources || [],
      });
    } catch (err) {
      console.error("❌ Error fetching sources:", err);
      setError(err.message || "Failed to fetch sources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  return {
    sources,
    loading,
    error,
    refetch: fetchSources,
  };
};

/**
 * USAGE EXAMPLES:
 *
 * // Basic usage
 * const { news, loading, error, refresh } = useNews();
 *
 * // With filters
 * const { news, loading } = useNews({
 *   symbol: 'BTC',
 *   limit: 10
 * });
 *
 * // With auto-refresh (every 5 minutes)
 * const { news, loading } = useNews({
 *   refreshInterval: 5 * 60 * 1000
 * });
 *
 * // Pagination
 * const { news, loadMore, hasMore } = useNews();
 *
 * // Single article
 * const { article, loading } = useSingleNews(123);
 *
 * // Sources
 * const { sources } = useNewsSources();
 */
