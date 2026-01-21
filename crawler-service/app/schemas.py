from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime
from typing import Optional, List


# ============== Request Schemas ==============

class CrawlRequest(BaseModel):
    """Request to crawl a specific URL"""
    url: str = Field(..., description="URL to crawl")
    source: str = Field(..., description="Source name (e.g., coindesk)")
    force_gemini: bool = Field(False, description="Force use Gemini parser")


class NewsSearchRequest(BaseModel):
    """Search news with filters"""
    keyword: Optional[str] = None
    source: Optional[str] = None
    symbols: Optional[List[str]] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    limit: int = Field(50, ge=1, le=100)
    offset: int = Field(0, ge=0)


# ============== Response Schemas ==============

class NewsBase(BaseModel):
    """Base news schema"""
    title: str
    content: str
    summary: Optional[str] = None
    url: str
    source: str
    author: Optional[str] = None
    published_at: Optional[datetime] = None
    related_symbols: Optional[str] = None


class NewsCreate(NewsBase):
    """Schema for creating news"""
    pass


class NewsResponse(NewsBase):
    """Full news response with metadata"""
    id: int
    crawled_at: datetime
    updated_at: datetime
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    parse_method: str
    is_valid: bool
    
    class Config:
        from_attributes = True


class NewsListResponse(BaseModel):
    """Paginated news list"""
    total: int
    items: List[NewsResponse]
    offset: int
    limit: int


class CrawlJobResponse(BaseModel):
    """Response for crawl job status"""
    status: str
    message: str
    news_id: Optional[int] = None
    parse_method: Optional[str] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    database: str
    gemini_api: str
    timestamp: datetime