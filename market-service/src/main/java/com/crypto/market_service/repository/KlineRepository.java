package com.crypto.market_service.repository;

import com.crypto.market_service.entity.Kline;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface KlineRepository extends JpaRepository<Kline, Long> {
    Optional<Kline> findBySymbolAndIntervalAndOpenTime(String symbol, String interval, LocalDateTime openTime);
    List<Kline> findBySymbolOrderByCloseTimeDesc(String symbol, Pageable pageable);
}
