from fastapi import APIRouter
from .health import router as health_router
from .coins import router as coins_router
from .newsletter import router as newsletter_router
from .contact import router as contact_router
from .calculator import router as calculator_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(coins_router)
api_router.include_router(newsletter_router)
api_router.include_router(contact_router)
api_router.include_router(calculator_router)

__all__ = ["api_router"]
