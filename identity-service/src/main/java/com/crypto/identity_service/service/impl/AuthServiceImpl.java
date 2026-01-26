package com.crypto.identity_service.service.impl;

import com.crypto.identity_service.service.AuthService;
import com.crypto.identity_service.dto.request.*;
import com.crypto.identity_service.dto.response.AuthResponse;
import com.crypto.identity_service.models.*;
import com.crypto.identity_service.exception.BusinessException;
import com.crypto.identity_service.repository.*;
import com.crypto.identity_service.security.JwtTokenProvider;
import com.crypto.identity_service.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final StringRedisTemplate redisTemplate;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already exists");
        }
        
        // Get USER role
        Role userRole = roleRepository.findByName("ROLE_USER")
            .orElseThrow(() -> new BusinessException("Role not found"));
        
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        
        // Create user
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .provider(AuthProvider.LOCAL)
            .roles(roles)
            .enabled(true)
            .accountNonLocked(true)
            .build();
        
        userRepository.save(user);
        log.info("User registered: {}", user.getEmail());
        
        // Generate tokens
        return generateAuthResponse(user);
    }
    
    @Override
    public AuthResponse login(LoginRequest request) {
        try {
            // Authenticate
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
                )
            );
            
            User user = (User) authentication.getPrincipal();
            log.info("User logged in: {}", user.getEmail());
            
            return generateAuthResponse(user);
            
        } catch (BadCredentialsException e) {
            throw new BusinessException("Invalid email or password");
        } catch (DisabledException e) {
            throw new BusinessException("Account is disabled");
        } catch (LockedException e) {
            throw new BusinessException("Account is locked");
        }
    }
    
    @Override
    @Transactional
    public AuthResponse refreshToken(String refreshTokenStr) {
        // Validate refresh token
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenStr)
            .orElseThrow(() -> new BusinessException("Invalid refresh token"));
        
        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new BusinessException("Refresh token expired");
        }
        
        User user = refreshToken.getUser();
        
        // Generate new tokens
        String newAccessToken = jwtTokenProvider.generateAccessToken(user);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user);
        
        // Delete old refresh token
        refreshTokenRepository.delete(refreshToken);
        
        // Save new refresh token
        RefreshToken newToken = RefreshToken.builder()
            .token(newRefreshToken)
            .user(user)
            .expiryDate(LocalDateTime.now().plusDays(7))
            .build();
        refreshTokenRepository.save(newToken);
        
        return AuthResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(newRefreshToken)
            .tokenType("Bearer")
            .expiresIn(900) // 15 minutes
            .email(user.getEmail())
            .roles(user.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .toList())
            .isVip(user.isVip())
            .build();
    }
    
    @Override
    public void logout(String accessToken) {
        String username = jwtTokenProvider.extractUsername(accessToken);
        
        // Blacklist access token in Redis (TTL = token expiry)
        long expirySeconds = jwtTokenProvider.extractExpiration(accessToken).getTime() / 1000 
            - System.currentTimeMillis() / 1000;
        
        if (expirySeconds > 0) {
            redisTemplate.opsForValue().set(
                "blacklist:" + accessToken,
                "true",
                expirySeconds,
                TimeUnit.SECONDS
            );
        }
        
        // Delete all refresh tokens
        refreshTokenRepository.deleteByUser_Email(username);
        
        log.info("User logged out: {}", username);
    }
    
    private AuthResponse generateAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);
        
        // Save refresh token
        RefreshToken token = RefreshToken.builder()
            .token(refreshToken)
            .user(user)
            .expiryDate(LocalDateTime.now().plusDays(7))
            .build();
        refreshTokenRepository.save(token);
        
        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(900) // 15 minutes
            .email(user.getEmail())
            .roles(user.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .toList())
            .isVip(user.isVip())
            .build();
    }
}
