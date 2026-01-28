package com.crypto.identity_service.controller;

import com.crypto.identity_service.dto.request.PaymentRequest;
import com.crypto.identity_service.dto.response.ApiResponse;
import com.crypto.identity_service.dto.response.PaymentHistoryResponse;
import com.crypto.identity_service.dto.response.PaymentResponse;
import com.crypto.identity_service.dto.response.PaymentStatusResponse;
import com.crypto.identity_service.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

  private final PaymentService paymentService;

  @Value("${app.frontend-url:http://localhost:5173}")
  private String frontendUrl;

  @PostMapping("/create")
  public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
      @RequestBody PaymentRequest request,
      @AuthenticationPrincipal UserDetails userDetails,
      HttpServletRequest httpRequest) {
    String ipAddress = getClientIp(httpRequest);
    PaymentResponse response =
        paymentService.createPayment(userDetails.getUsername(), request, ipAddress);
    return ResponseEntity.ok(ApiResponse.success(response, "Payment created"));
  }

  @GetMapping("/vnpay-return")
  public void vnpayReturn(@RequestParam Map<String, String> params, HttpServletResponse response)
      throws IOException {
    PaymentStatusResponse result = paymentService.handleVnpayReturn(params);

    // Build redirect URL with query params
    StringBuilder redirectUrl = new StringBuilder(frontendUrl);
    redirectUrl.append("/payment/callback");
    redirectUrl.append("?vnp_ResponseCode=").append(params.get("vnp_ResponseCode"));
    redirectUrl.append("&vnp_TxnRef=").append(params.get("vnp_TxnRef"));
    redirectUrl.append("&vnp_Amount=").append(params.get("vnp_Amount"));

    if (params.get("vnp_BankCode") != null) {
      redirectUrl.append("&vnp_BankCode=").append(params.get("vnp_BankCode"));
    }
    if (params.get("vnp_TransactionNo") != null) {
      redirectUrl.append("&vnp_TransactionNo=").append(params.get("vnp_TransactionNo"));
    }

    response.sendRedirect(redirectUrl.toString());
  }

  @GetMapping("/history")
  public ResponseEntity<ApiResponse<PaymentHistoryResponse>> getHistory(
      @AuthenticationPrincipal UserDetails userDetails) {
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
