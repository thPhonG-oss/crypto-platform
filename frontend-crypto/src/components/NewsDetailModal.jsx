/**
 * NewsDetailModal - Full article view in modal
 */

import React, { useEffect } from "react";
import { X, ExternalLink, Calendar, User, Sparkles } from "lucide-react";
import { format } from "date-fns";

const NewsDetailModal = ({ article, isOpen, onClose }) => {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !article) return null;

  // Format content with paragraphs
  const formatContent = (content) => {
    if (!content) return "";
    return content.split("\n\n").map((paragraph, idx) => (
      <p key={idx} className="mb-4 text-gray-300 leading-relaxed">
        {paragraph}
      </p>
    ));
  };

  const symbols = article.related_symbols
    ? article.related_symbols
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700 m-4">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex justify-between items-start z-10">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold text-white mb-2">
              {article.title}
            </h2>

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              {/* Source */}
              <span className="font-medium text-blue-400 uppercase tracking-wide">
                {article.source}
              </span>

              {/* Author */}
              {article.author && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {article.author}
                </span>
              )}

              {/* Date */}
              {article.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(article.published_at), "MMM dd, yyyy HH:mm")}
                </span>
              )}

              {/* Parse method */}
              {article.parse_method === "gemini" && (
                <span className="flex items-center gap-1 text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  AI Parsed
                </span>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {/* Summary (if available) */}
          {article.summary && (
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Summary
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {article.summary}
              </p>
            </div>
          )}

          {/* Related Symbols */}
          {symbols.length > 0 && (
            <div className="mb-6">
              <h4 className="text-gray-400 text-sm font-medium mb-2">
                Related Assets:
              </h4>
              <div className="flex flex-wrap gap-2">
                {symbols.map((symbol) => (
                  <span
                    key={symbol}
                    className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-sm font-medium border border-blue-800"
                  >
                    {symbol}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment Analysis (if available) */}
          {article.sentiment_score !== null && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h4 className="text-white font-semibold mb-3">
                Sentiment Analysis
              </h4>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Sentiment Score</span>
                    <span className="text-white font-mono">
                      {article.sentiment_score.toFixed(3)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        article.sentiment_score > 0.3
                          ? "bg-green-500"
                          : article.sentiment_score < -0.3
                            ? "bg-red-500"
                            : "bg-yellow-500"
                      }`}
                      style={{
                        width: `${((article.sentiment_score + 1) / 2) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Negative</span>
                    <span>Neutral</span>
                    <span>Positive</span>
                  </div>
                </div>
                <div className="text-center">
                  <span
                    className={`inline-block px-4 py-2 rounded-lg text-white font-semibold ${
                      article.sentiment_score > 0.3
                        ? "bg-green-600"
                        : article.sentiment_score < -0.3
                          ? "bg-red-600"
                          : "bg-yellow-600"
                    }`}
                  >
                    {article.sentiment_label || "Neutral"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="prose prose-invert max-w-none">
            <h3 className="text-white font-semibold mb-4 text-lg">
              Full Article
            </h3>
            {formatContent(article.content)}
          </div>

          {/* Original Link */}
          {article.url && (
            <div className="mt-8 pt-6 border-t border-gray-800">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Read original article
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailModal;
