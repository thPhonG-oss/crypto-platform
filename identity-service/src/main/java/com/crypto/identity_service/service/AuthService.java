package com.crypto.identity_service.service;

import com.crypto.identity_service.dto.request.LoginRequest;
import com.crypto.identity_service.dto.request.RegisterRequest;
import com.crypto.identity_service.dto.response.AuthResponse;

public interface AuthService {
  AuthResponse register(RegisterRequest request);

  AuthResponse login(LoginRequest request);

  AuthResponse refreshToken(String refreshToken);

  void logout(String accessToken);
}
