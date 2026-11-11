from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class NewsletterSubscribeRequest(BaseModel):
    email: EmailStr = Field(..., description="Valid subscriber email address")


class NewsletterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    created_at: datetime
    message: str
