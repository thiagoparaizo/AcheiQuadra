# app/api/routes/admin.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson.objectid import ObjectId
from pydantic import ValidationError

from app.core.security import get_current_user, get_current_admin_user
from app.db.database import db
from app.models.user import User, UserRole, UserUpdate
from app.models.arena import Arena, ArenaCreateWithFiles
from app.db.init_db import init_db
from app.models.booking import Booking, BookingStatus, BookingType, BookingWithDetails, PaginatedBookingsResponse
from app.models.court import Court

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

@router.put("/admin/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user = Depends(get_current_admin_user)
):
    """Atualizar dados do usuário pelo admin"""
    
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
    if str(user["_id"]) == str(current_user["id"]) and user.get("role") == "admin" and new_role != "admin":
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
    if str(user["_id"]) == str(current_user["id"]) and user.get("role") == "admin":
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
    search: Optional[str] = None
):
    """Listar todas as arenas (somente admin)"""
    # Construir filtro
    filter_query = {}
    
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
        arena = Arena.from_mongo(arena)
        
        # Adicionar informações do proprietário
        owner = await db.db.users.find_one({"_id": ObjectId(arena.owner_id)})
        user_owner = User.from_mongo(owner)
        if user_owner:
            arena.owner = {
                "id": user_owner.id,
                "name": f"{user_owner.first_name} {user_owner.last_name}",
                "email": user_owner.email
            }
        
        # Adicionar contagem de quadras
        courts_count = await db.db.courts.count_documents({"arena_id": arena.id})
        arena.courts_count = courts_count
        
        # Converter ObjectId para string
        #arena["_id"] = str(arena["_id"])
        arenas.append(arena)
    
    return arenas

@router.get("/admin/arenas/{arena_id}", response_model=Arena)
async def get_arena(
    arena_id: str,
    current_user = Depends(get_current_admin_user)):
    """Obter detalhes de uma arena"""
    try:
        arena_doc = await db.db.arenas.find_one({"_id": ObjectId(arena_id)})
        if not arena_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Arena não encontrada"
            )
        
        # Adicionar contagem de quadras
        courts_count = await db.db.courts.count_documents({"arena_id": arena_id})
        arena_doc["courts_count"] = courts_count
        
        # Adicionar informações do proprietário (básicas)
        owner_doc = await db.db.users.find_one({"_id": ObjectId(arena_doc["owner_id"])})
        if owner_doc:
            arena_doc["owner"] = {
                "id": str(owner_doc["_id"]),
                "name": f"{owner_doc.get('first_name')} {owner_doc.get('last_name')}",
                "email": owner_doc.get("email"),
                "phone": owner_doc.get("phone")
            }
        
        return Arena.from_mongo(arena_doc)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar arena: {str(e)}"
        )
        
@router.get("/admin/arenas/{arena_id}/courts", response_model=List[Court])
async def get_arena_courts(
    arena_id: str,
    court_type: Optional[str] = None,
    is_available: Optional[bool] = None,
    page: int = 1,
    items_per_page: int = 20
):
    """Obter quadras de uma arena"""
    # Verificar se a arena existe
    arena = await db.db.arenas.find_one({"_id": ObjectId(arena_id)})
    if not arena:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena não encontrada"
        )
    
    # Construir filtro
    filter_query = {"arena_id": ObjectId(arena_id)}
    
    if court_type:
        filter_query["type"] = court_type
    
    if is_available is not None:
        filter_query["is_available"] = is_available
    
    # Aplicar paginação
    skip = (page - 1) * items_per_page
    
    # Buscar quadras
    cursor = db.db.courts.find(filter_query).skip(skip).limit(items_per_page)
    
    # Converter cursor para lista
    courts = []
    async for court_doc in cursor:
        # Adicionar dados extra da arena
        court_doc["arena"] = {
            "id": arena_id,
            "name": arena["name"],
            "address": arena["address"]
        }
        
        courts.append(Court.from_mongo(court_doc))
    
    return courts

