package com.crypto.gateway_service.filter;

import com.crypto.gateway_service.config.RouteValidator;
import com.crypto.gateway_service.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

/**
 * Global authentication filter for JWT validation
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private final RouteValidator routeValidator;
    private final JwtUtil jwtUtil;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        
        log.debug("Processing request: {} {}", request.getMethod(), path);

        // Skip authentication for public endpoints
        if (!routeValidator.isSecured.test(request)) {
            log.debug("Public endpoint, skipping authentication: {}", path);
            return chain.filter(exchange);
        }

        // Check for Authorization header
        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            log.warn("Missing Authorization header for secured endpoint: {}", path);
            return onError(exchange, "Missing Authorization header", HttpStatus.UNAUTHORIZED);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        
        // Validate Bearer token format
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Invalid Authorization header format: {}", path);
            return onError(exchange, "Invalid Authorization header format", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);

        // Validate token
        if (!jwtUtil.validateToken(token)) {
            log.warn("Invalid JWT token for endpoint: {}", path);
            return onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
        }

        // Check if it's an access token (not refresh token)
        if (!jwtUtil.isAccessToken(token)) {
            log.warn("Refresh token used for API access: {}", path);
            return onError(exchange, "Invalid token type", HttpStatus.UNAUTHORIZED);
        }

        // Extract user info from token
        String username = jwtUtil.extractUsername(token);
        Long userId = jwtUtil.extractUserId(token);
        String role = jwtUtil.extractRole(token);

        log.debug("Authenticated user: {} (ID: {}, Role: {})", username, userId, role);

        // Check VIP endpoint access
        if (routeValidator.isVipEndpoint(request)) {
            if (!"VIP".equals(role) && !"ADMIN".equals(role)) {
                log.warn("VIP access denied for user: {} with role: {}", username, role);
                return onError(exchange, "VIP subscription required", HttpStatus.FORBIDDEN);
            }
        }

        // Check ADMIN endpoint access
        if (routeValidator.isAdminEndpoint(request)) {
            if (!"ADMIN".equals(role)) {
                log.warn("Admin access denied for user: {} with role: {}", username, role);
                return onError(exchange, "Admin access required", HttpStatus.FORBIDDEN);
            }
        }

        // Add user info headers for downstream services
        ServerHttpRequest mutatedRequest = request.mutate()
            .header("X-User-Id", userId != null ? userId.toString() : "")
            .header("X-User-Email", username)
            .header("X-User-Role", role != null ? role : "REGULAR")
            .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String body = String.format(
            "{\"success\":false,\"message\":\"%s\",\"status\":%d}",
            message, status.value()
        );

        DataBuffer buffer = response.bufferFactory()
            .wrap(body.getBytes(StandardCharsets.UTF_8));

        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -1; // High priority, runs before other filters
    }
}
