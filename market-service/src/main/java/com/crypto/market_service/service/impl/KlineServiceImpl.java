package com.crypto.market_service.service.impl;

import com.crypto.market_service.entity.Kline;
import com.crypto.market_service.repository.KlineRepository;
import com.crypto.market_service.service.KlineService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class KlineServiceImpl implements KlineService {
    KlineRepository klineRepository;

    @Override
    public List<Kline> getKlines(String symbol, String interval, int limit) {
        // Tạo Pageable để lấy 'limit' dòng đầu tiên
        Pageable pageable = PageRequest.of(0, limit);

        // Lấy dữ liệu từ DB (Đang xếp từ Mới -> Cũ)
        List<Kline> klines = klineRepository.findBySymbolAndIntervalOrderByCloseTimeDesc(symbol.toUpperCase(), interval, pageable);

        // Đảo ngược lại danh sách (thành Cũ -> Mới) để Frontend vẽ từ trái sang phải
        Collections.reverse(klines);

        return klines;
    }
}