@router.post("/admin/arenas/", response_model=Arena)
async def create_arena(
    arena_create: ArenaCreateWithFiles,
    current_user = Depends(get_current_admin_user)
):
    """Criar nova arena (somente admin pode criar)"""
    try:
        # Se não for fornecido um owner_id, usa o ID do usuário atual
        owner_id = arena_create.owner_id or str(current_user.id)
        
        # Verificar se o proprietário existe
        owner_doc = await db.db.users.find_one({"_id": ObjectId(owner_id)})
        if not owner_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proprietário não encontrado"
            )
        
        # Geocodificar endereço para obter coordenadas
        coordinates = await geocode_address(arena_create.address.dict())
        if coordinates:
            arena_create.address.coordinates = coordinates
        
        # Preparar dados para inserção
        arena_dict = arena_create.dict(exclude={"logo_base64", "photos_base64"})
        arena_dict["owner_id"] = owner_id
        arena_dict["created_at"] = datetime.now()
        arena_dict["updated_at"] = datetime.now()
        arena_dict["rating"] = 0.0
        arena_dict["rating_count"] = 0
        arena_dict["logo_url"] = None
        arena_dict["photos"] = []
        arena_dict["amenities"] = arena_dict.get("amenities", [])
        
        # Salvar arena no banco de dados
        result = await db.db.arenas.insert_one(arena_dict)
        arena_id = str(result.inserted_id)
        
        # Criar diretório para armazenar arquivos se não existir
        upload_dir = Path("static/arenas") / arena_id
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Processar logo em base64 se existir
        if arena_create.logo_base64:
            # Separar o cabeçalho da base64 (se houver) e obter os dados
            if "," in arena_create.logo_base64:
                header, encoded = arena_create.logo_base64.split(",", 1)
            else:
                encoded = arena_create.logo_base64
            
            # Decodificar base64
            binary_data = base64.b64decode(encoded)
            
            # Determinar extensão com base no tipo MIME ou usar .png como padrão
            extension = ".png"
            if "image/jpeg" in arena_create.logo_base64:
                extension = ".jpg"
            elif "image/gif" in arena_create.logo_base64:
                extension = ".gif"
            
            # Salvar logo
            logo_path = upload_dir / f"logo{extension}"
            with open(logo_path, "wb") as f:
                f.write(binary_data)
            
            # Atualizar URL do logo no banco de dados
            logo_url = f"/static/arenas/{arena_id}/logo{extension}"
            await db.db.arenas.update_one(
                {"_id": ObjectId(arena_id)},
                {"$set": {"logo_url": logo_url}}
            )
            arena_dict["logo_url"] = logo_url
        
        # Processar fotos em base64 se existirem
        photos_urls = []
        for i, photo_base64 in enumerate(arena_create.photos_base64):
            # Separar o cabeçalho da base64 (se houver) e obter os dados
            if "," in photo_base64:
                header, encoded = photo_base64.split(",", 1)
            else:
                encoded = photo_base64
            
            # Decodificar base64
            binary_data = base64.b64decode(encoded)
            
            # Determinar extensão com base no tipo MIME ou usar .png como padrão
            extension = ".png"
            if "image/jpeg" in photo_base64:
                extension = ".jpg"
            elif "image/gif" in photo_base64:
                extension = ".gif"
            
            # Salvar foto
            photo_path = upload_dir / f"photo{i}{extension}"
            with open(photo_path, "wb") as f:
                f.write(binary_data)
            
            # Adicionar URL à lista
            photo_url = f"/static/arenas/{arena_id}/photo{i}{extension}"
            photos_urls.append(photo_url)
        
        # Atualizar URLs das fotos no banco de dados se houver
        if photos_urls:
            await db.db.arenas.update_one(
                {"_id": ObjectId(arena_id)},
                {"$set": {"photos": photos_urls}}
            )
            arena_dict["photos"] = photos_urls
        
        # Buscar arena atualizada
        arena_doc = await db.db.arenas.find_one({"_id": ObjectId(arena_id)})
        
        return Arena.from_mongo(arena_doc)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar arena: {str(e)}"
        )

