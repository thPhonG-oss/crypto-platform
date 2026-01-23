import React, { useState } from "react";
import CryptoChart from "./CryptoChart";
import NewsPanel from "./NewsPanel";

const AVAILABLE_SYMBOLS = [
  { symbol: "BTCUSDT", name: "Bitcoin" },
  { symbol: "ETHUSDT", name: "Ethereum" },
  { symbol: "BNBUSDT", name: "BNB" },
  { symbol: "SOLUSDT", name: "Solana" },
];

const TIMEFRAMES = [
  { value: "1m", label: "1 Minute" },
  { value: "5m", label: "5 Minutes" },
  { value: "15m", label: "15 Minutes" },
  { value: "1h", label: "1 Hour" },
  { value: "4h", label: "4 Hours" },
  { value: "1d", label: "1 Day" },
];

const EnhancedMarketDashboard = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1m");
  const [layoutMode, setLayoutMode] = useState("split"); // split, chart-only, news-only

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-3xl font-bold text-white">
          🚀 Crypto Analysis Platform
        </h1>

        <div className="flex gap-4 items-center">
          {/* Timeframe Selector */}
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500"
          >
            {TIMEFRAMES.map((tf) => (
              <option key={tf.value} value={tf.value}>
                {tf.label}
              </option>
            ))}
          </select>

          {/* Layout Mode Toggle */}
          <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setLayoutMode("split")}
              className={`px-3 py-2 rounded transition-colors ${
                layoutMode === "split"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Split View"
            >
              📊📰
            </button>
            <button
              onClick={() => setLayoutMode("chart-only")}
              className={`px-3 py-2 rounded transition-colors ${
                layoutMode === "chart-only"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Chart Only"
            >
              📊
            </button>
            <button
              onClick={() => setLayoutMode("news-only")}
              className={`px-3 py-2 rounded transition-colors ${
                layoutMode === "news-only"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title="News Only"
            >
              📰
            </button>
          </div>
        </div>
      </div>

      {/* Symbol Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {AVAILABLE_SYMBOLS.map((item) => (
          <button
            key={item.symbol}
            onClick={() => setSelectedSymbol(item.symbol)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              selectedSymbol === item.symbol
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: layoutMode === "split" ? "2fr 1fr" : "1fr",
        }}
      >
        {/* Chart Panel */}
        {(layoutMode === "split" || layoutMode === "chart-only") && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <CryptoChart
              symbol={selectedSymbol}
              timeframe={selectedTimeframe}
            />
          </div>
        )}

        {/* News Panel */}
        {(layoutMode === "split" || layoutMode === "news-only") && (
          <div className="h-[600px]">
            <NewsPanel selectedSymbol={selectedSymbol} />
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Pairs"
          value={AVAILABLE_SYMBOLS.length}
          icon="💱"
        />
        <StatCard title="Timeframes" value={TIMEFRAMES.length} icon="⏱️" />
        <StatCard title="Data Sources" value="6+" icon="📡" />
        <StatCard title="AI Parser" value="Active" icon="🤖" color="green" />
      </div>
    </div>
  );
};

// Stats Card Component
const StatCard = ({ title, value, icon, color = "blue" }) => (
  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-white text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`text-4xl opacity-50`}>{icon}</div>
    </div>
  </div>
);

export default EnhancedMarketDashboard;
