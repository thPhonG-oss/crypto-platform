import requests
from bs4 import BeautifulSoup
from typing import Optional, Dict
from loguru import logger
from app.config import settings


class BaseCrawler:
    """
    Base crawler for fetching HTML content from URLs
    Supports both static and dynamic (JavaScript) pages
    """
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': settings.USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
    
    def fetch_html(self, url: str, use_selenium: bool = False) -> Optional[str]:
        """
        Fetch HTML content from URL
        
        Args:
            url: Target URL
            use_selenium: Use Selenium for JavaScript rendering
            
        Returns:
            HTML content as string, or None if failed
        """
        try:
            if use_selenium or settings.USE_SELENIUM:
                return self._fetch_with_selenium(url)
            else:
                return self._fetch_with_requests(url)
        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            return None
    
    def _fetch_with_requests(self, url: str) -> str:
        """Fetch using requests library (fast, static pages)"""
        response = self.session.get(
            url,
            timeout=settings.REQUEST_TIMEOUT,
            allow_redirects=True
        )
        response.raise_for_status()
        response.encoding = response.apparent_encoding  # Auto-detect encoding
        return response.text
    
    def _fetch_with_selenium(self, url: str) -> str:
        """
        Fetch using Selenium (slower, for JavaScript-rendered pages)
        TODO: Implement if needed for SPA sites
        """
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        
        options = Options()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument(f'user-agent={settings.USER_AGENT}')
        
        driver = webdriver.Chrome(options=options)
        
        try:
            driver.get(url)
            # Wait for body to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            html = driver.page_source
            return html
        finally:
            driver.quit()
    
    def parse_html(self, html: str) -> BeautifulSoup:
        """Parse HTML into BeautifulSoup object"""
        return BeautifulSoup(html, 'lxml')
    
    def clean_text(self, text: str) -> str:
        """Clean extracted text (remove extra whitespace, etc.)"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Remove common junk
        text = text.replace('\xa0', ' ')  # Non-breaking space
        text = text.replace('\u200b', '')  # Zero-width space
        
        return text.strip()
    
    def extract_metadata(self, soup: BeautifulSoup) -> Dict[str, str]:
        """
        Extract common metadata from HTML
        (Open Graph, Twitter Cards, meta tags)
        """
        metadata = {}
        
        # Open Graph tags
        og_title = soup.find('meta', property='og:title')
        if og_title:
            metadata['og_title'] = og_title.get('content', '')
        
        og_description = soup.find('meta', property='og:description')
        if og_description:
            metadata['og_description'] = og_description.get('content', '')
        
        # Standard meta tags
        meta_description = soup.find('meta', attrs={'name': 'description'})
        if meta_description:
            metadata['meta_description'] = meta_description.get('content', '')
        
        # Author
        author = soup.find('meta', attrs={'name': 'author'})
        if author:
            metadata['author'] = author.get('content', '')
        
        # Published date
        published = soup.find('meta', property='article:published_time')
        if published:
            metadata['published_time'] = published.get('content', '')
        
        return metadata