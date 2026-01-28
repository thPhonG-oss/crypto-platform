// ============================================
// File: market-service/src/main/java/com/crypto/market_service/service/BinanceStreamService.java
// ============================================
package com.crypto.market_service.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.crypto.market_service.config.RedisConfig;
import com.crypto.market_service.repository.TradingSymbolRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class BinanceStreamService {

    @Autowired
    private TradingSymbolRepository symbolRepository;

    @Value("${app.binance.intervals}")
    private List<String> intervals; // 1m,5m,15m,1h,4h,1d

    private static final String BASE_URL = "wss://stream.binance.com:9443/stream?streams=";

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private WebSocketSession currentSession;

    @PostConstruct
    public void connectToBinance() {
        new Thread(this::establishConnection).start();
    }

    /**
     * Thiết lập kết nối WebSocket đến Binance
     * Đọc danh sách symbols ACTIVE từ database
     */
    private void establishConnection() {
        while (true) {
            try {
                // 1. Lấy danh sách symbols ACTIVE từ database
                List<String> activeSymbols = symbolRepository.findByActiveTrue()
                        .stream()
                        .map(s -> s.getSymbol().toLowerCase())
                        .collect(Collectors.toList());

                if (activeSymbols.isEmpty()) {
                    log.warn("⚠️ No active symbols found in database. Retrying in 10s...");
                    Thread.sleep(10000);
                    continue;
                }

                // 2. Tạo stream URL
                String streams = activeSymbols.stream()
                        .flatMap(symbol -> intervals.stream()
                                .map(interval -> symbol + "@kline_" + interval))
                        .collect(Collectors.joining("/"));

                String finalUrl = BASE_URL + streams;

                log.info("🔗 Connecting to Binance with {} active symbols: {}", 
                         activeSymbols.size(), activeSymbols);
                log.debug("Stream URL: {}", finalUrl);

                // 3. Kết nối WebSocket
                WebSocketClient client = new StandardWebSocketClient();
                currentSession = client.execute(new TextWebSocketHandler() {
                    @Override
                    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
                        handleBinanceMessage(message);
                    }

                    @Override
                    public void afterConnectionEstablished(WebSocketSession session) {
                        log.info("✅ Connected to Binance WebSocket");
                    }

                    @Override
                    public void handleTransportError(WebSocketSession session, Throwable exception) {
                        log.error("❌ WebSocket transport error", exception);
                    }
                }, finalUrl).get();

                log.info("WebSocket connection established successfully");
                
                // Keep connection alive
                while (currentSession != null && currentSession.isOpen()) {
                    Thread.sleep(1000);
                }

            } catch (Exception e) {
                log.error("❌ Connection failed, retrying in 5s...", e);
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }
        }
    }

    /**
     * Xử lý tin nhắn từ Binance WebSocket
     */
    private void handleBinanceMessage(TextMessage message) {
        try {
            String payload = message.getPayload();
            JsonNode node = objectMapper.readTree(payload);
            
            if (!node.has("stream")) {
                return;
            }

            String streamName = node.get("stream").asText();
            String symbol = streamName.split("@")[0];

            // Publish to Redis
            String redisChannel = RedisConfig.MARKET_TOPIC_PREFIX + symbol;
            redisTemplate.convertAndSend(redisChannel, payload);

        } catch (Exception e) {
            log.error("Error processing Binance message", e);
        }
    }

    /**
     * Reconnect khi có thay đổi symbols
     * Gọi method này khi admin bật/tắt symbol
     */
    public void reconnect() {
        log.info("🔄 Reconnecting to Binance with updated symbols...");
        
        if (currentSession != null && currentSession.isOpen()) {
            try {
                currentSession.close();
            } catch (Exception e) {
                log.warn("Error closing current session", e);
            }
        }
        
        // Connection sẽ tự động reconnect trong vòng lặp
    }
}