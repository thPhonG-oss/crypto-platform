package com.crypto.identity_service.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
  private String orderId;
  private String paymentUrl;
  private java.math.BigDecimal amount;
  private String packageType;
}
