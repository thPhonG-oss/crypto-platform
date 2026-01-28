from typing import Optional, Dict, List
from bs4 import BeautifulSoup
import re

class AdaptiveParser:
    """
    Parser thích nghi với nhiều chiến lược fallback
    """
    
    def __init__(self, gemini_parser):
        self.gemini_parser = gemini_parser
        self.success_cache = {}  # Cache selectors thành công
    
    def parse_article(self, url: str, source: str, html: str) -> Optional[Dict]:
        """
        Parse với fallback chain:
        1. Cached selector (nhanh nhất)
        2. Semantic HTML
        3. OpenGraph/Meta tags
        4. Pattern matching
        5. Gemini AI (chậm nhất, đắt nhất)
        """
        soup = BeautifulSoup(html, 'lxml')
        
        # Strategy 1: Cached selector (từ lần parse thành công trước)
        if source in self.success_cache:
            result = self._try_cached_selectors(soup, source)
            if result:
                return result
        
        # Strategy 2: Semantic HTML + Heuristics
        result = self._semantic_parse(soup, url, source)
        if self._is_valid_result(result):
            self._update_cache(source, result)
            return result
        
        # Strategy 3: Gemini AI (Last resort)
        logger.warning(f"Semantic parsing failed for {url}, using Gemini AI")
        return self.gemini_parser.parse_article(url, source, html)
    
    def _semantic_parse(self, soup: BeautifulSoup, url: str, source: str) -> Dict:
        """
        Parse dựa trên cấu trúc HTML semantic và heuristics
        """
        return {
            'title': self._extract_title(soup),
            'content': self._extract_content(soup),
            'author': self._extract_author(soup),
            'published_at': self._extract_date(soup),
            'url': url,
            'source': source,
            'parse_method': 'semantic'
        }
    
    def _extract_title(self, soup: BeautifulSoup) -> Optional[str]:
        """
        Multiple strategies để extract title
        """
        strategies = [
            # 1. Semantic HTML
            lambda: soup.select_one("article h1"),
            lambda: soup.select_one("h1[itemprop='headline']"),
            
            # 2. Common patterns
            lambda: soup.select_one("h1[class*='title']"),
            lambda: soup.select_one("h1[class*='headline']"),
            lambda: soup.find("h1"),
            
            # 3. OpenGraph
            lambda: soup.select_one("meta[property='og:title']"),
            
            # 4. Twitter Card
            lambda: soup.select_one("meta[name='twitter:title']"),
            
            # 5. Generic meta
            lambda: soup.select_one("title")
        ]
        
        for strategy in strategies:
            try:
                element = strategy()
                if element:
                    # Extract text hoặc content attribute
                    text = element.get('content') or element.get_text()
                    if text and len(text.strip()) > 10:
                        return text.strip()
            except Exception as e:
                continue
        
        return None
    
    def _extract_content(self, soup: BeautifulSoup) -> Optional[str]:
        """
        Extract main content với noise filtering
        """
        # 1. Try semantic HTML
        article = soup.find('article')
        if article:
            # Remove unwanted elements
            for tag in article.find_all(['script', 'style', 'nav', 'aside', 'footer']):
                tag.decompose()
            
            # Get all paragraphs
            paragraphs = article.find_all('p')
            content = '\n\n'.join([p.get_text().strip() for p in paragraphs if len(p.get_text().strip()) > 50])
            
            if len(content) > 200:
                return content
        
        # 2. Try finding main content area
        main_selectors = [
            "main article",
            "div[class*='article-body']",
            "div[class*='post-content']",
            "div[class*='entry-content']",
            "div[itemprop='articleBody']"
        ]
        
        for selector in main_selectors:
            container = soup.select_one(selector)
            if container:
                paragraphs = container.find_all('p')
                content = '\n\n'.join([p.get_text().strip() for p in paragraphs if len(p.get_text().strip()) > 50])
                
                if len(content) > 200:
                    return content
        
        # 3. Heuristic: Find div with most <p> tags
        all_divs = soup.find_all('div')
        best_div = None
        max_p_count = 0
        
        for div in all_divs:
            p_count = len(div.find_all('p'))
            if p_count > max_p_count:
                max_p_count = p_count
                best_div = div
        
        if best_div and max_p_count >= 3:
            paragraphs = best_div.find_all('p')
            content = '\n\n'.join([p.get_text().strip() for p in paragraphs if len(p.get_text().strip()) > 50])
            
            if len(content) > 200:
                return content
        
        return None
    
    def _extract_author(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract author với multiple strategies"""
        strategies = [
            lambda: soup.select_one("a[rel='author']"),
            lambda: soup.select_one("[itemprop='author']"),
            lambda: soup.select_one("meta[name='author']"),
            lambda: soup.select_one(".author-name"),
            lambda: soup.select_one("[class*='author']")
        ]
        
        for strategy in strategies:
            try:
                element = strategy()
                if element:
                    text = element.get('content') or element.get_text()
                    if text and len(text.strip()) > 2:
                        return text.strip()
            except:
                continue
        
        return None
    
    def _extract_date(self, soup: BeautifulSoup) -> Optional[datetime]:
        """Extract published date"""
        strategies = [
            lambda: soup.select_one("time[datetime]"),
            lambda: soup.select_one("meta[property='article:published_time']"),
            lambda: soup.select_one("[itemprop='datePublished']")
        ]
        
        for strategy in strategies:
            try:
                element = strategy()
                if element:
                    date_str = element.get('datetime') or element.get('content')
                    if date_str:
                        return parser.parse(date_str)
            except:
                continue
        
        return None
    
    def _is_valid_result(self, result: Dict) -> bool:
        """
        Validate result quality
        """
        if not result.get('title') or not result.get('content'):
            return False
        
        # Check minimum lengths
        if len(result['title']) < 10:
            return False
        
        if len(result['content']) < 200:
            return False
        
        return True
    
    def _update_cache(self, source: str, result: Dict):
        """
        Cache selectors that worked
        (Simplified - in production, cache actual selectors used)
        """
        self.success_cache[source] = {
            'last_success': datetime.now(),
            'parse_method': result['parse_method']
        }