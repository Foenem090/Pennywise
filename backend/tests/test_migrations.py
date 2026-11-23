import argparse
import os
from io import StringIO
from pathlib import Path
import pytest
from sqlalchemy import create_engine, inspect
from alembic import command
from alembic.config import Config
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from alembic.util import CommandError

from app.database import Base
from app.config import Settings, settings


@pytest.fixture
def alembic_config(tmp_path):
    """Create an Alembic Config pointing to backend/alembic.ini with a test SQLite db."""
    backend_dir = Path(__file__).resolve().parent.parent
    ini_path = backend_dir / "alembic.ini"
    db_file = tmp_path / "test_migration.db"
    db_url = f"sqlite:///{db_file.as_posix()}"

    config = Config(str(ini_path))
    config.set_main_option("script_location", str(backend_dir / "alembic"))
    config.set_main_option("sqlalchemy.url", db_url)
    config.cmd_opts = argparse.Namespace(x=[f"url={db_url}"])
    config.attributes["x_args"] = {"url": db_url}

    return config, db_url


def test_fresh_database_creation_and_upgrade_head(alembic_config):
    """Verify that a fresh database can be created from scratch using alembic upgrade head."""
    config, db_url = alembic_config

    command.upgrade(config, "head")

    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    assert "alembic_version" in tables
    assert "newsletter_subscribers" in tables
    assert "contact_inquiries" in tables
    engine.dispose()


def test_schema_structure_columns_and_constraints(alembic_config):
    """Verify that the migration creates all expected columns, types, nullability, and indexes."""
    config, db_url = alembic_config
    command.upgrade(config, "head")

    engine = create_engine(db_url)
    inspector = inspect(engine)

    # 1. newsletter_subscribers columns
    sub_cols = {col["name"]: col for col in inspector.get_columns("newsletter_subscribers")}
    assert "id" in sub_cols
    assert "email" in sub_cols
    assert "created_at" in sub_cols
    assert "is_active" in sub_cols

    assert sub_cols["id"]["primary_key"] >= 1
    assert sub_cols["email"]["nullable"] is False
    assert sub_cols["is_active"]["nullable"] is False

    # newsletter_subscribers indexes
    sub_indexes = {idx["name"]: idx for idx in inspector.get_indexes("newsletter_subscribers")}
    assert "ix_newsletter_subscribers_email" in sub_indexes
    assert sub_indexes["ix_newsletter_subscribers_email"]["unique"] == 1 or sub_indexes["ix_newsletter_subscribers_email"]["unique"] is True
    assert "ix_newsletter_subscribers_id" in sub_indexes

    # 2. contact_inquiries columns
    contact_cols = {col["name"]: col for col in inspector.get_columns("contact_inquiries")}
    assert "id" in contact_cols
    assert "name" in contact_cols
    assert "email" in contact_cols
    assert "message" in contact_cols
    assert "ip_address" in contact_cols
    assert "created_at" in contact_cols

    assert contact_cols["id"]["primary_key"] >= 1
    assert contact_cols["name"]["nullable"] is False
    assert contact_cols["email"]["nullable"] is False
    assert contact_cols["message"]["nullable"] is False
    assert contact_cols["ip_address"]["nullable"] is True

    # contact_inquiries indexes
    contact_indexes = {idx["name"]: idx for idx in inspector.get_indexes("contact_inquiries")}
    assert "ix_contact_inquiries_email" in contact_indexes
    assert "ix_contact_inquiries_id" in contact_indexes

    engine.dispose()


