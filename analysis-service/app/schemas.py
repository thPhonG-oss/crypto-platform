from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    database: str
    model: str
    scheduler_enabled: bool


class SentimentRequest(BaseModel):
    news_id: int


class SentimentResponse(BaseModel):
    news_id: int
    sentiment_score: float
    sentiment_label: str
    processed_at: datetime


class BatchRequest(BaseModel):
    limit: Optional[int] = 50


class BatchResponse(BaseModel):
    processed: int
    success: int
    failed: int
    errors: Optional[List[str]] = None


class StatsResponse(BaseModel):
    symbol: Optional[str] = None
    total_articles: int
    analyzed_articles: int
    average_sentiment: Optional[float] = None
    positive_count: int
    negative_count: int
    neutral_count: int


class CorrelationResponse(BaseModel):
    news_id: int
    correlations: List[Dict[str, Any]]
