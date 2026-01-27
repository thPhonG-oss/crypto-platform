package com.crypto.identity_service.repository;

import com.crypto.identity_service.models.RefreshToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
  // Define necessary methods for managing refresh tokens
  Optional<RefreshToken> findByToken(String token);

  void deleteByUser_Email(String email);
}
