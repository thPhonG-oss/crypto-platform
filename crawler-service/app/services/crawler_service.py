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
    
    async def crawl_and_save(
        self,
        url: str,
        source: str,
        db: Session,
        force_gemini: bool = False
    ) -> Dict:
        """
        Main crawling method with hybrid parsing
        
        Returns:
            Dict with status and result
        """
        # Check if already crawled
        existing = db.query(models.News).filter(models.News.url == url).first()
        if existing:
            logger.info(f"URL already exists: {url}")
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
            # Fetch HTML once
            html = self.rule_parser.fetch_html(url)
            if not html:
                return {
                    'status': 'failed',
                    'error': 'Failed to fetch HTML'
                }
            
            if not force_gemini:
                # ✅ Strategy 1: Try adaptive semantic parsing first
                logger.info(f"🔍 Trying adaptive semantic parser for {url}")
                parsed_data = self.adaptive_parser.parse_article(url, source, html)
                
                if parsed_data:
                    parse_method = parsed_data.get('parse_method', 'semantic')
                    logger.info(f"✅ Adaptive parsing successful ({parse_method}) for {url}")
                else:
                    logger.info(f"⚠️ Adaptive parsing failed for {url}")
            
            # ✅ Strategy 2: Fallback to Gemini AI
            if not parsed_data:
                if not settings.USE_GEMINI_FALLBACK:
                    logger.error(f"❌ Semantic parsing failed and Gemini disabled for {url}")
                    return {
                        'status': 'failed',
                        'error': 'parsing_failed',
                        'message': 'Semantic parsing failed and Gemini fallback disabled'
                    }
                
                logger.info(f"🤖 Falling back to Gemini AI for {url}")
                parsed_data = self.gemini_parser.parse_article(url, source, html=html, db=db)
                gemini_used = True
                
                if parsed_data:
                    parse_method = 'gemini'
                    logger.info(f"✅ Gemini parsing successful for {url}")
            
            if not parsed_data:
                return {
                    'status': 'failed',
                    'error': 'all_parsers_failed',
                    'message': 'Both semantic and Gemini parsers failed'
                }
            
            # Save to database
            news = models.News(**parsed_data)
            db.add(news)
            db.commit()
            db.refresh(news)
            
            logger.info(f"💾 Saved news article: {news.id} - {news.title[:50]}...")
            
            return {
                'status': 'success',
                'message': 'Article crawled and saved successfully',
                'news_id': news.id,
                'parse_method': parse_method,
                'gemini_used': gemini_used
            }
            
        except Exception as e:
            db.rollback()
            error_msg = f"Error during crawl: {str(e)}"
            logger.error(error_msg)
            return {
                'status': 'failed',
                'error': str(e),
                'message': error_msg
            }
    
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