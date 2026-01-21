"""
News source configurations for rule-based parsing
Each source has CSS selectors for extracting article data
"""

NEWS_SOURCES = {
    # CoinDesk
    "coindesk": {
        "name": "CoinDesk",
        "base_url": "https://www.coindesk.com",
        "selectors": {
            "title": "h1.typography__StyledTypography-owin6q-0",
            "content": "div.article-body",
            "author": "a.typography__StyledTypography-owin6q-0.jWKDIo",
            "date": "time[datetime]"
        },
        "feed_url": "https://www.coindesk.com/arc/outboundfeeds/rss/"
    },
    
    # Cointelegraph
    "cointelegraph": {
        "name": "Cointelegraph",
        "base_url": "https://cointelegraph.com",
        "selectors": {
            "title": "h1.post__title",
            "content": "div.post-content",
            "author": "a.post-meta__author-name",
            "date": "time.post-meta__publish-date"
        },
        "feed_url": "https://cointelegraph.com/rss"
    },
    
    # CryptoSlate
    "cryptoslate": {
        "name": "CryptoSlate",
        "base_url": "https://cryptoslate.com",
        "selectors": {
            "title": "h1.post-title",
            "content": "div.post-content",
            "author": "span.author-name",
            "date": "time.post-date"
        },
        "feed_url": "https://cryptoslate.com/feed/"
    },
    
    # Decrypt
    "decrypt": {
        "name": "Decrypt",
        "base_url": "https://decrypt.co",
        "selectors": {
            "title": "h1",
            "content": "article div.content",
            "author": "a.author-link",
            "date": "time[datetime]"
        },
        "feed_url": "https://decrypt.co/feed"
    },
    
    # The Block
    "theblock": {
        "name": "The Block",
        "base_url": "https://www.theblock.co",
        "selectors": {
            "title": "h1.articleHeader__title",
            "content": "div.article__content",
            "author": "a.authorCard__name",
            "date": "time.timestamp"
        },
        "feed_url": "https://www.theblock.co/rss.xml"
    },
    
    # Bitcoin Magazine
    "bitcoinmagazine": {
        "name": "Bitcoin Magazine",
        "base_url": "https://bitcoinmagazine.com",
        "selectors": {
            "title": "h1.m-detail-header__title",
            "content": "div.m-detail-content",
            "author": "div.m-detail-header__authors",
            "date": "time.m-detail-header__timestamp"
        },
        "feed_url": "https://bitcoinmagazine.com/.rss/full/"
    }
}


def get_source_config(source: str) -> dict:
    """Get configuration for a specific source"""
    return NEWS_SOURCES.get(source.lower())


def get_all_sources() -> list:
    """Get list of all configured sources"""
    return list(NEWS_SOURCES.keys())


def get_feed_urls() -> dict:
    """Get all RSS feed URLs for scheduled crawling"""
    return {
        source: config.get('feed_url')
        for source, config in NEWS_SOURCES.items()
        if config.get('feed_url')
    }