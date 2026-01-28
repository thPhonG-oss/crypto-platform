/**
 * WebSocket Context Provider
 * Manages a single shared WebSocket connection for all charts
 * Distributes real-time data to multiple components efficiently
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import SockJS from "socketjs-client";
import { Client } from "@stomp/stompjs";
import { CONFIG } from "../config";

const WebSocketContext = createContext(null);

const AVAILABLE_SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"];

export function WebSocketProvider({ children }) {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestData, setLatestData] = useState({}); // { BTCUSDT: {...}, ETHUSDT: {...} }
  const subscriptionsRef = useRef(new Set());
  const listenersRef = useRef({}); // { BTCUSDT: [callback1, callback2, ...] }

  // Initialize WebSocket connection
  useEffect(() => {
    console.log("[WebSocket] Initializing shared connection...");

    const wsClient = new Client({
      brokerURL: CONFIG.WS.MARKET,
      webSocketFactory: () => new SockJS(CONFIG.WS.SOCKJS),
      debug: (str) => {
        // Suppress debug logs in production
        if (process.env.NODE_ENV === "development") {
          console.log("[STOMP Debug]", str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log("[WebSocket] ✅ Connected to broker");
        setIsConnected(true);

        // Subscribe to all symbols immediately
        AVAILABLE_SYMBOLS.forEach((symbol) => {
          subscribeToSymbol(symbol, wsClient);
        });
      },

      onDisconnect: () => {
        console.log("[WebSocket] ❌ Disconnected");
        setIsConnected(false);
      },

      onStompError: (frame) => {
        console.error("[WebSocket] Broker error:", frame.headers["message"]);
        setIsConnected(false);
      },
    });

    wsClient.activate();
    setClient(wsClient);

    return () => {
      console.log("[WebSocket] Cleaning up connection...");
      wsClient.deactivate();
    };
  }, []);

  // Subscribe to a specific symbol
  const subscribeToSymbol = useCallback((symbol, wsClient) => {
    const topic = `/topic/market/${symbol.toLowerCase()}`;

    if (subscriptionsRef.current.has(symbol)) {
      console.log(`[WebSocket] Already subscribed to ${symbol}`);
      return;
    }

    console.log(`[WebSocket] 📡 Subscribing to ${symbol}`);

    wsClient.subscribe(topic, (message) => {
      try {
        const kline = JSON.parse(message.body);

        // Update latest data
        setLatestData((prev) => ({
          ...prev,
          [symbol]: {
            time: new Date(kline.openTime).getTime() / 1000,
            open: kline.openPrice,
            high: kline.highPrice,
            low: kline.lowPrice,
            close: kline.closePrice,
            volume: kline.volume,
            timestamp: Date.now(),
          },
        }));

        // Notify all listeners for this symbol
        const listeners = listenersRef.current[symbol] || [];
        listeners.forEach((callback) => {
          callback({
            time: new Date(kline.openTime).getTime() / 1000,
            open: kline.openPrice,
            high: kline.highPrice,
            low: kline.lowPrice,
            close: kline.closePrice,
          });
        });
      } catch (error) {
        console.error(
          `[WebSocket] Error parsing message for ${symbol}:`,
          error,
        );
      }
    });

    subscriptionsRef.current.add(symbol);
  }, []);

  // Register a listener for a specific symbol
  const subscribe = useCallback((symbol, callback) => {
    if (!listenersRef.current[symbol]) {
      listenersRef.current[symbol] = [];
    }

    listenersRef.current[symbol].push(callback);
    console.log(
      `[WebSocket] Listener added for ${symbol} (total: ${listenersRef.current[symbol].length})`,
    );

    // Return unsubscribe function
    return () => {
      listenersRef.current[symbol] = listenersRef.current[symbol].filter(
        (cb) => cb !== callback,
      );
      console.log(
        `[WebSocket] Listener removed for ${symbol} (remaining: ${listenersRef.current[symbol].length})`,
      );
    };
  }, []);

  const value = {
    client,
    isConnected,
    latestData,
    subscribe,
    subscribeToSymbol,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to use WebSocket context
 */
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
}

export default WebSocketContext;
