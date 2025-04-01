# app/api/routes/courts.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import date, datetime, timedelta
from bson.objectid import ObjectId
import pymongo
from streamlit import status

from app.core.security import get_current_user, get_current_active_user
from app.db.database import db
from app.models.court import Court, CourtCreate, CourtUpdate, CourtType
from app.services.maps import calculate_distance

router = APIRouter()

@router.get("/courts", response_model=List[Court])
async def search_courts(
    court_type: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    neighborhood: Optional[str] = None,
    date: Optional[date] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    amenities: Optional[List[str]] = Query(None),
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    distance_km: Optional[float] = None,
    sort_by: Optional[str] = "distance",  # distance, price, rating
    page: int = 1,
    items_per_page: int = 20
):
    """
    Buscar quadras disponíveis com filtros
    """
    # Construir o filtro de busca
    filter_query = {}
    
    # Filtrar por tipo de quadra
    if court_type:
        filter_query["type"] = court_type
    
    # Filtrar por localização (cidade, estado, bairro)
    if city:
        filter_query["arena.address.city"] = {"$regex": city, "$options": "i"}
    if state:
        filter_query["arena.address.state"] = {"$regex": state, "$options": "i"}
    if neighborhood:
        filter_query["arena.address.neighborhood"] = {"$regex": neighborhood, "$options": "i"}
    
    # Filtrar por preço
    price_filter = {}
    if min_price is not None:
        price_filter["$gte"] = min_price
    if max_price is not None:
        price_filter["$lte"] = max_price
    if price_filter:
        filter_query["price_per_hour"] = price_filter
    
    # Filtrar por comodidades (amenities)
    if amenities:
        filter_query["arena.amenities"] = {"$all": amenities}
    
    # Filtrar apenas quadras disponíveis
    filter_query["is_available"] = True
    
    # Busca por proximidade (geoespacial)
    if latitude and longitude and distance_km:
        # Buscar arenas próximas usando coordenadas geoespaciais
        filter_query["arena.address.coordinates"] = {
            "$near": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "$maxDistance": distance_km * 1000  # Converter km para metros
            }
        }
    
    # Verificar disponibilidade por data e horário
    # Isso requer uma lógica adicional para verificar os agendamentos existentes
    if date:
        # Lógica para filtrar quadras disponíveis na data especificada
        # Este é um exemplo simplificado - na prática, você precisaria verificar
        # se não há agendamentos conflitantes para o horário solicitado
        date_str = date.isoformat()
        
        # Para ser totalmente implementado, essa parte precisa ser mais elaborada,
        # verificando os agendamentos existentes no banco de dados
        pass
    
    # Aplicar paginação
    skip = (page - 1) * items_per_page
    
    # Determinar ordenação
    sort_options = {
        "price_asc": [("price_per_hour", pymongo.ASCENDING)],
        "price_desc": [("price_per_hour", pymongo.DESCENDING)],
        "rating": [("arena.rating", pymongo.DESCENDING)]
    }
    
    # Para ordenação por distância, não precisamos especificar aqui
    # pois já é aplicada automaticamente pela consulta $near
    if sort_by == "distance" and not (latitude and longitude):
        # Se sort_by é distance mas não temos coordenadas, usar rating como fallback
        sort_option = sort_options.get("rating")
    else:
        sort_option = sort_options.get(sort_by, None)
    
    # Executar a consulta
    cursor = db.db.courts.find(filter_query)
    if sort_option:
        cursor = cursor.sort(sort_option)
    cursor = cursor.skip(skip).limit(items_per_page)
    
    # Converter cursor para lista
    courts = []
    async for court_doc in cursor:
        # Adicionar dados da arena
        arena_doc = await db.db.arenas.find_one({"_id": ObjectId(court_doc["arena_id"])})
        if arena_doc:
            court_doc["arena"] = {
                "id": str(arena_doc["_id"]),
                "name": arena_doc["name"],
                "address": arena_doc["address"],
                "rating": arena_doc.get("rating", 0.0)
            }
            
            # Calcular distância se coordenadas foram fornecidas
            if latitude and longitude and "coordinates" in arena_doc["address"]:
                court_doc["distance"] = calculate_distance(
                    (latitude, longitude),
                    (arena_doc["address"]["coordinates"]["latitude"], arena_doc["address"]["coordinates"]["longitude"])
                )
        
        # Usar from_mongo para converter o documento
        courts.append(Court.from_mongo(court_doc))
    
    return courts

