package com.crypto.gateway_service.config;

import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Predicate;

/**
 * Validates routes to determine authentication requirements
 */
@Component
public class RouteValidator {

    /**
     * Public endpoints that don't require authentication
     */
    public static final List<String> PUBLIC_ENDPOINTS = List.of(
        // Auth endpoints
        "/identity-service/api/v1/auth/register",
        "/identity-service/api/v1/auth/login",
        "/identity-service/api/v1/auth/refresh",
        "/identity-service/oauth2",
        "/identity-service/login/oauth2",
        
        // Public market data
        "/market-service/api/v1/klines",
        "/market-service/api/v1/symbols",
        "/market-service/ws",
        
        // Public news (basic access)
        "/crawler-service/api/v1/news",
        
        // Health checks
        "/actuator/health",
        "/actuator/info",
        
        // Eureka
        "/eureka"
    );

    /**
     * VIP-only endpoints that require VIP or ADMIN role
     */
    public static final List<String> VIP_ENDPOINTS = List.of(
        "/analysis-service/api/v1/analysis",
        "/analysis-service/api/v1/sentiment",
        "/analysis-service/api/v1/correlation"
    );

    /**
     * Admin-only endpoints
     */
    public static final List<String> ADMIN_ENDPOINTS = List.of(
        "/identity-service/api/v1/admin",
        "/crawler-service/api/v1/admin",
        "/analysis-service/api/v1/admin"
    );

    /**
     * Check if the request is to a public endpoint
     */
    public Predicate<ServerHttpRequest> isSecured = request -> {
        String path = request.getURI().getPath();
        return PUBLIC_ENDPOINTS.stream()
            .noneMatch(uri -> path.contains(uri));
    };

    /**
     * Check if the request requires VIP role
     */
    public boolean isVipEndpoint(ServerHttpRequest request) {
        String path = request.getURI().getPath();
        return VIP_ENDPOINTS.stream()
            .anyMatch(uri -> path.contains(uri));
    }

    /**
     * Check if the request requires ADMIN role
     */
    public boolean isAdminEndpoint(ServerHttpRequest request) {
        String path = request.getURI().getPath();
        return ADMIN_ENDPOINTS.stream()
            .anyMatch(uri -> path.contains(uri));
    }
}
