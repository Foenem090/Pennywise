import logging

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.contact import ContactInquiry
from ..schemas.contact import ContactInquiryRequest, ContactInquiryResponse
from ..services.email_service import (
    send_contact_acknowledgement,
    send_contact_admin_notification,
)
from ..utils.rate_limiter import contact_limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["Contact"])


@router.post(
    "",
    response_model=ContactInquiryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Contact Inquiry",
)
async def submit_contact_inquiry(
    payload: ContactInquiryRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    # Abuse prevention
    client_ip = request.client.host if request.client else "unknown"
    contact_limiter.check_rate_limit(client_ip)

    clean_name = payload.name.strip()
    clean_email = payload.email.lower().strip()
    clean_message = payload.message.strip()

    # ── 1. Persist to DB first ─────────────────────────────────────────────
    # Email delivery failures must not lose the inquiry record.
    inquiry = ContactInquiry(
        name=clean_name,
        email=clean_email,
        message=clean_message,
        ip_address=client_ip,
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)

    # ── 2. Dispatch emails after successful DB write ────────────────────────
    ack = await send_contact_acknowledgement(clean_name, clean_email)
    admin = await send_contact_admin_notification(clean_name, clean_email, clean_message)

    if not ack.success:
        logger.warning(
            "Acknowledgement email failed for contact inquiry id=%s (%s): %s",
            inquiry.id, clean_email, ack.error,
        )
    if not admin.success:
        logger.warning(
            "Admin notification failed for contact inquiry id=%s: %s",
            inquiry.id, admin.error,
        )

    return ContactInquiryResponse(
        id=inquiry.id,
        name=inquiry.name,
        email=inquiry.email,
        created_at=inquiry.created_at,
        message=(
            "Thank you for reaching out. A Penny Wise specialist will "
            "review your inquiry shortly. Check your inbox for a confirmation."
        ),
    )
