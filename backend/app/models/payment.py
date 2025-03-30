# app/models/payment.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum
from app.models.base import MongoBaseModel, MongoId

class PaymentMethod(str, Enum):
    PIX = "pix"
    CREDIT_CARD = "credit_card"
    ON_SITE = "on_site"  # Pagamento no local

class PaymentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REFUNDED = "refunded"

class PaymentBase(MongoBaseModel):
    booking_id: str
    payment_method: PaymentMethod
    amount: float

class PaymentCreate(PaymentBase):
    card_data: Optional[Dict[str, Any]] = None  # Para pagamentos com cartão

class PaymentUpdate(MongoBaseModel):
    status: PaymentStatus
    gateway_id: Optional[str] = None
    payment_date: Optional[datetime] = None

class PaymentInDB(PaymentBase):
    id: str = Field(..., alias="_id")
    user_id: str
    arena_id: str
    status: PaymentStatus = PaymentStatus.PENDING
    gateway_id: Optional[str] = None  # ID da transação no gateway de pagamento
    pix_qrcode: Optional[str] = None
    pix_copy_paste: Optional[str] = None
    credit_card_last4: Optional[str] = None
    payment_date: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class Payment(PaymentBase):
    id: str = Field(..., alias="_id")
    user_id: str
    arena_id: str
    status: PaymentStatus
    gateway_id: Optional[str] = None
    pix_qrcode: Optional[str] = None
    pix_copy_paste: Optional[str] = None
    credit_card_last4: Optional[str] = None
    payment_date: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Dados relacionados
    booking: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True
       