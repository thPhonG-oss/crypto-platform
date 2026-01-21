package com.crypto.market_service.service;

import com.crypto.market_service.entity.Kline;
import com.crypto.market_service.repository.KlineRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Slf4j
public class RedisSubscriber {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private KlineRepository klineRepository; // <--- Inject Repository

    public void handleMessage(String message) {
        try {
            JsonNode node = objectMapper.readTree(message);

            if (node.has("stream")) {
                String stream = node.get("stream").asText();
                String symbol = stream.split("@")[0].toUpperCase();

                // 1. Gửi WebSocket (Real-time)
                String wsTopic = "/topic/market/" + symbol.toLowerCase();
                messagingTemplate.convertAndSend(wsTopic, message);

                // 2. Lưu Database
                saveKline(node.get("data"), symbol);
            }
        } catch (Exception e) {
            log.error("Error handling message", e);
        }
    }

    private void saveKline(JsonNode data, String symbol) {
        try {
            JsonNode k = data.get("k");
            // k: { t: start, T: end, o: open, c: close, ... }

            long openTimeLong = k.get("t").asLong();
            LocalDateTime openTime = Kline.convertTime(openTimeLong);

            // Kiểm tra xem nến này đã tồn tại chưa để update
            Optional<Kline> existing = klineRepository.findBySymbolAndOpenTime(symbol, openTime);

            Kline kline = existing.orElse(new Kline());
            kline.setSymbol(symbol);
            kline.setOpenTime(openTime);
            kline.setCloseTime(Kline.convertTime(k.get("T").asLong()));
            kline.setOpenPrice(new BigDecimal(k.get("o").asText()));
            kline.setHighPrice(new BigDecimal(k.get("h").asText()));
            kline.setLowPrice(new BigDecimal(k.get("l").asText()));
            kline.setClosePrice(new BigDecimal(k.get("c").asText()));
            kline.setVolume(new BigDecimal(k.get("v").asText()));

            klineRepository.save(kline);

        } catch (Exception e) {
            log.error("Save DB Error: {}", e.getMessage());
        }
    }
}