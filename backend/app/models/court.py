# app/models/court.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from app.models.base import MongoBaseModel, MongoId

class CourtType(str, Enum):
    SOCCER = "soccer"
    FUTSAL = "futsal"
    TENNIS = "tennis"
    BEACH_TENNIS = "beach_tennis"
    VOLLEYBALL = "volleyball"
    BEACH_VOLLEYBALL = "beach_volleyball"
    BASKETBALL = "basketball"
    PADDLE = "paddle"
    SQUASH = "squash"
    OTHER = "other"

class CourtBase(MongoBaseModel):
    arena_id: str
    name: str
    type: CourtType
    description: str
    price_per_hour: float
    minimum_booking_hours: int = 1
    is_available: bool = True
    advance_payment_required: bool = True

class CourtCreate(CourtBase):
    characteristics: List[str] = []
    extra_services: List[str] = []

class CourtUpdate(MongoBaseModel):
    name: Optional[str] = None
    type: Optional[CourtType] = None
    description: Optional[str] = None
    photos: Optional[List[str]] = None
    price_per_hour: Optional[float] = None
    discounted_price: Optional[float] = None
    minimum_booking_hours: Optional[int] = None
    characteristics: Optional[List[str]] = None
    extra_services: Optional[List[str]] = None
    is_available: Optional[bool] = None
    advance_payment_required: Optional[bool] = None

class CourtInDB(CourtBase):
    id: str = Field(..., alias="_id")
    photos: List[str] = []
    discounted_price: Optional[float] = None
    characteristics: List[str] = []
    extra_services: List[str] = []
    created_at: datetime
    updated_at: datetime

class Court(CourtBase):
    id: str = Field(..., alias="_id")
    photos: List[str] = []
    discounted_price: Optional[float] = None
    characteristics: List[str] = []
    extra_services: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class CourtSearch(MongoBaseModel):
    """Modelo para parâmetros de busca de quadras."""
    court_type: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    neighborhood: Optional[str] = None
    date: Optional[datetime] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    amenities: Optional[List[str]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_km: Optional[float] = None
    sort_by: Optional[str] = "distance"  # distance, price, rating
    page: int = 1
    items_per_page: int = 20