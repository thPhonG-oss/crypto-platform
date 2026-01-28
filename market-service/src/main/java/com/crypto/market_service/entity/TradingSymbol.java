package com.crypto.market_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "trading_symbols", indexes = {
    @Index(name = "idx_symbol_unique", columnList = "symbol", unique = true),
    @Index(name = "idx_active", columnList = "active"),
    @Index(name = "idx_display_order", columnList = "displayOrder")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TradingSymbol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String symbol; // BTCUSDT

    @Column(nullable = false, length = 50)
    private String name; // Bitcoin

    @Column(length = 10)
    private String icon; // ₿

    @Column(length = 255)
    private String description; // Bitcoin to USDT

    @Column(nullable = false)
    private Boolean active = false; // Mặc định tắt

    @Column(nullable = false)
    private Integer displayOrder = 999; // Thứ tự hiển thị

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}