// ============================================
// File: market-service/src/main/java/com/crypto/market_service/service/SymbolManagementService.java
// ============================================
package com.crypto.market_service.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.crypto.market_service.dto.CreateSymbolRequest;
import com.crypto.market_service.dto.SymbolDTO;
import com.crypto.market_service.dto.UpdateSymbolRequest;
import com.crypto.market_service.entity.TradingSymbol;
import com.crypto.market_service.repository.TradingSymbolRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class SymbolManagementService {

    private final TradingSymbolRepository symbolRepository;

    /**
     * Lấy tất cả symbols
     */
    public List<SymbolDTO> getAllSymbols() {
        return symbolRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc()
                .stream()
                .map(SymbolDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Lấy chỉ symbols đang active
     */
    public List<SymbolDTO> getActiveSymbols() {
        return symbolRepository.findByActiveTrueOrderByDisplayOrderAscCreatedAtDesc()
                .stream()
                .map(SymbolDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Lấy một symbol theo tên
     */
    public SymbolDTO getSymbol(String symbol) {
        return symbolRepository.findBySymbol(symbol.toUpperCase())
                .map(SymbolDTO::fromEntity)
                .orElse(null);
    }

    /**
     * Tạo symbol mới
     */
    @Transactional
    public SymbolDTO createSymbol(CreateSymbolRequest request) {
        String symbolUpper = request.getSymbol().toUpperCase();

        if (symbolRepository.existsBySymbol(symbolUpper)) {
            throw new IllegalArgumentException("Symbol " + symbolUpper + " already exists");
        }

        TradingSymbol symbol = TradingSymbol.builder()
                .symbol(symbolUpper)
                .name(request.getName())
                .icon(request.getIcon() != null ? request.getIcon() : "●")
                .description(request.getDescription())
                .active(false) // Mặc định tắt
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 999)
                .build();

        TradingSymbol saved = symbolRepository.save(symbol);
        log.info("Created new symbol: {}", symbolUpper);

        return SymbolDTO.fromEntity(saved);
    }

    /**
     * Cập nhật symbol
     */
    @Transactional
    public SymbolDTO updateSymbol(String symbol, UpdateSymbolRequest request) {
        TradingSymbol existing = symbolRepository.findBySymbol(symbol.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Symbol not found: " + symbol));

        if (request.getName() != null) {
            existing.setName(request.getName());
        }
        if (request.getIcon() != null) {
            existing.setIcon(request.getIcon());
        }
        if (request.getDescription() != null) {
            existing.setDescription(request.getDescription());
        }
        if (request.getActive() != null) {
            existing.setActive(request.getActive());
        }
        if (request.getDisplayOrder() != null) {
            existing.setDisplayOrder(request.getDisplayOrder());
        }

        TradingSymbol saved = symbolRepository.save(existing);
        log.info("Updated symbol: {}", symbol);

        return SymbolDTO.fromEntity(saved);
    }

    /**
     * Xóa symbol
     */
    @Transactional
    public void deleteSymbol(String symbol) {
        TradingSymbol existing = symbolRepository.findBySymbol(symbol.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Symbol not found: " + symbol));

        symbolRepository.delete(existing);
        log.info("Deleted symbol: {}", symbol);
    }

    /**
     * Bật/tắt symbol
     */
    @Transactional
    public SymbolDTO toggleSymbolActive(String symbol) {
        TradingSymbol existing = symbolRepository.findBySymbol(symbol.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Symbol not found: " + symbol));

        existing.setActive(!existing.getActive());
        TradingSymbol saved = symbolRepository.save(existing);

        log.info("Toggled symbol {}: active={}", symbol, saved.getActive());

        return SymbolDTO.fromEntity(saved);
    }
}