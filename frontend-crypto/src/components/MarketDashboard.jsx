import React, { useState } from "react";
import CryptoChart from "./CryptoChart";

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

const MarketDashboard = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1m");
  const [gridMode, setGridMode] = useState(false); // Single or Grid view

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-3xl font-bold text-white">
          Crypto Market Dashboard
        </h1>

        <div className="flex gap-4">
          {/* Timeframe Selector */}
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700"
          >
            {TIMEFRAMES.map((tf) => (
              <option key={tf.value} value={tf.value}>
                {tf.label}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <button
            onClick={() => setGridMode(!gridMode)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            {gridMode ? "Single View" : "Grid View"}
          </button>
        </div>
      </div>

      {/* Symbol Tabs (Single Mode) */}
      {!gridMode && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {AVAILABLE_SYMBOLS.map((item) => (
            <button
              key={item.symbol}
              onClick={() => setSelectedSymbol(item.symbol)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedSymbol === item.symbol
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      {/* Chart Display */}
      {gridMode ? (
        // Grid View - Show all symbols
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AVAILABLE_SYMBOLS.map((item) => (
            <div key={item.symbol} className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-3">
                {item.name} ({item.symbol})
              </h3>
              <CryptoChart symbol={item.symbol} timeframe={selectedTimeframe} />
            </div>
          ))}
        </div>
      ) : (
        // Single View - Show selected symbol
        <div className="bg-gray-800 rounded-lg p-6">
          <CryptoChart symbol={selectedSymbol} timeframe={selectedTimeframe} />
        </div>
      )}
    </div>
  );
};

export default MarketDashboard;
