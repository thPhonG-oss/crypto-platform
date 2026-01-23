from typing import Dict, List, Optional
from loguru import logger
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.models import News, Kline, NewsCorrelation


class CorrelationService:
    """
    Service for correlating news sentiment with price movements
    """
    
    def align_news_with_price(self, news_id: int, db: Session) -> Optional[Dict]:
        """
        Find price data around news publication and calculate correlation
        """
        news = db.query(News).filter(News.id == news_id).first()
        
        if not news or not news.published_at or not news.related_symbols:
            return None
        
        if news.sentiment_score is None:
            logger.warning(f"News {news_id} has no sentiment score yet")
            return None
        
        symbols = [s.strip().upper() for s in news.related_symbols.split(',')]
        results = []
        
        for symbol in symbols:
            correlation = self._calculate_correlation(news, symbol, db)
            if correlation:
                results.append(correlation)
        
        return {
            "news_id": news_id,
            "correlations": results
        }
    
    def _calculate_correlation(self, news: News, symbol: str, db: Session) -> Optional[Dict]:
        """
        Calculate price correlation for a specific symbol
        """
        # Convert timezone-aware published_at to naive datetime for comparison if needed
        # (Assuming Kline uses naive local time or UTC as stored)
        pub_time = news.published_at
        if pub_time.tzinfo is not None:
             pub_time = pub_time.replace(tzinfo=None)
        
        # Construct the trading pair (e.g., BTC -> BTCUSDT if not already)
        trading_pair = f"{symbol}USDT" if not symbol.endswith("USDT") and not symbol.endswith("BTC") else symbol
        # Simple heuristic: most symbols in our DB are likely BTCUSDT, etc.
        # If symbol is already BTCUSDT, leave it. If BTC, add USDT.
        
        try:
            # Get price 1h BEFORE news
            price_before_record = db.query(Kline).filter(
                Kline.symbol == trading_pair,
                Kline.close_time <= pub_time,
                Kline.interval == '1h'
            ).order_by(Kline.close_time.desc()).first()
            
            # Get price 1h AFTER news
            price_after_record = db.query(Kline).filter(
                Kline.symbol == trading_pair,
                Kline.close_time >= pub_time,
                Kline.interval == '1h'
            ).order_by(Kline.close_time.asc()).first()
            
            if not price_before_record or not price_after_record:
                # Try raw symbol if trading pair didn't work?
                # For now, just logging debug
                # logger.debug(f"No price data found for {trading_pair} around {pub_time}")
                return None
            
            # Calculate price change percentage
            price_before = float(price_before_record.close_price)
            price_after = float(price_after_record.close_price)
            
            if price_before == 0:
                return None
            
            change_pct = ((price_after - price_before) / price_before) * 100
            
            # Check if correlation already exists
            existing = db.query(NewsCorrelation).filter(
                NewsCorrelation.news_id == news.id,
                NewsCorrelation.symbol == symbol
            ).first()
            
            if existing:
                # Update existing
                existing.price_before = price_before
                existing.price_after = price_after
                existing.price_change_pct = round(change_pct, 4)
                existing.sentiment_score = news.sentiment_score
            else:
                # Create new correlation
                correlation = NewsCorrelation(
                    news_id=news.id,
                    symbol=symbol,
                    price_before=price_before,
                    price_after=price_after,
                    price_change_pct=round(change_pct, 4),
                    sentiment_score=news.sentiment_score
                )
                db.add(correlation)
            
            db.commit()
            
            return {
                "symbol": symbol,
                "price_before": price_before,
                "price_after": price_after,
                "price_change_pct": round(change_pct, 4),
                "sentiment_score": news.sentiment_score
            }
            
        except Exception as e:
            logger.error(f"Error calculating correlation for {symbol}: {e}")
            db.rollback()
            return None
    
    def process_pending_correlations(self, db: Session, limit: int = 100) -> Dict:
        """
        Process all analyzed news that don't have correlations yet
        """
        # Optimized: Find news that HAVE sentiment but are NOT in correlation table
        # This is a bit complex in pure ORM, so we might iterate or use NOT IN
        
        subquery = db.query(NewsCorrelation.news_id).distinct()
        
        pending = db.query(News).filter(
            News.sentiment_score.isnot(None),
            News.related_symbols.isnot(None),
            News.published_at.isnot(None),
            ~News.id.in_(subquery)
        ).limit(limit).all()
        
        if not pending:
            return {"processed": 0, "success": 0, "failed": 0}
        
        logger.info(f"Processing correlations for {len(pending)} news articles...")
        
        success = 0
        failed = 0
        
        for news in pending:
            try:
                result = self.align_news_with_price(news.id, db)
                if result and result.get("correlations"):
                    success += 1
                else:
                    # If no correlations found (e.g. missing price data), we count as failed?
                    # Or maybe we successfully processed it but found no correlation.
                    # For metrics, let's say failed if it crashed, but here we just check result.
                    failed += 1 
            except Exception as e:
                failed += 1
                logger.error(f"Failed correlation for news {news.id}: {e}")
        
        return {
            "processed": len(pending),
            "success": success,
            "failed": failed
        }
    
    def get_correlations_by_symbol(
        self, 
        db: Session, 
        symbol: Optional[str] = None, 
        limit: int = 100
    ) -> List[Dict]:
        """
        Get correlation data, optionally filtered by symbol
        """
        query = db.query(NewsCorrelation)
        
        if symbol:
            query = query.filter(NewsCorrelation.symbol == symbol.upper())
        
        correlations = query.order_by(
            NewsCorrelation.created_at.desc()
        ).limit(limit).all()
        
        return [
            {
                "news_id": c.news_id,
                "symbol": c.symbol,
                "price_before": float(c.price_before) if c.price_before else None,
                "price_after": float(c.price_after) if c.price_after else None,
                "price_change_pct": float(c.price_change_pct) if c.price_change_pct else None,
                "sentiment_score": c.sentiment_score,
                "created_at": c.created_at
            }
            for c in correlations
        ]
    
    def get_sentiment_stats(self, db: Session, symbol: Optional[str] = None) -> Dict:
        """
        Get aggregate sentiment statistics
        """
        query = db.query(News).filter(News.sentiment_score.isnot(None))
        
        if symbol:
            query = query.filter(News.related_symbols.ilike(f"%{symbol}%"))
        
        total_analyzed = query.count()
        
        if total_analyzed == 0:
            return {
                "symbol": symbol,
                "total_articles": 0,
                "analyzed_articles": 0,
                "positive_count": 0,
                "negative_count": 0,
                "neutral_count": 0
            }
        
        positive = query.filter(News.sentiment_label == "positive").count()
        negative = query.filter(News.sentiment_label == "negative").count()
        neutral = query.filter(News.sentiment_label == "neutral").count()
        
        avg_result = db.query(func.avg(News.sentiment_score)).filter(News.sentiment_score.isnot(None))
        if symbol:
            avg_result = avg_result.filter(News.related_symbols.ilike(f"%{symbol}%"))
        avg_score = avg_result.scalar()
        
        return {
            "symbol": symbol,
            "total_articles": db.query(News).count(), # Total including unanalyzed? Or maybe just total relevant
            "analyzed_articles": total_analyzed,
            "average_sentiment": round(float(avg_score), 4) if avg_score else None,
            "positive_count": positive,
            "negative_count": negative,
            "neutral_count": neutral
        }


# Singleton instance
correlation_service = CorrelationService()
