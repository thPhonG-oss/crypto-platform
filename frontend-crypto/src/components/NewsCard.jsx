/**
 * NewsCard - Display individual news article
 */

import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Sparkles,
  FileText,
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

  // Sentiment helpers
  const getSentimentColor = (score) => {
    if (!score && score !== 0) return "bg-gray-600";
    if (score > 0.3) return "bg-green-600";
    if (score < -0.3) return "bg-red-600";
    return "bg-yellow-600";
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
        className="bg-gray-900 rounded-lg p-3 hover:bg-gray-850 transition-all cursor-pointer border border-gray-700 hover:border-blue-500 group"
      >
        {/* Title */}
        <h4 className="text-white font-medium text-sm line-clamp-2 mb-2 group-hover:text-blue-400">
          {article.title}
        </h4>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">{article.source}</span>
          {article.sentiment_score !== null && (
            <span
              className={`px-2 py-0.5 rounded text-white ${getSentimentColor(article.sentiment_score)}`}
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
      className="bg-gray-900 rounded-lg p-4 hover:bg-gray-850 transition-all cursor-pointer border border-gray-700 hover:border-blue-500 hover:shadow-lg group"
    >
      {/* Header: Source & Time */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">
            {article.source}
          </span>
          {article.parse_method === "gemini" && (
            <span
              className="flex items-center gap-1 text-xs text-purple-400"
              title="Parsed by AI"
            >
              <Sparkles className="w-3 h-3" />
              AI
            </span>
          )}
          {article.parse_method === "rule" && (
            <span
              className="flex items-center gap-1 text-xs text-gray-500"
              title="Parsed by rules"
            >
              <FileText className="w-3 h-3" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{getTimeAgo(article.published_at)}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-white font-semibold text-base mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
        {article.title}
      </h3>

      {/* Summary */}
      {article.summary && (
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {article.summary}
        </p>
      )}

      {/* Tags: Symbols */}
      {symbols.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {symbols.slice(0, 4).map((symbol) => (
            <span
              key={symbol}
              className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-xs font-medium border border-blue-800"
            >
              #{symbol}
            </span>
          ))}
          {symbols.length > 4 && (
            <span className="text-gray-500 text-xs self-center">
              +{symbols.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Footer: Sentiment & Link */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-800">
        {/* Sentiment Badge */}
        {article.sentiment_score !== null ? (
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-white text-xs font-medium ${getSentimentColor(article.sentiment_score)}`}
            >
              {getSentimentIcon(article.sentiment_score)}
              {getSentimentLabel(article.sentiment_score)}
              {article.sentiment_score !== null && (
                <span className="text-xs opacity-75">
                  ({article.sentiment_score > 0 ? "+" : ""}
                  {article.sentiment_score.toFixed(2)})
                </span>
              )}
            </span>
          </div>
        ) : (
          <div className="text-xs text-gray-600">No sentiment data</div>
        )}

        {/* External Link */}
        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Read more
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};

export default NewsCard;
