# ARQUIVO: backend/app/core/security.py
from datetime import datetime, timedelta
from typing import Any, Optional, Union

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from pydantic import ValidationError

from app.core.config import settings
from app.db.database import db
from app.models.user import User, UserRole, TokenPayload

from werkzeug.security import generate_password_hash, check_password_hash

# Esquema de autenticação OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# Verificar senha
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return check_password_hash(hashed_password, plain_password)

# Criar hash de senha
def get_password_hash(password: str) -> str:
    return generate_password_hash(password, method='pbkdf2:sha256', salt_length=8)

# Criar token de acesso JWT
def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

# Obter usuário atual a partir do token
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        token_data = TokenPayload(**payload)
        
        if datetime.fromtimestamp(token_data.exp) < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await db.db.users.find_one({"_id": ObjectId(token_data.sub)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )
    user_new = User.from_mongo(user)
    return user_new

# Obter usuário ativo atual
async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário inativo",
        )
    return current_user

# Obter usuário admin atual
async def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão insuficiente",
        )
    return current_user

# Obter usuário dono de arena atual
async def get_current_arena_owner(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role not in [UserRole.ADMIN, UserRole.ARENA_OWNER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão insuficiente",
        )
    return current_user

# Verificar se o usuário é dono de uma arena específica
async def is_arena_owner(arena_id: str, user_id: str) -> bool:
    arena = await db.db.arenas.find_one({"_id": arena_id, "owner_id": user_id})
    return arena is not None