package com.crypto.market_service.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Binance Exchange Info API
 * GET https://api.binance.com/api/v3/exchangeInfo
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BinanceExchangeInfoDTO {
    
    private String timezone;
    private Long serverTime;
    private List<RateLimit> rateLimits;
    private List<SymbolInfo> symbols;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RateLimit {
        private String rateLimitType;
        private String interval;
        private Integer intervalNum;
        private Integer limit;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SymbolInfo {
        private String symbol;              // "BTCUSDT"
        private String status;              // "TRADING"
        private String baseAsset;           // "BTC"
        private String baseAssetPrecision;
        private String quoteAsset;          // "USDT"
        private String quotePrecision;
        private Integer baseCommissionPrecision;
        private Integer quoteCommissionPrecision;
        private List<String> orderTypes;
        private Boolean icebergAllowed;
        private Boolean ocoAllowed;
        private Boolean quoteOrderQtyMarketAllowed;
        private Boolean allowTrailingStop;
        private Boolean cancelReplaceAllowed;
        private Boolean isSpotTradingAllowed;
        private Boolean isMarginTradingAllowed;
        private List<Filter> filters;
        private List<String> permissions;
        
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Filter {
            private String filterType;
            // Additional fields based on filter type
        }
    }
}