from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from .config import settings

# Configure connection arguments and engine parameters based on database dialect
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True,
}

if is_sqlite:
    connect_args["check_same_thread"] = False
else:
    # Conservative settings for serverless PostgreSQL on Neon / Render
    engine_kwargs.update({
        "pool_size": 3,
        "max_overflow": 2,
        "pool_timeout": 30,
        "pool_recycle": 300,
    })
    connect_args.update({
        "connect_timeout": settings.DB_CONNECT_TIMEOUT_SECONDS,
    })

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@event.listens_for(Session, "after_begin")
def set_postgresql_statement_timeout(session, transaction, connection):
    """Enforce a transaction-scoped statement timeout on PostgreSQL connections.

    Using SET LOCAL ensures the timeout resets automatically on commit or rollback,
    which is essential for compatibility with PgBouncer transaction pooling.
    SQLite and other non-PostgreSQL dialects are bypassed.
    """
    if connection.dialect.name == "postgresql" and settings.DB_STATEMENT_TIMEOUT_MS > 0:
        connection.execute(
            text(f"SET LOCAL statement_timeout = {int(settings.DB_STATEMENT_TIMEOUT_MS)}")
        )


Base = declarative_base()


def get_db():
    """Dependency that provides an active database session and ensures clean closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Creates database tables if they do not exist."""
    # Import all models here so that Base metadata registers them
    from .models import newsletter, contact  # noqa: F401
    Base.metadata.create_all(bind=engine)

