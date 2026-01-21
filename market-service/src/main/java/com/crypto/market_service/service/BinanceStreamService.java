package com.crypto.market_service.service;

import com.crypto.market_service.config.RedisConfig;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Service
@Slf4j
public class BinanceStreamService {

    // URL lấy nến 1 phút của cặp BTCUSDT
    private static final String BINANCE_WS_URL = "wss://stream.binance.com:9443/ws/btcusdt@kline_1m";

    @Autowired
    private StringRedisTemplate redisTemplate;

    @PostConstruct
    public void connectToBinance() {
        // Chạy trong thread riêng để không chặn quá trình khởi động của App
        new Thread(() -> {
            try {
                WebSocketClient client = new StandardWebSocketClient();
                client.doHandshake(new TextWebSocketHandler() {
                    @Override
                    public void afterConnectionEstablished(WebSocketSession session) {
                        log.info("✅ Đã kết nối thành công tới Binance Stream!");
                    }

                    @Override
                    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
                        // 1. Nhận JSON từ Binance
                        String payload = message.getPayload();
                        
                        // 2. Bắn ngay vào Redis (Publisher)
                        // log.info("Nhận giá từ Binance: {}", payload); // Uncomment nếu muốn debug
                        redisTemplate.convertAndSend(RedisConfig.MARKET_TOPIC, payload);
                    }
                }, BINANCE_WS_URL);
            } catch (Exception e) {
                log.error("Lỗi kết nối Binance", e);
            }
        }).start();
    }
}