from fastapi import APIRouter, Query, Request
from ..schemas.coin import CoinListResponse
from ..services.crypto_service import crypto_service
from ..utils.rate_limiter import coins_limiter, search_limiter, resolve_client_ip

router = APIRouter(prefix="/coins", tags=["Cryptocurrency"])


@router.get("", response_model=CoinListResponse, summary="Get Top Cryptocurrency Markets")
async def get_coins(
    request: Request,
    limit: int = Query(6, ge=1, le=50, description="Number of coins to retrieve (max 50)"),
):
    """Retrieve top cryptocurrency prices, market caps, and 24-hour changes with automatic caching and resilient fallbacks."""
    coins_limiter.check_rate_limit(resolve_client_ip(request))
    return await crypto_service.get_coins(limit=limit)


@router.get("/search", response_model=CoinListResponse, summary="Search Cryptocurrencies")
async def search_coins(
    request: Request,
    q: str = Query(..., min_length=1, max_length=50, description="Search query (name, symbol, or ID)"),
    limit: int = Query(10, ge=1, le=50, description="Max search results"),
):
    """Search for coins matching a keyword or symbol."""
    search_limiter.check_rate_limit(resolve_client_ip(request))
    return await crypto_service.search_coins(query=q, limit=limit)

