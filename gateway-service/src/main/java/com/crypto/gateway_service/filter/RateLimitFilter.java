package com.crypto.gateway_service.filter;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * Custom rate limiting filter with different limits for different endpoints.
 * Runs before authentication filter to block brute force attacks early.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter implements GlobalFilter, Ordered {

    private final ReactiveStringRedisTemplate redisTemplate;

    // Rate limit configurations: endpoint pattern -> (requests, seconds)
    private static final Map<String, RateLimitConfig> RATE_LIMITS = Map.of(
        // Strict limits for auth endpoints (prevent brute force)
        "/identity-service/api/v1/auth/login", new RateLimitConfig(5, 60),      // 5 requests per minute
        "/identity-service/api/v1/auth/register", new RateLimitConfig(3, 60),   // 3 requests per minute
        "/identity-service/api/v1/auth/refresh", new RateLimitConfig(10, 60),   // 10 requests per minute
        
        // Moderate limits for other endpoints
        "/market-service/api/v1/market", new RateLimitConfig(100, 60),          // 100 requests per minute
        "/analysis-service/api/v1", new RateLimitConfig(30, 60),                // 30 requests per minute
        "/crawler-service/api/v1", new RateLimitConfig(60, 60)                  // 60 requests per minute
    );

    // Default rate limit for unmatched endpoints
    private static final RateLimitConfig DEFAULT_LIMIT = new RateLimitConfig(200, 60); // 200 requests per minute

    // In-memory fallback when Redis is unavailable
    private final Map<String, RateLimitEntry> fallbackCache = new ConcurrentHashMap<>();

    @Override
    public int getOrder() {
        // Run before AuthenticationFilter (-1) to block early
        return -2;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        String ip = getClientIp(exchange);
        
        RateLimitConfig config = findRateLimitConfig(path);
        String key = buildRateLimitKey(path, ip);

        return checkRateLimit(key, config)
            .flatMap(allowed -> {
                if (!allowed) {
                    log.warn("Rate limit exceeded for IP: {} on path: {}", ip, path);
                    return onRateLimitExceeded(exchange, config);
                }
                return chain.filter(exchange);
            })
            .onErrorResume(e -> {
                // On Redis error, use in-memory fallback
                log.warn("Redis error, using fallback rate limiter: {}", e.getMessage());
                return checkRateLimitFallback(key, config)
                    ? chain.filter(exchange)
                    : onRateLimitExceeded(exchange, config);
            });
    }

    private String getClientIp(ServerWebExchange exchange) {
        // Check for forwarded headers first (behind proxy/load balancer)
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

    private RateLimitConfig findRateLimitConfig(String path) {
        for (Map.Entry<String, RateLimitConfig> entry : RATE_LIMITS.entrySet()) {
            if (path.startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }
        return DEFAULT_LIMIT;
    }

    private String buildRateLimitKey(String path, String ip) {
        // Group similar paths together
        String pathGroup = RATE_LIMITS.keySet().stream()
            .filter(path::startsWith)
            .findFirst()
            .orElse("default");
        
        return "ratelimit:" + pathGroup + ":" + ip;
    }

    private Mono<Boolean> checkRateLimit(String key, RateLimitConfig config) {
        return redisTemplate.opsForValue()
            .increment(key)
            .flatMap(count -> {
                if (count == 1) {
                    // First request, set expiry
                    return redisTemplate.expire(key, Duration.ofSeconds(config.windowSeconds))
                        .thenReturn(true);
                }
                return Mono.just(count <= config.maxRequests);
            });
    }

    private boolean checkRateLimitFallback(String key, RateLimitConfig config) {
        long now = System.currentTimeMillis();
        
        fallbackCache.compute(key, (k, entry) -> {
            if (entry == null || now - entry.windowStart > config.windowSeconds * 1000L) {
                return new RateLimitEntry(now, 1);
            }
            entry.count++;
            return entry;
        });
        
        RateLimitEntry entry = fallbackCache.get(key);
        return entry != null && entry.count <= config.maxRequests;
    }

    private Mono<Void> onRateLimitExceeded(ServerWebExchange exchange, RateLimitConfig config) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().add("Retry-After", String.valueOf(config.windowSeconds));
        response.getHeaders().add("X-RateLimit-Limit", String.valueOf(config.maxRequests));
        response.getHeaders().add("X-RateLimit-Reset", String.valueOf(config.windowSeconds));

        String body = String.format(
            "{\"error\":\"Too many requests\",\"message\":\"Rate limit exceeded. Try again in %d seconds.\",\"retryAfter\":%d}",
            config.windowSeconds,
            config.windowSeconds
        );
        
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    /**
     * Rate limit configuration holder
     */
    private record RateLimitConfig(int maxRequests, int windowSeconds) {}

    /**
     * Fallback cache entry for when Redis is unavailable
     */
    private static class RateLimitEntry {
        long windowStart;
        int count;

        RateLimitEntry(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
