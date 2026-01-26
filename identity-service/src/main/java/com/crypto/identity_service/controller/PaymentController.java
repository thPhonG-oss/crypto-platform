package com.crypto.identity_service.controller;

import com.crypto.identity_service.dto.request.PaymentRequest;
import com.crypto.identity_service.dto.response.*;
import com.crypto.identity_service.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {
    
    private final PaymentService paymentService;
    
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
        @RequestBody PaymentRequest request,
        @AuthenticationPrincipal UserDetails userDetails,
        HttpServletRequest httpRequest
    ) {
        String ipAddress = getClientIp(httpRequest);
        PaymentResponse response = paymentService.createPayment(
            userDetails.getUsername(), 
            request, 
            ipAddress
        );
        return ResponseEntity.ok(ApiResponse.success(response, "Payment created"));
    }
    
    @GetMapping("/vnpay-return")
    public ResponseEntity<ApiResponse<PaymentStatusResponse>> vnpayReturn(
        @RequestParam Map<String, String> params
    ) {
        PaymentStatusResponse response = paymentService.handleVnpayReturn(params);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment processed"));
    }
    
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<PaymentHistoryResponse>> getHistory(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        PaymentHistoryResponse history = paymentService.getPaymentHistory(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(history, "Payment history retrieved"));
    }
    
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}