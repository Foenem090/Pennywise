from typing import List, Optional, Union
import json
from urllib.parse import urlsplit
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Penny Wise API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./pennywise.db"

    # Frontend Application URL (for email links and client redirects)
    FRONTEND_URL: str = "http://localhost:5173"

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
        default_localhost = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]

        # No explicit value → return localhost defaults for local development
        if v is None:
            return default_localhost

        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    if not isinstance(parsed, list):
                        parsed = [str(parsed)]
                except Exception:
                    parsed = [i.strip() for i in v.split(",") if i.strip()]
            else:
                parsed = [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            parsed = list(v)
        else:
            return default_localhost

        # Reject wildcard origins
        if "*" in parsed:
            raise ValueError(
                'Wildcard origin "*" is not permitted. Specify explicit origin URLs.'
            )

        # Remove duplicates while preserving order
        parsed = list(dict.fromkeys(parsed))

        # Determine whether the caller supplied any external (non-localhost) origin.
        # Only treat origins whose actual hostname is exactly "localhost" or "127.0.0.1"
        # as localhost origins. Origins with hostnames such as "localhost.attacker.com"
        # are treated as external.
        # If external origins are present, return exactly what was configured — do NOT
        # inject localhost origins.
        # If only genuine localhost origins are present, supplement to the full
        # default localhost set so local development works correctly.
        def _is_localhost(origin: str) -> bool:
            try:
                parsed_url = urlsplit(origin if "://" in origin else f"//{origin}")
                return parsed_url.hostname in ("localhost", "127.0.0.1")
            except Exception:
                return False

        has_external_origin = any(not _is_localhost(o) for o in parsed)

        if has_external_origin:
            return parsed
        else:
            return list(dict.fromkeys(parsed + default_localhost))

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

