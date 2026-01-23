from contextlib import asynccontextmanager
from typing import Optional

import py_eureka_client.eureka_client as eureka_client
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from loguru import logger

from app import __version__
from app.config import settings
from app.database import get_db, init_db
from app.models import News, NewsCorrelation, Kline
from app import schemas
from app.services.sentiment_service import sentiment_service
from app.services.correlation_service import correlation_service
from app.scheduler.analysis_scheduler import AnalysisScheduler

# Global scheduler instance
scheduler = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager"""
    global scheduler
    
    # Startup
    logger.info(f"🚀 Starting {settings.SERVICE_NAME} v{__version__}")
    
    # Initialize database tables
    try:
        init_db()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
    
    # Pre-initialize sentiment model (optional, can be lazy-loaded)
    try:
        logger.info("Pre-loading sentiment model...")
        sentiment_service.initialize()
    except Exception as e:
        logger.warning(f"Model pre-load failed (will retry on first request): {e}")
    
    # Register with Eureka
    if settings.EUREKA_SERVER:
        try:
            await eureka_client.init_async(
                eureka_server=settings.EUREKA_SERVER,
                app_name=settings.SERVICE_NAME,
                instance_port=settings.SERVICE_PORT,
                instance_host=settings.HOSTNAME,
                renewal_interval_in_secs=30,
                duration_in_secs=90
            )
            logger.info(f"✅ Registered with Eureka at {settings.EUREKA_SERVER}")
        except Exception as e:
            logger.warning(f"Eureka registration failed: {e}")
    
    # Start scheduler
    scheduler = AnalysisScheduler(enabled=settings.ENABLE_SCHEDULER)
    scheduler.start()
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    if scheduler:
        scheduler.stop()
    if settings.EUREKA_SERVER:
        try:
            await eureka_client.stop_async()
        except Exception:
            pass


# Initialize FastAPI
app = FastAPI(
    title="AI Analysis Service",
    description="Sentiment analysis and price correlation for crypto news",
    version=__version__,
    lifespan=lifespan
)

# Configure logger
logger.add("logs/analysis_{time}.log", rotation="500 MB", level=settings.LOG_LEVEL)


# ============== Health Check ==============

@app.get("/health", response_model=schemas.HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)[:50]}"
    
    model_type = "FinBERT" if settings.USE_FINBERT else "Gemini"
    
    return schemas.HealthResponse(
        status="healthy",
        service=settings.SERVICE_NAME,
        version=__version__,
        database=db_status,
        model=model_type,
        scheduler_enabled=settings.ENABLE_SCHEDULER
    )


# ============== Scheduler Control ==============

@app.get("/api/v1/scheduler/status")
def scheduler_status():
    """Get scheduler status"""
    global scheduler
    if scheduler:
        return scheduler.get_status()
    return {"running": False, "enabled": False, "jobs": []}


@app.post("/api/v1/scheduler/trigger")
def trigger_analysis():
    """Manually trigger analysis job"""
    global scheduler
    if scheduler:
        try:
            scheduler.run_analysis_job()
            return {"status": "success", "message": "Analysis job triggered"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=503, detail="Scheduler not initialized")


# ============== Sentiment Analysis Endpoints ==============

@app.post("/api/v1/analysis/sentiment", response_model=schemas.SentimentResponse)
def analyze_sentiment(request: schemas.SentimentRequest, db: Session = Depends(get_db)):
    """
    Analyze sentiment for a specific news article
    """
    result = sentiment_service.update_news_sentiment(request.news_id, db)
    
    if not result:
        raise HTTPException(status_code=404, detail=f"News {request.news_id} not found or has no content")
    
    return schemas.SentimentResponse(
        news_id=result["news_id"],
        sentiment_score=result["sentiment_score"],
        sentiment_label=result["sentiment_label"],
        processed_at=result["processed_at"]
    )


@app.post("/api/v1/analysis/batch", response_model=schemas.BatchResponse)
def batch_analyze(
    request: Optional[schemas.BatchRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Batch analyze all pending news articles (where sentiment_score IS NULL)
    """
    limit = request.limit if request else settings.BATCH_SIZE
    result = sentiment_service.process_pending_news(db, limit=limit)
    
    return schemas.BatchResponse(
        processed=result["processed"],
        success=result["success"],
        failed=result["failed"],
        errors=result.get("errors")
    )


# ============== Correlation Endpoints ==============

@app.get("/api/v1/analysis/correlation")
def get_correlations(
    symbol: Optional[str] = Query(None, description="Filter by symbol (e.g., BTC)"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Get price-news correlation data
    """
    correlations = correlation_service.get_correlations_by_symbol(db, symbol, limit)
    return {"correlations": correlations, "count": len(correlations)}


@app.post("/api/v1/analysis/correlation/{news_id}")
def create_correlation(news_id: int, db: Session = Depends(get_db)):
    """
    Calculate and store price correlation for a specific news article
    """
    result = correlation_service.align_news_with_price(news_id, db)
    
    if not result:
        raise HTTPException(
            status_code=404, 
            detail=f"Could not create correlation for news {news_id} (missing data)"
        )
    
    return result


@app.post("/api/v1/analysis/correlation/batch")
def batch_correlations(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Process pending correlations for all analyzed news
    """
    result = correlation_service.process_pending_correlations(db, limit)
    return result


# ============== Statistics Endpoints ==============

@app.get("/api/v1/analysis/stats", response_model=schemas.StatsResponse)
def get_stats(
    symbol: Optional[str] = Query(None, description="Filter by symbol (e.g., BTC)"),
    db: Session = Depends(get_db)
):
    """
    Get sentiment statistics, optionally filtered by symbol
    """
    stats = correlation_service.get_sentiment_stats(db, symbol)
    return schemas.StatsResponse(**stats)


# ============== News Endpoints ==============

@app.get("/api/v1/news")
def get_analyzed_news(
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    analyzed_only: bool = Query(True, description="Only return news with sentiment"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Get news articles with sentiment data
    """
    query = db.query(News)
    
    if analyzed_only:
        query = query.filter(News.sentiment_score.isnot(None))
    
    if symbol:
        query = query.filter(News.related_symbols.ilike(f"%{symbol}%"))
    
    total = query.count()
    news = query.order_by(News.published_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "news": [
            {
                "id": n.id,
                "title": n.title,
                "source": n.source,
                "published_at": n.published_at,
                "sentiment_score": n.sentiment_score,
                "sentiment_label": n.sentiment_label,
                "related_symbols": n.related_symbols,
                "url": n.url,
                "summary": n.summary,
                "parse_method": n.parse_method
            }
            for n in news
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }


# ============== Root Endpoint ==============


@app.get("/")
def root():
    """Root endpoint with service info"""
    return {
        "service": settings.SERVICE_NAME,
        "version": __version__,
        "status": "running",
        "model": "FinBERT" if settings.USE_FINBERT else "Gemini",
        "endpoints": {
            "health": "/health",
            "sentiment": "/api/v1/analysis/sentiment",
            "batch": "/api/v1/analysis/batch",
            "correlation": "/api/v1/analysis/correlation",
            "stats": "/api/v1/analysis/stats",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.SERVICE_PORT)
