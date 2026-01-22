package com.crypto.market_service.service;

import com.crypto.market_service.entity.Kline;

import java.util.List;

public interface KlineService {
    List<Kline> getKlines(String symbol, String interval, int limit);
}
