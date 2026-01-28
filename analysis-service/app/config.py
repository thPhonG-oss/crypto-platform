from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://admin:admin@localhost:5432/crypto_core"
    
    # Service Discovery (Eureka)
    EUREKA_SERVER: Optional[str] = "http://discovery-service:8761/eureka/"
    SERVICE_NAME: str = "analysis-service"
    SERVICE_PORT: int = 8002
    HOSTNAME: str = "analysis-service"
    
    # AI Models
    HUGGINGFACE_MODEL: str = "ProsusAI/finbert"
    USE_FINBERT: bool = True  # Flag to toggle between FinBERT and potential fallbacks
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.0-flash"
    
    # Scheduler
    ENABLE_SCHEDULER: bool = True
    ANALYSIS_INTERVAL_MINUTES: int = 15
    
    # Processing
    BATCH_SIZE: int = 50
    MAX_TEXT_LENGTH: int = 512
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Singleton instance
settings = Settings()
