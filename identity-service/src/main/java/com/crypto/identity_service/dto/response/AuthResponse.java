package com.crypto.identity_service.dto.response;

import java.util.List;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
  private String accessToken;
  private String refreshToken;
  private String tokenType;
  private Integer expiresIn;
  private String email;
  private List<String> roles;
  private Boolean isVip;
}
