# app/api/routes/arenas.py
import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status, BackgroundTasks
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson.objectid import ObjectId
import json
import shutil
import os
from pathlib import Path

from app.core.security import get_current_user, get_current_active_user, get_current_admin_user, get_current_arena_owner
from app.db.database import db
from app.models.arena import Arena, ArenaCreate, ArenaCreateWithFiles, ArenaUpdate, ArenaFilter, Address, ArenaUpdateWithFiles
from app.models.court import Court
from app.services.maps import geocode_address

router = APIRouter()

@router.post("/arenas/", response_model=Arena)
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

@router.get("/arenas/", response_model=List[Arena])
async def search_arenas(
    name: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    neighborhood: Optional[str] = None,
    amenities: Optional[List[str]] = Query(None),
    court_type: Optional[str] = None,
    min_rating: Optional[float] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    distance_km: Optional[float] = None,
    active: bool = True,
    page: int = 1,
    items_per_page: int = 20
):
    """Buscar arenas com filtros"""
    # Construir filtro
    filter_query = {"active": active}
    
    if name:
        filter_query["name"] = {"$regex": name, "$options": "i"}
    
    if city:
        filter_query["address.city"] = {"$regex": city, "$options": "i"}
    
    if state:
        filter_query["address.state"] = {"$regex": state, "$options": "i"}
    
    if neighborhood:
        filter_query["address.neighborhood"] = {"$regex": neighborhood, "$options": "i"}
    
    if amenities:
        filter_query["amenities"] = {"$all": amenities}
    
    if min_rating is not None:
        filter_query["rating"] = {"$gte": min_rating}
    
    # Busca geoespacial
    if latitude and longitude and distance_km:
        filter_query["address.coordinates"] = {
            "$near": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "$maxDistance": distance_km * 1000  # Converter km para metros
            }
        }
    
    # Se filtrar por tipo de quadra, primeiro encontrar as arenas com esse tipo
    arena_ids = []
    if court_type:
        # Buscar quadras do tipo especificado
        courts_cursor = db.db.courts.find({"type": court_type})
        async for court in courts_cursor:
            arena_ids.append(ObjectId(court["arena_id"]))
        
        if arena_ids:
            filter_query["_id"] = {"$in": arena_ids}
        else:
            # Se não houver arenas com esse tipo de quadra, retornar lista vazia
            return []
    
    # Aplicar paginação
    skip = (page - 1) * items_per_page
    
    # Buscar arenas com filtro
    cursor = db.db.arenas.find(filter_query).skip(skip).limit(items_per_page)
    
    # Converter cursor para lista
    arenas = []
    async for arena_doc in cursor:
        # Adicionar contagem de quadras
        courts_count = await db.db.courts.count_documents({"arena_id": str(arena_doc["_id"])})
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
        
        arenas.append(Arena.from_mongo(arena_doc))
    
    return arenas

@router.get("/arenas/{arena_id}", response_model=Arena)
async def get_arena(arena_id: str):
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

