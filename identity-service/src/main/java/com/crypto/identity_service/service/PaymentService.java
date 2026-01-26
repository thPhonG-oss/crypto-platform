package com.crypto.identity_service.service;

import com.crypto.identity_service.dto.request.PaymentRequest;
import com.crypto.identity_service.dto.response.PaymentHistoryResponse;
import com.crypto.identity_service.dto.response.PaymentResponse;
import com.crypto.identity_service.dto.response.PaymentStatusResponse;
import java.util.Map;

public interface PaymentService {
    PaymentResponse createPayment(String email, PaymentRequest request, String ipAddress);
    PaymentStatusResponse handleVnpayReturn(Map<String, String> params);
    PaymentHistoryResponse getPaymentHistory(String email);
}
