import feedparser
from typing import List, Dict
from loguru import logger


class RSSParser:
    """Parse RSS/Atom feeds to get article URLs"""
    
    @staticmethod
    def parse_feed(feed_url: str, limit: int = 10) -> List[Dict]:
        """
        Parse RSS feed and extract articles
        
        Args:
            feed_url: RSS feed URL
            limit: Maximum number of articles to return
            
        Returns:
            List of dicts with 'link', 'title', 'published'
        """
        try:
            logger.info(f"Parsing RSS feed: {feed_url}")
            feed = feedparser.parse(feed_url)
            
            if feed.bozo:  # Feed has errors
                logger.warning(f"RSS feed has parsing issues: {feed_url}")
            
            articles = []
            for entry in feed.entries[:limit]:
                article = {
                    'link': entry.get('link', ''),
                    'title': entry.get('title', ''),
                    'published': entry.get('published', '')
                }
                
                # Only add if has valid link
                if article['link']:
                    articles.append(article)
            
            logger.info(f"Found {len(articles)} articles from {feed_url}")
            return articles
            
        except Exception as e:
            logger.error(f"Error parsing RSS feed {feed_url}: {str(e)}")
            return []