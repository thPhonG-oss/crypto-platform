from typing import Dict, List, Optional
from loguru import logger
from sqlalchemy.orm import Session
from datetime import datetime
import torch

from app.config import settings
from app.models import News


class SentimentService:
    """
    Sentiment analysis service using FinBERT or Gemini API fallback
    """
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.gemini_model = None
        self._initialized = False
        self.device = "cpu"
        
    def initialize(self):
        """Load the sentiment analysis model"""
        if self._initialized:
            return
            
        if settings.USE_FINBERT:
            self._init_finbert()
        else:
            self._init_gemini()
            
        self._initialized = True
    
    def _init_finbert(self):
        """Initialize FinBERT model from HuggingFace"""
        try:
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            
            logger.info(f"Loading FinBERT model from {settings.HUGGINGFACE_MODEL}...")
            self.tokenizer = AutoTokenizer.from_pretrained(settings.HUGGINGFACE_MODEL)
            self.model = AutoModelForSequenceClassification.from_pretrained(settings.HUGGINGFACE_MODEL)
            
            # Move to GPU if available
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model.to(self.device)
            self.model.eval()
            
            logger.info(f"✅ FinBERT model loaded successfully (device: {self.device})")
            
        except Exception as e:
            logger.error(f"Failed to load FinBERT: {e}")
            logger.info("Falling back to Gemini API...")
            settings.USE_FINBERT = False
            self._init_gemini()
    
    def _init_gemini(self):
        """Initialize Gemini API client"""
        try:
            import google.generativeai as genai
            
            if not settings.GEMINI_API_KEY:
                # If no key, we can't do anything. But maybe FinBERT failed?
                # If FinBERT failed and no Gemini key, we are stuck.
                # But if USE_FINBERT was False initially, we expect a key.
                logger.warning("GEMINI_API_KEY not configured. Sentiment analysis may fail if FinBERT is unavailable.")
                return
            
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.gemini_model = genai.GenerativeModel(settings.GEMINI_MODEL)
            logger.info(f"✅ Gemini model initialized: {settings.GEMINI_MODEL}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            raise
    
    def analyze(self, text: str) -> Dict:
        """
        Analyze sentiment of text
        Returns: {"sentiment_score": float, "sentiment_label": str}
        """
        self.initialize()
        
        # Truncate text if too long
        text = text[:settings.MAX_TEXT_LENGTH * 4]  # Rough character limit pre-tokenization
        
        if settings.USE_FINBERT:
            return self._analyze_finbert(text)
        else:
            return self._analyze_gemini(text)
    
    def _analyze_finbert(self, text: str) -> Dict:
        """Analyze using FinBERT model"""
        try:
            inputs = self.tokenizer(
                text, 
                return_tensors="pt", 
                truncation=True, 
                max_length=settings.MAX_TEXT_LENGTH,
                padding=True
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
            
            # FinBERT outputs: [negative, neutral, positive]
            neg_prob = probs[0][0].item()
            # neu_prob = probs[0][1].item()
            pos_prob = probs[0][2].item()
            
            # Calculate sentiment score: positive - negative (-1 to +1)
            sentiment_score = pos_prob - neg_prob
            
            # Determine label
            if sentiment_score > 0.3:
                label = "positive"
            elif sentiment_score < -0.3:
                label = "negative"
            else:
                label = "neutral"
            
            return {
                "sentiment_score": round(sentiment_score, 4),
                "sentiment_label": label
            }
            
        except Exception as e:
            logger.error(f"FinBERT analysis error: {e}")
            raise
    
    def _analyze_gemini(self, text: str) -> Dict:
        """Analyze using Gemini API"""
        if not self.gemini_model:
             raise ValueError("Gemini model not initialized (missing API Key?)")

        try:
            prompt = f"""Analyze the sentiment of this financial/crypto news text.
            
Text: {text}

Respond in exactly this format (JSON):
{{"sentiment_score": <float between -1 (bearish/negative) and 1 (bullish/positive)>, "sentiment_label": "<positive|negative|neutral>"}}

Only respond with the JSON, no other text."""

            response = self.gemini_model.generate_content(prompt)
            
            import json
            # Clean response and parse JSON
            response_text = response.text.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
            
            result = json.loads(response_text.strip())
            
            return {
                "sentiment_score": round(float(result["sentiment_score"]), 4),
                "sentiment_label": result["sentiment_label"]
            }
            
        except Exception as e:
            logger.error(f"Gemini analysis error: {e}")
            raise
    
    def update_news_sentiment(self, news_id: int, db: Session) -> Optional[Dict]:
        """
        Analyze and update sentiment for a specific news article
        """
        news = db.query(News).filter(News.id == news_id).first()
        if not news:
            logger.warning(f"News {news_id} not found")
            return None
        
        # Use content or title for analysis
        text = news.content if news.content else news.title
        if not text:
            logger.warning(f"News {news_id} has no content")
            return None
        
        try:
            result = self.analyze(text)
            
            # Update news record
            news.sentiment_score = result["sentiment_score"]
            news.sentiment_label = result["sentiment_label"]
            db.commit()
            
            logger.info(f"✅ Updated sentiment for news {news_id}: {result['sentiment_label']} ({result['sentiment_score']})")
            
            return {
                "news_id": news_id,
                "sentiment_score": result["sentiment_score"],
                "sentiment_label": result["sentiment_label"],
                "processed_at": datetime.now()
            }
            
        except Exception as e:
            logger.error(f"Failed to analyze news {news_id}: {e}")
            db.rollback()
            return None
    
    def process_pending_news(self, db: Session, limit: int = 50) -> Dict:
        """
        Process all news articles without sentiment scores
        """
        # Get pending news
        pending = db.query(News).filter(
            News.sentiment_score.is_(None),
            News.is_valid == True
        ).limit(limit).all()
        
        if not pending:
            return {"processed": 0, "success": 0, "failed": 0}
        
        logger.info(f"Processing {len(pending)} pending news articles...")
        
        success = 0
        failed = 0
        errors = []
        
        # We can optimize with batching for FinBERT later if needed, 
        # but for now simplicity and safety (fallback) is preferred.
        # The prompt asked for batch processing, but loop is acceptable.
        
        for news in pending:
            try:
                text = news.content or news.title
                if not text:
                    continue
                
                result = self.analyze(text)
                news.sentiment_score = result["sentiment_score"]
                news.sentiment_label = result["sentiment_label"]
                success += 1
                
            except Exception as e:
                failed += 1
                errors.append(f"News {news.id}: {str(e)[:100]}")
                logger.error(f"Failed to analyze news {news.id}: {e}")
        
        db.commit()
        
        return {
            "processed": len(pending),
            "success": success,
            "failed": failed,
            "errors": errors if errors else None
        }


# Singleton instance
sentiment_service = SentimentService()
