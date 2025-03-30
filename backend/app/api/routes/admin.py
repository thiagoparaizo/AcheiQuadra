# app/api/routes/admin.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson.objectid import ObjectId

from app.core.security import get_current_user, get_current_admin_user
from app.db.database import db
from app.models.user import User, UserRole
from app.models.arena import Arena
from app.db.init_db import init_db

router = APIRouter()

@router.get("/admin/users", response_model=List[User])
async def get_all_users(
    current_user = Depends(get_current_admin_user),
    page: int = 1,
    items_per_page: int = 20,
    role: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """Listar todos os usuários (somente admin)"""
    # Construir filtro
    filter_query = {}
    
    if role:
        filter_query["role"] = role
    
    if is_active is not None:
        filter_query["is_active"] = is_active
    
    if search:
        # Buscar por nome, sobrenome, email ou username
        filter_query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"username": {"$regex": search, "$options": "i"}}
        ]
    
    # Aplicar paginação
    skip = (page - 1) * items_per_page
    
    # Buscar usuários
    cursor = db.db.users.find(filter_query).sort("created_at", -1).skip(skip).limit(items_per_page)
    
    # Converter cursor para lista
    users = []
    async for user in cursor:
        # Converter ObjectId para string
        user["_id"] = str(user["_id"])
        users.append(user)
    
    return users

@router.get("/admin/users/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    current_user = Depends(get_current_admin_user)
):
    """Obter detalhes de um usuário específico (somente admin)"""
    user = await db.db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Converter ObjectId para string
    user["_id"] = str(user["_id"])
    
    return user

@router.put("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_data: Dict[str, str],
    current_user = Depends(get_current_admin_user)
):
    """Atualizar papel/role de um usuário (somente admin)"""
    # Verificar se o usuário existe
    user = await db.db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Verificar se o papel é válido
    new_role = role_data.get("role")
    valid_roles = [role.value for role in UserRole]
    
    if not new_role or new_role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Papel inválido. Valores permitidos: {', '.join(valid_roles)}"
        )
    
    # Não permitir alterar o papel do próprio usuário admin
    if str(user["_id"]) == str(current_user["_id"]) and user.get("role") == "admin" and new_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é permitido remover seu próprio papel de administrador"
        )
    
    # Atualizar papel
    await db.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role, "updated_at": datetime.now()}}
    )
    
    return {"message": f"Papel do usuário atualizado para {new_role}"}

@router.put("/admin/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    current_user = Depends(get_current_admin_user)
):
    """Ativar um usuário (somente admin)"""
    # Verificar se o usuário existe
    user = await db.db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Atualizar status
    await db.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": True, "updated_at": datetime.now()}}
    )
    
    return {"message": "Usuário ativado com sucesso"}

@router.put("/admin/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    current_user = Depends(get_current_admin_user)
):
    """Desativar um usuário (somente admin)"""
    # Verificar se o usuário existe
    user = await db.db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Não permitir desativar o próprio usuário admin
    if str(user["_id"]) == str(current_user["_id"]) and user.get("role") == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é permitido desativar sua própria conta de administrador"
        )
    
    # Atualizar status
    await db.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False, "updated_at": datetime.now()}}
    )
    
    return {"message": "Usuário desativado com sucesso"}

@router.get("/admin/arenas", response_model=List[Arena])
async def get_all_arenas(
    current_user = Depends(get_current_admin_user),
    page: int = 1,
    items_per_page: int = 20,
    search: Optional[str] = None,
    active_only: bool = False
):
    """Listar todas as arenas (somente admin)"""
    # Construir filtro
    filter_query = {}
    
    if active_only:
        filter_query["active"] = True
    
    if search:
        # Buscar por nome ou cidade
        filter_query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"address.city": {"$regex": search, "$options": "i"}},
            {"address.state": {"$regex": search, "$options": "i"}}
        ]
    
    # Aplicar paginação
    skip = (page - 1) * items_per_page
    
    # Buscar arenas
    cursor = db.db.arenas.find(filter_query).sort("created_at", -1).skip(skip).limit(items_per_page)
    
    # Converter cursor para lista
    arenas = []
    async for arena in cursor:
        # Adicionar informações do proprietário
        owner = await db.db.users.find_one({"_id": ObjectId(arena["owner_id"])})
        if owner:
            arena["owner"] = {
                "id": str(owner["_id"]),
                "name": f"{owner.get('first_name')} {owner.get('last_name')}",
                "email": owner.get("email")
            }
        
        # Adicionar contagem de quadras
        courts_count = await db.db.courts.count_documents({"arena_id": str(arena["_id"])})
        arena["courts_count"] = courts_count
        
        # Converter ObjectId para string
        arena["_id"] = str(arena["_id"])
        arenas.append(arena)
    
    return arenas