@router.get("/admin/bookings", response_model=PaginatedBookingsResponse)
async def get_all_bookings(
    current_user = Depends(get_current_admin_user),
    page: int = 1,
    items_per_page: int = 20,
    search: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Listar todas as reservas (somente admin)"""
    # Construir filtro
    filter_query = {}
    
    if status:
        if status not in BookingStatus.__members__.values():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status inválido"
            )
        filter_query["status"] = status
    
    if start_date or end_date:
        date_filter = {}
        try:
            if start_date:
                start_datetime = datetime.fromisoformat(start_date)
                date_filter["$gte"] = start_datetime
            if end_date:
                end_datetime = datetime.fromisoformat(end_date) + timedelta(days=1)
                date_filter["$lt"] = end_datetime
            
            filter_query["$or"] = [
                {"booking_type": BookingType.SINGLE, "timeslot.date": {"$exists": True, **date_filter}},
                {"booking_type": BookingType.MONTHLY, "monthly_config.start_date": {"$exists": True, **date_filter}}
            ]
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de data inválido. Use YYYY-MM-DD"
            )
    
    if search:
        regex = {"$regex": search, "$options": "i"}
        filter_query["$or"] = [
            {"user_name": regex},
            {"user_email": regex},
            {"court_name": regex},
            {"arena_name": regex}
        ]
    
    # Pipeline de agregação
    pipeline = [
        {"$match": filter_query},
        {"$sort": {"created_at": -1}},
        {"$skip": (page - 1) * items_per_page},
        {"$limit": items_per_page},
        # Lookup para usuário
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "_id",
                "as": "user"
            }
        },
        {"$unwind": "$user"},
        # Lookup para quadra
        {
            "$lookup": {
                "from": "courts",
                "localField": "court_id",
                "foreignField": "_id",
                "as": "court"
            }
        },
        {"$unwind": "$court"},
        # Lookup para arena
        {
            "$lookup": {
                "from": "arenas",
                "localField": "arena_id",
                "foreignField": "_id",
                "as": "arena"
            }
        },
        {"$unwind": "$arena"},
        # Lookup para pagamento
        {
            "$lookup": {
                "from": "payments",
                "localField": "_id",
                "foreignField": "booking_id",
                "as": "payment"
            }
        },
        {"$unwind": {"path": "$payment", "preserveNullAndEmptyArrays": True}},
        # Projeção final
        {
            "$project": {
                "_id": {"$toString": "$_id"},
                "user_id": {"$toString": "$user_id"},
                "court_id": {"$toString": "$court_id"},
                "arena_id": {"$toString": "$arena_id"},
                "booking_type": 1,
                "timeslot": 1,
                "monthly_config": 1,
                "status": 1,
                "price_per_hour": 1,
                "total_hours": 1,
                "subtotal": 1,
                "extra_services": 1,
                "total_amount": 1,
                "discount_amount": 1,
                "requires_payment": 1,
                "payment_deadline": 1,
                "created_at": 1,
                "updated_at": 1,
                "payment_status": "$payment.status",
                "can_cancel": {
                    "$and": [
                        {"$ne": ["$status", BookingStatus.CANCELLED]},
                        {"$ne": ["$status", BookingStatus.COMPLETED]}
                    ]
                },
                "user": {
                    "id": {"$toString": "$user._id"},
                    "name": {"$concat": ["$user.first_name", " ", "$user.last_name"]},
                    "email": "$user.email",
                    "phone": "$user.phone",
                    "username": "$user.username"
                },
                "court": {
                    "id": {"$toString": "$court._id"},
                    "name": "$court.name",
                    "type": "$court.type",
                    "cover_image": "$court.cover_image"
                },
                "arena": {
                    "id": {"$toString": "$arena._id"},
                    "name": "$arena.name",
                    "city": "$arena.address.city",
                    "neighborhood": "$arena.address.neighborhood"
                }
            }
        }
    ]
    
    # Executar a consulta
    bookings_cursor = db.db.bookings.aggregate(pipeline)
    bookings = await bookings_cursor.to_list(length=None)
    
    # Contar total de documentos
    total_count = await db.db.bookings.count_documents(filter_query)
    total_pages = max(1, (total_count + items_per_page - 1) // items_per_page)
    
    # Criar objetos Pydantic para cada booking
    validated_bookings = []
    for booking in bookings:
        try:
            # Converter datas para strings ISO
            if booking.get("created_at"):
                booking["created_at"] = booking["created_at"].isoformat()
            if booking.get("updated_at"):
                booking["updated_at"] = booking["updated_at"].isoformat()
            if booking.get("payment_deadline"):
                booking["payment_deadline"] = booking["payment_deadline"].isoformat()
            
            # Converter para o modelo BookingWithDetails
            validated_booking = BookingWithDetails(**booking)
            validated_bookings.append(validated_booking)
        except ValidationError as e:
            print(f"Erro de validação ao processar booking: {e}")
            continue
    
    return PaginatedBookingsResponse(
        bookings=validated_bookings,
        total_pages=total_pages,
        current_page=page,
        total_items=total_count,
        items_per_page=items_per_page
    )

@router.get("/admin/bookings/{booking_id}", response_model=Booking)
async def get_booking(
    booking_id: str,
    current_user = Depends(get_current_admin_user)
):
    """Obter detalhes de uma reserva específica (somente admin)"""
    user_id = current_user.id
    
    # Buscar a reserva
    booking = await db.db.bookings.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada"
        )
    
    # Verificar permissões
    is_owner = booking["user_id"] == user_id
    
    arena = await db.db.arenas.find_one({"_id": ObjectId(booking["arena_id"])})
    if not arena:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena não encontrada"
        )
    arena = Arena.from_mongo(arena)
    
    is_arena_owner = arena.owner_id == user_id
    is_admin = current_user.role == "admin"
    
    if not (is_owner or is_arena_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada"
        )
    
    #ajuste nos ids dos dados relacionados no booking
    booking["arena_id"] = str(booking["arena_id"])
    booking["court_id"] = str(booking["court_id"])
    booking["user_id"] = str(booking["user_id"])
    
    # Adicionar dados relacionados
    court = await db.db.courts.find_one({"_id": ObjectId(booking["court_id"])})
    if court:
        court = Court.from_mongo(court)
        booking["court"] = court
    
    booking["arena"] = arena
    
    # Incluir informações do usuário para o dono da arena
    if is_arena_owner or is_admin:
        user = await db.db.users.find_one({"_id": ObjectId(booking["user_id"])})
        if user:
            user = User.from_mongo(user)
            booking["user"] = {
                "id": user.id,
                "name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "phone": user.phone
            }
    
    # Converter ObjectId para string
    booking["_id"] = str(booking["_id"])
    
    return booking

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