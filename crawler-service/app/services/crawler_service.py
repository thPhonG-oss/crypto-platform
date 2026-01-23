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
    
    async def crawl_and_save(
        self,
        url: str,
        source: str,
        db: Session,
        force_gemini: bool = False
    ) -> Dict:
        """
        Main crawling method with hybrid parsing
        
        Args:
            url: Article URL
            source: Source name
            db: Database session
            force_gemini: Skip rule-based, go straight to Gemini
            
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
        
        # Initialize result
        parsed_data = None
        parse_method = None
        error_msg = None
        
        try:
            # Strategy 1: Try rule-based parsing first (unless forced)
            if not force_gemini and get_source_config(source):
                logger.info(f"Trying rule-based parsing for {url}")
                parsed_data = self.rule_parser.parse_article(url, source)
                
                if parsed_data:
                    parse_method = 'rule'
                    logger.info(f"✅ Rule-based parsing successful")
                else:
                    logger.info(f"⚠️ Rule-based parsing failed, falling back to Gemini")
            
            # Strategy 2: Fallback to Gemini AI
            if not parsed_data and settings.USE_GEMINI_FALLBACK:
                logger.info(f"🤖 Using Gemini AI parser for {url}")
                parsed_data = self.gemini_parser.parse_article(url, source, db=db)
                
                if parsed_data:
                    parse_method = 'gemini'
                    logger.info(f"✅ Gemini parsing successful")
            
            # If both methods failed
            if not parsed_data:
                error_msg = "Both rule-based and Gemini parsing failed"
                logger.error(error_msg)
                return {
                    'status': 'failed',
                    'message': error_msg,
                    'error': 'parsing_failed'
                }
            
            # Save to database
            news = models.News(
                title=parsed_data['title'],
                content=parsed_data['content'],
                summary=parsed_data.get('summary'),
                url=url,
                source=source,
                author=parsed_data.get('author'),
                published_at=parsed_data.get('published_at'),
                related_symbols=parsed_data.get('related_symbols'),
                parse_method=parse_method,
                is_valid=True
            )
            
            db.add(news)
            db.commit()
            db.refresh(news)
            
            logger.info(f"💾 Saved news article: {news.id} - {news.title[:50]}...")
            
            return {
                'status': 'success',
                'message': 'Article crawled and saved successfully',
                'news_id': news.id,
                'parse_method': parse_method
            }
            
        except Exception as e:
            db.rollback()
            error_msg = f"Error during crawl: {str(e)}"
            logger.error(error_msg)
            return {
                'status': 'failed',
                'message': error_msg,
                'error': str(e)
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