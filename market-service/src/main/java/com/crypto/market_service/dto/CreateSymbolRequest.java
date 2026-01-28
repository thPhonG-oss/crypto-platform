package com.crypto.market_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSymbolRequest {
    private String symbol;      // BTCUSDT (required)
    private String name;        // Bitcoin (required)
    private String icon;        // ₿ (optional)
    private String description; // Bitcoin to USDT (optional)
    private Integer displayOrder; // 1 (optional)
}