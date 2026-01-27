package com.crypto.identity_service.security;

import com.crypto.identity_service.models.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class JwtTokenProvider {
  @Value("${app.jwt.secret}")
  private String jwtSecret;

  @Value("${app.jwt.access-token-expiration}")
  private long accessTokenExpiration; // 15 minutes

  @Value("${app.jwt.refresh-token-expiration}")
  private long refreshTokenExpiration; // 7 days

  private SecretKey getSigningKey() {
    return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
  }

  // Generate Access Token
  public String generateAccessToken(UserDetails userDetails) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("type", "access");

    // Add user info to claims
    if (userDetails instanceof User) {
      User user = (User) userDetails;
      claims.put("userId", user.getId());
      claims.put("fullName", user.getFullName());

      // Determine role: VIP if active VIP subscription, else highest role
      String role = determineUserRole(user);
      claims.put("role", role);

      // Add all authorities
      String authorities =
          user.getAuthorities().stream()
              .map(GrantedAuthority::getAuthority)
              .collect(Collectors.joining(","));
      claims.put("authorities", authorities);
    }

    return createToken(claims, userDetails.getUsername(), accessTokenExpiration);
  }

  // Generate Refresh Token
  public String generateRefreshToken(UserDetails userDetails) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("type", "refresh");
    return createToken(claims, userDetails.getUsername(), refreshTokenExpiration);
  }

  /** Determine the effective role for the user VIP status is determined by vipExpiredAt field */
  private String determineUserRole(User user) {
    // Check if user has active VIP subscription
    if (user.isVip()) {
      return "VIP";
    }

    // Check for ADMIN role
    boolean isAdmin =
        user.getRoles().stream().anyMatch(role -> role.getName().equals("ROLE_ADMIN"));
    if (isAdmin) {
      return "ADMIN";
    }

    // Default to REGULAR
    return "REGULAR";
  }

  private String createToken(Map<String, Object> claims, String subject, long expiration) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + expiration);

    return Jwts.builder()
        .claims(claims)
        .subject(subject)
        .issuedAt(now)
        .expiration(expiryDate)
        .signWith(getSigningKey(), Jwts.SIG.HS256)
        .compact();
  }

  // Extract username from token
  public String extractUsername(String token) {
    return extractClaim(token, Claims::getSubject);
  }

  // Extract expiration
  public Date extractExpiration(String token) {
    return extractClaim(token, Claims::getExpiration);
  }

  public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
    final Claims claims = extractAllClaims(token);
    return claimsResolver.apply(claims);
  }

  private Claims extractAllClaims(String token) {
    return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
  }

  // Validate token
  public boolean validateToken(String token, UserDetails userDetails) {
    try {
      final String username = extractUsername(token);
      return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    } catch (JwtException | IllegalArgumentException e) {
      log.error("JWT validation error: {}", e.getMessage());
      return false;
    }
  }

  private boolean isTokenExpired(String token) {
    return extractExpiration(token).before(new Date());
  }
}
