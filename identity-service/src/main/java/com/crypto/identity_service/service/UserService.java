package com.crypto.identity_service.service;

import com.crypto.identity_service.dto.response.UserResponse;

public interface UserService {
    UserResponse getUserByEmail(String email);
    UserResponse getUserById(Long id);
}
