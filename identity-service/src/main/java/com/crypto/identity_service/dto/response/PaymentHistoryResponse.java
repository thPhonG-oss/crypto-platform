package com.crypto.identity_service.dto.response;

import java.util.List;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentHistoryResponse {
  private List<PaymentDto> payments;
}
