# Modelos em Python usando Pydantic para validação

from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict
from datetime import datetime, time
from enum import Enum
import re
from bson import ObjectId


# Custom ObjectId field para compatibilidade com MongoDB
class PydanticObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not isinstance(v, (str, ObjectId)):
            raise TypeError('ObjectId required')
        return str(v)


# Enumerações
class UserRole(str, Enum):
    ADMIN = "admin"
    ARENA_OWNER = "arena_owner"
    CUSTOMER = "customer"


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


class BookingType(str, Enum):
    SINGLE = "single"  # Aluguel avulso
    MONTHLY = "monthly"  # Aluguel mensal


class BookingStatus(str, Enum):
    PENDING = "pending"  # Aguardando confirmação da arena
    WAITING_PAYMENT = "waiting_payment"  # Aguardando pagamento
    CONFIRMED = "confirmed"  # Confirmado
    CANCELLED = "cancelled"  # Cancelado
    COMPLETED = "completed"  # Finalizado


class PaymentMethod(str, Enum):
    PIX = "pix"
    CREDIT_CARD = "credit_card"
    ON_SITE = "on_site"  # Pagamento no local


class PaymentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REFUNDED = "refunded"


# Modelos base
class User(BaseModel):
    id: Optional[PydanticObjectId] = Field(None, alias="_id")
    username: str
    email: EmailStr
    password_hash: Optional[str] = None
    first_name: str
    last_name: str
    phone: str
    cpf: str
    birth_date: datetime
    role: UserRole = UserRole.CUSTOMER
    google_id: Optional[str] = None
    is_active: bool = False
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    @validator('cpf')
    def validate_cpf(cls, v):
        # Remove caracteres não numéricos
        cpf = re.sub(r'[^0-9]', '', v)
        
        if len(cpf) != 11:
            raise ValueError('CPF deve conter 11 dígitos')
        
        # Verifica se todos os dígitos são iguais
        if cpf == cpf[0] * 11:
            raise ValueError('CPF inválido')
        
        # Validação do primeiro dígito verificador
        soma = 0
        for i in range(9):
            soma += int(cpf[i]) * (10 - i)
        resto = (soma * 10) % 11
        if resto == 10:
            resto = 0
        if resto != int(cpf[9]):
            raise ValueError('CPF inválido')
        
        # Validação do segundo dígito verificador
        soma = 0
        for i in range(10):
            soma += int(cpf[i]) * (11 - i)
        resto = (soma * 10) % 11
        if resto == 10:
            resto = 0
        if resto != int(cpf[10]):
            raise ValueError('CPF inválido')
        
        return cpf


class Address(BaseModel):
    street: str
    number: str
    complement: Optional[str] = None
    neighborhood: str
    city: str
    state: str
    zipcode: str
    coordinates: Dict[str, float] = {"latitude": 0.0, "longitude": 0.0}


class AmenityOption(BaseModel):
    id: str
    name: str
    icon: Optional[str] = None
    category: str  # Categoria da comodidade (ex: "structure", "services", "comfort")


class ExtraService(BaseModel):
    id: Optional[PydanticObjectId] = Field(None, alias="_id")
    name: str
    description: Optional[str] = None
    price: float
    discounted_price: Optional[float] = None
    is_available: bool = True
    image_url: Optional[str] = None


class WeeklySchedule(BaseModel):
    monday: List[Dict[str, time]] = []  # Lista de {"start": time, "end": time}
    tuesday: List[Dict[str, time]] = []
    wednesday: List[Dict[str, time]] = []
    thursday: List[Dict[str, time]] = []
    friday: List[Dict[str, time]] = []
    saturday: List[Dict[str, time]] = []
    sunday: List[Dict[str, time]] = []


class Arena(BaseModel):
    id: Optional[PydanticObjectId] = Field(None, alias="_id")
    name: str
    description: str
    address: Address
    owner_id: PydanticObjectId
    phone: str
    email: EmailStr
    logo_url: Optional[str] = None
    photos: List[str] = []
    amenities: List[str] = []  # IDs das comodidades disponíveis
    rating: float = 0.0
    rating_count: int = 0
    business_hours: WeeklySchedule
    cancellation_policy: str
    advance_payment_required: bool = True
    payment_deadline_hours: Optional[int] = None  # Horas antes para pagamento
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class Court(BaseModel):
    id: Optional[PydanticObjectId] = Field(None, alias="_id")
    arena_id: PydanticObjectId
    name: str
    type: CourtType
    description: str
    photos: List[str] = []
    price_per_hour: float
    discounted_price: Optional[float] = None
    minimum_booking_hours: int = 1
    characteristics: List[str] = []  # Ex: "Grama sintética", "Iluminação LED"
    extra_services: List[PydanticObjectId] = []
    is_available: bool = True
    advance_payment_required: bool = True  # Sobrescreve configuração da arena
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class BookingTimeslot(BaseModel):
    date: datetime
    start_time: time
    end_time: time


class MonthlyBooking(BaseModel):
    weekdays: List[int]  # 0 = Segunda, 6 = Domingo
    start_time: time
    end_time: time
    start_date: datetime
    end_date: Optional[datetime] = None  # Se não definido, continua indefinidamente


class BookingExtraService(BaseModel):
    service_id: PydanticObjectId
    quantity: int
    unit_price: float
    total_price: float


class Booking(BaseModel):
    id: Optional[PydanticObjectId] = Field(None, alias="_id")
    user_id: PydanticObjectId
    court_id: PydanticObjectId
    arena_id: PydanticObjectId
    booking_type: BookingType
    timeslot: Optional[BookingTimeslot] = None  # Para aluguel avulso
    monthly_config: Optional[MonthlyBooking] = None  # Para aluguel mensal
    status: BookingStatus = BookingStatus.PENDING
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
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class Payment(BaseModel):
    id: Optional[PydanticObjectId] = Field(None, alias="_id")
    booking_id: PydanticObjectId
    user_id: PydanticObjectId
    arena_id: PydanticObjectId
    amount: float
    payment_method: PaymentMethod
    status: PaymentStatus = PaymentStatus.PENDING
    gateway_id: Optional[str] = None  # ID da transação no gateway de pagamento
    pix_qrcode: Optional[str] = None
    pix_copy_paste: Optional[str] = None
    credit_card_last4: Optional[str] = None
    payment_date: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class Review(BaseModel):
    id: Optional[PydanticObjectId] = Field(None, alias="_id")
    booking_id: PydanticObjectId
    user_id: PydanticObjectId
    arena_id: PydanticObjectId
    court_id: PydanticObjectId
    rating: int  # De 1 a 5
    comment: Optional[str] = None
    aspects: Dict[str, int] = {}  # Ex: {"limpeza": 4, "atendimento": 5}
    created_at: datetime = Field(default_factory=datetime.now)