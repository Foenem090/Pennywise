import logging

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.newsletter import NewsletterSubscriber
from ..schemas.newsletter import NewsletterResponse, NewsletterSubscribeRequest
from ..services.email_service import (
    send_newsletter_admin_notification,
    send_newsletter_welcome,
)
from ..utils.rate_limiter import newsletter_limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/newsletter", tags=["Newsletter"])


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
    client_ip = request.client.host if request.client else "unknown"
    newsletter_limiter.check_rate_limit(client_ip)

    clean_email = payload.email.lower().strip()

    # ── Handle existing subscription ───────────────────────────────────────
    existing = db.query(NewsletterSubscriber).filter(
        NewsletterSubscriber.email == clean_email
    ).first()

    if existing:
        response.status_code = status.HTTP_200_OK

        if not existing.is_active:
            # Reactivation — resend welcome email
            existing.is_active = True
            db.commit()
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
    db.commit()
    db.refresh(new_sub)

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
