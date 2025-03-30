# app/models/review.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.base import MongoBaseModel, MongoId

class ReviewBase(MongoBaseModel):
    rating: int  # De 1 a 5
    comment: Optional[str] = None
    aspects: Dict[str, int] = {}  # Ex: {"limpeza": 4, "atendimento": 5}

class ReviewCreate(ReviewBase):
    booking_id: str

class ReviewUpdate(MongoBaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None
    aspects: Optional[Dict[str, int]] = None

class ReviewInDB(ReviewBase):
    id: str = Field(..., alias="_id")
    booking_id: str
    user_id: str
    arena_id: str
    court_id: str
    created_at: datetime

class Review(ReviewBase):
    id: str = Field(..., alias="_id")
    booking_id: str
    user_id: str
    arena_id: str
    court_id: str
    created_at: datetime
    
    # Dados relacionados
    user: Optional[Dict[str, Any]] = None
    arena: Optional[Dict[str, Any]] = None
    court: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True
        