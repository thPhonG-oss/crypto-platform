package com.crypto.gateway_service.service;

import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * Service to check if a JWT token has been blacklisted (logged out)
 * 
 * When a user logs out from identity-service, the token is added to Redis
 * with key "blacklist:{token}" and TTL matching the token's remaining validity.
 * 
 * This service checks Redis to ensure logged-out tokens are rejected.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    private static final String BLACKLIST_PREFIX = "blacklist:";
    
    private final ReactiveStringRedisTemplate redisTemplate;

    /**
     * Check if a token has been blacklisted (user logged out)
     * 
     * @param token The JWT access token
     * @return Mono<Boolean> - true if blacklisted, false otherwise
     */
    public Mono<Boolean> isTokenBlacklisted(String token) {
        String key = BLACKLIST_PREFIX + token;
        
        return redisTemplate.hasKey(key)
            .doOnNext(isBlacklisted -> {
                if (isBlacklisted) {
                    log.debug("Token is blacklisted (user logged out)");
                }
            })
            .onErrorResume(e -> {
                // If Redis is down, allow the request (fail-open)
                // In production, you might want fail-closed instead
                log.warn("Redis connection error while checking blacklist: {}", e.getMessage());
                return Mono.just(false);
            });
    }
}
