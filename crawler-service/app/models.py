from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, Index
from sqlalchemy.sql import func
from app.database import Base


class News(Base):
    """
    News article model for storing crawled financial news
    """
    __tablename__ = "news"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Content
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)  # AI-generated summary
    
    # Metadata
    url = Column(String(1000), unique=True, nullable=False, index=True)
    source = Column(String(100), nullable=False, index=True)  # e.g., "coindesk", "cointelegraph"
    author = Column(String(200), nullable=True)
    
    # Timestamps
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    crawled_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Analysis (for AI service later)
    sentiment_score = Column(Float, nullable=True)  # -1 to 1 (negative to positive)
    sentiment_label = Column(String(20), nullable=True)  # "positive", "negative", "neutral"
    
    # Related symbols (comma-separated: "BTC,ETH,SOL")
    related_symbols = Column(String(200), nullable=True)
    
    # Parsing metadata
    parse_method = Column(String(20), default="rule")  # "rule" or "gemini"
    is_valid = Column(Boolean, default=True)
    
    # Indexes for efficient queries
    __table_args__ = (
        Index('idx_news_published_at_desc', published_at.desc()),
        Index('idx_news_source_published', source, published_at),
        Index('idx_news_symbols', related_symbols),
    )
    
    def __repr__(self):
        return f"<News(id={self.id}, title='{self.title[:50]}...', source='{self.source}')>"


class GeminiUsage(Base):
    """
    Model for tracking Gemini API usage and costs
    """
    __tablename__ = "gemini_usage"

    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String(50), index=True) # e.g., "generate_content"
    model_name = Column(String(50)) # e.g., "gemini-pro"
    
    # Token usage
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    
    # Request details
    status = Column(String(20)) # "success", "error"
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<GeminiUsage(id={self.id}, model='{self.model_name}', tokens={self.total_tokens})>"