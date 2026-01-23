import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import {
  X,
  ExternalLink,
  Calendar,
  Sparkles,
  Brain,
  Clock,
  Share2,
} from "lucide-react";
import { format } from "date-fns";

const NewsDetailModal = ({ article, isOpen, onClose }) => {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !article) return null;

  // Format content
  const formatContent = (content) => {
    if (!content) return "";
    return content.split("\n\n").map((paragraph, idx) => (
      <p
        key={idx}
        className="mb-6 text-gray-300 leading-relaxed text-lg font-light tracking-wide first:first-letter:text-5xl first:first-letter:font-bold first:first-letter:text-neon-blue first:first-letter:mr-3 first:first-letter:float-left"
      >
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Dark Backdrop with Blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container - Premium Glass */}
      <div className="relative bg-gray-900/80 backdrop-blur-2xl w-full max-w-4xl max-h-[90vh] shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] border border-white/10 rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 group ring-1 ring-white/5">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-1/2 h-px bg-linear-to-r from-transparent via-neon-blue/50 to-transparent blur-sm" />
        <div className="absolute top-0 right-0 w-75 h-75 bg-neon-purple/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="sticky top-0 bg-gray-900/50 backdrop-blur-md border-b border-white/5 p-6 md:p-8 flex justify-between items-start z-10 shrink-0">
          <div className="flex-1 pr-6">
            {/* Meta Tags */}
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-neon-blue/10 text-neon-blue border border-neon-blue/20 text-xs font-bold uppercase tracking-widest shadow-[0_0_10px_-5px_var(--color-neon-blue)]">
                {article.source}
              </span>
              {article.parse_method === "gemini" && (
                <span className="px-3 py-1 rounded-full bg-neon-purple/10 text-neon-purple border border-neon-purple/20 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_-5px_var(--color-neon-purple)]">
                  <Brain className="w-3 h-3" />
                  AI Analyzed
                </span>
              )}
              {article.published_at && (
                <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-medium flex items-center gap-1.5 border border-white/5">
                  <Clock className="w-3 h-3" />
                  {format(new Date(article.published_at), "MMM dd, HH:mm")}
                </span>
              )}
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight text-glow tracking-tight">
              {article.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="group p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-gray-400 hover:text-white transition-all duration-200 hover:rotate-90 hover:shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative z-0">
          {/* AI Summary Block */}
          {article.summary && (
            <div className="relative overflow-hidden bg-linear-to-br from-gray-800/50 to-gray-900/50 border border-neon-purple/20 rounded-2xl p-8 mb-10 shadow-lg group/summary">
              <div className="absolute top-0 right-0 px-4 py-2 bg-neon-purple/20 rounded-bl-2xl text-[10px] uppercase font-bold text-neon-purple tracking-wider border-l border-b border-neon-purple/20">
                AI Generated
              </div>

              <h3 className="text-neon-purple font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Sparkles className="w-4 h-4 animate-pulse relative z-10" />
                <span className="relative z-10">Executive Summary</span>
                <div className="absolute left-6 top-6 w-8 h-8 bg-neon-purple/30 blur-[20px] rounded-full" />
              </h3>
              <p className="text-gray-200 text-lg leading-relaxed font-medium relative z-10">
                {article.summary}
              </p>
            </div>
          )}

          {/* Sentiment & Symbols Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Sentiment Meter */}
            {article.sentiment_score !== null && (
              <div className="bg-gray-800/30 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    Market Sentiment
                  </h4>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg ${
                      article.sentiment_score > 0.3
                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                        : article.sentiment_score < -0.3
                          ? "bg-rose-500 text-white shadow-rose-500/20"
                          : "bg-amber-500 text-white shadow-amber-500/20"
                    }`}
                  >
                    {article.sentiment_score > 0.3
                      ? "Bullish"
                      : article.sentiment_score < -0.3
                        ? "Bearish"
                        : "Neutral"}
                  </span>
                </div>

                <div className="relative h-4 bg-gray-900 rounded-full overflow-hidden shadow-inner border border-white/5">
                  <div
                    className={`absolute top-0 bottom-0 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
                      article.sentiment_score > 0
                        ? "bg-linear-to-r from-emerald-600 to-emerald-400"
                        : "bg-linear-to-r from-rose-600 to-rose-400"
                    }`}
                    style={{
                      left: "50%",
                      width: `${Math.abs(article.sentiment_score) * 50}%`,
                      transform:
                        article.sentiment_score < 0
                          ? "translateX(-100%)"
                          : "none",
                    }}
                  />
                  {/* Center marker */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/30 z-10" />

                  {/* Grid lines */}
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 w-px bg-white/5"
                      style={{ left: `${i * 20}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-mono tracking-wider">
                  <span>BEARISH</span>
                  <span>NEUTRAL</span>
                  <span>BULLISH</span>
                </div>
              </div>
            )}

            {/* Related Assets */}
            {symbols.length > 0 && (
              <div className="bg-gray-800/30 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors flex flex-col justify-center">
                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
                  Impacted Assets
                </h4>
                <div className="flex flex-wrap gap-2">
                  {symbols.map((symbol) => (
                    <button
                      key={symbol}
                      className="px-4 py-2 rounded-lg bg-gray-900 text-gray-300 text-sm font-bold border border-gray-700 hover:border-neon-blue hover:text-neon-blue hover:shadow-[0_0_15px_-5px_var(--color-neon-blue)] transition-all"
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Full Content */}
          <div className="border-t border-white/5 pt-8">
            <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-neon-blue rounded-full" />
              Full Article
            </h3>
            <div className="prose prose-invert prose-lg max-w-none text-gray-300">
              {formatContent(article.content)}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 md:p-8 border-t border-white/5 bg-gray-900/80 backdrop-blur-xl flex justify-between items-center shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 font-mono">
            <span>ID: {String(article.id).substring(0, 8) || "UNKNOWN"}</span>
            <span className="text-gray-700">|</span>
            <span>CRAWLER_V2</span>
          </div>

          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button className="px-6 py-3 rounded-xl bg-gray-800 text-white font-bold text-sm border border-gray-700 hover:bg-gray-700 hover:border-gray-600 transition-all flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-neon-blue/10 text-neon-blue font-bold text-sm border border-neon-blue/30 hover:bg-neon-blue/20 hover:shadow-[0_0_20px_-5px_var(--color-neon-blue)] transition-all flex items-center gap-2"
              >
                Read Original
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

NewsDetailModal.propTypes = {
  article: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    source: PropTypes.string,
    published_at: PropTypes.string,
    summary: PropTypes.string,
    content: PropTypes.string,
    url: PropTypes.string,
    related_symbols: PropTypes.string,
    sentiment_score: PropTypes.number,
    parse_method: PropTypes.string,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default NewsDetailModal;
