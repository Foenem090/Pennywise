from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactInquiryRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full sender name")
    email: EmailStr = Field(..., description="Valid contact email address")
    message: str = Field(..., min_length=10, max_length=2000, description="Inquiry or message text")


class ContactInquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    created_at: datetime
    message: str
