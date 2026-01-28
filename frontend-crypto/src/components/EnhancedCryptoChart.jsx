/**
 * Enhanced Crypto Chart Component
 * Consumes shared WebSocket context for efficient real-time updates
 * Supports both single and multi-chart display
 */

import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import axios from "axios";
import { CONFIG } from "../config";
import { useWebSocket } from "../context/WebSocketContext";

const EnhancedCryptoChart = ({
  symbol = "BTCUSDT",
  timeframe = "1m",
  compact = false,
  height = 500,
}) => {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const seriesRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use shared WebSocket context
  const { isConnected, subscribe } = useWebSocket();

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    console.log(`[Chart ${symbol}] Initializing...`);

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9CA3AF",
      },
      grid: {
        vertLines: { color: "#374151" },
        horzLines: { color: "#374151" },
      },
      width: chartContainerRef.current.clientWidth,
      height: compact ? 300 : height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#4B5563",
      },
      rightPriceScale: {
        borderColor: "#4B5563",
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: "#6366F1",
          style: 0,
          labelBackgroundColor: "#6366F1",
        },
        horzLine: {
          width: 1,
          color: "#6366F1",
          style: 0,
          labelBackgroundColor: "#6366F1",
        },
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10B981",
      downColor: "#EF4444",
      borderVisible: false,
      wickUpColor: "#10B981",
      wickDownColor: "#EF4444",
      priceLineVisible: true,
    });

    chartInstanceRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Fetch historical data
    fetchHistory();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: compact ? 300 : height,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chart) {
        console.log(`[Chart ${symbol}] Destroying...`);
        chart.remove();
      }
    };
  }, [symbol, compact, height]);

  // Fetch historical data
  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${CONFIG.API.MARKET_SERVICE}/api/v1/market/klines`,
        {
          params: {
            symbol: symbol.toUpperCase(),
            interval: timeframe,
            limit: 500,
          },
        },
      );

      const data = response.data.map((item) => ({
        time: new Date(item.openTime).getTime() / 1000,
        open: parseFloat(item.openPrice),
        high: parseFloat(item.highPrice),
        low: parseFloat(item.lowPrice),
        close: parseFloat(item.closePrice),
      }));

      if (seriesRef.current) {
        seriesRef.current.setData(data);
        console.log(
          `[Chart ${symbol}] Loaded ${data.length} historical candles`,
        );
      }

      setIsLoading(false);
    } catch (err) {
      console.error(`[Chart ${symbol}] Error fetching history:`, err);
      setError("Failed to load chart data");
      setIsLoading(false);
    }
  };

  // Subscribe to real-time updates from shared WebSocket
  useEffect(() => {
    if (!seriesRef.current || !isConnected) return;

    console.log(`[Chart ${symbol}] Subscribing to real-time updates`);

    const unsubscribe = subscribe(symbol, (candle) => {
      if (seriesRef.current) {
        seriesRef.current.update(candle);
      }
    });

    return () => {
      console.log(`[Chart ${symbol}] Unsubscribing from real-time updates`);
      unsubscribe();
    };
  }, [symbol, isConnected, subscribe]);

  // Refetch when timeframe changes
  useEffect(() => {
    if (seriesRef.current) {
      fetchHistory();
    }
  }, [timeframe]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-tertiary rounded-lg p-6">
        <div className="text-center">
          <p className="text-red-400 mb-3">❌ {error}</p>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-accent-primary hover:bg-accent-primary/90 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-tertiary/80 backdrop-blur-sm z-10 rounded-lg">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading {symbol}...</p>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        className="w-full"
        style={{ height: compact ? "300px" : `${height}px` }}
      />

      {/* Connection Status (only in non-compact mode) */}
      {!compact && (
        <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-accent-primary animate-pulse" : "bg-gray-500"
            }`}
          />
          <span className="text-xs text-white font-medium">
            {isConnected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      )}
    </div>
  );
};

export default EnhancedCryptoChart;
