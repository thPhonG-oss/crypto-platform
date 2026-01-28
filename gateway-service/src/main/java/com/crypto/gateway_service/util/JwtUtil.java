package com.crypto.gateway_service.util;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

/**
 * JWT utility for token validation in Gateway
 */
@Component
@Slf4j
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("JwtUtil initialized with secret (first 10 chars): {}", 
            jwtSecret != null ? jwtSecret.substring(0, Math.min(10, jwtSecret.length())) : "NULL");
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Validate JWT token
     */
    public boolean validateToken(String token) {
        try {
            log.info("=== JWT VALIDATION START ===");
            log.info("Token (first 50 chars): {}", token.substring(0, Math.min(50, token.length())));
            log.info("Secret used (first 20 chars): {}", jwtSecret.substring(0, Math.min(20, jwtSecret.length())));
            
            Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
            
            log.info("Token claims - sub: {}, userId: {}, role: {}, type: {}", 
                claims.getSubject(), claims.get("userId"), claims.get("role"), claims.get("type"));
            log.info("Token exp: {}, iat: {}, current: {}", 
                claims.getExpiration(), claims.getIssuedAt(), new Date());
            log.info("=== JWT VALIDATION SUCCESS ===");
            return true;
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.error("=== JWT EXPIRED === exp: {}, current: {}", e.getClaims().getExpiration(), new Date());
            return false;
        } catch (io.jsonwebtoken.security.SignatureException e) {
            log.error("=== JWT SIGNATURE MISMATCH === message: {}", e.getMessage());
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            log.error("=== JWT VALIDATION FAILED === type: {}, message: {}", e.getClass().getSimpleName(), e.getMessage());
            return false;
        }
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        try {
            Date expiration = extractAllClaims(token).getExpiration();
            return expiration.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Extract username (subject) from token
     */
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    /**
     * Extract user ID from token
     */
    public Long extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        Object userId = claims.get("userId");
        if (userId instanceof Number) {
            return ((Number) userId).longValue();
        }
        return null;
    }

    /**
     * Extract role from token
     */
    public String extractRole(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("role", String.class);
    }

    /**
     * Extract token type (access or refresh)
     */
    public String extractTokenType(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("type", String.class);
    }

    /**
     * Check if token is an access token
     */
    public boolean isAccessToken(String token) {
        String type = extractTokenType(token);
        return "access".equals(type);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
