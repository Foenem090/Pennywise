from fastapi import APIRouter, Query
from ..schemas.coin import CoinListResponse
from ..services.crypto_service import crypto_service

router = APIRouter(prefix="/coins", tags=["Cryptocurrency"])


@router.get("", response_model=CoinListResponse, summary="Get Top Cryptocurrency Markets")
async def get_coins(
    limit: int = Query(6, ge=1, le=50, description="Number of coins to retrieve (max 50)")
):
    """Retrieve top cryptocurrency prices, market caps, and 24-hour changes with automatic caching and resilient fallbacks."""
    return await crypto_service.get_coins(limit=limit)


@router.get("/search", response_model=CoinListResponse, summary="Search Cryptocurrencies")
async def search_coins(
    q: str = Query(..., min_length=1, max_length=50, description="Search query (name, symbol, or ID)"),
    limit: int = Query(10, ge=1, le=50, description="Max search results")
):
    """Search for coins matching a keyword or symbol."""
    return await crypto_service.search_coins(query=q, limit=limit)
