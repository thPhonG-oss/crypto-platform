package com.crypto.identity_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.crypto.identity_service.models.Payment;
import com.crypto.identity_service.models.User;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(String orderId);
    List<Payment> findByUserOrderByCreatedAtDesc(User user);
}