def test_alembic_version_tracking_and_downgrade_cycle(alembic_config):
    """Verify revision tracking in alembic_version and successful downgrade/re-upgrade cycle."""
    config, db_url = alembic_config

    # Upgrade to head
    command.upgrade(config, "head")

    engine = create_engine(db_url)
    with engine.connect() as conn:
        from sqlalchemy import text
        res = conn.execute(text("SELECT version_num FROM alembic_version")).fetchone()
        assert res is not None
        assert res[0] == "2354f5b41338"

    # Downgrade to base
    command.downgrade(config, "base")

    inspector = inspect(engine)
    tables_after_downgrade = inspector.get_table_names()
    assert "newsletter_subscribers" not in tables_after_downgrade
    assert "contact_inquiries" not in tables_after_downgrade

    # Re-upgrade to head
    command.upgrade(config, "head")
    inspector = inspect(engine)
    tables_re_upgraded = inspector.get_table_names()
    assert "newsletter_subscribers" in tables_re_upgraded
    assert "contact_inquiries" in tables_re_upgraded

    engine.dispose()


def test_model_to_schema_alignment_no_drift(alembic_config):
    """Verify that compare_metadata detects zero schema drift between Base.metadata and the migration."""
    config, db_url = alembic_config
    command.upgrade(config, "head")

    engine = create_engine(db_url)
    with engine.connect() as connection:
        mc = MigrationContext.configure(
            connection,
            opts={"compare_type": True, "compare_server_default": True}
        )
        diff = compare_metadata(mc, Base.metadata)

    # Empty diff indicates complete schema alignment
    assert diff == []
    engine.dispose()


def test_pooled_database_url_rejection_cli_override(monkeypatch):
    """1. Verify that get_migration_database_url rejects pooled PgBouncer URLs passed via CLI override."""
    monkeypatch.setattr(settings, "DATABASE_URL", "sqlite:///./pennywise.db")
    monkeypatch.setattr(settings, "DATABASE_URL_DIRECT", None)

    pooled_cli_url = "postgresql+psycopg://user:secret_pass@ep-pooler-xyz-pooler.neon.tech/neondb"
    with pytest.raises(RuntimeError) as exc_info:
        settings.get_migration_database_url(cli_override=pooled_cli_url)

    error_message = str(exc_info.value)
    assert "connection pooler" in error_message.lower() or "pgbouncer" in error_message.lower()
    assert "secret_pass" not in error_message
    assert "ep-pooler-xyz" not in error_message


def test_pooled_database_url_rejection_database_url_direct(monkeypatch):
    """2. Verify that get_migration_database_url rejects pooled PgBouncer URLs in DATABASE_URL_DIRECT."""
    monkeypatch.setattr(settings, "DATABASE_URL", "sqlite:///./pennywise.db")
    monkeypatch.setattr(
        settings,
        "DATABASE_URL_DIRECT",
        "postgresql+psycopg://user:secret_pass@ep-pooler-xyz-pooler.neon.tech/neondb"
    )

    with pytest.raises(RuntimeError) as exc_info:
        settings.get_migration_database_url()

    error_message = str(exc_info.value)
    assert "connection pooler" in error_message.lower() or "pgbouncer" in error_message.lower()
    assert "secret_pass" not in error_message
    assert "ep-pooler-xyz" not in error_message


def test_pooled_database_url_rejection_database_url(monkeypatch):
    """3. Verify that get_migration_database_url rejects pooled PgBouncer URLs in DATABASE_URL when DIRECT is missing."""
    monkeypatch.setattr(
        settings,
        "DATABASE_URL",
        "postgresql+psycopg://user:secret_pass@ep-pooler-xyz-pooler.neon.tech/neondb?sslmode=require"
    )
    monkeypatch.setattr(settings, "DATABASE_URL_DIRECT", None)

    with pytest.raises(RuntimeError) as exc_info:
        settings.get_migration_database_url()

    error_message = str(exc_info.value)
    assert "connection pooler" in error_message.lower() or "pgbouncer" in error_message.lower()
    assert "database_url_direct" in error_message.lower()
    assert "secret_pass" not in error_message
    assert "ep-pooler-xyz" not in error_message


