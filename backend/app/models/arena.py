# app/models/arena.py
from fastapi import Form
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, time
from enum import Enum
from app.models.base import MongoBaseModel, MongoId

class Address(MongoBaseModel):
    street: str
    number: str
    complement: Optional[str] = None
    neighborhood: str
    city: str
    state: str
    zipcode: str
    coordinates: Dict[str, float] = {"latitude": 0.0, "longitude": 0.0}

class WeeklySchedule(MongoBaseModel):
    monday: List[Dict[str, time]] = []  # Lista de {"start": time, "end": time}
    tuesday: List[Dict[str, time]] = []
    wednesday: List[Dict[str, time]] = []
    thursday: List[Dict[str, time]] = []
    friday: List[Dict[str, time]] = []
    saturday: List[Dict[str, time]] = []
    sunday: List[Dict[str, time]] = []

class ArenaBase(MongoBaseModel):
    name: str
    description: str
    address: Address
    phone: str
    email: EmailStr
    business_hours: WeeklySchedule
    cancellation_policy: str
    advance_payment_required: bool = True
    payment_deadline_hours: Optional[int] = None  # Horas antes para pagamento
    active: bool = True

class ArenaCreate(ArenaBase):
    owner_id: Optional[str] = None  # Se não fornecido, usa o ID do usuário atual

class ArenaUpdate(MongoBaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[Address] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    logo_url: Optional[str] = None
    photos: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    business_hours: Optional[WeeklySchedule] = None
    cancellation_policy: Optional[str] = None
    advance_payment_required: Optional[bool] = None
    payment_deadline_hours: Optional[int] = None
    active: Optional[bool] = None

class ArenaInDB(ArenaBase):
    id: str = Field(..., alias="_id")
    owner_id: str
    logo_url: Optional[str] = None
    photos: List[str] = []
    amenities: List[str] = []
    rating: float = 0.0
    rating_count: int = 0
    created_at: datetime
    updated_at: datetime

class Arena(ArenaBase):
    id: str = Field(..., alias="_id")
    owner_id: str
    logo_url: Optional[str] = None
    photos: List[str] = []
    amenities: List[str] = []
    rating: float = 0.0
    rating_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    # Dados relacionados
    owner: Optional[Dict[str, Any]] = None
    courts_count: Optional[int] = None

    class Config:
        orm_mode = True
        arbitrary_types_allowed = True

# Modelo para busca de arenas
class ArenaFilter(MongoBaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    neighborhood: Optional[str] = None
    amenities: Optional[List[str]] = None
    court_type: Optional[str] = None
    min_rating: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_km: Optional[float] = None
    active: bool = True
    
class ArenaCreateWithFiles(ArenaCreate):
    logo_base64: Optional[str] = None
    photos_base64: List[str] = Field(default_factory=list)
    
class ArenaUpdateWithFiles(MongoBaseModel):
    # Campos básicos
    name: Optional[str] = Form(None)
    description: Optional[str] = Form(None)
    phone: Optional[str] = Form(None)
    email: Optional[EmailStr] = Form(None)
    address: Optional[Address] = None
    business_hours: Optional[WeeklySchedule] = None
    amenities: Optional[List[str]] = None
    cancellation_policy: Optional[str] = Form(None)
    advance_payment_required: Optional[bool] = Form(None)
    payment_deadline_hours: Optional[int] = Form(None)
    active: Optional[bool] = Form(None)