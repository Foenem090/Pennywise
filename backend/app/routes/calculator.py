from fastapi import APIRouter
from ..config import settings
from ..schemas.calculator import (
    CalculatorRequest,
    CalculatorResponse,
    SupportedRatesResponse,
)
from ..services.calculator_service import calculate_earnings

router = APIRouter(prefix="/calculator", tags=["Yield Calculator"])


@router.get("/rates", response_model=SupportedRatesResponse, summary="Get Supported APY Rates")
async def get_rates():
    """Returns current APY reward rates for supported cryptocurrencies."""
    return SupportedRatesResponse(rates=settings.APY_RATES)


@router.post("/estimate", response_model=CalculatorResponse, summary="Estimate Crypto APY Returns")
async def estimate_returns(payload: CalculatorRequest):
    """Calculates estimated daily, monthly, and yearly returns on crypto deposits."""
    return calculate_earnings(asset=payload.asset, amount=payload.amount)
