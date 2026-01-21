package com.crypto.market_service.controllers;

import com.crypto.market_service.entity.Kline;
import com.crypto.market_service.service.KlineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/market")
@RequiredArgsConstructor // Tự động Inject Service (thay cho @Autowired)
public class MarketController {

    private final KlineService klineService;

    @GetMapping("/klines")
    public ResponseEntity<List<Kline>> getKlines(
            @RequestParam(name = "symbol") String symbol,
            @RequestParam(name = "interval", defaultValue = "1m") String interval, // Tạm thời chưa dùng, để sẵn
            @RequestParam(name = "limit", defaultValue = "100") int limit
    ) {
        // Gọi Service lấy dữ liệu
        List<Kline> klines = klineService.getKlines(symbol, limit);
        return ResponseEntity.ok(klines);
    }
}