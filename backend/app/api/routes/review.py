# app/api/routes/reviews.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson.objectid import ObjectId

from app.core.security import get_current_user, get_current_active_user
from app.db.database import db
from app.models.review import Review, ReviewCreate, ReviewUpdate

router = APIRouter()

@router.post("/reviews/", response_model=Review)
async def create_review(
    review_data: ReviewCreate,
    current_user = Depends(get_current_active_user)
):
    """Criar uma avaliação para uma reserva concluída"""
    user_id = current_user.id  # Usando id em vez de _id
    
    # Buscar a reserva
    booking_doc = await db.db.bookings.find_one({"_id": ObjectId(review_data.booking_id)})
    if not booking_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada"
        )
    
    # Verificar se o usuário tem permissão (dono da reserva)
    if booking_doc["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada. Você só pode avaliar suas próprias reservas."
        )
    
    # Verificar se a reserva está concluída
    if booking_doc["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Só é possível avaliar reservas concluídas"
        )
    
    # Verificar se já existe uma avaliação para esta reserva
    existing_review = await db.db.reviews.find_one({"booking_id": review_data.booking_id})
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você já avaliou esta reserva"
        )
    
    # Criar a avaliação
    new_review = {
        "booking_id": review_data.booking_id,
        "user_id": user_id,
        "arena_id": booking_doc["arena_id"],
        "court_id": booking_doc["court_id"],
        "rating": review_data.rating,
        "comment": review_data.comment,
        "aspects": review_data.aspects,
        "created_at": datetime.now()
    }
    
    # Inserir no banco de dados
    result = await db.db.reviews.insert_one(new_review)
    
    # Buscar a review completa do banco
    review_doc = await db.db.reviews.find_one({"_id": result.inserted_id})
    
    # Atualizar rating médio da arena
    await update_arena_rating(booking_doc["arena_id"])
    
    # Usar from_mongo para converter o documento
    return Review.from_mongo(review_doc)

@router.get("/reviews/booking/{booking_id}", response_model=Review)
async def get_booking_review(
    booking_id: str,
    current_user = Depends(get_current_active_user)
):
    """Obter avaliação de uma reserva específica"""
    user_id = current_user.id  # Usando id em vez de _id
    
    # Buscar a reserva
    booking_doc = await db.db.bookings.find_one({"_id": ObjectId(booking_id)})
    if not booking_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada"
        )
    
    # Buscar a avaliação
    review_doc = await db.db.reviews.find_one({"booking_id": booking_id})
    if not review_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avaliação não encontrada"
        )
    
    # Verificar permissões
    is_owner = review_doc["user_id"] == user_id
    
    arena_doc = await db.db.arenas.find_one({"_id": ObjectId(review_doc["arena_id"])})
    if not arena_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena não encontrada"
        )
    
    is_arena_owner = str(arena_doc["owner_id"]) == user_id
    is_admin = current_user.role == "admin"
    
    if not (is_owner or is_arena_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada"
        )
    
    # Usar from_mongo para converter o documento
    return Review.from_mongo(review_doc)

@router.get("/reviews/arena/{arena_id}", response_model=List[Review])
async def get_arena_reviews(
    arena_id: str,
    page: int = 1,
    items_per_page: int = 20
):
    """Obter avaliações de uma arena específica"""
    # Verificar se a arena existe
    arena_doc = await db.db.arenas.find_one({"_id": ObjectId(arena_id)})
    if not arena_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena não encontrada"
        )
    
    # Aplicar paginação
    skip = (page - 1) * items_per_page
    
    # Buscar avaliações ordenadas por data (mais recentes primeiro)
    cursor = db.db.reviews.find({"arena_id": arena_id}).sort("created_at", -1).skip(skip).limit(items_per_page)
    
    # Converter cursor para lista
    reviews = []
    async for review_doc in cursor:
        # Adicionar dados do usuário
        user_doc = await db.db.users.find_one({"_id": ObjectId(review_doc["user_id"])})
        if user_doc:
            review_doc["user"] = {
                "name": f"{user_doc.get('first_name')} {user_doc.get('last_name')[0]}.",  # Apenas inicial do sobrenome
            }
        
        # Usar from_mongo para converter o documento
        reviews.append(Review.from_mongo(review_doc))
    
    return reviews

