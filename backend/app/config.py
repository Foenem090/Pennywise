from typing import List, Optional, Union
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Penny Wise API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./pennywise.db"

    # CORS Origins
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # External APIs
    COINGECKO_API_BASE: str = "https://api.coingecko.com/api/v3"
    CACHE_TTL_SECONDS: int = 60
    RATE_LIMIT_PER_MINUTE: int = 60

    # Configurable APY Rates
    APY_RATES: dict[str, float] = {
        "USDC": 12.0,
        "USDT": 11.5,
        "SOL": 7.8,
        "ETH": 5.2,
        "BNB": 4.8,
        "BTC": 3.5,
        "ADA": 3.2,
        "XRP": 3.0,
    }

    # Resend transactional email
    RESEND_API_KEY: Optional[str] = None
    MAIL_FROM: str = "noreply@example.com"
    ADMIN_EMAIL: Optional[str] = None

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

