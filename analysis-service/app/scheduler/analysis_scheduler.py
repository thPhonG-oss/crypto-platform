from apscheduler.schedulers.background import BackgroundScheduler
from loguru import logger

from app.config import settings
from app.database import SessionLocal
from app.services.sentiment_service import sentiment_service
from app.services.correlation_service import correlation_service


class AnalysisScheduler:
    """Background scheduler for automatic sentiment analysis and correlation processing"""
    
    def __init__(self, enabled: bool = True):
        self.scheduler = BackgroundScheduler()
        self.enabled = enabled
    
    def start(self):
        """Start the scheduler"""
        if not self.enabled:
            logger.info("Scheduler is disabled by config")
            return
        
        # Schedule: Run analysis every X minutes
        self.scheduler.add_job(
            func=self.run_analysis_job,
            trigger='interval',
            minutes=settings.ANALYSIS_INTERVAL_MINUTES,
            id='sentiment_analyzer',
            name='Analyze pending news sentiment',
            max_instances=1,
            replace_existing=True
        )
        
        # Run immediately on startup (after small delay isn't needed if we call start() late enough, but helpful)
        self.scheduler.add_job(
            func=self.run_analysis_job,
            trigger='date',
            id='sentiment_analyzer_startup',
            name='Initial analysis on startup',
            run_date=None # Run immediately
        )
        
        self.scheduler.start()
        logger.info(f"✅ Scheduler started - will run every {settings.ANALYSIS_INTERVAL_MINUTES} minutes")
    
    def stop(self):
        """Stop the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Scheduler stopped")
    
    def run_analysis_job(self):
        """Main job: analyze sentiment and calculate correlations"""
        logger.info("🔄 Starting scheduled analysis job...")
        
        db = SessionLocal()
        try:
            # Step 1: Process pending sentiment analysis
            logger.info("Step 1: Analyzing pending news sentiment...")
            sentiment_result = sentiment_service.process_pending_news(
                db, 
                limit=settings.BATCH_SIZE
            )
            logger.info(
                f"Sentiment analysis: {sentiment_result['success']}/{sentiment_result['processed']} successful"
            )
            
            # Step 2: Process pending correlations
            logger.info("Step 2: Calculating price correlations...")
            correlation_result = correlation_service.process_pending_correlations(
                db, 
                limit=settings.BATCH_SIZE
            )
            logger.info(
                f"Correlation processing: {correlation_result['success']}/{correlation_result['processed']} successful"
            )
            
            logger.info("✅ Analysis job completed")
            
        except Exception as e:
            logger.error(f"Analysis job error: {str(e)}")
        
        finally:
            db.close()
    
    def get_status(self) -> dict:
        """Get scheduler status"""
        jobs = []
        if self.scheduler.running:
            for job in self.scheduler.get_jobs():
                jobs.append({
                    "id": job.id,
                    "name": job.name,
                    "next_run": str(job.next_run_time) if job.next_run_time else None
                })
        
        return {
            "running": self.scheduler.running,
            "enabled": self.enabled,
            "jobs": jobs
        }
