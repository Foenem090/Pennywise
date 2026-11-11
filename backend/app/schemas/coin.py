from typing import List, Optional
from pydantic import BaseModel


class CoinMarket(BaseModel):
    id: str
    symbol: str
    name: str
    image: str
    current_price: float
    price_change_percentage_24h: Optional[float] = 0.0
    market_cap: Optional[float] = None
    market_cap_rank: Optional[int] = None
    high_24h: Optional[float] = None
    low_24h: Optional[float] = None
    total_volume: Optional[float] = None


class CoinListResponse(BaseModel):
    coins: List[CoinMarket]
    count: int
    source: str
    cached: bool

