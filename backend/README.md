# Penny Wise Backend API

FastAPI-powered REST backend providing cryptocurrency market data caching, yield/APY calculators, lead capture newsletter subscriptions, and customer inquiries with SQLite/PostgreSQL storage.

## Features
- **Cryptocurrency Service:** Real-time CoinGecko market aggregation, in-memory caching with configurable TTL, and fallback data for 100% uptime.
- **Yield Calculator:** Real-time earnings estimates for crypto deposits based on configurable asset APYs.
- **Newsletter Subscription:** Duplicate-safe email list subscription with Pydantic validation and abuse limits.
- **Contact Inquiries:** Validated customer message dispatch and persistent database storage.
- **OpenAPI & Swagger Documentation:** Interactive API explorer at `/docs`.

## Quick Start

### 1. Requirements
- Python 3.10+
- Dependencies listed in `requirements.txt`

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run the Backend
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive documentation is available at: `http://localhost:8000/docs`

### 4. Running Tests
```bash
pytest
```
