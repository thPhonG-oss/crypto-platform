package com.crypto.identity_service.security;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import com.crypto.identity_service.models.AuthProvider;
import com.crypto.identity_service.models.RefreshToken;
import com.crypto.identity_service.models.Role;
import com.crypto.identity_service.models.User;
import com.crypto.identity_service.repository.RefreshTokenRepository;
import com.crypto.identity_service.repository.RoleRepository;
import com.crypto.identity_service.repository.UserRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    // Implement the logic to handle successful OAuth2 authentication
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication
    ) throws IOException, ServletException {
        
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String picture = oauth2User.getAttribute("picture");
        String googleId = oauth2User.getAttribute("sub");
        
        // Find or create user
        User user = userRepository.findByEmail(email)
            .orElseGet(() -> createGoogleUser(email, name, picture, googleId));
        
        // Generate tokens
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);
        
        // Save refresh token
        RefreshToken token = RefreshToken.builder()
            .token(refreshToken)
            .user(user)
            .expiryDate(LocalDateTime.now().plusDays(7))
            .build();
        refreshTokenRepository.save(token);
        
        // Redirect to frontend with tokens
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:5173/auth/callback")
            .queryParam("accessToken", accessToken)
            .queryParam("refreshToken", refreshToken)
            .build()
            .toUriString();
        
        log.info("Google OAuth2 success for user: {}", email);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
    
    private User createGoogleUser(String email, String name, String picture, String googleId) {
        Role userRole = roleRepository.findByName("ROLE_USER")
            .orElseThrow(() -> new RuntimeException("Default role not found"));
        
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        
        User user = User.builder()
            .email(email)
            .password("") // No password for OAuth users
            .fullName(name)
            .avatarUrl(picture)
            .provider(AuthProvider.GOOGLE)
            .providerId(googleId)
            .roles(roles)
            .enabled(true)
            .accountNonLocked(true)
            .build();
        
        userRepository.save(user);
        log.info("Created new Google user: {}", email);
        
        return user;
    }
    
}
