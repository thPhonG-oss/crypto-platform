import google.generativeai as genai
from typing import Optional, Dict
import json
from datetime import datetime
from loguru import logger
from app.config import settings
from app.crawlers.base_crawler import BaseCrawler
from sqlalchemy.orm import Session
from app import models


class GeminiParser(BaseCrawler):
    """
    AI-powered parser using Google Gemini
    Adaptive - works even when HTML structure changes
    """
    
    def __init__(self):
        super().__init__()
        # Configure Gemini
        if not settings.GEMINI_API_KEY:
            logger.warning("⚠️ Gemini API key not configured!")
            self.model = None
        else:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            logger.info(f"Using Gemini model: {settings.GEMINI_MODEL}")
            logger.info("✅ Gemini API initialized")
    
    def parse_article(self, url: str, source: str, html: Optional[str] = None, db: Session = None) -> Optional[Dict]:
        """
        Parse article using Gemini AI
        
        Args:
            url: Article URL
            source: Source name
            html: Optional pre-fetched HTML (to save bandwidth)
            db: Database session for usage tracking
            
        Returns:
            Dict with extracted data or None if parsing failed
        """
        if not self.model:
            logger.error("Gemini model not initialized - API key missing")
            return None
        else:
            logger.info(f"Using Gemini model: {self.model}")
            
        try:
            # Fetch HTML if not provided
            if not html:
                html = self.fetch_html(url)
            
            if not html:
                logger.error(f"Failed to fetch HTML for {url}")
                return None
            
            # Clean HTML to reduce token usage
            soup = self.parse_html(html)
            
            # Remove scripts, styles, and other noise
            for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe']):
                tag.decompose()
            
            # Get clean text (limit to avoid token overflow)
            clean_html = str(soup)[:50000]  # Limit to ~50k chars
            
            # Create extraction prompt
            prompt = self._create_extraction_prompt(clean_html, url, source)
            
            # Call Gemini API
            logger.info(f"🤖 Calling Gemini API for {url}")
            response = self.model.generate_content(prompt)
            logger.info(f"Gemini response length: {len(response.text)}")
            
            # Track usage
            if db:
                self._track_usage(db, response, "parse_article")
            
            # Parse JSON response
            result = self._parse_gemini_response(response.text, url, source)
            
            if result:
                logger.info(f"✅ Gemini parsing successful for {url}")
                return result
            else:
                logger.warning(f"⚠️ Gemini returned invalid data for {url}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Gemini parsing error for {url}: {str(e)}")
            # Track error if db is available
            if db:
                try:
                    usage_record = models.GeminiUsage(
                        endpoint="parse_article",
                        model_name=settings.GEMINI_MODEL,
                        status="error",
                        error_message=str(e)[:500]
                    )
                    db.add(usage_record)
                    db.commit()
                except Exception as db_e:
                    logger.error(f"Failed to track Gemini error usage: {db_e}")
            return None
    
    def _track_usage(self, db: Session, response, endpoint: str):
        """Track Gemini API usage"""
        try:
            usage = response.usage_metadata
            usage_record = models.GeminiUsage(
                endpoint=endpoint,
                model_name=settings.GEMINI_MODEL,
                prompt_tokens=usage.prompt_token_count,
                completion_tokens=usage.candidates_token_count,
                total_tokens=usage.total_token_count,
                status="success"
            )
            db.add(usage_record)
            db.commit()
            logger.info(f"📊 Tracked Gemini usage: {usage.total_token_count} tokens")
        except Exception as e:
            logger.error(f"Failed to track Gemini usage: {e}")
    
    def _create_extraction_prompt(self, html: str, url: str, source: str) -> str:
        """Create structured extraction prompt for Gemini"""
        return f"""You are a professional news article extractor. Extract information from this HTML page.

**CRITICAL REQUIREMENTS:**
1. Return ONLY a valid JSON object (no markdown, no explanation)
2. Extract the main article content - this is MANDATORY, content CANNOT be null
3. Content must be the full article text, not just a summary
4. Extract from the main article body, ignore ads, navigation, sidebars, comments
5. If you cannot find a field, use null (EXCEPT for content - content is REQUIRED)
6. For date: try to parse into ISO 8601 format (YYYY-MM-DDTHH:MM:SS)

**HTML Content:**
{html}


**Extract these fields as JSON:**
{{
  "title": "Main article title",
  "content": "Full article text (paragraphs joined with \\n\\n)",
  "author": "Author name or null",
  "published_at": "ISO date string or null",
  "summary": "Brief 2-3 sentence summary",
  "related_symbols": ["BTC", "ETH"] (crypto symbols mentioned, or empty array)
}}

**Rules:**
- Content must be at least 100 characters
- Remove all ads, navigation, comments
- Preserve paragraph structure with \\n\\n
- Date format: "2024-01-20T14:30:00" or null

Return JSON only:"""
    
    def _parse_gemini_response(self, response_text: str, url: str, source: str) -> Optional[Dict]:
        """Parse and validate Gemini's JSON response"""
        try:
            # Clean response (remove markdown code blocks if present)
            response_text = response_text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            # Parse JSON
            data = json.loads(response_text)
            logger.debug(f"Parsed JSON keys: {list(data.keys())}")
            logger.debug(f"Title present: {bool(data.get('title'))}")
            logger.debug(f"Content present: {bool(data.get('content'))}")
            
            # Validate required fields
            if not data.get('title') or not data.get('content'):
                logger.warning("Missing required fields in Gemini response")
                return None
            
            # Ensure content is substantial
            if len(data['content']) < 100:
                logger.warning(f"Content too short: {len(data['content'])} chars")
                return None
            
            # Parse date
            published_at = None
            if data.get('published_at'):
                try:
                    published_at = datetime.fromisoformat(data['published_at'].replace('Z', '+00:00'))
                except:
                    logger.debug(f"Could not parse date: {data['published_at']}")
            
            # Format related symbols
            related_symbols = None
            if data.get('related_symbols') and isinstance(data['related_symbols'], list):
                related_symbols = ','.join([s.upper() for s in data['related_symbols']])
            
            return {
                'title': data['title'],
                'content': data['content'],
                'summary': data.get('summary'),
                'author': data.get('author'),
                'published_at': published_at,
                'related_symbols': related_symbols,
                'url': url,
                'source': source,
                'parse_method': 'gemini'
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON from Gemini: {str(e)}")
            logger.debug(f"Response text: {response_text[:500]}")
            return None
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {str(e)}")
            return None