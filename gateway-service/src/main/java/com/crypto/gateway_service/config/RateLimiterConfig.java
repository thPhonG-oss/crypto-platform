package com.crypto.gateway_service.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import reactor.core.publisher.Mono;

/**
 * Configuration for rate limiting using Redis.
 * Provides different KeyResolver strategies for rate limiting.
 */
@Configuration
public class RateLimiterConfig {

    /**
     * Rate limit by IP address (default).
     * Used for general API rate limiting.
     */
    @Bean
    @Primary
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String ip = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";
            return Mono.just("rate_limit:ip:" + ip);
        };
    }

    /**
     * Rate limit by user (from JWT token).
     * Used for authenticated endpoints.
     */
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                // Use a hash of the token as key (or extract user from JWT)
                String token = authHeader.substring(7);
                // Use first 32 chars of token as identifier to avoid key being too long
                String tokenKey = token.length() > 32 ? token.substring(0, 32) : token;
                return Mono.just("rate_limit:user:" + tokenKey);
            }
            // Fall back to IP if no token
            String ip = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";
            return Mono.just("rate_limit:ip:" + ip);
        };
    }

    /**
     * Rate limit by path + IP for specific endpoints.
     * Used for sensitive endpoints like login.
     */
    @Bean
    public KeyResolver pathKeyResolver() {
        return exchange -> {
            String path = exchange.getRequest().getURI().getPath();
            String ip = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";
            return Mono.just("rate_limit:path:" + path + ":" + ip);
        };
    }
}
