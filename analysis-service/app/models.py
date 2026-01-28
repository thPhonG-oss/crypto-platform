from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, Index, Numeric, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class News(Base):
    """
    News article model - mirrors existing table from crawler-service
    This service reads from and updates sentiment fields
    """
    __tablename__ = "news"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    url = Column(String(1000), unique=True, nullable=False, index=True)
    source = Column(String(100), nullable=False, index=True)
    author = Column(String(200), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    crawled_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Sentiment fields - this service fills these
    sentiment_score = Column(Float, nullable=True)
    sentiment_label = Column(String(20), nullable=True)
    
    related_symbols = Column(String(200), nullable=True)
    parse_method = Column(String(20), default="rule")
    is_valid = Column(Boolean, default=True)


class Kline(Base):
    """
    Kline (OHLCV) model - mirrors existing table from market-service
    Read-only access for price correlation
    """
    __tablename__ = "klines"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False)
    open_price = Column(Numeric(20, 8))
    high_price = Column(Numeric(20, 8))
    low_price = Column(Numeric(20, 8))
    close_price = Column(Numeric(20, 8))
    volume = Column(Numeric(20, 8))
    open_time = Column(DateTime, nullable=False)  # LocalDateTime (no timezone)
    close_time = Column(DateTime, nullable=False)
    interval = Column(String(5), nullable=False)


class NewsCorrelation(Base):
    """
    Price-News Correlation model
    Stores the relationship between news sentiment and price movements
    """
    __tablename__ = "news_price_correlation"
    __table_args__ = (
        Index('idx_correlation_symbol_created', 'symbol', 'created_at'),
        {'extend_existing': True}
    )
    
    id = Column(Integer, primary_key=True, index=True)
    news_id = Column(Integer, ForeignKey("news.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    
    # Prices around news publication
    price_before = Column(Numeric(20, 8))  # Close price 1h before news
    price_after = Column(Numeric(20, 8))   # Close price 1h after news
    price_change_pct = Column(Numeric(10, 4))  # Percentage change
    
    # Snapshot of sentiment at correlation time
    sentiment_score = Column(Float)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<NewsCorrelation(news_id={self.news_id}, symbol='{self.symbol}', change={self.price_change_pct}%)>"
