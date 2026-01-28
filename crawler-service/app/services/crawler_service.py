from typing import Optional, Dict
from sqlalchemy.orm import Session
from loguru import logger

from app.config import settings
from app.crawlers.rule_parser import RuleBasedParser
from app.crawlers.gemini_parser import GeminiParser
from app.crawlers.sources import get_source_config
from app import models


class CrawlerService:
    """
    Orchestrates crawling with hybrid parsing strategy:
    1. Try rule-based parsing first (fast, cheap)
    2. Fallback to Gemini AI if rules fail (adaptive, expensive)
    """
    
    def __init__(self):
        self.rule_parser = RuleBasedParser()
        self.gemini_parser = GeminiParser()
    
    async def crawl_and_save(self, url: str, source: str, db: Session, force_gemini: bool = False):
        # Check if already crawled
        existing = db.query(models.News).filter(models.News.url == url).first()
        if existing:
            return {'status': 'skipped', 'message': 'URL already crawled'}
        
        parsed_data = None
        parse_method = None
        gemini_used = False
        
        try:
            if not force_gemini:
                # Try adaptive semantic parsing first
                logger.info(f"🔍 Trying adaptive parser for {url}")
                parsed_data = self.adaptive_parser.parse_article(url, source, html=None)
                
                if parsed_data and parsed_data.get('parse_method') == 'semantic':
                    parse_method = 'semantic'
                    logger.info(f"✅ Semantic parsing successful for {url}")
            
            # Fallback to Gemini if needed
            if not parsed_data:
                if not settings.USE_GEMINI_FALLBACK:
                    logger.error(f"❌ Semantic parsing failed and Gemini disabled for {url}")
                    return {'status': 'failed', 'error': 'parsing_failed'}
                
                logger.info(f"🤖 Falling back to Gemini AI for {url}")
                parsed_data = self.gemini_parser.parse_article(url, source, db=db)
                gemini_used = True
                
                if parsed_data:
                    parse_method = 'gemini'
                    logger.info(f"✅ Gemini parsing successful for {url}")
            
            if not parsed_data:
                return {'status': 'failed', 'error': 'all_parsers_failed'}
            
            # Save to database
            news = models.News(**parsed_data)
            db.add(news)
            db.commit()
            db.refresh(news)
            
            return {
                'status': 'success',
                'message': 'Article crawled and saved successfully',
                'news_id': news.id,
                'parse_method': parse_method,
                'gemini_used': gemini_used
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error during crawl: {str(e)}")
            return {'status': 'failed', 'error': str(e)}
    
    async def crawl_batch(
        self,
        urls: list,
        source: str,
        db: Session
    ) -> Dict:
        """
        Crawl multiple URLs from the same source
        
        Args:
            urls: List of article URLs
            source: Source name
            db: Database session
            
        Returns:
            Summary statistics
        """
        results = {
            'total': len(urls),
            'success': 0,
            'skipped': 0,
            'failed': 0,
            'details': []
        }
        
        for url in urls:
            result = await self.crawl_and_save(url, source, db)
            
            if result['status'] == 'success':
                results['success'] += 1
            elif result['status'] == 'skipped':
                results['skipped'] += 1
            else:
                results['failed'] += 1
            
            results['details'].append({
                'url': url,
                'status': result['status'],
                'news_id': result.get('news_id')
            })
        
        logger.info(f"Batch crawl complete: {results['success']}/{results['total']} succeeded")
        return results