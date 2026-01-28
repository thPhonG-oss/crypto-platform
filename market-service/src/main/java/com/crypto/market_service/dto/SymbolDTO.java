package com.crypto.market_service.dto;

import com.crypto.market_service.entity.TradingSymbol;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SymbolDTO {
    private Long id;
    private String symbol;      // BTCUSDT
    private String name;        // Bitcoin
    private String icon;        // ₿
    private String description; // Bitcoin to USDT
    private Boolean active;     // true/false
    private Integer displayOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SymbolDTO fromEntity(TradingSymbol entity) {
        return SymbolDTO.builder()
                .id(entity.getId())
                .symbol(entity.getSymbol())
                .name(entity.getName())
                .icon(entity.getIcon())
                .description(entity.getDescription())
                .active(entity.getActive())
                .displayOrder(entity.getDisplayOrder())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
