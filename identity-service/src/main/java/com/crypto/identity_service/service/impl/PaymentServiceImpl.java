package com.crypto.identity_service.service.impl;

import com.crypto.identity_service.service.PaymentService;

import com.crypto.identity_service.dto.request.PaymentRequest;
import com.crypto.identity_service.dto.response.*;
import com.crypto.identity_service.models.*;
import com.crypto.identity_service.exception.BusinessException;
import com.crypto.identity_service.repository.*;
import com.crypto.identity_service.service.PaymentService;
import com.crypto.identity_service.util.VnpayUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final RoleRepository roleRepository;
    
    @Value("${app.vnpay.tmn-code}")
    private String vnpTmnCode;
    
    @Value("${app.vnpay.hash-secret}")
    private String vnpHashSecret;
    
    @Value("${app.vnpay.url}")
    private String vnpUrl;
    
    @Value("${app.vnpay.return-url}")
    private String vnpReturnUrl;
    
    private static final Map<String, BigDecimal> PACKAGE_PRICES = Map.of(
        "VIP_1_MONTH", new BigDecimal("99000"),
        "VIP_3_MONTHS", new BigDecimal("269000"),
        "VIP_1_YEAR", new BigDecimal("999000")
    );
    
    @Override
    @Transactional
    public PaymentResponse createPayment(String email, PaymentRequest request, String ipAddress) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("User not found"));
        
        // Validate package
        BigDecimal amount = PACKAGE_PRICES.get(request.getPackageType());
        if (amount == null) {
            throw new BusinessException("Invalid package type");
        }
        
        // Create payment record
        String orderId = UUID.randomUUID().toString();
        Payment payment = Payment.builder()
            .user(user)
            .orderId(orderId)
            .amount(amount)
            .status(PaymentStatus.PENDING)
            .packageType(request.getPackageType())
            .build();
        
        paymentRepository.save(payment);
        
        // Generate VNPay URL
        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnpTmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amount.multiply(new BigDecimal("100")).intValue()));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", orderId);
        vnpParams.put("vnp_OrderInfo", "Thanh toan goi " + request.getPackageType());
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnpReturnUrl);
        vnpParams.put("vnp_IpAddr", ipAddress);
        vnpParams.put("vnp_CreateDate", VnpayUtil.getCurrentDateTime());
        
        String paymentUrl = VnpayUtil.buildPaymentUrl(vnpUrl, vnpParams, vnpHashSecret);
        
        return PaymentResponse.builder()
            .orderId(orderId)
            .paymentUrl(paymentUrl)
            .amount(amount)
            .packageType(request.getPackageType())
            .build();
    }
    
    @Override
    @Transactional
    public PaymentStatusResponse handleVnpayReturn(Map<String, String> params) {
        String orderId = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String secureHash = params.get("vnp_SecureHash");
        
        // Verify signature
        if (!VnpayUtil.verifySignature(params, vnpHashSecret)) {
            throw new BusinessException("Invalid signature");
        }
        
        Payment payment = paymentRepository.findByOrderId(orderId)
            .orElseThrow(() -> new BusinessException("Payment not found"));
        
        if ("00".equals(responseCode)) {
            // Success
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setVnpTransactionNo(params.get("vnp_TransactionNo"));
            payment.setVnpBankCode(params.get("vnp_BankCode"));
            payment.setCompletedAt(LocalDateTime.now());
            
            // Upgrade user to VIP
            upgradeUserToVip(payment.getUser(), payment.getPackageType());
            
            log.info("Payment success: {}", orderId);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            log.warn("Payment failed: {} - Code: {}", orderId, responseCode);
        }
        
        paymentRepository.save(payment);
        
        return PaymentStatusResponse.builder()
            .orderId(orderId)
            .status(payment.getStatus().name())
            .amount(payment.getAmount())
            .completedAt(payment.getCompletedAt())
            .build();
    }
    
    private void upgradeUserToVip(User user, String packageType) {
        Role vipRole = roleRepository.findByName("ROLE_VIP")
            .orElseThrow(() -> new BusinessException("VIP role not found"));
        
        user.getRoles().add(vipRole);
        
        LocalDateTime vipExpiry = switch (packageType) {
            case "VIP_1_MONTH" -> LocalDateTime.now().plusMonths(1);
            case "VIP_3_MONTHS" -> LocalDateTime.now().plusMonths(3);
            case "VIP_1_YEAR" -> LocalDateTime.now().plusYears(1);
            default -> LocalDateTime.now().plusMonths(1);
        };
        
        user.setVipExpiredAt(vipExpiry);
        userRepository.save(user);
        
        log.info("User upgraded to VIP: {} - Expires: {}", user.getEmail(), vipExpiry);
    }
    
    @Override
    public PaymentHistoryResponse getPaymentHistory(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("User not found"));
        
        List<Payment> payments = paymentRepository.findByUserOrderByCreatedAtDesc(user);
        
        return PaymentHistoryResponse.builder()
            .payments(payments.stream()
                .map(p -> PaymentDto.builder()
                    .orderId(p.getOrderId())
                    .amount(p.getAmount())
                    .status(p.getStatus().name())
                    .packageType(p.getPackageType())
                    .createdAt(p.getCreatedAt())
                    .completedAt(p.getCompletedAt())
                    .build())
                .toList())
            .build();
    }
}
