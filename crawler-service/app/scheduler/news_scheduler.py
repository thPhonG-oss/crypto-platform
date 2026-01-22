from apscheduler.schedulers.background import BackgroundScheduler
from loguru import logger
from app.crawlers.sources import get_feed_urls
from app.services.rss_parser import RSSParser
from app.services.crawler_service import CrawlerService
from app.database import SessionLocal


class NewsScheduler:
    """Background scheduler for automatic news crawling"""
    
    def __init__(self, enabled: bool = True):
        self.scheduler = BackgroundScheduler()
        self.crawler_service = CrawlerService()
        self.rss_parser = RSSParser()
        self.enabled = enabled
    
    def start(self):
        """Start the scheduler"""
        if not self.enabled:
            logger.info("Scheduler is disabled")
            return
        
        # Schedule: Crawl every 30 minutes
        self.scheduler.add_job(
            func=self.crawl_all_sources,
            trigger='interval',
            minutes=30,
            id='news_crawler',
            name='Crawl all news sources',
            max_instances=1  # Prevent overlapping
        )
        
        # Run immediately on startup
        self.scheduler.add_job(
            func=self.crawl_all_sources,
            trigger='date',
            id='news_crawler_startup',
            name='Initial crawl on startup'
        )
        
        self.scheduler.start()
        logger.info("✅ Scheduler started - will crawl every 30 minutes")
    
    def stop(self):
        """Stop the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Scheduler stopped")
    
    def crawl_all_sources(self):
        """Main job: crawl all configured sources"""
        logger.info("🔄 Starting scheduled crawl job...")
        
        db = SessionLocal()
        try:
            feed_urls = get_feed_urls()
            total_crawled = 0
            
            for source, feed_url in feed_urls.items():
                if not feed_url:
                    continue
                
                logger.info(f"Processing source: {source}")
                
                # Get articles from RSS
                articles = self.rss_parser.parse_feed(feed_url, limit=5)
                
                # Crawl each article
                for article in articles:
                    try:
                        result = self.crawler_service.crawl_and_save(
                            url=article['link'],
                            source=source,
                            db=db,
                            force_gemini=False  # Try rules first
                        )
                        
                        if result['status'] == 'success':
                            total_crawled += 1
                            logger.info(f"✅ Crawled: {article['title'][:50]}...")
                        elif result['status'] == 'skipped':
                            logger.debug(f"⏭️ Skipped (exists): {article['link']}")
                        else:
                            logger.warning(f"❌ Failed: {article['link']}")
                    
                    except Exception as e:
                        logger.error(f"Error crawling {article['link']}: {str(e)}")
                        continue
            
            logger.info(f"✅ Crawl job completed: {total_crawled} new articles")
        
        except Exception as e:
            logger.error(f"Scheduler job error: {str(e)}")
        
        finally:
            db.close()