@router.put("/arenas/{arena_id}", response_model=Arena)
async def update_arena(
    arena_id: str,
    arena_update: ArenaUpdateWithFiles,
    current_user = Depends(get_current_active_user)
):
    """Atualizar arena (somente dono ou admin)"""
    try:
        # Verificar se a arena existe
        arena = await db.db.arenas.find_one({"_id": ObjectId(arena_id)})
        if not arena:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Arena não encontrada"
            )
        
        # Verificar permissões
        user_id = str(current_user["id"])
        is_owner = arena["owner_id"] == user_id
        is_admin = current_user.get("role") == "admin"
        
        if not (is_owner or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissão negada"
            )
        
        # Converter dados do formulário para JSON
        arena_dict = json.loads(arena_update)
        arena_update = ArenaUpdate(**arena_dict)
        
        # Preparar dados para atualização
        update_data = {k: v for k, v in arena_update.dict().items() if v is not None}
        
        # Se o endereço foi atualizado, geocodificar para obter novas coordenadas
        if "address" in update_data:
            coordinates = await geocode_address(update_data["address"])
            if coordinates:
                update_data["address"]["coordinates"] = coordinates
        
        # Adicionar data de atualização
        update_data["updated_at"] = datetime.now()
        
        # Atualizar arena no banco de dados
        await db.db.arenas.update_one(
            {"_id": ObjectId(arena_id)},
            {"$set": update_data}
        )
        
        # Processar upload de logo se existir
        if arena_update.logo:
            # Criar diretório para armazenar arquivos se não existir
            upload_dir = Path("static/arenas") / arena_id
            upload_dir.mkdir(parents=True, exist_ok=True)
            
            # Salvar logo
            logo_path = upload_dir / f"logo{Path(arena_update.logo.filename).suffix}"
            with open(logo_path, "wb") as buffer:
                shutil.copyfileobj(arena_update.logo.file, buffer)
            
            # Atualizar URL do logo no banco de dados
            logo_url = f"/static/arenas/{arena_id}/logo{Path(arena_update.logo.filename).suffix}"
            await db.db.arenas.update_one(
                {"_id": ObjectId(arena_id)},
                {"$set": {"logo_url": logo_url}}
            )
        
        # Processar upload de fotos se existirem e se deve substituir
        if photos:
            # Obter fotos existentes
            existing_photos = arena.get("photos", [])
            
            # Salvar novas fotos
            photos_urls = []
            start_index = len(existing_photos)
            
            for i, photo in enumerate(photos):
                # Criar diretório para armazenar arquivos se não existir
                upload_dir = Path("static/arenas") / arena_id
                upload_dir.mkdir(parents=True, exist_ok=True)
                
                # Salvar foto
                photo_path = upload_dir / f"photo{start_index + i}{Path(photo.filename).suffix}"
                with open(photo_path, "wb") as buffer:
                    shutil.copyfileobj(photo.file, buffer)
                
                # Adicionar URL à lista
                photo_url = f"/static/arenas/{arena_id}/photo{start_index + i}{Path(photo.filename).suffix}"
                photos_urls.append(photo_url)
            
            # Atualizar URLs das fotos no banco de dados
            combined_photos = existing_photos + photos_urls
            await db.db.arenas.update_one(
                {"_id": ObjectId(arena_id)},
                {"$set": {"photos": combined_photos}}
            )
        
        # Buscar arena atualizada
        updated_arena = await db.db.arenas.find_one({"_id": ObjectId(arena_id)})
        
        # Adicionar contagem de quadras
        courts_count = await db.db.courts.count_documents({"arena_id": arena_id})
        updated_arena["courts_count"] = courts_count
        
        # Adicionar informações do proprietário
        owner = await db.db.users.find_one({"_id": ObjectId(updated_arena["owner_id"])})
        if owner:
            updated_arena["owner"] = {
                "id": str(owner["_id"]),
                "name": f"{owner.get('first_name')} {owner.get('last_name')}",
                "email": owner.get("email"),
                "phone": owner.get("phone")
            }
        
        # Converter ObjectId para string
        updated_arena["_id"] = str(updated_arena["_id"])
        
        return updated_arena
    
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dados da arena inválidos. Formato JSON esperado."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar arena: {str(e)}"
        )

@router.get("/arenas/{arena_id}/courts", response_model=List[Court])
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
    filter_query = {"arena_id": arena_id}
    
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

@router.delete("/arenas/{arena_id}")
async def delete_arena(
    arena_id: str,
    current_user = Depends(get_current_admin_user)
):
    """Excluir uma arena (somente admin)"""
    # Verificar se a arena existe
    arena = await db.db.arenas.find_one({"_id": ObjectId(arena_id)})
    if not arena:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena não encontrada"
        )
    
    # Verificar se há quadras associadas
    courts_count = await db.db.courts.count_documents({"arena_id": arena_id})
    if courts_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível excluir arena com quadras associadas"
        )
    
    # Verificar se há reservas associadas
    bookings_count = await db.db.bookings.count_documents({"arena_id": arena_id})
    if bookings_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível excluir arena com reservas associadas"
        )
    
    # Excluir arena
    result = await db.db.arenas.delete_one({"_id": ObjectId(arena_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena não encontrada"
        )
    
    # Excluir arquivos associados
    upload_dir = Path("static/arenas") / arena_id
    if upload_dir.exists():
        shutil.rmtree(upload_dir)
    
    return {"message": "Arena excluída com sucesso"}

@router.post("/arenas/{arena_id}/deactivate")
async def deactivate_arena(
    arena_id: str,
    current_user = Depends(get_current_active_user)
):
    """Desativar uma arena (somente dono ou admin)"""
    # Verificar se a arena existe
    arena = await db.db.arenas.find_one({"_id": ObjectId(arena_id)})
    if not arena:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena não encontrada"
        )
    
    # Verificar permissões
    user_id = str(current_user["id"])
    is_owner = arena["owner_id"] == user_id
    is_admin = current_user.get("role") == "admin"
    
    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada"
        )
    
    # Desativar arena
    await db.db.arenas.update_one(
        {"_id": ObjectId(arena_id)},
        {"$set": {"active": False, "updated_at": datetime.now()}}
    )
    
    return {"message": "Arena desativada com sucesso"}

@router.post("/arenas/{arena_id}/activate")
async def activate_arena(
    arena_id: str,
    current_user = Depends(get_current_active_user)
):
    """Ativar uma arena (somente dono ou admin)"""
    # Verificar se a arena existe
    arena = await db.db.arenas.find_one({"_id": ObjectId(arena_id)})
    if not arena:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena não encontrada"
        )
    
    # Verificar permissões
    user_id = str(current_user["id"])
    is_owner = arena["owner_id"] == user_id
    is_admin = current_user.get("role") == "admin"
    
    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada"
        )
    
    # Ativar arena
    await db.db.arenas.update_one(
        {"_id": ObjectId(arena_id)},
        {"$set": {"active": True, "updated_at": datetime.now()}}
    )
    
    return {"message": "Arena ativada com sucesso"}