@router.get("/admin/dashboard")
async def admin_dashboard(
    current_user = Depends(get_current_admin_user),
    period: str = "month"  # day, week, month, year
):
    """Obter dados para dashboard administrativo"""
    try:
        now = datetime.now()
        
        # Definir período
        if period == "day":
            start_date = datetime(now.year, now.month, now.day)
        elif period == "week":
            # Início da semana atual (domingo)
            start_date = now - timedelta(days=now.weekday())
            start_date = datetime(start_date.year, start_date.month, start_date.day)
        elif period == "month":
            # Início do mês atual
            start_date = datetime(now.year, now.month, 1)
        elif period == "year":
            # Início do ano atual
            start_date = datetime(now.year, 1, 1)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Período inválido. Valores permitidos: day, week, month, year"
            )
        
        # Estatísticas de usuários
        total_users = await db.db.users.count_documents({})
        new_users = await db.db.users.count_documents({"created_at": {"$gte": start_date}})
        
        users_by_role = []
        for role in UserRole:
            count = await db.db.users.count_documents({"role": role.value})
            users_by_role.append({"role": role.value, "count": count})
        
        # Estatísticas de arenas
        total_arenas = await db.db.arenas.count_documents({})
        active_arenas = await db.db.arenas.count_documents({"active": True})
        new_arenas = await db.db.arenas.count_documents({"created_at": {"$gte": start_date}})
        
        # Estatísticas de quadras
        total_courts = await db.db.courts.count_documents({})
        
        # Agrupar quadras por tipo
        pipeline = [
            {"$group": {"_id": "$type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        courts_by_type_cursor = db.db.courts.aggregate(pipeline)
        courts_by_type = []
        async for item in courts_by_type_cursor:
            courts_by_type.append({"type": item["_id"], "count": item["count"]})
        
        # Estatísticas de reservas
        total_bookings = await db.db.bookings.count_documents({})
        completed_bookings = await db.db.bookings.count_documents({"status": "completed"})
        cancelled_bookings = await db.db.bookings.count_documents({"status": "cancelled"})
        pending_bookings = await db.db.bookings.count_documents({"status": "pending"})
        
        # Reservas no período atual
        bookings_in_period = await db.db.bookings.count_documents({"created_at": {"$gte": start_date}})
        
        # Pagamentos
        total_payments = await db.db.payments.count_documents({})
        approved_payments = await db.db.payments.count_documents({"status": "approved"})
        
        # Somar valor total de pagamentos aprovados
        pipeline = [
            {"$match": {"status": "approved"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        total_revenue_cursor = db.db.payments.aggregate(pipeline)
        total_revenue = 0
        async for item in total_revenue_cursor:
            total_revenue = item["total"]
        
        # Pagamentos no período atual
        payments_in_period = await db.db.payments.count_documents({"created_at": {"$gte": start_date}})
        
        # Somar valor de pagamentos no período
        pipeline = [
            {"$match": {"status": "approved", "created_at": {"$gte": start_date}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        period_revenue_cursor = db.db.payments.aggregate(pipeline)
        period_revenue = 0
        async for item in period_revenue_cursor:
            period_revenue = item["total"]
        
        # Montar resposta
        dashboard_data = {
            "period": period,
            "start_date": start_date.isoformat(),
            "current_date": now.isoformat(),
            "users": {
                "total": total_users,
                "new_in_period": new_users,
                "by_role": users_by_role
            },
            "arenas": {
                "total": total_arenas,
                "active": active_arenas,
                "new_in_period": new_arenas
            },
            "courts": {
                "total": total_courts,
                "by_type": courts_by_type
            },
            "bookings": {
                "total": total_bookings,
                "completed": completed_bookings,
                "cancelled": cancelled_bookings,
                "pending": pending_bookings,
                "in_period": bookings_in_period
            },
            "payments": {
                "total": total_payments,
                "approved": approved_payments,
                "total_revenue": total_revenue,
                "in_period": payments_in_period,
                "period_revenue": period_revenue
            }
        }
        
        return dashboard_data
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar dados do dashboard: {str(e)}"
        )
        
@router.get("/admin/init_db")
async def init_db_route():
    print("Iniciando banco de dados...")
    await init_db()
    return {"message": "Banco de dados inicializado com sucesso."}