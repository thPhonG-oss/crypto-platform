from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from loguru import logger  # ✅ ADD: Missing import
from app.database import SessionLocal
from app import models


class CrawlerHealthChecker:
    """
    Tự động phát hiện và fix broken selectors
    """
    
    def __init__(self, db: Session = None):
        self.db = db or SessionLocal()
    
    async def check_parser_health(self):
        """
        Check parsing success rate per source
        """
        try:
            # Get recent crawl stats (last 24h)
            stats = self.db.query(
                models.News.source,
                models.News.parse_method,
                func.count(models.News.id).label('count')
            ).filter(
                models.News.crawled_at >= datetime.now() - timedelta(days=1)
            ).group_by(
                models.News.source,
                models.News.parse_method
            ).all()
            
            if not stats:
                logger.info("No crawl stats available for health check")
                return
            
            # Analyze stats
            for stat in stats:
                source = stat.source
                gemini_rate = self._get_gemini_rate(source, stats)
                
                if gemini_rate > 0.5:  # >50% sử dụng Gemini
                    logger.warning(f"⚠️ High Gemini usage for {source}: {gemini_rate:.1%}")
                    logger.warning(f"   → Selectors may be broken, consider updating")
                    
                    # Trigger alert
                    await self._send_alert(source, gemini_rate)
        
        except Exception as e:
            logger.error(f"Health check error: {e}")
    
    def _get_gemini_rate(self, source: str, stats: List) -> float:
        """Calculate percentage of articles using Gemini for a source"""
        total = sum(s.count for s in stats if s.source == source)
        gemini_count = sum(
            s.count 
            for s in stats 
            if s.source == source and s.parse_method == 'gemini'
        )
        
        return gemini_count / total if total > 0 else 0
    
    async def _send_alert(self, source: str, gemini_rate: float):
        """Send alert via Slack/Email/etc."""
        message = f"""
        ⚠️ Crawler Alert: High Gemini Usage
        
        Source: {source}
        Gemini Usage: {gemini_rate:.1%}
        
        Possible causes:
        - Website HTML structure changed
        - CSS selectors outdated
        - Increased anti-scraping measures
        
        Action required: Update selectors in sources.py
        """
        logger.warning(message)
        
        # TODO: Integrate với Slack/Email
        # Example:
        # await self._send_slack_alert(message)
        # await self._send_email_alert(message)