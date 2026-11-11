from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.newsletter import NewsletterSubscriber
from ..schemas.newsletter import NewsletterResponse, NewsletterSubscribeRequest
from ..utils.rate_limiter import newsletter_limiter

router = APIRouter(prefix="/newsletter", tags=["Newsletter"])


@router.post(
    "/subscribe",
    response_model=NewsletterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Subscribe to Newsletter / Lead Capture"
)
async def subscribe_newsletter(
    payload: NewsletterSubscribeRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    # Check rate limit / abuse prevention
    client_ip = request.client.host if request.client else "unknown"
    newsletter_limiter.check_rate_limit(client_ip)

    clean_email = payload.email.lower().strip()

    # Check for existing subscription
    existing = db.query(NewsletterSubscriber).filter(
        NewsletterSubscriber.email == clean_email
    ).first()

    if existing:
        response.status_code = status.HTTP_200_OK
        if not existing.is_active:
            existing.is_active = True
            db.commit()
            db.refresh(existing)
            return NewsletterResponse(
                id=existing.id,
                email=existing.email,
                created_at=existing.created_at,
                message="Welcome back! Your subscription has been reactivated."
            )
        # Return friendly message without leaking internal error
        return NewsletterResponse(
            id=existing.id,
            email=existing.email,
            created_at=existing.created_at,
            message="You are already subscribed to Penny Wise updates!"
        )

    # Create new subscriber
    new_sub = NewsletterSubscriber(email=clean_email)
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)

    return NewsletterResponse(
        id=new_sub.id,
        email=new_sub.email,
        created_at=new_sub.created_at,
        message="Thank you for subscribing! You will receive our latest crypto insights and IRA guides."
    )
