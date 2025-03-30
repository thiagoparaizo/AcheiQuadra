# app/api/routes/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from bson.objectid import ObjectId
from datetime import datetime

from app.core.security import get_current_user, get_current_active_user, get_password_hash
from app.db.database import db
from app.models.user import User, UserUpdate, UserInDB

router = APIRouter()

@router.get("/users/me", response_model=User)
async def read_users_me(current_user = Depends(get_current_active_user)):
    """Obter dados do usuário atual"""
    return current_user

@router.put("/users/me", response_model=User)
async def update_user_me(
    user_update: UserUpdate,
    current_user = Depends(get_current_active_user)
):
    """Atualizar dados do usuário atual"""
    user_id = current_user.id
    
    # Verificar se o username já existe (se estiver sendo atualizado)
    if user_update.username and user_update.username != current_user.username:
        existing_user = await db.db.users.find_one({"username": user_update.username})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome de usuário já está em uso"
            )
    
    # Verificar se o email já existe (se estiver sendo atualizado)
    if user_update.email and user_update.email != current_user.email:
        existing_user = await db.db.users.find_one({"email": user_update.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já está em uso"
            )
    
    # Preparar os dados para atualização
    update_data = user_update.dict(exclude_unset=True)
    
    # Se a senha estiver sendo atualizada, cria o hash
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    
    # Adicionar data de atualização
    update_data["updated_at"] = datetime.utcnow()
    
    # Atualizar usuário
    await db.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    # Retornar usuário atualizado
    updated_user_doc = await db.db.users.find_one({"_id": ObjectId(user_id)})
    
    return User.from_mongo(updated_user_doc)

@router.get("/users/{user_id}", response_model=User)
async def read_user(
    user_id: str,
    current_user = Depends(get_current_active_user)
):
    """Obter dados de um usuário específico (somente para o próprio usuário ou admin)"""
    # Verificar permissões (somente o próprio usuário ou admin pode ver os detalhes)
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não tem permissão para acessar estes dados"
        )
    
    user_doc = await db.db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Converter usando from_mongo
    return User.from_mongo(user_doc)