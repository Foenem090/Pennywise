import time
import logging
from typing import List, Optional
import httpx
from ..config import settings
from ..schemas.coin import CoinMarket, CoinListResponse

logger = logging.getLogger("pennywise.crypto_service")

# Resilient fallback list for zero-blackout reliability
FALLBACK_COINS = [
    {
        "id": "bitcoin",
        "symbol": "btc",
        "name": "Bitcoin",
        "image": "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
        "current_price": 64250.0,
        "price_change_percentage_24h": 2.35,
        "market_cap": 1265000000000.0,
        "market_cap_rank": 1,
        "high_24h": 65100.0,
        "low_24h": 63400.0,
        "total_volume": 28400000000.0,
    },
    {
        "id": "ethereum",
        "symbol": "eth",
        "name": "Ethereum",
        "image": "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
        "current_price": 3480.0,
        "price_change_percentage_24h": -1.12,
        "market_cap": 418000000000.0,
        "market_cap_rank": 2,
        "high_24h": 3550.0,
        "low_24h": 3420.0,
        "total_volume": 16200000000.0,
    },
    {
        "id": "solana",
        "symbol": "sol",
        "name": "Solana",
        "image": "https://assets.coingecko.com/coins/images/4128/large/solana.png",
        "current_price": 145.0,
        "price_change_percentage_24h": 5.64,
        "market_cap": 67000000000.0,
        "market_cap_rank": 5,
        "high_24h": 149.0,
        "low_24h": 139.5,
        "total_volume": 4100000000.0,
    },
    {
        "id": "binancecoin",
        "symbol": "bnb",
        "name": "BNB",
        "image": "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
        "current_price": 580.0,
        "price_change_percentage_24h": 0.85,
        "market_cap": 89000000000.0,
        "market_cap_rank": 4,
        "high_24h": 589.0,
        "low_24h": 574.0,
        "total_volume": 1200000000.0,
    },
    {
        "id": "ripple",
        "symbol": "xrp",
        "name": "XRP",
        "image": "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
        "current_price": 0.58,
        "price_change_percentage_24h": -0.45,
        "market_cap": 32000000000.0,
        "market_cap_rank": 7,
        "high_24h": 0.60,
        "low_24h": 0.57,
        "total_volume": 1100000000.0,
    },
    {
        "id": "cardano",
        "symbol": "ada",
        "name": "Cardano",
        "image": "https://assets.coingecko.com/coins/images/975/large/cardano.png",
        "current_price": 0.38,
        "price_change_percentage_24h": 1.20,
        "market_cap": 13500000000.0,
        "market_cap_rank": 10,
        "high_24h": 0.39,
        "low_24h": 0.37,
        "total_volume": 420000000.0,
    },
    {
        "id": "dogecoin",
        "symbol": "doge",
        "name": "Dogecoin",
        "image": "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
        "current_price": 0.12,
        "price_change_percentage_24h": 3.82,
        "market_cap": 17800000000.0,
        "market_cap_rank": 8,
        "high_24h": 0.13,
        "low_24h": 0.11,
        "total_volume": 980000000.0,
    },
    {
        "id": "avalanche-2",
        "symbol": "avax",
        "name": "Avalanche",
        "image": "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
        "current_price": 28.5,
        "price_change_percentage_24h": -2.15,
        "market_cap": 11200000000.0,
        "market_cap_rank": 12,
        "high_24h": 29.8,
        "low_24h": 27.9,
        "total_volume": 350000000.0,
    },
]


class CryptoService:
    def __init__(self):
        self._cache: List[CoinMarket] = [CoinMarket(**coin) for coin in FALLBACK_COINS]
        self._last_fetched: float = 0.0

    async def fetch_markets_from_coingecko(self, count: int = 50) -> Optional[List[CoinMarket]]:
        url = (
            f"{settings.COINGECKO_API_BASE}/coins/markets"
            f"?vs_currency=usd&order=market_cap_desc&per_page={count}&page=1&sparkline=false"
        )
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    raw_data = response.json()
                    parsed: List[CoinMarket] = []
                    for item in raw_data:
                        try:
                            parsed.append(
                                CoinMarket(
                                    id=item.get("id", ""),
                                    symbol=item.get("symbol", "").lower(),
                                    name=item.get("name", ""),
                                    image=item.get("image", ""),
                                    current_price=float(item.get("current_price") or 0.0),
                                    price_change_percentage_24h=float(
                                        item.get("price_change_percentage_24h") or 0.0
                                    ),
                                    market_cap=float(item.get("market_cap") or 0.0),
                                    market_cap_rank=item.get("market_cap_rank"),
                                    high_24h=float(item.get("high_24h") or 0.0),
                                    low_24h=float(item.get("low_24h") or 0.0),
                                    total_volume=float(item.get("total_volume") or 0.0),
                                )
                            )
                        except Exception as parse_err:
                            logger.debug(f"Skipping malformed coin: {parse_err}")
                    if parsed:
                        return parsed
                elif response.status_code == 429:
                    logger.warning("CoinGecko rate limit reached (HTTP 429). Using cache/fallback.")
                else:
                    logger.warning(f"CoinGecko responded with status {response.status_code}.")
        except Exception as exc:
            logger.warning(f"Failed to fetch coins from CoinGecko: {exc}. Using cache/fallback.")

        return None

    async def get_coins(self, limit: int = 6) -> CoinListResponse:
        now = time.time()
        is_stale = (now - self._last_fetched) > settings.CACHE_TTL_SECONDS
        source = "cache"
        is_cached = True

        if is_stale or not self._cache:
            fresh_coins = await self.fetch_markets_from_coingecko(count=50)
            if fresh_coins:
                self._cache = fresh_coins
                self._last_fetched = now
                source = "coingecko"
                is_cached = False
            else:
                source = "fallback" if self._last_fetched == 0 else "stale_cache"

        coins_slice = self._cache[:limit]
        return CoinListResponse(
            coins=coins_slice,
            count=len(coins_slice),
            source=source,
            cached=is_cached,
        )

    async def search_coins(self, query: str, limit: int = 10) -> CoinListResponse:
        # Ensure cache is populated
        await self.get_coins(limit=50)

        q = query.strip().lower()
        if not q:
            return await self.get_coins(limit=limit)

        matches = [
            coin for coin in self._cache
            if q in coin.name.lower() or q in coin.symbol.lower() or q in coin.id.lower()
        ]

        matches_slice = matches[:limit]
        return CoinListResponse(
            coins=matches_slice,
            count=len(matches_slice),
            source="search",
            cached=True,
        )


crypto_service = CryptoService()

