package com.crypto.identity_service.security;

import java.io.IOException;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class OAuth2FailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException, ServletException {
        
        log.error("OAuth2 authentication failed: {}", exception.getMessage(), exception);
        
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:5173/auth/callback")
                .queryParam("error", exception.getMessage())
                .build()
                .toUriString();
        
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
