# ARQUIVO: app/api/api.py
from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
from app.api.routes import auth, users, arenas, courts, bookings, payments, admin, review

api_router = APIRouter()

# Rotas de autenticação
api_router.include_router(auth.router, prefix="", tags=["authentication"])

# Rotas de usuários
api_router.include_router(users.router, prefix="", tags=["users"])

# Rotas de arenas
api_router.include_router(arenas.router, prefix="", tags=["arenas"])

# Rotas de quadras
api_router.include_router(courts.router, prefix="", tags=["courts"])

# Rotas de agendamentos
api_router.include_router(bookings.router, prefix="", tags=["bookings"])

# Rotas de pagamentos
api_router.include_router(payments.router, prefix="", tags=["payments"])

# Rotas de avaliações
api_router.include_router(review.router, prefix="", tags=["reviews"])

# Rotas de administração
api_router.include_router(admin.router, prefix="", tags=["admin"])
