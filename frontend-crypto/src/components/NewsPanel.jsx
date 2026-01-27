import React, { useState } from "react";
import PropTypes from "prop-types";
import { useNews } from "../hooks/useNews";
import NewsCard from "./NewsCard";
import NewsDetailModal from "./NewsDetailModal";
import { RefreshCw, Filter, Zap } from "lucide-react";

const NewsPanel = ({ selectedSymbol }) => {
  const [filter, setFilter] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use custom hook with auto-refresh every 5 minutes
  const { news, loading, error, hasMore, loadMore } = useNews({
    symbol: filter === "all" ? null : filter, // Fetch all news when filter is 'all', ignore selectedSymbol
    limit: 20,
    autoFetch: true,
    refreshInterval: 5 * 60 * 1000,
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
      <div className="bg-transparent rounded-lg p-4 h-full overflow-hidden flex flex-col relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            Latest News
            {loading && (
              <RefreshCw className="w-3 h-3 animate-spin text-accent-primary" />
            )}
          </h2>

          {/* Filter Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-tertiary">
            {["all", "btc", "eth", "sol"].map((sym) => (
              <button
                key={sym}
                onClick={() => handleFilterChange(sym)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase transition-all ${
                  filter === sym
                    ? "bg-accent-primary text-white"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                {sym === "all" ? "All" : sym}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-accent-danger/10 border border-accent-danger/20 rounded-lg p-3 mb-4">
            <p className="text-accent-danger text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-danger animate-pulse" />
              Error: {error}
            </p>
          </div>
        )}

        {/* News List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading && news.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-accent-primary/20 border-t-accent-primary animate-spin" />
              <p className="text-gray-500 text-xs">Loading news...</p>
            </div>
          ) : news.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full gap-3 opacity-50">
              <div className="text-3xl">📰</div>
              <p className="text-gray-500 text-sm">No news available</p>
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
                  className="w-full py-3 mt-2 text-gray-500 hover:text-accent-primary text-xs font-medium transition-all border border-dashed border-border-primary hover:border-accent-primary/30 rounded-lg"
                >
                  Load more
                </button>
              )}

              {loading && news.length > 0 && (
                <div className="flex justify-center py-3">
                  <RefreshCw className="w-4 h-4 animate-spin text-accent-primary opacity-50" />
                </div>
              )}
            </>
          )}
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

NewsPanel.propTypes = {
  selectedSymbol: PropTypes.string,
};

export default NewsPanel;
