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
      <div className="bg-transparent rounded-lg p-0 h-full overflow-hidden flex flex-col relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pl-1 pr-1 gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight text-glow">
            <Zap className="w-5 h-5 text-neon-blue" />
            LIVE FEED
            {loading && (
              <RefreshCw className="w-3 h-3 animate-spin text-neon-blue" />
            )}
          </h2>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neon-purple/70" />
            <div className="flex gap-1 p-1 rounded-xl bg-gray-900/50 backdrop-blur-md border border-white/5">
              {["all", "btc", "eth", "sol"].map((sym) => (
                <button
                  key={sym}
                  onClick={() => handleFilterChange(sym)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    filter === sym
                      ? "bg-neon-blue/20 text-neon-blue shadow-[0_0_10px_-5px_var(--color-neon-blue)] border border-neon-blue/30"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {sym === "all" ? "All" : sym}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-4 mx-1 backdrop-blur-sm">
            <p className="text-rose-400 text-xs font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              CONNECTION ERROR: {error}
            </p>
          </div>
        )}

        {/* News List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {loading && news.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-neon-blue/20 border-t-neon-blue animate-spin" />
                <div
                  className="absolute inset-0 w-12 h-12 rounded-full border-2 border-neon-purple/20 border-b-neon-purple animate-spin"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "1s",
                  }}
                />
              </div>
              <p className="text-neon-blue/50 text-xs font-bold tracking-widest animate-pulse">
                SEARCHING SATELLITE DATA...
              </p>
            </div>
          ) : news.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full gap-4 opacity-50">
              <div className="text-4xl">📡</div>
              <p className="text-gray-500 text-sm font-medium">
                No signal detected
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
                  className="w-full py-4 mt-2 text-gray-500 hover:text-neon-blue hover:border-neon-blue/30 hover:bg-neon-blue/5 text-xs font-bold uppercase tracking-[0.2em] transition-all border border-dashed border-gray-800 rounded-xl group relative overflow-hidden"
                >
                  <span className="relative z-10">Load more signals</span>
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                </button>
              )}

              {loading && news.length > 0 && (
                <div className="flex justify-center py-4">
                  <RefreshCw className="w-5 h-5 animate-spin text-neon-blue opacity-50" />
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
