from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://admin:admin@localhost:5432/crypto_core"
    
    # Gemini AI
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # Service
    SERVICE_NAME: str = "crawler-service"
    SERVICE_PORT: int = 8000
    
    # Eureka (Optional)
    EUREKA_SERVER: Optional[str] = None
    
    # Crawling
    CRAWL_INTERVAL_MINUTES: int = 30
    MAX_CONCURRENT_CRAWLS: int = 5
    REQUEST_TIMEOUT: int = 30
    USER_AGENT: str = "Mozilla/5.0 (compatible; CryptoNewsBot/1.0)"
    
    # Retry
    MAX_RETRIES: int = 3
    RETRY_DELAY_SECONDS: int = 5
    
    # Features
    USE_SELENIUM: bool = False
    USE_GEMINI_FALLBACK: bool = True
    ENABLE_SCHEDULER: bool = True
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Singleton instance
settings = Settings()