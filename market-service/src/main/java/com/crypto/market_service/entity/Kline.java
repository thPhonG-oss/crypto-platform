package com.crypto.market_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Entity
@Table(name = "klines", indexes = {
    @Index(name = "idx_kline_unique", columnList = "symbol, interval, openTime", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Kline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String symbol; // VD: BTCUSDT

    // Dữ liệu OHLCV
    @Column(precision = 20, scale = 8)
    private BigDecimal openPrice;

    @Column(precision = 20, scale = 8)
    private BigDecimal highPrice;

    @Column(precision = 20, scale = 8)
    private BigDecimal lowPrice;

    @Column(precision = 20, scale = 8)
    private BigDecimal closePrice;

    @Column(precision = 20, scale = 8)
    private BigDecimal volume;

    @Column(nullable = false)
    private LocalDateTime openTime;

    @Column(nullable = false)
    private LocalDateTime closeTime;

    @Column(nullable = false, length = 5)
    private String interval; // 1m, 5m, 1h, 1d

    // Helper convert timestamp -> LocalDateTime
    public static LocalDateTime convertTime(long timestamp) {
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(timestamp), ZoneId.systemDefault());
    }
}