def test_valid_direct_postgresql_url(monkeypatch):
    """4. Verify that a valid direct PostgreSQL URL is returned correctly and takes precedence over pooled URL."""
    direct_url = "postgresql+psycopg://user:pass@ep-direct-xyz.neon.tech/neondb"
    pooled_url = "postgresql+psycopg://user:pass@ep-direct-xyz-pooler.neon.tech/neondb"

    monkeypatch.setattr(settings, "DATABASE_URL_DIRECT", direct_url)
    monkeypatch.setattr(settings, "DATABASE_URL", pooled_url)

    resolved_url = settings.get_migration_database_url()
    assert resolved_url == direct_url


def test_direct_hostname_accepted_when_password_contains_pooler(monkeypatch):
    """4b. Verify that direct hostname is accepted even when the password contains '-pooler'."""
    url = "postgresql+psycopg://user:my-pooler-secret@ep-direct-xyz.neon.tech:5432/neondb"
    monkeypatch.setattr(settings, "DATABASE_URL_DIRECT", url)
    monkeypatch.setattr(settings, "DATABASE_URL", "sqlite:///./pennywise.db")

    resolved = settings.get_migration_database_url()
    assert resolved == url

    # Also test via CLI override
    assert settings.get_migration_database_url(cli_override=url) == url


def test_direct_hostname_accepted_when_dbname_or_query_contains_pooler(monkeypatch):
    """5. Verify direct hostname is accepted when database name or query parameters contain '-pooler'."""
    url = "postgresql+psycopg://user:secret@ep-direct-xyz.neon.tech:5432/neondb-pooler?channel=pooler-events"
    monkeypatch.setattr(settings, "DATABASE_URL_DIRECT", url)
    monkeypatch.setattr(settings, "DATABASE_URL", "sqlite:///./pennywise.db")

    resolved = settings.get_migration_database_url()
    assert resolved == url

    # Also test via CLI override
    assert settings.get_migration_database_url(cli_override=url) == url


def test_valid_sqlite_url(monkeypatch):
    """5b. Verify that a valid SQLite URL is returned correctly when no direct URL is configured."""
    sqlite_url = "sqlite:///./pennywise.db"
    monkeypatch.setattr(settings, "DATABASE_URL", sqlite_url)
    monkeypatch.setattr(settings, "DATABASE_URL_DIRECT", None)

    resolved_url = settings.get_migration_database_url()
    assert resolved_url == sqlite_url


def test_postgres_scheme_normalization(monkeypatch):
    """6. Verify that legacy postgres:// URLs are normalized to postgresql+psycopg:// without losing components."""
    legacy_url = "postgres://user:p%40ss@ep-direct.neon.tech:5432/neondb?sslmode=require"
    expected_url = "postgresql+psycopg://user:p%40ss@ep-direct.neon.tech:5432/neondb?sslmode=require"

    # Static method normalization
    assert Settings.normalize_database_url(legacy_url) == expected_url

    # Settings instantiation normalization
    s = Settings(DATABASE_URL=legacy_url)
    assert s.DATABASE_URL == expected_url

    # CLI override normalization in get_migration_database_url
    assert settings.get_migration_database_url(cli_override=legacy_url) == expected_url

    # Settings DATABASE_URL resolution
    monkeypatch.setattr(settings, "DATABASE_URL", legacy_url)
    monkeypatch.setattr(settings, "DATABASE_URL_DIRECT", None)
    assert settings.get_migration_database_url() == expected_url


def test_bare_postgresql_scheme_normalization():
    """7. Verify that bare postgresql:// URLs are normalized to explicit postgresql+psycopg://."""
    bare_url = "postgresql://user:pass@ep-direct.neon.tech:5432/neondb?sslmode=require"
    expected_url = "postgresql+psycopg://user:pass@ep-direct.neon.tech:5432/neondb?sslmode=require"

    assert Settings.normalize_database_url(bare_url) == expected_url

    s = Settings(DATABASE_URL=bare_url)
    assert s.DATABASE_URL == expected_url

    assert settings.get_migration_database_url(cli_override=bare_url) == expected_url


