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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class BinanceStreamService {

    // 1. Inject danh sách từ application.yaml
    @Value("${app.binance.symbols}")
    private List<String> symbols;

    @Value("${app.binance.intervals}")
private List<String> intervals; // 1m,5m,15m,1h,4h,1d

    private static final String BASE_URL = "wss://stream.binance.com:9443/stream?streams=";

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @PostConstruct
    public void connectToBinance() {
        new Thread(() -> {
            try {
                // 2. Sử dụng biến 'symbols' đã được inject thay vì hard-code
                if (symbols == null || symbols.isEmpty()) {
                    log.warn("⚠️ Danh sách coin trong config rỗng!");
                    return;
                }

                String streams = symbols.stream()
    .flatMap(symbol -> intervals.stream()
        .map(interval -> symbol.toLowerCase() + "@kline_" + interval))
    .collect(Collectors.joining("/"));

                String finalUrl = BASE_URL + streams;

                log.info("🔗 Đang kết nối Binance với {} cặp tiền: {}", symbols.size(), symbols);

                WebSocketClient client = new StandardWebSocketClient();
                client.execute(new TextWebSocketHandler() {
                    @Override
                    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
                        try {
                            String payload = message.getPayload();
                            JsonNode node = objectMapper.readTree(payload);
                            String streamName = node.get("stream").asText();
                            String symbol = streamName.split("@")[0];

                            String redisChannel = RedisConfig.MARKET_TOPIC_PREFIX + symbol;
                            redisTemplate.convertAndSend(redisChannel, payload);

                        } catch (Exception e) {
                            log.error("Lỗi xử lý tin nhắn: {}", e.getMessage());
                        }
                    }
                }, finalUrl);
            } catch (Exception e) {
                log.error("Mất kết nối, thử lại sau 5s...");
                try { Thread.sleep(5000); } catch (InterruptedException ig) {}
            }
        }).start();
    }
}