# Penny Wise — Full-Stack Crypto IRA & Wealth Management Platform

Penny Wise is a modern full-stack application built for tax-advantaged cryptocurrency retirement investing (IRAs/401(k) rollovers), real-time market tracking, and high-yield passive rewards.

The application combines a high-performance **React 19** frontend styled with **Tailwind CSS v4** and a modular **Python FastAPI** backend powered by **SQLAlchemy** and **Pydantic**.

---

## 1. Technologies & Architecture

### Frontend
- **Framework:** React 19 (`react`, `react-dom`)
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS v4 & custom theme variables
- **Icons:** React Icons (`react-icons` FontAwesome & Feather)
- **HTTP Client:** Axios (centralized client with base URL configuration)
- **Web3 Wallet Support:** Real browser provider integration (MetaMask & Coinbase Wallet via `window.ethereum`)

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **ORM & Database:** SQLAlchemy with SQLite (default for development; seamless PostgreSQL support)
- **Validation & Serialization:** Pydantic v2 & Pydantic Settings
- **HTTP Server:** Uvicorn
- **HTTP Client & External Services:** HTTPX for CoinGecko market aggregation
- **Testing:** Pytest & Starlette TestClient

---

## 2. Final Project Structure

```
C.App/
├── frontend/                        # React 19 + Vite 8 Client
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/                 # Brand imagery and graphics
│   │   │   ├── bgImg.jpg           # Hero graphic
│   │   │   └── trade.png           # Earn section illustration
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Responsive nav with wallet indicator & mobile menu
│   │   │   ├── hero.jsx            # Hero banner & newsletter lead capture
│   │   │   ├── featured.jsx        # Live market cards, loading skeleton & search modal
│   │   │   ├── earn.jsx            # Staking promotions & interactive APY calculator
│   │   │   ├── Contact.jsx         # Customer inquiries & advisor rollover form
│   │   │   ├── footer.jsx          # Multi-column footer & copyright
│   │   │   ├── ConnectModal.jsx    # Real Web3 wallet modal (MetaMask & Coinbase)
│   │   │   └── Toast.jsx           # Global notification toast
│   │   ├── services/
│   │   │   └── api.js              # Centralized Axios API service
│   │   ├── App.jsx                 # Root layout & state coordinator
│   │   ├── App.css                 # Custom keyframes & utilities
│   │   ├── index.css               # Typography, Tailwind v4 imports & CSS variables
│   │   └── main.jsx                # Entry point
│   ├── .env.example                # Frontend environment template
│   ├── .env                        # Local frontend environment config
│   ├── index.html                  # HTML shell with meta tags & SEO title
│   ├── package.json
│   └── vite.config.js
│
├── backend/                         # FastAPI Application
│   ├── app/
│   │   ├── main.py                 # FastAPI application, CORS & lifespan
│   │   ├── config.py               # Pydantic BaseSettings configuration
│   │   ├── database.py             # SQLAlchemy engine & session dependency
│   │   ├── models/                 # SQLAlchemy database models
│   │   │   ├── newsletter.py       # Newsletter subscriber model
│   │   │   └── contact.py          # Contact inquiry model
│   │   ├── schemas/                # Pydantic validation schemas
│   │   │   ├── coin.py             # CoinMarket & list schemas
│   │   │   ├── calculator.py       # APY request & calculation schemas
│   │   │   ├── newsletter.py       # Subscriber request & response schemas
│   │   │   └── contact.py          # Contact request & response schemas
│   │   ├── routes/                 # API endpoint routers (/api/v1)
│   │   │   ├── health.py           # GET /health
│   │   │   ├── coins.py            # GET /coins and GET /coins/search
│   │   │   ├── newsletter.py       # POST /newsletter/subscribe
│   │   │   ├── contact.py          # POST /contact
│   │   │   └── calculator.py       # GET /calculator/rates & POST /calculator/estimate
│   │   ├── services/
│   │   │   ├── crypto_service.py   # CoinGecko integration, caching & fallback
│   │   │   └── calculator_service.py # APY return calculations
│   │   └── utils/
│   │       └── rate_limiter.py     # In-memory sliding window abuse protection
│   ├── tests/                      # Automated test suite (12 tests)
│   │   ├── conftest.py             # In-memory SQLite fixtures & TestClient
│   │   ├── test_health.py
│   │   ├── test_coins.py
│   │   ├── test_newsletter.py
│   │   ├── test_contact.py
│   │   └── test_calculator.py
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Backend environment template
│   ├── .env                        # Local backend environment config
│   ├── pytest.ini
│   └── README.md
│
├── .gitignore                       # Global Git exclusions
├── pytest.ini                       # Root pytest configuration
└── README.md                        # Master project documentation
```

