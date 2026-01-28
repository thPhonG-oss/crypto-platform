package com.crypto.market_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSymbolRequest {
    private String name;
    private String icon;
    private String description;
    private Boolean active;
    private Integer displayOrder;
}