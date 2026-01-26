package com.crypto.identity_service.service.impl;

import org.springframework.stereotype.Service;

import com.crypto.identity_service.repository.UserRepository;
import com.crypto.identity_service.service.UserService;

import lombok.RequiredArgsConstructor;

import com.crypto.identity_service.dto.response.UserResponse;
import com.crypto.identity_service.models.User;
import  java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    @Override
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .avatarUrl(user.getAvatarUrl())
            .roles(user.getRoles().stream().map(role -> role.getName()).toList())
            .isVip(user.getVipExpiredAt() != null && user.getVipExpiredAt().isAfter(java.time.LocalDateTime.now()))
            .vipExpiredAt(user.getVipExpiredAt() != null ? user.getVipExpiredAt().toString() : null)
            .build();
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .avatarUrl(user.getAvatarUrl())
            .roles(user.getRoles().stream().map(role -> role.getName()).toList())
            .isVip(user.getVipExpiredAt() != null && user.getVipExpiredAt().isAfter(java.time.LocalDateTime.now()))
            .vipExpiredAt(user.getVipExpiredAt() != null ? user.getVipExpiredAt().toString() : null)
            .build();
    }
}
