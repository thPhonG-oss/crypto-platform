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
from loguru import logger

EUREKA_SERVER = os.getenv("EUREKA_SERVER", "http://discovery-service:8761/eureka/")
SERVICE_PORT = settings.SERVICE_PORT
SERVICE_NAME = settings.SERVICE_NAME
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. KHI KHỞI ĐỘNG: Đăng ký với Eureka
    print(f"🔄 Đang đăng ký {SERVICE_NAME} vào Eureka tại {EUREKA_SERVER}...")
    await eureka_client.init_async(
        eureka_server=EUREKA_SERVER,
        app_name=SERVICE_NAME,
        instance_port=SERVICE_PORT,
        # Địa chỉ IP mà các service khác sẽ gọi đến (quan trọng trong Docker)
        instance_host=os.getenv("HOSTNAME", SERVICE_NAME)
    )
    print("✅ Đăng ký Eureka thành công!")
    
    yield
    
    # 2. KHI TẮT: Hủy đăng ký
    print("🛑 Đang hủy đăng ký khỏi Eureka...")
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


# ============== Startup/Shutdown Events ==============

@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup"""
    logger.info(f"Starting {settings.SERVICE_NAME}...")
    init_db()
    logger.info("Database initialized")
    
    # TODO: Start scheduler if enabled
    if settings.ENABLE_SCHEDULER:
        logger.info("Scheduler will be initialized in next step")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down crawler service...")


# ============== Health Check ==============

@app.get("/health", response_model=schemas.HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Check database
        db.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # Check Gemini API (simple validation)
    gemini_status = "configured" if settings.GEMINI_API_KEY else "not configured"
    
    return schemas.HealthResponse(
        status="healthy" if db_status == "healthy" else "degraded",
        service=settings.SERVICE_NAME,
        database=db_status,
        gemini_api=gemini_status,
        timestamp=datetime.now()
    )


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
    
    # Apply filters
    if source:
        query = query.filter(models.News.source == source)
    
    if symbols:
        # Filter by any of the symbols
        symbol_list = symbols.split(',')
        filters = [models.News.related_symbols.contains(s.strip()) for s in symbol_list]
        query = query.filter(db.or_(*filters))
    
    if from_date:
        query = query.filter(models.News.published_at >= from_date)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and order
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
    TODO: Implement crawler logic in next step
    """
    logger.info(f"Crawl request received: {request.url}")
    
    # Check if URL already exists
    existing = db.query(models.News).filter(models.News.url == request.url).first()
    if existing:
        return schemas.CrawlJobResponse(
            status="skipped",
            message="URL already crawled",
            news_id=existing.id
        )
    
    return schemas.CrawlJobResponse(
        status="pending",
        message="Crawler logic will be implemented in next step"
    )


@app.get("/api/v1/sources")
async def get_sources(db: Session = Depends(get_db)):
    """Get list of available news sources"""
    sources = db.query(models.News.source).distinct().all()
    return {"sources": [s[0] for s in sources]}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.SERVICE_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.SERVICE_PORT)