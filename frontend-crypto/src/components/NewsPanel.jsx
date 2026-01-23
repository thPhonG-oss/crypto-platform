import React, { useState } from "react";
import { useNews } from "../hooks/useNews";
import NewsCard from "./NewsCard";
import NewsDetailModal from "./NewsDetailModal";
import { RefreshCw, Filter } from "lucide-react";

const NewsPanel = ({ selectedSymbol }) => {
  const [filter, setFilter] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use custom hook with auto-refresh every 5 minutes
  const { news, loading, error, refresh, hasMore, loadMore } = useNews({
    symbol: filter === "all" ? null : filter,
    limit: 20,
    autoFetch: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleCardClick = (article) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedArticle(null);
  };

  return (
    <>
      <div className="bg-gray-800 rounded-lg p-4 h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📰 Financial News
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </h2>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-1">
              {["all", "btc", "eth", "bnb", "sol"].map((sym) => (
                <button
                  key={sym}
                  onClick={() => handleFilterChange(sym)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    filter === sym
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {sym.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mb-4 pb-3 border-b border-gray-700">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{news.length} articles loaded</span>
            <span>Auto-refresh: ON (5min)</span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">⚠️ {error}</p>
          </div>
        )}

        {/* News List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {loading && news.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-400 text-sm">Loading news...</p>
            </div>
          ) : news.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full gap-3">
              <div className="text-4xl">📭</div>
              <p className="text-gray-400 text-center">
                No news available for{" "}
                {filter === "all" ? "all symbols" : filter.toUpperCase()}
              </p>
            </div>
          ) : (
            <>
              {news.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  onClick={handleCardClick}
                />
              ))}

              {/* Load More Button */}
              {hasMore && !loading && (
                <button
                  onClick={loadMore}
                  className="w-full py-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  Load more...
                </button>
              )}

              {loading && news.length > 0 && (
                <div className="flex justify-center py-4">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer: Manual Refresh */}
        <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* News Detail Modal */}
      <NewsDetailModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default NewsPanel;