---

## 3. Environment Variable Configuration

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:
```env
PROJECT_NAME="Penny Wise API"
VERSION="1.0.0"
API_V1_STR="/api/v1"
DATABASE_URL=sqlite:///./pennywise.db
CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:3000","http://127.0.0.1:3000"]
COINGECKO_API_BASE=https://api.coingecko.com/api/v3
CACHE_TTL_SECONDS=60
RATE_LIMIT_PER_MINUTE=60
```
> **PostgreSQL Migration:** To switch from SQLite to PostgreSQL, update `DATABASE_URL` in `backend/.env`:
> `DATABASE_URL=postgresql://user:password@localhost:5432/pennywise_db`

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 4. Installation & Setup

### A. Backend Installation
Open a terminal in the `backend/` directory:
```bash
cd backend
python -m pip install -r requirements.txt
```

### B. Frontend Installation
Open a separate terminal in the `frontend/` directory:
```bash
cd frontend
npm install
```

---

## 5. How to Run the Applications

### Starting the Backend
Run from the root or `backend/` directory:
```bash
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
- **API Base:** `http://127.0.0.1:8000/api/v1`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **ReDoc Documentation:** `http://127.0.0.1:8000/redoc`

### Starting the Frontend
In a separate terminal, run:
```bash
cd frontend
npm run dev
```
- **Web App:** `http://localhost:5173`

---

## 6. How the Frontend and Backend Communicate

1. **Centralized Client:** [api.js](file:///c:/Users/HP/Documents/Codebase/C.App/frontend/src/services/api.js) configures an Axios instance pointing to `VITE_API_BASE_URL` (`http://localhost:8000/api/v1`).
2. **CORS:** FastAPI uses `CORSMiddleware` reading allowed origins directly from `settings.CORS_ORIGINS`.
3. **Market Data:** [featured.jsx](file:///c:/Users/HP/Documents/Codebase/C.App/frontend/src/components/featured.jsx) queries `GET /api/v1/coins`. The backend caches responses for 60 seconds and gracefully serves resilient fallback assets if CoinGecko rate-limits.
4. **Lead Generation:** Both Hero and Earn email forms post to `POST /api/v1/newsletter/subscribe`. Duplicate emails receive an informative confirmation without leaking errors.
5. **Customer Inquiries:** The Contact form posts to `POST /api/v1/contact`. Submissions are validated by Pydantic and persisted in SQLite.
6. **Yield Calculator:** The interactive calculator fetches active rates from `GET /api/v1/calculator/rates` and estimates daily, monthly, and yearly returns with explicit non-guarantee disclosures.
7. **Web3 Connect:** The `ConnectModal` queries browser wallet providers directly (`window.ethereum`) without storing or handling private credentials.

---

## 7. Automated Testing & Verification

### Running Backend Tests
Execute pytest from the root:
```bash
python -m pytest
```
All 12 unit and integration tests cover:
- Health check endpoint (`test_health.py`)
- Cryptocurrency listing, limits, and symbol search (`test_coins.py`)
- Newsletter subscribe, validation, and duplicate handling (`test_newsletter.py`)
- Contact inquiry storage, validation, and abuse protection (`test_contact.py`)
- APY return calculations and rate configurations (`test_calculator.py`)

### Linting & Production Build
```bash
# Frontend Linting
npm --prefix frontend run lint

# Frontend Production Build
npm --prefix frontend run build
```
Result: **0 errors, 0 warnings.**
