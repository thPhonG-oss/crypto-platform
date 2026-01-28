/**
 * Multi-Chart Grid Component
 * Displays multiple crypto charts simultaneously in a grid layout
 * All charts share a single WebSocket connection for efficiency
 */

import React from "react";
import EnhancedCryptoChart from "./EnhancedCryptoChart";
import { Grid2X2, Maximize2, TrendingUp } from "lucide-react";

const MultiChartGrid = ({
  symbols = [], // ✨ NEW: Nhận symbols từ props thay vì hardcode
  timeframe = "1m",
  onSymbolClick,
  gridColumns = 2, // 1, 2, or 4
}) => {
  const getGridClass = () => {
    switch (gridColumns) {
      case 1:
        return "grid-cols-1";
      case 4:
        return "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";
      default:
        return "grid-cols-1 lg:grid-cols-2";
    }
  };

  // Get color gradient for each symbol
  const getColorGradient = (index) => {
    const gradients = [
      "from-orange-500 to-yellow-600",
      "from-blue-500 to-purple-600",
      "from-yellow-500 to-orange-600",
      "from-purple-500 to-pink-600",
      "from-green-500 to-emerald-600",
      "from-red-500 to-pink-600",
      "from-indigo-500 to-blue-600",
      "from-teal-500 to-cyan-600",
    ];
    return gradients[index % gradients.length];
  };

  // Show loading if no symbols
  if (!symbols || symbols.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-bg-card rounded-xl">
        <div className="text-center">
          <p className="text-gray-400">No active symbols available</p>
          <p className="text-xs text-gray-600 mt-2">
            Please add symbols in admin panel
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-primary/10 border border-accent-primary/20">
            <Grid2X2 className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Multi-Chart View</h3>
            <p className="text-xs text-gray-500">
              Real-time • Shared Connection • {symbols.length} Active Charts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-bg-tertiary border border-border-primary">
            <TrendingUp className="w-3 h-3 text-accent-primary" />
            <span>Timeframe: {timeframe.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className={`grid ${getGridClass()} gap-4`}>
        {symbols.map((symbolData, index) => (
          <div
            key={symbolData.symbol}
            className="card rounded-xl overflow-hidden group hover:border-border-secondary transition-all duration-200 relative"
          >
            {/* Chart Header */}
            <div
              className={`p-3 bg-gradient-to-r ${getColorGradient(index)} bg-opacity-10 border-b border-border-primary flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getColorGradient(index)} flex items-center justify-center text-white text-xl font-bold shadow-lg`}
                >
                  {symbolData.icon || "●"}
                </div>

                {/* Name */}
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {symbolData.name}
                  </h4>
                  <p className="text-xs text-gray-400">{symbolData.symbol}</p>
                </div>
              </div>

              {/* Maximize Button */}
              <button
                onClick={() => onSymbolClick?.(symbolData.symbol)}
                className="p-2 rounded-lg hover:bg-bg-card transition-colors opacity-0 group-hover:opacity-100"
                title="Focus this chart"
              >
                <Maximize2 className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Chart */}
            <div className="p-2 bg-bg-card">
              <EnhancedCryptoChart
                symbol={symbolData.symbol}
                timeframe={timeframe}
                compact={true}
                height={280}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-3 px-4 rounded-lg bg-bg-tertiary border border-border-primary text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
          <span>Shared WebSocket Connection</span>
        </div>
        <span className="text-gray-700">•</span>
        <span>Single connection for all {symbols.length} charts</span>
        <span className="text-gray-700">•</span>
        <span>Optimized for scalability</span>
      </div>
    </div>
  );
};

export default MultiChartGrid;
