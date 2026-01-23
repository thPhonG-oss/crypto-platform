import os
from contextlib import asynccontextmanager
import py_eureka_client.eureka_client as eureka_client
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.config import settings
from app.database import get_db, init_db
from app import models, schemas
from app.services.crawler_service import CrawlerService
from app.crawlers.sources import get_all_sources
from app.scheduler import NewsScheduler
from loguru import logger

EUREKA_SERVER = settings.EUREKA_SERVER or "http://discovery-service:8761/eureka/"
SERVICE_PORT = settings.SERVICE_PORT
SERVICE_NAME = settings.SERVICE_NAME

# Global scheduler instance
scheduler = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global scheduler
    
    # Startup
    logger.info(f"🔄 Registering {SERVICE_NAME} to Eureka at {EUREKA_SERVER}...")
    await eureka_client.init_async(
        eureka_server=EUREKA_SERVER,
        app_name=SERVICE_NAME,
        instance_port=SERVICE_PORT,
        instance_host=settings.HOSTNAME
    )
    logger.info("✅ Eureka registration successful!")
    
    # Initialize database
    init_db()
    logger.info("✅ Database initialized")
    
    # Start scheduler
    if settings.ENABLE_SCHEDULER:
        scheduler = NewsScheduler(enabled=True)
        scheduler.start()
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down...")
    if scheduler:
        scheduler.stop()
    await eureka_client.stop_async()

# Initialize FastAPI
app = FastAPI(
    title="Crawler Service",
    description="AI-Powered News Crawler for Crypto Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logger
logger.add("logs/crawler_{time}.log", rotation="500 MB", level=settings.LOG_LEVEL)

# Initialize CrawlerService
crawler_service = CrawlerService()


# ============== Health Check ==============

@app.get("/health", response_model=schemas.HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        db.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    gemini_status = "configured" if settings.GEMINI_API_KEY else "not configured"
    
    scheduler_status = "running" if (scheduler and scheduler.scheduler.running) else "stopped"
    
    return schemas.HealthResponse(
        status="healthy" if db_status == "healthy" else "degraded",
        service=settings.SERVICE_NAME,
        database=db_status,
        gemini_api=gemini_status,
        timestamp=datetime.now()
    )


@app.get("/api/v1/scheduler/status")
async def scheduler_status():
    """Get scheduler status"""
    if not scheduler:
        return {"enabled": False, "status": "not initialized"}
    
    jobs = []
    if scheduler.scheduler.running:
        for job in scheduler.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": str(job.next_run_time)
            })
    
    return {
        "enabled": settings.ENABLE_SCHEDULER,
        "status": "running" if scheduler.scheduler.running else "stopped",
        "jobs": jobs
    }


@app.post("/api/v1/scheduler/trigger")
async def trigger_crawl():
    """Manually trigger crawl job"""
    if not scheduler:
        raise HTTPException(status_code=503, detail="Scheduler not initialized")
    
    # Run job immediately in background
    scheduler.scheduler.add_job(
        func=scheduler.crawl_all_sources,
        trigger='date',
        id='manual_trigger'
    )
    
    return {"message": "Crawl job triggered", "status": "running"}


@app.get("/api/v1/gemini/models")
async def list_gemini_models():
    """List available Gemini models for current API key"""
    import google.generativeai as genai
    from app.config import settings
    
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=400, detail="Gemini API key not configured")
    
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        models = genai.list_models()
        
        available_models = []
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                available_models.append({
                    'name': model.name,
                    'display_name': model.display_name,
                    'description': model.description,
                    'input_token_limit': model.input_token_limit,
                    'output_token_limit': getattr(model, 'output_token_limit', None)
                })
        
        return {
            'total': len(available_models),
            'models': available_models,
            'current_model': settings.GEMINI_MODEL
        }
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== News CRUD Endpoints ==============

@app.get("/api/v1/news", response_model=schemas.NewsListResponse)
async def get_news(
    source: Optional[str] = Query(None, description="Filter by source"),
    symbols: Optional[str] = Query(None, description="Filter by symbols (comma-separated)"),
    from_date: Optional[datetime] = Query(None, description="From date"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get list of news with filters"""
    query = db.query(models.News).filter(models.News.is_valid == True)
    
    if source:
        query = query.filter(models.News.source == source)
    
    if symbols:
        symbol_list = symbols.split(',')
        filters = [models.News.related_symbols.contains(s.strip()) for s in symbol_list]
        query = query.filter(db.or_(*filters))
    
    if from_date:
        query = query.filter(models.News.published_at >= from_date)
    
    total = query.count()
    
    news_items = query.order_by(models.News.published_at.desc()) \
                      .offset(offset) \
                      .limit(limit) \
                      .all()
    
    return schemas.NewsListResponse(
        total=total,
        items=news_items,
        offset=offset,
        limit=limit
    )


@app.get("/api/v1/news/{news_id}", response_model=schemas.NewsResponse)
async def get_news_by_id(news_id: int, db: Session = Depends(get_db)):
    """Get specific news by ID"""
    news = db.query(models.News).filter(models.News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    return news


@app.post("/api/v1/crawl", response_model=schemas.CrawlJobResponse)
async def crawl_url(request: schemas.CrawlRequest, db: Session = Depends(get_db)):
    """
    Manually trigger crawl for a specific URL
    Uses hybrid parsing: Rule-based → Gemini AI fallback
    """
    logger.info(f"📨 Crawl request received: {request.url}")
    
    try:
        result = await crawler_service.crawl_and_save(
            url=request.url,
            source=request.source,
            db=db,
            force_gemini=request.force_gemini
        )
        
        return schemas.CrawlJobResponse(**result)
        
    except Exception as e:
        logger.error(f"Crawl endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/sources")
async def get_sources(db: Session = Depends(get_db)):
    """Get list of available news sources"""
    db_sources = db.query(models.News.source).distinct().all()
    db_sources = [s[0] for s in db_sources]
    
    configured_sources = get_all_sources()
    
    return {
        "configured_sources": configured_sources,
        "active_sources": db_sources,
        "total_configured": len(configured_sources),
        "total_active": len(db_sources)
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.SERVICE_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "features": {
            "hybrid_parsing": True,
            "gemini_ai": settings.USE_GEMINI_FALLBACK,
            "scheduler": settings.ENABLE_SCHEDULER,
            "scheduler_running": scheduler.scheduler.running if scheduler else False
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.SERVICE_PORT)