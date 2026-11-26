import os
import sys
from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from alembic import context

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Import Base and models so metadata is fully populated
from app.database import Base
from app.models.newsletter import NewsletterSubscriber  # noqa: F401
from app.models.contact import ContactInquiry  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def include_object(object, name, type_, reflected, compare_to):
    """Exclude Neon's unmanaged sample table from Alembic autogeneration."""
    if type_ == "table" and name == "playing_with_neon":
        return False
    return True


def get_migration_url() -> str:
    """Resolve the database connection URL for migrations safely.

    Uses Settings.get_migration_database_url() as the single source of truth,
    supporting CLI overrides (-x url=...) and environment variables while ensuring
    strict validation against connection poolers.
    """
    from app.config import settings

    x_args = context.get_x_argument(as_dictionary=True)
    cli_url = x_args.get("url") if isinstance(x_args, dict) else None

    if not cli_url and hasattr(config, "attributes"):
        x_attrs = config.attributes.get("x_args")
        if isinstance(x_attrs, dict):
            cli_url = x_attrs.get("url")
        elif isinstance(x_attrs, str):
            cli_url = x_attrs
        if not cli_url:
            cli_url = config.attributes.get("url")

    return settings.get_migration_database_url(cli_override=cli_url)


def get_connect_args(url: str) -> dict:
    """Return dialect-appropriate engine connection arguments for migrations.

    Applies DB_CONNECT_TIMEOUT_SECONDS to PostgreSQL migration connections
    while preserving SQLite-specific check_same_thread=False isolation.
    """
    from app.config import settings

    return settings.get_migration_connect_args(url)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, emitting SQL statements directly to output.
    """
    url = get_migration_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
        compare_type=True,
        compare_server_default=True,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    Creates an Engine and associates a connection with the context.
    """
    url = get_migration_url()
    connect_args = get_connect_args(url)

    connectable = create_engine(
        url,
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
            compare_type=True,
            compare_server_default=True,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
