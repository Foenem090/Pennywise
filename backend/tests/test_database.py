"""
Tests for database configuration, pooling parameters, and statement timeout handling.
Verifies PgBouncer compatibility, dialect isolation, and timeout settings.
"""
from unittest.mock import MagicMock
import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session, sessionmaker

from app.config import Settings, settings
from app.database import set_postgresql_statement_timeout


# ---------------------------------------------------------------------------
# Configuration Unit Tests
# ---------------------------------------------------------------------------


def test_default_timeout_configuration():
    """Default Settings should have a 10s connect timeout and a 15000ms statement timeout."""
    s = Settings()
    assert s.DB_CONNECT_TIMEOUT_SECONDS == 10
    assert s.DB_STATEMENT_TIMEOUT_MS == 15000


def test_timeout_environment_variable_overrides(monkeypatch):
    """Timeouts configured via environment variables are correctly parsed and applied."""
    monkeypatch.setenv("DB_CONNECT_TIMEOUT_SECONDS", "5")
    monkeypatch.setenv("DB_STATEMENT_TIMEOUT_MS", "8000")
    s = Settings()
    assert s.DB_CONNECT_TIMEOUT_SECONDS == 5
    assert s.DB_STATEMENT_TIMEOUT_MS == 8000


def test_rejection_of_invalid_connect_timeout():
    """DB_CONNECT_TIMEOUT_SECONDS must be a positive integer (> 0)."""
    with pytest.raises(ValidationError):
        Settings(DB_CONNECT_TIMEOUT_SECONDS=0)

    with pytest.raises(ValidationError):
        Settings(DB_CONNECT_TIMEOUT_SECONDS=-5)


def test_rejection_of_invalid_statement_timeout():
    """DB_STATEMENT_TIMEOUT_MS must be non-negative (>= 0)."""
    with pytest.raises(ValidationError):
        Settings(DB_STATEMENT_TIMEOUT_MS=-1)

    with pytest.raises(ValidationError):
        Settings(DB_STATEMENT_TIMEOUT_MS=-500)


def test_zero_statement_timeout_disables_feature(monkeypatch):
    """DB_STATEMENT_TIMEOUT_MS=0 is valid and disables the application-level statement timeout."""
    s = Settings(DB_STATEMENT_TIMEOUT_MS=0)
    assert s.DB_STATEMENT_TIMEOUT_MS == 0

    monkeypatch.setattr(settings, "DB_STATEMENT_TIMEOUT_MS", 0)
    mock_conn = MagicMock()
    mock_conn.dialect.name = "postgresql"

    set_postgresql_statement_timeout(None, None, mock_conn)
    mock_conn.execute.assert_not_called()


# ---------------------------------------------------------------------------
# SQLAlchemy Session Event & Dialect Isolation Tests
# ---------------------------------------------------------------------------


def test_sqlalchemy_session_event_registered():
    """set_postgresql_statement_timeout must be registered on the SQLAlchemy Session after_begin event."""
    assert event.contains(Session, "after_begin", set_postgresql_statement_timeout)


def test_sqlite_connections_never_execute_postgresql_timeout_sql():
    """SQLite connections must never receive PostgreSQL-specific SET LOCAL statement_timeout."""
    # Test through the listener function directly
    mock_sqlite_conn = MagicMock()
    mock_sqlite_conn.dialect.name = "sqlite"

    set_postgresql_statement_timeout(None, None, mock_sqlite_conn)
    mock_sqlite_conn.execute.assert_not_called()

    # Test through a real SQLite transaction session
    engine = create_engine("sqlite:///:memory:")
    TestSessionLocal = sessionmaker(bind=engine)
    with TestSessionLocal() as session:
        result = session.execute(text("SELECT 1")).scalar()
        assert result == 1


def test_postgresql_connections_receive_configured_statement_timeout(monkeypatch):
    """PostgreSQL connections must receive SET LOCAL statement_timeout with the configured value."""
    monkeypatch.setattr(settings, "DB_STATEMENT_TIMEOUT_MS", 15000)
    mock_pg_conn = MagicMock()
    mock_pg_conn.dialect.name = "postgresql"

    set_postgresql_statement_timeout(None, None, mock_pg_conn)
    mock_pg_conn.execute.assert_called_once()

    # Verify SQL text
    called_clause = mock_pg_conn.execute.call_args[0][0]
    assert "SET LOCAL statement_timeout = 15000" in str(called_clause)


def test_custom_postgresql_statement_timeout_value(monkeypatch):
    """A custom statement timeout value is correctly formatted into the SET LOCAL command."""
    monkeypatch.setattr(settings, "DB_STATEMENT_TIMEOUT_MS", 7500)
    mock_pg_conn = MagicMock()
    mock_pg_conn.dialect.name = "postgresql"

    set_postgresql_statement_timeout(None, None, mock_pg_conn)
    called_clause = mock_pg_conn.execute.call_args[0][0]
    assert "SET LOCAL statement_timeout = 7500" in str(called_clause)


# ---------------------------------------------------------------------------
# Engine Kwargs & PgBouncer Compatibility Tests
# ---------------------------------------------------------------------------


def test_postgresql_engine_parameters_and_connect_timeout():
    """Verify that backend/app/database.py genuinely constructs the required PostgreSQL
    engine parameters, connection timeouts, and PgBouncer-compatible arguments.
    Executes database.py in an isolated module context to prevent mutating app.database
    function identity in the test runner."""
    import importlib.util
    from pathlib import Path
    from unittest.mock import patch

    db_path = Path(__file__).resolve().parent.parent / "app" / "database.py"
    spec = importlib.util.spec_from_file_location("app.isolated_pg_database", str(db_path))
    isolated_db_module = importlib.util.module_from_spec(spec)
    isolated_db_module.__package__ = "app"

    mock_settings = Settings(
        DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/testdb",
        DB_CONNECT_TIMEOUT_SECONDS=10,
    )

    try:
        with patch("sqlalchemy.create_engine") as mock_create_engine:
            with patch("app.config.settings", mock_settings):
                spec.loader.exec_module(isolated_db_module)

                mock_create_engine.assert_called_once()
                called_args, called_kwargs = mock_create_engine.call_args

                # Verify the PostgreSQL URL passed to create_engine
                assert called_args[0] == "postgresql+psycopg://user:pass@localhost:5432/testdb"

                # 1. Verify connect_timeout is configured from settings
                assert called_kwargs["connect_args"]["connect_timeout"] == 10

                # 2. Verify pool settings and pre_ping
                assert called_kwargs["pool_size"] == 3
                assert called_kwargs["max_overflow"] == 2
                assert called_kwargs["pool_timeout"] == 30
                assert called_kwargs["pool_recycle"] == 300
                assert called_kwargs["pool_pre_ping"] is True

                # 3. Verify options argument is absent from connect_args (PgBouncer compatibility)
                assert "options" not in called_kwargs["connect_args"]
    finally:
        # Clean up any listener registered on Session during isolated execution
        if hasattr(isolated_db_module, "set_postgresql_statement_timeout") and event.contains(
            Session, "after_begin", isolated_db_module.set_postgresql_statement_timeout
        ):
            event.remove(Session, "after_begin", isolated_db_module.set_postgresql_statement_timeout)


def test_incompatible_options_argument_remains_absent():
    """Ensure the rejected options startup argument (-c statement_timeout=...) is not in connect_args."""
    from app.database import connect_args
    assert "options" not in connect_args
