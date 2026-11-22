import logging

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.newsletter import NewsletterSubscriber
from ..schemas.newsletter import NewsletterResponse, NewsletterSubscribeRequest
from ..services.email_service import (
    send_newsletter_admin_notification,
    send_newsletter_welcome,
)
from ..utils.rate_limiter import newsletter_limiter, resolve_client_ip

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/newsletter", tags=["Newsletter"])


def _is_unique_constraint_violation(exc: IntegrityError) -> bool:
    """Inspect whether an IntegrityError was caused by a unique constraint or index violation."""
    orig = getattr(exc, "orig", None)
    if orig is not None:
        # PostgreSQL: psycopg 3 sqlstate or psycopg2 pgcode for unique_violation is 23505
        sqlstate = getattr(orig, "sqlstate", None) or getattr(orig, "pgcode", None)
        if sqlstate == "23505":
            return True

        # SQLite error name for unique constraint violation where available
        sqlite_errorname = getattr(orig, "sqlite_errorname", None)
        if sqlite_errorname == "SQLITE_CONSTRAINT_UNIQUE":
            return True

    # Reliable fallback string inspection across driver variants without fragile coupling
    msg = str(exc).lower()
    return "unique" in msg or "duplicate key" in msg


@router.post(
    "/subscribe",
    response_model=NewsletterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Subscribe to Newsletter / Lead Capture",
)
async def subscribe_newsletter(
    payload: NewsletterSubscribeRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    # Abuse prevention
    client_ip = resolve_client_ip(request)
    newsletter_limiter.check_rate_limit(client_ip)

    clean_email = payload.email.lower().strip()

    # ── Handle existing subscription ───────────────────────────────────────
    existing = db.query(NewsletterSubscriber).filter(
        NewsletterSubscriber.email == clean_email
    ).first()

    if existing:
        response.status_code = status.HTTP_200_OK

        if not existing.is_active:
            # Atomic conditional update: only reactivate if subscriber is still inactive
            affected_rows = db.query(NewsletterSubscriber).filter(
                NewsletterSubscriber.id == existing.id,
                NewsletterSubscriber.is_active.is_(False),
            ).update({"is_active": True})
            db.commit()

            if affected_rows == 1:
                db.refresh(existing)

                # Fire-and-forget emails; failures are logged but do not affect response
                welcome = await send_newsletter_welcome(clean_email)
                admin = await send_newsletter_admin_notification(clean_email)
                if not welcome.success:
                    logger.warning(
                        "Welcome email failed for reactivated subscriber %s: %s",
                        clean_email, welcome.error,
                    )
                if not admin.success:
                    logger.warning(
                        "Admin notification failed for reactivated subscriber %s: %s",
                        clean_email, admin.error,
                    )

                return NewsletterResponse(
                    id=existing.id,
                    email=existing.email,
                    created_at=existing.created_at,
                    message="Welcome back! Your subscription has been reactivated.",
                )

            # Zero affected rows: another concurrent request already reactivated the subscriber
            db.refresh(existing)
            return NewsletterResponse(
                id=existing.id,
                email=existing.email,
                created_at=existing.created_at,
                message="You are already subscribed to Penny Wise updates!",
            )

        # Already active — do NOT resend emails
        return NewsletterResponse(
            id=existing.id,
            email=existing.email,
            created_at=existing.created_at,
            message="You are already subscribed to Penny Wise updates!",
        )

    # ── New subscription ───────────────────────────────────────────────────
    # 1. Persist to DB first — email failure must not lose the subscription
    new_sub = NewsletterSubscriber(email=clean_email)
    db.add(new_sub)
    try:
        db.commit()
        db.refresh(new_sub)
    except IntegrityError as exc:
        db.rollback()

        # Handle race condition: check if error is a unique violation and record now exists
        if _is_unique_constraint_violation(exc):
            existing = db.query(NewsletterSubscriber).filter(
                NewsletterSubscriber.email == clean_email
            ).first()
            if existing:
                response.status_code = status.HTTP_200_OK
                return NewsletterResponse(
                    id=existing.id,
                    email=existing.email,
                    created_at=existing.created_at,
                    message="You are already subscribed to Penny Wise updates!",
                )

        # Unrelated integrity failure or missing record: re-raise so unexpected errors propagate
        raise

    # 2. Dispatch emails after successful DB write
    welcome = await send_newsletter_welcome(clean_email)
    admin = await send_newsletter_admin_notification(clean_email)

    if not welcome.success:
        logger.warning(
            "Welcome email failed for new subscriber %s: %s",
            clean_email, welcome.error,
        )
    if not admin.success:
        logger.warning(
            "Admin notification failed for new subscriber %s: %s",
            clean_email, admin.error,
        )

    return NewsletterResponse(
        id=new_sub.id,
        email=new_sub.email,
        created_at=new_sub.created_at,
        message=(
            "Thank you for subscribing! "
            "Check your inbox for a welcome email from Penny Wise."
        ),
    )
