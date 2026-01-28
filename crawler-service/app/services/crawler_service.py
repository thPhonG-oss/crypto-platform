from typing import Optional, Dict
from sqlalchemy.orm import Session
from loguru import logger

from app.config import settings
from app.crawlers.rule_parser import RuleBasedParser
from app.crawlers.gemini_parser import GeminiParser
from app.crawlers.sources import get_source_config
from app import models
from app.parsers.adaptive_parser import AdaptiveParser


class CrawlerService:
    """
    Orchestrates crawling with hybrid parsing strategy:
    1. Try rule-based parsing first (fast, cheap)
    2. Fallback to Gemini AI if rules fail (adaptive, expensive)
    """
    
    def __init__(self):
        self.rule_parser = RuleBasedParser()
        self.gemini_parser = GeminiParser()
        # ✅ FIX: Initialize adaptive parser
        self.adaptive_parser = AdaptiveParser(self.gemini_parser)
        logger.info("✅ CrawlerService initialized with adaptive parser")
    
    async def crawl_and_save(
        self,
        url: str,
        source: str,
        db: Session,
        force_gemini: bool = False
    ) -> Dict:
        """Main crawling method with hybrid parsing"""
        # Check if already crawled
        existing = db.query(models.News).filter(models.News.url == url).first()
        if existing:
            logger.info(f"⏭️ URL already exists: {url}")
            return {
                'status': 'skipped',
                'message': 'URL already crawled',
                'news_id': existing.id,
                'parse_method': existing.parse_method
            }
        
        parsed_data = None
        parse_method = None
        gemini_used = False
        
        try:
            # ✅ FIX: Fetch HTML ONCE
            logger.info(f"🌐 Fetching HTML from {url}")
            html = self.rule_parser.fetch_html(url)
            
            if not html:
                return {'status': 'failed', 'error': 'fetch_failed'}
            
            # Strategy 1: Adaptive semantic parsing
            if not force_gemini:
                logger.info(f"🔍 Trying adaptive parser for {url}")
                # ✅ FIX: Pass html
                parsed_data = self.adaptive_parser.parse_article(url, source, html)
                
                if parsed_data:
                    parse_method = parsed_data.get('parse_method', 'semantic')
                    logger.info(f"✅ Adaptive parsing successful for {url}")
            
            # Strategy 2: Gemini fallback
            if not parsed_data:
                if not settings.USE_GEMINI_FALLBACK:
                    return {'status': 'failed', 'error': 'parsing_failed'}
                
                logger.info(f"🤖 Falling back to Gemini for {url}")
                parsed_data = self.gemini_parser.parse_article(url, source, html=html, db=db)
                gemini_used = True
                
                if parsed_data:
                    parse_method = 'gemini'
            
            if not parsed_data:
                return {'status': 'failed', 'error': 'all_parsers_failed'}
            
            # Save to database
            news = models.News(**parsed_data)
            db.add(news)
            db.commit()
            db.refresh(news)
            
            return {
                'status': 'success',
                'message': 'Article crawled successfully',
                'news_id': news.id,
                'parse_method': parse_method,
                'gemini_used': gemini_used
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error during crawl: {str(e)}")
            return {'status': 'failed', 'error': str(e)}
    
    async def crawl_batch(self, urls: list, source: str, db: Session) -> Dict:
        """Crawl multiple URLs"""
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
        
        logger.info(f"Batch: {results['success']}/{results['total']} succeeded")
        return results
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