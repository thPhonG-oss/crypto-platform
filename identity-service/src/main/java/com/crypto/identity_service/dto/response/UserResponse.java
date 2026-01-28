package com.crypto.identity_service.dto.response;

import java.util.List;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
  private Long id;
  private String email;
  private String fullName;
  private String avatarUrl;
  private List<String> roles;
  private Boolean isVip;
  private String vipExpiredAt;
}
