package com.crypto.identity_service.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDto {
    private String orderId;
    private java.math.BigDecimal amount;
    private String status;
    private String packageType;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime completedAt;
}

