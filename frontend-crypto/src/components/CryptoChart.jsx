import React, { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import axios from "axios";
import SockJS from "socketjs-client";
import { Stomp } from "@stomp/stompjs";

const CryptoChart = ({ symbol = "BTCUSDT" }) => {
  const chartContainerRef = useRef();
  const chartInstanceRef = useRef(null); // Lưu instance biểu đồ để cleanup
  const seriesRef = useRef(null); // Lưu series nến để update real-time

  useEffect(() => {
    // 1. Khởi tạo biểu đồ TradingView
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#1E1E1E" }, // Màu nền tối
        textColor: "#DDD",
      },
      grid: {
        vertLines: { color: "#2B2B43" },
        horzLines: { color: "#2B2B43" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    // Tạo series nến (Candlestick)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a", // Màu nến tăng (Xanh)
      downColor: "#ef5350", // Màu nến giảm (Đỏ)
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    chartInstanceRef.current = chart;
    seriesRef.current = candlestickSeries;

    // 2. Gọi API lấy lịch sử nến (1000 cây nến quá khứ)
    const fetchHistory = async () => {
      try {
        // Gọi qua Gateway (Port 8080) -> vào Market Service
        const response = await axios.get(
          `http://localhost:8080/market-service/api/v1/market/klines`,
          {
            params: { symbol: symbol.toUpperCase(), limit: 1000 },
          },
        );

        // Map dữ liệu từ Backend sang format của Lightweight Charts
        const data = response.data.map((item) => ({
          // Backend trả về thời gian dạng ISO string hoặc Timestamp, ta chuyển về Seconds
          time: new Date(item.openTime).getTime() / 1000,
          open: item.openPrice,
          high: item.highPrice,
          low: item.lowPrice,
          close: item.closePrice,
        }));

        // Set dữ liệu lịch sử vào biểu đồ
        candlestickSeries.setData(data);
      } catch (error) {
        console.error("Lỗi tải lịch sử:", error);
      }
    };

    fetchHistory();

    // 3. Kết nối WebSocket nhận giá Real-time
    const socket = new SockJS("http://localhost:8080/market-service/ws");
    const stompClient = Stomp.over(socket);

    // Tắt log debug của Stomp cho đỡ rối console
    stompClient.debug = () => {};

    stompClient.connect(
      {},
      () => {
        console.log(`Connected to WebSocket for ${symbol}`);

        // Subscribe vào topic của cặp tiền tương ứng
        stompClient.subscribe(
          `/topic/market/${symbol.toLowerCase()}`,
          (message) => {
            const kline = JSON.parse(message.body);

            // Update cây nến hiện tại
            const candle = {
              time: new Date(kline.openTime).getTime() / 1000,
              open: kline.openPrice,
              high: kline.highPrice,
              low: kline.lowPrice,
              close: kline.closePrice,
            };

            // Hàm update tự động nối thêm nến mới hoặc cập nhật nến đang chạy
            candlestickSeries.update(candle);
          },
        );
      },
      (error) => {
        console.error("Lỗi WebSocket:", error);
      },
    );

    // Cleanup khi component bị hủy (người dùng chuyển trang)
    return () => {
      chart.remove();
      if (stompClient && stompClient.connected) {
        stompClient.disconnect();
      }
    };
  }, [symbol]); // Chạy lại effect nếu đổi symbol (VD: BTC -> ETH)

  return (
    <div className="p-4 bg-gray-900 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">
        Biểu đồ {symbol.toUpperCase()} - Realtime
      </h2>
      <div ref={chartContainerRef} className="w-full h-[500px]" />
    </div>
  );
};

export default CryptoChart;
