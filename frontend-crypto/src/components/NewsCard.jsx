import React from "react";
import PropTypes from "prop-types";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Sparkles,
} from "lucide-react";

const NewsCard = ({ article, onClick, compact = false }) => {
  if (!article) return null;

  // Format date
  const getTimeAgo = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  const getSentimentLabel = (score) => {
    if (!score && score !== 0) return "Neutral";
    if (score > 0.3) return "Positive";
    if (score < -0.3) return "Negative";
    return "Neutral";
  };

  const getSentimentIcon = (score) => {
    if (!score && score !== 0) return <Minus className="w-3 h-3" />;
    if (score > 0.3) return <TrendingUp className="w-3 h-3" />;
    if (score < -0.3) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  // Parse related symbols
  const symbols = article.related_symbols
    ? article.related_symbols
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // Compact mode (for grid view)
  if (compact) {
    return (
      <div
        onClick={() => onClick?.(article)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClick?.(article);
          }
        }}
        role="button"
        tabIndex={0}
        className="glass-panel p-3 cursor-pointer group hover:bg-white/5 transition-all duration-300 border-b border-white/5 last:border-0 relative overflow-hidden"
      >
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-neon-blue opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Title */}
        <h4 className="text-gray-200 font-medium text-sm line-clamp-2 mb-2 group-hover:text-neon-blue group-hover:text-glow transition-colors">
          {article.title}
        </h4>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500 font-mono">{article.source}</span>
          {article.sentiment_score !== null && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                article.sentiment_score > 0.3
                  ? "text-emerald-400 bg-emerald-400/10 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                  : article.sentiment_score < -0.3
                    ? "text-rose-400 bg-rose-400/10 shadow-[0_0_8px_rgba(251,113,133,0.3)]"
                    : "text-amber-400 bg-amber-400/10"
              }`}
            >
              {getSentimentLabel(article.sentiment_score)}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full card mode
  return (
    <div
      onClick={() => onClick?.(article)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.(article);
        }
      }}
      role="button"
      tabIndex={0}
      className="bg-bg-tertiary p-4 cursor-pointer group hover:bg-bg-card border border-border-primary hover:border-border-secondary transition-all duration-200 rounded-lg"
    >
      {/* Header: Source & Time */}
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-accent-primary uppercase tracking-wide">
            {article.source}
          </span>
          {article.parse_method === "gemini" && (
            <span
              className="flex items-center gap-1 text-xs text-accent-secondary font-medium bg-accent-secondary/10 px-2 py-0.5 rounded"
              title="Parsed by AI"
            >
              <Sparkles className="w-3 h-3" />
              AI
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{getTimeAgo(article.published_at)}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-gray-100 font-semibold text-base mb-2 leading-snug group-hover:text-white transition-all relative z-10">
        {article.title}
      </h3>

      {/* Summary */}
      {article.summary && (
        <p className="text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed relative z-10">
          {article.summary}
        </p>
      )}

      {/* Footer: Sentiment & Link */}
      <div className="flex justify-between items-center pt-3 border-t border-border-primary relative z-10">
        {/* Sentiment Badge */}
        {article.sentiment_score !== null ? (
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold ${
                article.sentiment_score > 0.3
                  ? "text-accent-primary bg-accent-primary/10"
                  : article.sentiment_score < -0.3
                    ? "text-accent-danger bg-accent-danger/10"
                    : "text-accent-warning bg-accent-warning/10"
              }`}
            >
              {getSentimentIcon(article.sentiment_score)}
              {getSentimentLabel(article.sentiment_score)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-500 font-medium">Neutral</span>
        )}

        {/* External Link */}
        {article.url && (
          <button
            className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-accent-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              window.open(article.url, "_blank");
            }}
          >
            Read source
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

NewsCard.propTypes = {
  article: PropTypes.shape({
    title: PropTypes.string,
    source: PropTypes.string,
    published_at: PropTypes.string,
    summary: PropTypes.string,
    url: PropTypes.string,
    related_symbols: PropTypes.string,
    sentiment_score: PropTypes.number,
    parse_method: PropTypes.string,
  }),
  onClick: PropTypes.func,
  compact: PropTypes.bool,
};

export default NewsCard;