@router.get("/courts/{court_id}", response_model=Court)
async def get_court(court_id: str):
    """Obter detalhes de uma quadra específica"""
    court_doc = await db.db.courts.find_one({"_id": ObjectId(court_id)})
    
    if not court_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quadra não encontrada"
        )
    
    # Adicionar dados da arena
    arena_doc = await db.db.arenas.find_one({"_id": ObjectId(court_doc["arena_id"])})
    if arena_doc:
        court_doc["arena"] = {
            "id": str(arena_doc["_id"]),
            "name": arena_doc["name"],
            "address": arena_doc["address"],
            "rating": arena_doc.get("rating", 0.0)
        }
    
    # Usar from_mongo para converter o documento
    return Court.from_mongo(court_doc)

@router.get("/courts/{court_id}/availability")
async def get_court_availability(
    court_id: str,
    start_date: date,
    end_date: Optional[date] = None
):
    """Obter disponibilidade de horários de uma quadra"""
    # Se end_date não for fornecido, usar start_date
    if not end_date:
        end_date = start_date
    
    # Verificar se a quadra existe
    court_doc = await db.db.courts.find_one({"_id": ObjectId(court_id)})
    if not court_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quadra não encontrada"
        )
    
    # Obter a arena para verificar os horários de funcionamento
    arena_doc = await db.db.arenas.find_one({"_id": ObjectId(court_doc["arena_id"])})
    if not arena_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena não encontrada"
        )
    
    # Criar um dicionário de disponibilidade por dia
    availability = {}
    
    # Para cada dia no intervalo
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.isoformat()
        weekday = current_date.weekday()  # 0 é segunda-feira, 6 é domingo
        
        # Mapear weekday para o campo correspondente no business_hours
        weekday_map = {
            0: "monday",
            1: "tuesday",
            2: "wednesday",
            3: "thursday",
            4: "friday",
            5: "saturday",
            6: "sunday"
        }
        
        # Obter horários de funcionamento para este dia da semana
        day_hours = arena_doc["business_hours"].get(weekday_map[weekday], [])
        
        # Obter reservas existentes para este dia
        existing_bookings = await db.db.bookings.find({
            "court_id": court_id,
            "status": {"$in": ["confirmed", "pending"]},
            "$or": [
                # Reservas avulsas neste dia
                {
                    "booking_type": "single",
                    "timeslot.date": date_str
                },
                # Reservas mensais que incluem este dia da semana
                {
                    "booking_type": "monthly",
                    "monthly_config.weekdays": weekday,
                    "monthly_config.start_date": {"$lte": date_str},
                    "$or": [
                        {"monthly_config.end_date": {"$gte": date_str}},
                        {"monthly_config.end_date": None}
                    ]
                }
            ]
        }).to_list(length=None)
        
        # Criar slots de tempo disponíveis
        time_slots = []
        
        for hour_range in day_hours:
            start_time_str = hour_range["start"]  # '07:00'
            end_time_str = hour_range["end"]     # '23:00'
            
            # Converter strings para objetos time
            start_time = datetime.strptime(start_time_str, "%H:%M").time()
            end_time = datetime.strptime(end_time_str, "%H:%M").time()
            
            # Criar slots de 1 hora
            current_time = start_time
            while current_time < end_time:
                try:
                    next_time = (datetime.combine(date.min, current_time) + timedelta(hours=1)).time()
                    # ... resto do seu código ...
                    current_time = next_time
                except Exception as e:
                    raise
                
                # Verificar se este slot está livre
                is_available = True
                
                for booking in existing_bookings:
                    if booking["booking_type"] == "single":
                        booking_start = booking["timeslot"]["start_time"]
                        booking_end = booking["timeslot"]["end_time"]
                    else:  # monthly
                        booking_start = booking["monthly_config"]["start_time"]
                        booking_end = booking["monthly_config"]["end_time"]
                    
                    # Verificar se há sobreposição
                    if (current_time < booking_end and next_time > booking_start):
                        is_available = False
                        break
                
                time_slots.append({
                    "start": current_time.strftime("%H:%M"),
                    "end": next_time.strftime("%H:%M"),
                    "is_available": is_available
                })
                
                current_time = next_time
        
        # Adicionar slots ao dicionário de disponibilidade
        availability[date_str] = time_slots
        
        # Avançar para o próximo dia
        current_date += timedelta(days=1)
    
    return availability