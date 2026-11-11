from typing import Dict
from pydantic import BaseModel, Field


class CalculatorRequest(BaseModel):
    asset: str = Field(..., description="Cryptocurrency symbol (e.g. BTC, ETH, USDC)")
    amount: float = Field(..., gt=0, description="Principal amount to invest (USD)")


class CalculatorResponse(BaseModel):
    asset: str
    amount: float
    apy_percentage: float
    estimated_daily_return: float
    estimated_monthly_return: float
    estimated_yearly_return: float
    total_estimated_value_1y: float
    disclaimer: str = (
        "Estimated returns are calculated for illustrative purposes based on current APY rates "
        "and are not guaranteed. Market rates and asset values fluctuate."
    )


class SupportedRatesResponse(BaseModel):
    rates: Dict[str, float]
