from ..config import settings
from ..schemas.calculator import CalculatorResponse


def calculate_earnings(asset: str, amount: float) -> CalculatorResponse:
    normalized_asset = asset.strip().upper()
    
    # Retrieve APY rate or default to 5.0% for other assets
    apy_rate = settings.APY_RATES.get(normalized_asset, 5.0)

    # Basic daily/monthly/yearly interest calculations
    yearly_return = amount * (apy_rate / 100.0)
    monthly_return = yearly_return / 12.0
    daily_return = yearly_return / 365.0
    total_estimated = amount + yearly_return

    return CalculatorResponse(
        asset=normalized_asset,
        amount=amount,
        apy_percentage=apy_rate,
        estimated_daily_return=round(daily_return, 4),
        estimated_monthly_return=round(monthly_return, 2),
        estimated_yearly_return=round(yearly_return, 2),
        total_estimated_value_1y=round(total_estimated, 2)
    )
