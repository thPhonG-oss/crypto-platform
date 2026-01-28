package com.crypto.market_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.crypto.market_service.entity.TradingSymbol;

@Repository
public interface TradingSymbolRepository extends JpaRepository<TradingSymbol, Long> {
    
    Optional<TradingSymbol> findBySymbol(String symbol);
    
    List<TradingSymbol> findByActiveTrue();
    
    List<TradingSymbol> findAllByOrderByDisplayOrderAscCreatedAtDesc();
    
    List<TradingSymbol> findByActiveTrueOrderByDisplayOrderAscCreatedAtDesc();
    
    boolean existsBySymbol(String symbol);
}
