import React, { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import axios from "axios";
import SockJS from "socketjs-client";
import { Client } from "@stomp/stompjs";
import { CONFIG } from "../config";

const CryptoChart = ({ symbol = "BTCUSDT" }) => {
  const chartContainerRef = useRef();
  const chartInstanceRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    // 1. Initialize TradingView Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#111827" }, // Gray-900
        textColor: "#9CA3AF", // Gray-400
      },
      grid: {
        vertLines: { color: "#374151" }, // Gray-700
        horzLines: { color: "#374151" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10B981", // Emerald-500
      downColor: "#EF4444", // Red-500
      borderVisible: false,
      wickUpColor: "#10B981",
      wickDownColor: "#EF4444",
    });

    chartInstanceRef.current = chart;
    seriesRef.current = candlestickSeries;

    // 2. Fetch Historical Data
    const fetchHistory = async () => {
      try {
        const response = await axios.get(
          `${CONFIG.API.MARKET_SERVICE}/api/v1/market/klines`,
          {
            params: { symbol: symbol.toUpperCase(), limit: 1000 },
          },
        );

        const data = response.data.map((item) => ({
          time: new Date(item.openTime).getTime() / 1000,
          open: item.openPrice,
          high: item.highPrice,
          low: item.lowPrice,
          close: item.closePrice,
        }));

        candlestickSeries.setData(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };

    fetchHistory();

    // 3. WebSocket Connection
    const client = new Client({
      brokerURL: `${CONFIG.WS.MARKET}`,
      webSocketFactory: () => new SockJS(`${CONFIG.WS.SOCKJS}`),
      debug: () => {},
      onConnect: () => {
        console.log(`Connected to WebSocket for ${symbol}`);
        client.subscribe(`/topic/market/${symbol.toLowerCase()}`, (message) => {
          const kline = JSON.parse(message.body);
          const candle = {
            time: new Date(kline.openTime).getTime() / 1000,
            open: kline.openPrice,
            high: kline.highPrice,
            low: kline.lowPrice,
            close: kline.closePrice,
          };
          candlestickSeries.update(candle);
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
      },
    });

    client.activate();

    // Resize Observer
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      if (client) client.deactivate();
    };
  }, [symbol]);

  return (
    <div className="p-4 bg-gray-900 rounded-lg shadow-xl border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-blue-500">📊</span>
          {symbol.toUpperCase()} Chart
        </h2>
        <span className="text-xs text-green-400 animate-pulse bg-green-900/30 px-2 py-1 rounded-full border border-green-800">
          ● Live
        </span>
      </div>
      <div ref={chartContainerRef} className="w-full h-[500px]" />
    </div>
  );
};

export default CryptoChart;
