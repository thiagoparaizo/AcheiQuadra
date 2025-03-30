# app/models/user.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.models.base import MongoBaseModel, MongoId

class UserRole(str, Enum):
    ADMIN = "admin"
    ARENA_OWNER = "arena_owner"
    CUSTOMER = "customer"

class UserBase(MongoBaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    is_active: bool = True
    role: UserRole = UserRole.CUSTOMER

class UserCreate(UserBase):
    password: str
    cpf: str
    birth_date: datetime

class UserUpdate(MongoBaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserInDB(UserBase):
    id: MongoId = Field(..., alias="_id")
    password_hash: str
    cpf: str
    birth_date: datetime
    created_at: datetime
    updated_at: datetime

class User(UserBase):
    id: MongoId = Field(..., alias="_id")
    cpf: str
    birth_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        
class Token(MongoBaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class TokenPayload(MongoBaseModel):
    sub: str
    exp: int
    
class UserLogin(MongoBaseModel):
    """Modelo para login de usuário."""
    email: EmailStr
    password: str