@router.get("/reviews/court/{court_id}", response_model=List[Review])
async def get_court_reviews(
    court_id: str,
    page: int = 1,
    items_per_page: int = 20
):
    """Obter avaliações de uma quadra específica"""
    # Verificar se a quadra existe
    court_doc = await db.db.courts.find_one({"_id": ObjectId(court_id)})
    if not court_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quadra não encontrada"
        )
    
    # Aplicar paginação
    skip = (page - 1) * items_per_page
    
    # Buscar avaliações ordenadas por data (mais recentes primeiro)
    cursor = db.db.reviews.find({"court_id": court_id}).sort("created_at", -1).skip(skip).limit(items_per_page)
    
    # Converter cursor para lista
    reviews = []
    async for review_doc in cursor:
        # Adicionar dados do usuário
        user_doc = await db.db.users.find_one({"_id": ObjectId(review_doc["user_id"])})
        if user_doc:
            review_doc["user"] = {
                "name": f"{user_doc.get('first_name')} {user_doc.get('last_name')[0]}.",  # Apenas inicial do sobrenome
            }
        
        # Usar from_mongo para converter o documento
        reviews.append(Review.from_mongo(review_doc))
    
    return reviews

@router.get("/reviews/user/me", response_model=List[Review])
async def get_user_reviews(
    current_user = Depends(get_current_active_user),
    page: int = 1,
    items_per_page: int = 20
):
    """Obter avaliações feitas pelo usuário logado"""
    user_id = current_user.id  # Usando id em vez de _id
    
    # Aplicar paginação
    skip = (page - 1) * items_per_page
    
    # Buscar avaliações ordenadas por data (mais recentes primeiro)
    cursor = db.db.reviews.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(items_per_page)
    
    # Converter cursor para lista
    reviews = []
    async for review_doc in cursor:
        # Buscar dados da quadra e arena
        court_doc = await db.db.courts.find_one({"_id": ObjectId(review_doc["court_id"])})
        arena_doc = await db.db.arenas.find_one({"_id": ObjectId(review_doc["arena_id"])})
        
        if court_doc and arena_doc:
            review_doc["court"] = {
                "id": str(court_doc["_id"]),
                "name": court_doc["name"],
                "type": court_doc["type"]
            }
            
            review_doc["arena"] = {
                "id": str(arena_doc["_id"]),
                "name": arena_doc["name"]
            }
        
        # Usar from_mongo para converter o documento
        reviews.append(Review.from_mongo(review_doc))
    
    return reviews

@router.put("/reviews/{review_id}", response_model=Review)
async def update_review(
    review_id: str,
    review_update: ReviewUpdate,
    current_user = Depends(get_current_active_user)
):
    """Atualizar uma avaliação (somente para o próprio usuário)"""
    user_id = current_user.id  # Usando id em vez de _id
    
    # Buscar a avaliação
    review_doc = await db.db.reviews.find_one({"_id": ObjectId(review_id)})
    if not review_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avaliação não encontrada"
        )
    
    # Verificar se o usuário tem permissão (dono da avaliação)
    if review_doc["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada. Você só pode editar suas próprias avaliações."
        )
    
    # Atualizar a avaliação
    update_data = {k: v for k, v in review_update.dict().items() if v is not None}
    
    await db.db.reviews.update_one(
        {"_id": ObjectId(review_id)},
        {"$set": update_data}
    )
    
    # Buscar a avaliação atualizada
    updated_review_doc = await db.db.reviews.find_one({"_id": ObjectId(review_id)})
    
    # Atualizar rating médio da arena
    await update_arena_rating(review_doc["arena_id"])
    
    # Usar from_mongo para converter o documento
    return Review.from_mongo(updated_review_doc)

@router.delete("/reviews/{review_id}")
async def delete_review(
    review_id: str,
    current_user = Depends(get_current_active_user)
):
    """Excluir uma avaliação (somente para o próprio usuário ou admin)"""
    user_id = current_user.id  # Usando id em vez de _id
    
    # Buscar a avaliação
    review_doc = await db.db.reviews.find_one({"_id": ObjectId(review_id)})
    if not review_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avaliação não encontrada"
        )
    
    # Verificar permissões
    is_owner = review_doc["user_id"] == user_id
    is_admin = current_user.role == "admin"
    
    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada"
        )
    
    # Excluir a avaliação
    result = await db.db.reviews.delete_one({"_id": ObjectId(review_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avaliação não encontrada"
        )
    
    # Atualizar rating médio da arena
    await update_arena_rating(review_doc["arena_id"])
    
    return {"message": "Avaliação excluída com sucesso"}

# Função auxiliar para atualizar o rating médio de uma arena
async def update_arena_rating(arena_id: str):
    """Recalcular e atualizar o rating médio de uma arena"""
    # Buscar todas as avaliações da arena
    cursor = db.db.reviews.find({"arena_id": arena_id})
    
    total_rating = 0
    review_count = 0
    
    async for review in cursor:
        total_rating += review["rating"]
        review_count += 1
    
    # Calcular o rating médio
    avg_rating = total_rating / review_count if review_count > 0 else 0
    
    # Atualizar o rating da arena
    await db.db.arenas.update_one(
        {"_id": ObjectId(arena_id)},
        {"$set": {
            "rating": round(avg_rating, 1),
            "rating_count": review_count
        }}
    )