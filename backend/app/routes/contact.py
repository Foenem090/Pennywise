from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.contact import ContactInquiry
from ..schemas.contact import ContactInquiryRequest, ContactInquiryResponse
from ..utils.rate_limiter import contact_limiter

router = APIRouter(prefix="/contact", tags=["Contact"])


@router.post(
    "",
    response_model=ContactInquiryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Contact Inquiry"
)
async def submit_contact_inquiry(
    payload: ContactInquiryRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    # Abuse prevention check
    client_ip = request.client.host if request.client else "unknown"
    contact_limiter.check_rate_limit(client_ip)

    inquiry = ContactInquiry(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        message=payload.message.strip(),
        ip_address=client_ip
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)

    return ContactInquiryResponse(
        id=inquiry.id,
        name=inquiry.name,
        email=inquiry.email,
        created_at=inquiry.created_at,
        message="Thank you for reaching out. A Penny Wise specialist will review your inquiry shortly."
    )
