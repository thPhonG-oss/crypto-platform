package com.crypto.market_service.controllers;

import com.crypto.market_service.dto.ApiResponse;
import com.crypto.market_service.dto.CreateSymbolRequest;
import com.crypto.market_service.dto.SymbolDTO;
import com.crypto.market_service.dto.UpdateSymbolRequest;
import com.crypto.market_service.service.BinanceSymbolSyncService;
import com.crypto.market_service.service.SymbolManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/market/symbols")
@RequiredArgsConstructor
public class SymbolController {

    private final SymbolManagementService symbolService;
    private final BinanceSymbolSyncService syncService;

    /**
     * GET /api/v1/market/symbols - Lấy tất cả symbols
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SymbolDTO>>> getAllSymbols(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly
    ) {
        List<SymbolDTO> symbols = activeOnly 
            ? symbolService.getActiveSymbols() 
            : symbolService.getAllSymbols();
        
        return ResponseEntity.ok(ApiResponse.<List<SymbolDTO>>builder()
                .success(true)
                .message("Symbols retrieved successfully")
                .data(symbols)
                .build());
    }

    /**
     * GET /api/v1/market/symbols/active - Lấy symbols đang active
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<SymbolDTO>>> getActiveSymbols() {
        List<SymbolDTO> symbols = symbolService.getActiveSymbols();
        return ResponseEntity.ok(ApiResponse.<List<SymbolDTO>>builder()
                .success(true)
                .message("Active symbols retrieved")
                .data(symbols)
                .build());
    }

    /**
     * GET /api/v1/market/symbols/{symbol} - Lấy một symbol
     */
    @GetMapping("/{symbol}")
    public ResponseEntity<ApiResponse<SymbolDTO>> getSymbol(@PathVariable String symbol) {
        SymbolDTO symbolDTO = symbolService.getSymbol(symbol);
        if (symbolDTO == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.<SymbolDTO>builder()
                .success(true)
                .message("Symbol found")
                .data(symbolDTO)
                .build());
    }

    /**
     * POST /api/v1/market/symbols - Tạo symbol mới
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SymbolDTO>> createSymbol(@RequestBody CreateSymbolRequest request) {
        try {
            SymbolDTO created = symbolService.createSymbol(request);
            return ResponseEntity.ok(ApiResponse.<SymbolDTO>builder()
                    .success(true)
                    .message("Symbol created successfully")
                    .data(created)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<SymbolDTO>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    /**
     * PUT /api/v1/market/symbols/{symbol} - Cập nhật symbol
     */
    @PutMapping("/{symbol}")
    public ResponseEntity<ApiResponse<SymbolDTO>> updateSymbol(
            @PathVariable String symbol,
            @RequestBody UpdateSymbolRequest request
    ) {
        try {
            SymbolDTO updated = symbolService.updateSymbol(symbol, request);
            return ResponseEntity.ok(ApiResponse.<SymbolDTO>builder()
                    .success(true)
                    .message("Symbol updated successfully")
                    .data(updated)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<SymbolDTO>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    /**
     * DELETE /api/v1/market/symbols/{symbol} - Xóa symbol
     */
    @DeleteMapping("/{symbol}")
    public ResponseEntity<ApiResponse<Void>> deleteSymbol(@PathVariable String symbol) {
        try {
            symbolService.deleteSymbol(symbol);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Symbol deleted successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<Void>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    /**
     * PATCH /api/v1/market/symbols/{symbol}/toggle - Bật/tắt symbol
     */
    @PatchMapping("/{symbol}/toggle")
    public ResponseEntity<ApiResponse<SymbolDTO>> toggleSymbol(@PathVariable String symbol) {
        try {
            SymbolDTO toggled = symbolService.toggleSymbolActive(symbol);
            return ResponseEntity.ok(ApiResponse.<SymbolDTO>builder()
                    .success(true)
                    .message("Symbol toggled successfully")
                    .data(toggled)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.<SymbolDTO>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    /**
     * ✨ NEW: POST /api/v1/market/symbols/sync - Đồng bộ symbols từ Binance
     * Fetch tất cả USDT pairs từ Binance API và lưu vào DB
     */
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<BinanceSymbolSyncService.SyncResult>> syncFromBinance() {
        try {
            BinanceSymbolSyncService.SyncResult result = syncService.syncSymbolsFromBinance();
            
            return ResponseEntity.ok(ApiResponse.<BinanceSymbolSyncService.SyncResult>builder()
                    .success(result.isSuccess())
                    .message(result.getMessage())
                    .data(result)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<BinanceSymbolSyncService.SyncResult>builder()
                            .success(false)
                            .message("Sync failed: " + e.getMessage())
                            .build());
        }
    }
}