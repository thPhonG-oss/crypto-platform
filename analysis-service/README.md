# AI Analysis Service

This service performs sentiment analysis on crypto news articles using FinBERT and correlates them with historical price data.

## Features

- Sentiment analysis using FinBERT model (or Gemini API fallback)
- Price-news correlation analysis
- Automatic batch processing every 15 minutes
- REST API for manual analysis and statistics

## Setup

1. Copy `.env.example` to `.env`
2. Configure your environment variables
3. Run: `pip install -r requirements.txt`
4. Start: `uvicorn app.main:app --reload --port 8002`
