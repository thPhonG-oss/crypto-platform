package com.crypto.identity_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    @NotBlank(message = "Package type is required")
    private String packageType; // VIP_1_MONTH, VIP_3_MONTHS, VIP_1_YEAR
}