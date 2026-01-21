package com.crypto.market_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class RedisSubscriber {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Hàm này được RedisConfig gọi khi có tin mới
    public void handleMessage(String message) {
        log.info("Received from Redis: {}", message);

        // Đẩy xuống Frontend đang subscribe kênh '/topic/market'
        messagingTemplate.convertAndSend("/topic/market", message);
    }
}