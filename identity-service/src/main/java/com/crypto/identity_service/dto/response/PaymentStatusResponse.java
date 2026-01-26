package com.crypto.identity_service.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatusResponse {
    private String orderId;
    private String status;
    private java.math.BigDecimal amount;
    private java.time.LocalDateTime completedAt;
}
