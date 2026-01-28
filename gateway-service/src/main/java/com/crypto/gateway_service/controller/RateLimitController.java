package com.crypto.gateway_service.controller;

import java.util.Map;

import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

/**
 * Controller for rate limit information.
 * Provides endpoint to check current rate limit status.
 */
@RestController
@RequestMapping("/api/v1/gateway")
@RequiredArgsConstructor
public class RateLimitController {

    private final ReactiveStringRedisTemplate redisTemplate;

    /**
     * Get rate limit status for the current IP.
     * Useful for clients to check their remaining quota.
     */
    @GetMapping("/rate-limit-status")
    public Mono<ResponseEntity<Map<String, Object>>> getRateLimitStatus(ServerWebExchange exchange) {
        String ip = getClientIp(exchange);
        String key = "ratelimit:default:" + ip;
        
        return redisTemplate.opsForValue().get(key)
            .map(count -> {
                int currentCount = Integer.parseInt(count);
                int limit = 200; // Default limit
                int remaining = Math.max(0, limit - currentCount);
                
                Map<String, Object> response = new java.util.HashMap<>();
                response.put("ip", ip);
                response.put("limit", limit);
                response.put("used", currentCount);
                response.put("remaining", remaining);
                response.put("windowSeconds", 60);
                return ResponseEntity.ok(response);
            })
            .defaultIfEmpty(ResponseEntity.ok(Map.of(
                "ip", ip,
                "limit", 200,
                "used", 0,
                "remaining", 200,
                "windowSeconds", 60
            )))
            .map(response -> ResponseEntity.ok((Map<String, Object>) response.getBody()));
    }

    /**
     * Health check endpoint for the gateway.
     */
    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, String>>> health() {
        return Mono.just(ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "gateway-service"
        )));
    }

    private String getClientIp(ServerWebExchange exchange) {
        String xForwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = exchange.getRequest().getHeaders().getFirst("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return exchange.getRequest().getRemoteAddress() != null
            ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
            : "unknown";
    }
}
