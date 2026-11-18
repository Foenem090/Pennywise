from fastapi import APIRouter, Request
from ..config import settings
from ..schemas.calculator import (
    CalculatorRequest,
    CalculatorResponse,
    SupportedRatesResponse,
)
from ..services.calculator_service import calculate_earnings
from ..utils.rate_limiter import calculator_estimate_limiter, calculator_rates_limiter, resolve_client_ip

router = APIRouter(prefix="/calculator", tags=["Yield Calculator"])


@router.get("/rates", response_model=SupportedRatesResponse, summary="Get Supported APY Rates")
async def get_rates(request: Request):
    """Returns current APY reward rates for supported cryptocurrencies."""
    calculator_rates_limiter.check_rate_limit(resolve_client_ip(request))
    return SupportedRatesResponse(rates=settings.APY_RATES)


@router.post("/estimate", response_model=CalculatorResponse, summary="Estimate Crypto APY Returns")
async def estimate_returns(request: Request, payload: CalculatorRequest):
    """Calculates estimated daily, monthly, and yearly returns on crypto deposits."""
    calculator_estimate_limiter.check_rate_limit(resolve_client_ip(request))
    return calculate_earnings(asset=payload.asset, amount=payload.amount)

