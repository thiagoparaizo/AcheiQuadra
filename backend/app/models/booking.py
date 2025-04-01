# app/models/booking.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, time
from enum import Enum
from app.models.base import MongoBaseModel, MongoId

class BookingType(str, Enum):
    SINGLE = "single"  # Aluguel avulso
    MONTHLY = "monthly"  # Aluguel mensal

class BookingStatus(str, Enum):
    PENDING = "pending"  # Aguardando confirmação da arena
    WAITING_PAYMENT = "waiting_payment"  # Aguardando pagamento
    CONFIRMED = "confirmed"  # Confirmado
    CANCELLED = "cancelled"  # Cancelado
    COMPLETED = "completed"  # Finalizado

class BookingTimeslot(MongoBaseModel):
    date: str  # ISO format date (YYYY-MM-DD)
    start_time: str  # HH:MM format
    end_time: str  # HH:MM format

class MonthlyBookingConfig(MongoBaseModel):
    weekdays: List[int]  # 0 = Segunda, 6 = Domingo
    start_time: str  # HH:MM format
    end_time: str  # HH:MM format
    start_date: str  # ISO format date (YYYY-MM-DD)
    end_date: Optional[str] = None  # ISO format date, optional

class BookingExtraService(MongoBaseModel):
    service_id: str
    name: str
    quantity: int
    unit_price: float
    total_price: float

class BookingBase(MongoBaseModel):
    court_id: str
    booking_type: BookingType
    timeslot: Optional[BookingTimeslot] = None
    monthly_config: Optional[MonthlyBookingConfig] = None

class BookingCreate(BookingBase):
    extra_services: List[Dict[str, Any]] = []  # Lista de {service_id, quantity}

class BookingStatusUpdate(MongoBaseModel):
    status: BookingStatus
    notes: Optional[str] = None

class BookingCancellation(MongoBaseModel):
    reason: Optional[str] = None
    request_refund: bool = False

class BookingInDB(BookingBase):
    id: str = Field(..., alias="_id")
    user_id: str
    arena_id: str
    status: BookingStatus
    price_per_hour: float
    total_hours: float
    subtotal: float
    extra_services: List[BookingExtraService] = []
    total_amount: float
    discount_amount: float = 0.0
    requires_payment: bool = True
    payment_deadline: Optional[datetime] = None
    confirmation_deadline: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class Booking(BookingBase):
    id: str = Field(..., alias="_id")
    user_id: str
    arena_id: str
    status: BookingStatus
    price_per_hour: float
    total_hours: float
    subtotal: float
    extra_services: List[BookingExtraService] = []
    total_amount: float
    discount_amount: float = 0.0
    requires_payment: bool = True
    payment_deadline: Optional[datetime] = None
    confirmation_deadline: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Dados relacionados
    court: Optional[Dict[str, Any]] = None
    arena: Optional[Dict[str, Any]] = None
    user: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True
        
class BookingUpdate(MongoBaseModel):
    """Modelo para atualização de reservas."""
    status: Optional[BookingStatus] = None
    notes: Optional[str] = None
    requires_payment: Optional[bool] = None
    payment_deadline: Optional[datetime] = None
    confirmation_deadline: Optional[datetime] = None
    
    # Para reservas mensais
    monthly_config: Optional[Dict[str, Any]] = None
    

class BookingStatusUpdate(MongoBaseModel):
    """Modelo para atualização de status de reserva."""
    status: BookingStatus
    notes: Optional[str] = None
    
class BookingCancellation(MongoBaseModel):
    """Modelo para cancelamento de reserva."""
    reason: Optional[str] = None
    request_refund: bool = False
    
class BookingUserInfo(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    username: Optional[str] = None

class BookingCourtInfo(BaseModel):
    id: str
    name: str
    type: str
    cover_image: Optional[str] = None

class BookingArenaInfo(BaseModel):
    id: str
    name: str
    city: Optional[str] = None
    neighborhood: Optional[str] = None

class BookingWithDetails(Booking):
    user: BookingUserInfo
    court: BookingCourtInfo
    arena: BookingArenaInfo
    payment_status: Optional[str] = None
    can_cancel: Optional[bool] = None

class PaginatedBookingsResponse(BaseModel):
    bookings: List[BookingWithDetails]
    total_pages: int
    current_page: int
    total_items: int
    items_per_page: int