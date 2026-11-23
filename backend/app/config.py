from typing import List, Optional, Union
import json
from urllib.parse import urlsplit
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    PROJECT_NAME: str = "Penny Wise API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./pennywise.db"
    DATABASE_URL_DIRECT: Optional[str] = None

    # Database Timeouts
    DB_CONNECT_TIMEOUT_SECONDS: int = 10
    DB_STATEMENT_TIMEOUT_MS: int = 15000

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

    @staticmethod
    def normalize_database_url(url: Optional[str]) -> Optional[str]:
        """Normalize legacy postgres:// and bare postgresql:// URLs to explicit postgresql+psycopg://.

        Preserves credentials, hostname, port, database name, query parameters,
        already explicit driver schemes (e.g. postgresql+psycopg://), and unrelated
        schemes (e.g. sqlite://).
        """
        if not url or not isinstance(url, str):
            return url
        stripped = url.strip()
        if stripped.startswith("postgres://"):
            return "postgresql+psycopg://" + stripped[len("postgres://"):]
        if stripped.startswith("postgresql://"):
            return "postgresql+psycopg://" + stripped[len("postgresql://"):]
        return stripped

    @field_validator("DATABASE_URL", "DATABASE_URL_DIRECT", mode="before")
    @classmethod
    def validate_and_normalize_database_urls(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, str):
            return cls.normalize_database_url(v)
        return v

    @field_validator("DB_CONNECT_TIMEOUT_SECONDS")
    @classmethod
    def validate_connect_timeout(cls, v: int) -> int:
        if v <= 0:
            raise ValueError(
                "DB_CONNECT_TIMEOUT_SECONDS must be a positive integer greater than 0."
            )
        return v

    @field_validator("DB_STATEMENT_TIMEOUT_MS")
    @classmethod
    def validate_statement_timeout(cls, v: int) -> int:
        if v < 0:
            raise ValueError(
                "DB_STATEMENT_TIMEOUT_MS must be a non-negative integer (>= 0)."
            )
        return v

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

    def get_migration_database_url(self, cli_override: Optional[str] = None) -> str:
        """Resolve the database connection URL for administrative schema migrations safely.

        Priority order:
        1. Explicit CLI override (-x url=<url>).
        2. Explicit DATABASE_URL_DIRECT setting.
        3. Local SQLite DATABASE_URL (for development and test isolation).
        4. Non-pooled PostgreSQL DATABASE_URL (e.g. local PostgreSQL or direct Neon endpoint).

        Safety:
        - Normalizes legacy postgres:// and bare postgresql:// schemes to postgresql+psycopg://.
        - Parses URL with make_url() and inspects host to reject Neon connection poolers (-pooler).
        - Allows direct endpoints even if credentials, database name, or query parameters contain '-pooler'.
        - Never falls back silently to a lower-priority connection.
        - Never leaks credentials in exception messages.
        """
        candidate: Optional[str] = None

        if cli_override and cli_override.strip():
            candidate = cli_override.strip()
        elif self.DATABASE_URL_DIRECT and self.DATABASE_URL_DIRECT.strip():
            candidate = self.DATABASE_URL_DIRECT.strip()
        elif self.DATABASE_URL and self.DATABASE_URL.strip():
            candidate = self.DATABASE_URL.strip()

        if not candidate:
            raise RuntimeError(
                "No suitable database connection found for schema migrations. "
                "Please configure DATABASE_URL_DIRECT, DATABASE_URL, or pass -x url=<url>."
            )

        candidate = self.normalize_database_url(candidate)

        try:
            parsed_url = make_url(candidate)
            host = parsed_url.host or ""
        except Exception:
            raise RuntimeError(
                "Invalid or malformed database connection URL provided for schema migrations."
            )

        if "-pooler" in host:
            raise RuntimeError(
                "Schema migrations cannot be executed through a connection pooler (PgBouncer). "
                "Please configure DATABASE_URL_DIRECT with the direct (unpooled) PostgreSQL connection string."
            )

        if parsed_url.drivername.startswith("sqlite"):
            return candidate

        if parsed_url.drivername.startswith("postgresql"):
            return candidate

        raise RuntimeError(
            "Unsupported database URL scheme for schema migrations. "
            "Expected SQLite ('sqlite://...') or PostgreSQL ('postgresql://...')."
        )

    def get_migration_connect_args(self, url: str) -> dict:
        """Return dialect-appropriate engine connection arguments for migrations.

        Applies DB_CONNECT_TIMEOUT_SECONDS to PostgreSQL migration connections
        while preserving SQLite-specific check_same_thread=False isolation.
        """
        normalized = self.normalize_database_url(url) or ""
        if normalized.startswith("sqlite"):
            return {"check_same_thread": False}
        return {"connect_timeout": self.DB_CONNECT_TIMEOUT_SECONDS}

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        validate_assignment=True
    )


settings = Settings()

