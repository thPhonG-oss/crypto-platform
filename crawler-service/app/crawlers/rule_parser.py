from bs4 import BeautifulSoup
from typing import Optional, Dict
from datetime import datetime
from loguru import logger
from app.crawlers.base_crawler import BaseCrawler
from app.crawlers.sources import NEWS_SOURCES


class RuleBasedParser(BaseCrawler):
    """
    Rule-based parser using CSS selectors
    Fast but fragile - breaks when HTML structure changes
    """
    
    def parse_article(self, url: str, source: str) -> Optional[Dict]:
        """
        Parse article using predefined CSS selectors
        
        Args:
            url: Article URL
            source: Source name (must be in NEWS_SOURCES)
            
        Returns:
            Dict with extracted data or None if parsing failed
        """
        # Get source configuration
        source_config = NEWS_SOURCES.get(source.lower())
        if not source_config:
            logger.warning(f"No rule config for source: {source}")
            return None
        
        # Fetch HTML
        html = self.fetch_html(url)
        if not html:
            return None
        
        soup = self.parse_html(html)
        
        # Extract using selectors
        try:
            result = {
                'title': self._extract_by_selector(soup, source_config['selectors']['title']),
                'content': self._extract_by_selector(soup, source_config['selectors']['content']),
                'author': self._extract_by_selector(soup, source_config['selectors'].get('author')),
                'published_at': self._extract_date(soup, source_config['selectors'].get('date')),
                'url': url,
                'source': source,
                'parse_method': 'rule'
            }
            
            # Validate required fields
            if not result['title'] or not result['content']:
                logger.warning(f"Rule parsing failed for {url}: Missing title or content")
                return None
            
            # Extract metadata as fallback
            metadata = self.extract_metadata(soup)
            if not result['author'] and 'author' in metadata:
                result['author'] = metadata['author']
            
            logger.info(f"✅ Rule parsing successful for {url}")
            return result
            
        except Exception as e:
            logger.error(f"Rule parsing error for {url}: {str(e)}")
            return None
    
    def _extract_by_selector(self, soup: BeautifulSoup, selector: Optional[str]) -> Optional[str]:
        """Extract text using CSS selector"""
        if not selector:
            return None
        
        try:
            # Try multiple selector strategies
            element = soup.select_one(selector)
            if element:
                # Get all text, join paragraphs
                if selector.endswith('content') or 'article' in selector:
                    # For content, get all paragraphs
                    paragraphs = element.find_all(['p', 'div'])
                    text = '\n\n'.join([self.clean_text(p.get_text()) for p in paragraphs])
                else:
                    text = self.clean_text(element.get_text())
                return text if text else None
        except Exception as e:
            logger.debug(f"Selector extraction failed: {str(e)}")
        
        return None
    
    def _extract_date(self, soup: BeautifulSoup, selector: Optional[str]) -> Optional[datetime]:
        """Extract and parse date"""
        if not selector:
            # Try metadata fallback
            metadata = self.extract_metadata(soup)
            if 'published_time' in metadata:
                return self._parse_date(metadata['published_time'])
            return None
        
        try:
            element = soup.select_one(selector)
            if element:
                # Try datetime attribute first
                date_str = element.get('datetime') or element.get_text()
                return self._parse_date(date_str)
        except Exception as e:
            logger.debug(f"Date extraction failed: {str(e)}")
        
        return None
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string to datetime"""
        if not date_str:
            return None
        
        from dateutil import parser
        try:
            return parser.parse(date_str)
        except Exception as e:
            logger.debug(f"Date parsing failed for '{date_str}': {str(e)}")
            return None