def test_explicit_driver_scheme_remains_unchanged():
    """8. Verify that explicit postgresql+psycopg:// URLs remain unchanged."""
    driver_url = "postgresql+psycopg://user:pass@ep-direct.neon.tech:5432/neondb?sslmode=require"
    assert Settings.normalize_database_url(driver_url) == driver_url

    s = Settings(DATABASE_URL=driver_url)
    assert s.DATABASE_URL == driver_url

    assert settings.get_migration_database_url(cli_override=driver_url) == driver_url


def test_sqlite_url_remains_unchanged():
    """9. Verify that SQLite URLs and non-database schemes remain untouched."""
    sqlite_url = "sqlite:///./pennywise.db"
    assert Settings.normalize_database_url(sqlite_url) == sqlite_url

    http_url = "https://example.com/api"
    assert Settings.normalize_database_url(http_url) == http_url


def test_malformed_url_fails_safely():
    """9b. Verify that malformed URLs fail safely with RuntimeError without exposing raw input."""
    with pytest.raises(RuntimeError) as exc_info:
        settings.get_migration_database_url(cli_override="not_a_valid_url")

    error_msg = str(exc_info.value)
    assert "malformed" in error_msg.lower() or "unsupported" in error_msg.lower()


def test_ini_url_cannot_bypass_validation(tmp_path, monkeypatch):
    """8. Verify that setting a custom/pooled sqlalchemy.url in alembic.ini cannot bypass validation."""
    backend_dir = Path(__file__).resolve().parent.parent
    ini_path = backend_dir / "alembic.ini"
    pooled_url = "postgresql+psycopg://user:secret_pass@ep-pooler-xyz-pooler.neon.tech/neondb"

    config = Config(str(ini_path))
    config.set_main_option("script_location", str(backend_dir / "alembic"))
    config.set_main_option("sqlalchemy.url", pooled_url)

    # When DATABASE_URL is pooled and DATABASE_URL_DIRECT is None, running upgrade must fail safely
    monkeypatch.setattr(settings, "DATABASE_URL", pooled_url)
    monkeypatch.setattr(settings, "DATABASE_URL_DIRECT", None)

    with pytest.raises(RuntimeError) as exc_info:
        command.upgrade(config, "head")

    error_msg = str(exc_info.value)
    assert "connection pooler" in error_msg.lower() or "pgbouncer" in error_msg.lower()
    assert "secret_pass" not in error_msg


def test_postgresql_migration_connection_timeout():
    """9. Verify that PostgreSQL migration connection arguments include DB_CONNECT_TIMEOUT_SECONDS."""
    pg_url = "postgresql+psycopg://user:pass@ep-direct.neon.tech/neondb"
    connect_args = settings.get_migration_connect_args(pg_url)

    assert "connect_timeout" in connect_args
    assert connect_args["connect_timeout"] == settings.DB_CONNECT_TIMEOUT_SECONDS
    assert "check_same_thread" not in connect_args


def test_sqlite_connection_arguments_remain_valid():
    """10. Verify that SQLite migration connection arguments preserve check_same_thread=False."""
    sqlite_url = "sqlite:///./pennywise.db"
    connect_args = settings.get_migration_connect_args(sqlite_url)

    assert connect_args == {"check_same_thread": False}
    assert "connect_timeout" not in connect_args


def test_offline_migration_sql_generation(alembic_config, capsys):
    """Verify that offline mode (--sql) generates DDL without executing against a live database."""
    config, db_url = alembic_config

    # Run upgrade in offline mode
    command.upgrade(config, "head", sql=True)

    captured = capsys.readouterr()
    sql_output = captured.out
    assert "CREATE TABLE newsletter_subscribers" in sql_output
    assert "CREATE TABLE contact_inquiries" in sql_output
    assert "CREATE TABLE alembic_version" in sql_output


def test_invalid_revision_failure_handling(alembic_config):
    """Verify that attempting to upgrade to an invalid revision raises CommandError gracefully."""
    config, _ = alembic_config

    with pytest.raises(CommandError):
        command.upgrade(config, "nonexistent_rev_xyz")
