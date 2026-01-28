package com.crypto.market_service.service;

import com.crypto.market_service.dto.BinanceExchangeInfoDTO;
import com.crypto.market_service.entity.TradingSymbol;
import com.crypto.market_service.repository.TradingSymbolRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class BinanceSymbolSyncService {

    private static final String BINANCE_EXCHANGE_INFO_URL = "https://api.binance.com/api/v3/exchangeInfo";
    
    private final TradingSymbolRepository symbolRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    // Mapping baseAsset -> icon
    private static final Map<String, String> CRYPTO_ICONS = new HashMap<>();
    static {
        CRYPTO_ICONS.put("BTC", "₿");
        CRYPTO_ICONS.put("ETH", "Ξ");
        CRYPTO_ICONS.put("BNB", "◆");
        CRYPTO_ICONS.put("SOL", "◎");
        CRYPTO_ICONS.put("ADA", "₳");
        CRYPTO_ICONS.put("XRP", "XRP");
        CRYPTO_ICONS.put("DOGE", "Ð");
        CRYPTO_ICONS.put("DOT", "●");
        CRYPTO_ICONS.put("MATIC", "⬡");
        CRYPTO_ICONS.put("AVAX", "▲");
        CRYPTO_ICONS.put("LINK", "⬡");
        CRYPTO_ICONS.put("UNI", "🦄");
        CRYPTO_ICONS.put("ATOM", "⚛");
        CRYPTO_ICONS.put("LTC", "Ł");
        CRYPTO_ICONS.put("BCH", "฿");
        CRYPTO_ICONS.put("XLM", "✦");
        CRYPTO_ICONS.put("ALGO", "◬");
        CRYPTO_ICONS.put("VET", "ⓥ");
        // Add more as needed
    }

    /**
     * Fetch all available symbols from Binance and store in DB
     * Only USDT pairs with TRADING status
     */
    @Transactional
    public SyncResult syncSymbolsFromBinance() {
        log.info("🔄 Starting Binance symbol sync...");
        
        try {
            // 1. Fetch từ Binance API
            BinanceExchangeInfoDTO exchangeInfo = restTemplate.getForObject(
                BINANCE_EXCHANGE_INFO_URL, 
                BinanceExchangeInfoDTO.class
            );

            if (exchangeInfo == null || exchangeInfo.getSymbols() == null) {
                log.error("❌ Failed to fetch exchange info from Binance");
                return SyncResult.builder()
                    .success(false)
                    .message("Failed to fetch from Binance")
                    .build();
            }

            // 2. Filter: Chỉ lấy USDT pairs đang TRADING
            List<BinanceExchangeInfoDTO.SymbolInfo> usdtPairs = exchangeInfo.getSymbols().stream()
                .filter(s -> "TRADING".equals(s.getStatus()))
                .filter(s -> "USDT".equals(s.getQuoteAsset()))
                .filter(s -> s.getIsSpotTradingAllowed() != null && s.getIsSpotTradingAllowed())
                .collect(Collectors.toList());

            log.info("📊 Found {} USDT trading pairs", usdtPairs.size());

            int added = 0;
            int updated = 0;
            int skipped = 0;

            // 3. Sync vào database
            for (BinanceExchangeInfoDTO.SymbolInfo symbolInfo : usdtPairs) {
                String symbolName = symbolInfo.getSymbol();
                String baseAsset = symbolInfo.getBaseAsset();

                // Check xem đã tồn tại chưa
                var existingOpt = symbolRepository.findBySymbol(symbolName);

                if (existingOpt.isPresent()) {
                    // Đã tồn tại -> Chỉ update status nếu cần
                    TradingSymbol existing = existingOpt.get();
                    if (!"TRADING".equals(symbolInfo.getStatus()) && existing.getActive()) {
                        existing.setActive(false);
                        symbolRepository.save(existing);
                        updated++;
                        log.debug("Updated {}: set inactive", symbolName);
                    } else {
                        skipped++;
                    }
                } else {
                    // Chưa tồn tại -> Tạo mới (mặc định INACTIVE)
                    TradingSymbol newSymbol = TradingSymbol.builder()
                        .symbol(symbolName)
                        .name(formatName(baseAsset))
                        .icon(CRYPTO_ICONS.getOrDefault(baseAsset, "●"))
                        .description(baseAsset + " to USDT")
                        .active(false) // ⚠️ MẶC ĐỊNH TẮT - Admin phải bật thủ công
                        .displayOrder(999)
                        .build();
                    
                    symbolRepository.save(newSymbol);
                    added++;
                    log.debug("Added new symbol: {}", symbolName);
                }
            }

            log.info("✅ Sync completed: {} added, {} updated, {} skipped", added, updated, skipped);

            return SyncResult.builder()
                .success(true)
                .message("Sync completed successfully")
                .totalSymbols(usdtPairs.size())
                .added(added)
                .updated(updated)
                .skipped(skipped)
                .build();

        } catch (Exception e) {
            log.error("❌ Error syncing symbols from Binance", e);
            return SyncResult.builder()
                .success(false)
                .message("Error: " + e.getMessage())
                .build();
        }
    }

    /**
     * Format base asset thành tên đẹp
     * BTC -> Bitcoin, ETH -> Ethereum, etc.
     */
    private String formatName(String baseAsset) {
        Map<String, String> names = new HashMap<>();
        names.put("BTC", "Bitcoin");
        names.put("ETH", "Ethereum");
        names.put("BNB", "BNB");
        names.put("SOL", "Solana");
        names.put("ADA", "Cardano");
        names.put("XRP", "Ripple");
        names.put("DOGE", "Dogecoin");
        names.put("DOT", "Polkadot");
        names.put("MATIC", "Polygon");
        names.put("AVAX", "Avalanche");
        names.put("LINK", "Chainlink");
        names.put("UNI", "Uniswap");
        names.put("ATOM", "Cosmos");
        names.put("LTC", "Litecoin");
        names.put("BCH", "Bitcoin Cash");
        names.put("XLM", "Stellar");
        names.put("ALGO", "Algorand");
        names.put("VET", "VeChain");
        
        return names.getOrDefault(baseAsset, baseAsset);
    }

    // Result DTO
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SyncResult {
        private boolean success;
        private String message;
        private int totalSymbols;
        private int added;
        private int updated;
        private int skipped;
    }
}