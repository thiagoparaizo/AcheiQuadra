# app/api/routes/bookings.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, time
from bson.objectid import ObjectId

from app.core.security import get_current_user, get_current_active_user
from app.db.database import db
from app.models.booking import (
    Booking, BookingCreate, BookingUpdate, BookingStatusUpdate, 
    BookingCancellation, BookingType, BookingStatus
)
from app.services.email import send_booking_confirmation_email, send_booking_update_email
from app.services.whatsapp import send_booking_confirmation_whatsapp, send_booking_request_to_arena

router = APIRouter()

@router.post("/bookings/", response_model=Booking)
async def create_booking(
    booking_data: BookingCreate,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_active_user)
):
    """Criar um novo agendamento"""
    user_id = current_user.id
    
    # Verificar se a quadra existe
    court_doc = await db.db.courts.find_one({"_id": ObjectId(booking_data.court_id)})
    if not court_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quadra não encontrada"
        )
    
    # Obter informações da arena
    arena_doc = await db.db.arenas.find_one({"_id": ObjectId(court_doc["arena_id"])})
    if not arena_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena não encontrada"
        )
    
    # Verificar disponibilidade
    is_available = True
    error_message = ""
    
    if booking_data.booking_type == BookingType.SINGLE and booking_data.timeslot:
        # Verificar disponibilidade para reserva avulsa
        date_str = booking_data.timeslot.date
        start_time_str = booking_data.timeslot.start_time
        end_time_str = booking_data.timeslot.end_time
        
        # Converter strings para objetos datetime e time
        booking_date = datetime.fromisoformat(date_str)
        start_time = datetime.strptime(start_time_str, "%H:%M").time()
        end_time = datetime.strptime(end_time_str, "%H:%M").time()
        
        # Verificar se a data/hora não está no passado
        current_datetime = datetime.now()
        booking_datetime = datetime.combine(booking_date.date(), start_time)
        if booking_datetime < current_datetime:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível agendar para uma data/hora no passado"
            )
        
        # Verificar se há reservas conflitantes
        conflicts = await db.db.bookings.find_one({
            "court_id": booking_data.court_id,
            "status": {"$in": ["pending", "confirmed"]},
            "$or": [
                # Reservas avulsas no mesmo dia e com horários sobrepostos
                {
                    "booking_type": "single",
                    "timeslot.date": date_str,
                    "$or": [
                        # Reserva existente começa durante o novo período
                        {
                            "timeslot.start_time": {"$lt": end_time_str},
                            "timeslot.end_time": {"$gt": start_time_str}
                        },
                        # Reserva existente termina durante o novo período
                        {
                            "timeslot.start_time": {"$lt": end_time_str},
                            "timeslot.end_time": {"$gt": start_time_str}
                        }
                    ]
                },
                # Reservas mensais que incluem este dia da semana e com horários sobrepostos
                {
                    "booking_type": "monthly",
                    "monthly_config.weekdays": booking_date.weekday(),
                    "monthly_config.start_date": {"$lte": date_str},
                    "$or": [
                        {"monthly_config.end_date": {"$gte": date_str}},
                        {"monthly_config.end_date": None}
                    ],
                    "monthly_config.start_time": {"$lt": end_time_str},
                    "monthly_config.end_time": {"$gt": start_time_str}
                }
            ]
        })
        
        if conflicts:
            is_available = False
            error_message = "Este horário já está reservado"
        
        # Calcular horas e valores
        hours_diff = (
            datetime.combine(datetime.min, end_time) - 
            datetime.combine(datetime.min, start_time)
        ).seconds / 3600
        
    elif booking_data.booking_type == BookingType.MONTHLY and booking_data.monthly_config:
        # Verificar disponibilidade para reserva mensal
        weekdays = booking_data.monthly_config.weekdays
        start_date_str = booking_data.monthly_config.start_date
        start_time_str = booking_data.monthly_config.start_time
        end_time_str = booking_data.monthly_config.end_time
        
        # Converter strings para objetos datetime e time
        start_date = datetime.fromisoformat(start_date_str)
        start_time = datetime.strptime(start_time_str, "%H:%M").time()
        end_time = datetime.strptime(end_time_str, "%H:%M").time()
        
        # Verificar se a data de início não está no passado
        current_date = datetime.now().date()
        if start_date.date() < current_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A data de início não pode estar no passado"
            )
        
        # Verificar se há pelo menos um dia da semana selecionado
        if not weekdays:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selecione pelo menos um dia da semana"
            )
        
        # Verificar se há reservas conflitantes para cada dia da semana
        for weekday in weekdays:
            # Buscar reservas mensais conflitantes
            conflicts = await db.db.bookings.find_one({
                "court_id": booking_data.court_id,
                "status": {"$in": ["pending", "confirmed"]},
                "$or": [
                    # Outras reservas mensais no mesmo dia da semana
                    {
                        "booking_type": "monthly",
                        "monthly_config.weekdays": weekday,
                        "$or": [
                            # Reserva começa antes do fim da nova reserva
                            {
                                "monthly_config.start_time": {"$lt": end_time_str},
                                "monthly_config.end_time": {"$gt": start_time_str}
                            }
                        ]
                    }
                ]
            })
            
            if conflicts:
                is_available = False
                error_message = f"Há conflitos para o dia {weekday}"
                break
        
        # Calcular horas por dia e valores
        hours_diff = (
            datetime.combine(datetime.min, end_time) - 
            datetime.combine(datetime.min, start_time)
        ).seconds / 3600
        
        # Multiplicar pelo número de dias por semana
        hours_diff = hours_diff * len(weekdays)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dados incompletos para o tipo de reserva selecionado"
        )
    
    if not is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Calcular valores
    price_per_hour = court_doc["discounted_price"] or court_doc["price_per_hour"]
    subtotal = price_per_hour * hours_diff
    
    # Processar serviços extras
    extra_services_data = []
    extra_services_total = 0
    
    if booking_data.extra_services:
        for extra in booking_data.extra_services:
            service_id = extra.get("service_id")
            quantity = extra.get("quantity", 1)
            
            # Ignorar serviços com quantidade 0
            if quantity <= 0:
                continue
            
            # Buscar serviço
            service = await db.db.extra_services.find_one({"_id": ObjectId(service_id)})
            if service:
                price = service.get("discounted_price") or service.get("price")
                total_price = price * quantity
                
                extra_services_data.append({
                    "service_id": service_id,
                    "name": service.get("name"),
                    "quantity": quantity,
                    "unit_price": price,
                    "total_price": total_price
                })
                
                extra_services_total += total_price
    
    # Calcular valor total
    total_amount = subtotal + extra_services_total
    
    # Verificar se a arena requer pagamento antecipado
    requires_payment = court_doc.get("advance_payment_required", True)
    if requires_payment is None:
        requires_payment = arena_doc.get("advance_payment_required", True)
    
    # Definir prazo de pagamento (se necessário)
    payment_deadline = None
    if requires_payment and arena_doc["payment_deadline_hours"]:
        payment_deadline = datetime.now() + timedelta(hours=arena_doc["payment_deadline_hours"])
    
    # Criar a reserva
    new_booking = {
        "user_id": user_id,
        "court_id": booking_data.court_id,
        "arena_id": str(arena_doc["_id"]),
        "booking_type": booking_data.booking_type,
        "timeslot": booking_data.timeslot.dict() if booking_data.timeslot else None,
        "monthly_config": booking_data.monthly_config.dict() if booking_data.monthly_config else None,
        "status": BookingStatus.WAITING_PAYMENT if requires_payment else BookingStatus.PENDING,
        "price_per_hour": price_per_hour,
        "total_hours": hours_diff,
        "subtotal": subtotal,
        "extra_services": extra_services_data,
        "total_amount": total_amount,
        "discount_amount": 0.0,  # Aplicar descontos se houver
        "requires_payment": requires_payment,
        "payment_deadline": payment_deadline,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
     # Inserir no banco de dados
    result = await db.db.bookings.insert_one(new_booking)
    booking_id = str(result.inserted_id)
    
    # Buscar a reserva criada
    created_booking_doc = await db.db.bookings.find_one({"_id": ObjectId(booking_id)})
    
    # Adicionar dados relacionados para resposta
    created_booking_doc["court"] = {
        "id": str(court_doc["_id"]),
        "name": court_doc["name"],
        "type": court_doc["type"]
    }
    
    created_booking_doc["arena"] = {
        "id": str(arena_doc["_id"]),
        "name": arena_doc["name"]
    }
    
    # Enviar notificações em background
    # Apenas se não requer pagamento antecipado
    if not requires_payment:
        # Notificar arena sobre nova solicitação
        arena_owner = await db.db.users.find_one({"_id": ObjectId(arena_doc["owner_id"])})
        if arena_owner:
            background_tasks.add_task(
                send_booking_request_to_arena,
                phone=arena_owner.get("phone"),
                booking_data={
                    "booking_id": booking_id,
                    "court_name": court_doc["name"],
                    "date": booking_data.timeslot.date if booking_data.timeslot else booking_data.monthly_config.start_date,
                    "time": f"{booking_data.timeslot.start_time if booking_data.timeslot else booking_data.monthly_config.start_time} - {booking_data.timeslot.end_time if booking_data.timeslot else booking_data.monthly_config.end_time}",
                    "client_name": f"{current_user.get('first_name')} {current_user.get('last_name')}"
                }
            )
    
    return new_booking

@router.get("/bookings/user/me", response_model=List[Booking])
async def get_user_bookings(
    current_user = Depends(get_current_active_user),
    status: Optional[str] = None,
    page: int = 1,
    items_per_page: int = 20
):
    """Obter agendamentos do usuário logado"""
    user_id = str(current_user["_id"])
    
    # Construir filtro
    filter_query = {"user_id": user_id}
    if status:
        filter_query["status"] = status
    
    # Aplicar paginação
    skip = (page - 1) * items_per_page
    
    # Buscar bookings ordenados por data de criação (mais recentes primeiro)
    cursor = db.db.bookings.find(filter_query).sort("created_at", -1).skip(skip).limit(items_per_page)
    
    # Converter cursor para lista
    bookings = []
    async for booking in cursor:
        # Adicionar dados relacionados
        court = await db.db.courts.find_one({"_id": ObjectId(booking["court_id"])})
        if court:
            booking["court"] = {
                "id": str(court["_id"]),
                "name": court["name"],
                "type": court["type"]
            }
        
        arena = await db.db.arenas.find_one({"_id": ObjectId(booking["arena_id"])})
        if arena:
            booking["arena"] = {
                "id": str(arena["_id"]),
                "name": arena["name"]
            }
        
        # Converter ObjectId para string
        booking["_id"] = str(booking["_id"])
        bookings.append(booking)
    
    return bookings

@router.get("/bookings/arena/{arena_id}", response_model=List[Booking])
async def get_arena_bookings(
    arena_id: str,
    current_user = Depends(get_current_active_user),
    status: Optional[str] = None,
    page: int = 1,
    items_per_page: int = 20
):
    """Obter agendamentos de uma arena (somente para donos da arena)"""
    user_id = str(current_user["_id"])
    
    # Verificar se o usuário tem permissão (dono da arena ou admin)
    arena = await db.db.arenas.find_one({"_id": ObjectId(arena_id)})
    if not arena:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arena não encontrada"
        )
    
    if str(arena["owner_id"]) != user_id and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada"
        )
    
    # Construir filtro
    filter_query = {"arena_id": arena_id}
    if status:
        filter_query["status"] = status
    
    # Aplicar paginação
    skip = (page - 1) * items_per_page
    
    # Buscar bookings ordenados por data (mais recentes primeiro)
    cursor = db.db.bookings.find(filter_query).sort("created_at", -1).skip(skip).limit(items_per_page)
    
    # Converter cursor para lista
    bookings = []
    async for booking in cursor:
        # Adicionar dados relacionados
        court = await db.db.courts.find_one({"_id": ObjectId(booking["court_id"])})
        if court:
            booking["court"] = {
                "id": str(court["_id"]),
                "name": court["name"],
                "type": court["type"]
            }
        
        user = await db.db.users.find_one({"_id": ObjectId(booking["user_id"])})
        if user:
            booking["user"] = {
                "id": str(user["_id"]),
                "name": f"{user.get('first_name')} {user.get('last_name')}",
                "email": user.get("email"),
                "phone": user.get("phone")
            }
        
        # Converter ObjectId para string
        booking["_id"] = str(booking["_id"])
        bookings.append(booking)
    
    return bookings

@router.put("/bookings/{booking_id}/status", response_model=Booking)
async def update_booking_status(
    booking_id: str,
    status_data: BookingStatusUpdate,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_active_user)
):
    """Atualizar status de um agendamento (confirmar, cancelar, etc)"""
    user_id = str(current_user["_id"])
    
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
    
    is_arena_owner = str(arena["owner_id"]) == user_id
    is_admin = current_user.get("role") == "admin"
    
    if not (is_owner or is_arena_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada"
        )
    
    # Verificar transições de estado válidas
    current_status = booking["status"]
    new_status = status_data.status
    
    valid_transitions = {
        # Do status atual para possíveis status novos
        BookingStatus.PENDING: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
        BookingStatus.WAITING_PAYMENT: [BookingStatus.PENDING, BookingStatus.CANCELLED],
        BookingStatus.CONFIRMED: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
        # Não permitir mudança de status para COMPLETED ou CANCELLED
        BookingStatus.COMPLETED: [],
        BookingStatus.CANCELLED: []
    }
    
    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transição inválida de status: {current_status} para {new_status}"
        )
    
    # Atualizar status
    update_data = {
        "status": new_status,
        "updated_at": datetime.now()
    }
    
    if status_data.notes:
        update_data["notes"] = status_data.notes
    
    await db.db.bookings.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": update_data}
    )
    
    # Buscar a reserva atualizada
    updated_booking = await db.db.bookings.find_one({"_id": ObjectId(booking_id)})
    updated_booking["_id"] = booking_id
    
    # Adicionar dados relacionados para resposta
    court = await db.db.courts.find_one({"_id": ObjectId(updated_booking["court_id"])})
    if court:
        updated_booking["court"] = {
            "id": str(court["_id"]),
            "name": court["name"],
            "type": court["type"]
        }
    
    updated_booking["arena"] = {
        "id": str(arena["_id"]),
        "name": arena["name"]
    }
    
    # Enviar notificações
    user = await db.db.users.find_one({"_id": ObjectId(updated_booking["user_id"])})
    
    if user and new_status == BookingStatus.CONFIRMED:
        # Notificar cliente sobre confirmação
        background_tasks.add_task(
            send_booking_confirmation_email,
            email_to=user.get("email"),
            booking_data={
                "court_name": court["name"],
                "date": updated_booking["timeslot"]["date"] if updated_booking["timeslot"] else updated_booking["monthly_config"]["start_date"],
                "time": f"{updated_booking['timeslot']['start_time'] if updated_booking['timeslot'] else updated_booking['monthly_config']['start_time']} - {updated_booking['timeslot']['end_time'] if updated_booking['timeslot'] else updated_booking['monthly_config']['end_time']}",
                "arena_name": arena["name"]
            }
        )
        
        background_tasks.add_task(
            send_booking_confirmation_whatsapp,
            phone=user.get("phone"),
            booking_data={
                "court_name": court["name"],
                "date": updated_booking["timeslot"]["date"] if updated_booking["timeslot"] else updated_booking["monthly_config"]["start_date"],
                "time": f"{updated_booking['timeslot']['start_time'] if updated_booking['timeslot'] else updated_booking['monthly_config']['start_time']} - {updated_booking['timeslot']['end_time'] if updated_booking['timeslot'] else updated_booking['monthly_config']['end_time']}",
                "arena_name": arena["name"]
            }
        )
    
    return updated_booking

@router.post("/bookings/{booking_id}/cancel", response_model=Booking)
async def cancel_booking(
    booking_id: str,
    cancel_data: BookingCancellation,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_active_user)
):
    """Cancelar um agendamento"""
    user_id = str(current_user["_id"])
    
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
    
    is_arena_owner = str(arena["owner_id"]) == user_id
    is_admin = current_user.get("role") == "admin"
    
    if not (is_owner or is_arena_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada"
        )
    
    # Verificar política de cancelamento
    # Em uma implementação completa, verificaria a política da arena
    # e se o cancelamento é permitido com base na data/hora da reserva
    
    # Por enquanto, simplificaremos e permitiremos o cancelamento
    
    # Atualizar status
    update_data = {
        "status": BookingStatus.CANCELLED,
        "updated_at": datetime.now()
    }
    
    if cancel_data.reason:
        update_data["notes"] = cancel_data.reason
    
    await db.db.bookings.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": update_data}
    )
    
    # Processar reembolso se necessário e solicitado
    if cancel_data.request_refund:
        # Verificar se há pagamento associado
        payment = await db.db.payments.find_one({
            "booking_id": booking_id,
            "status": "approved"
        })
        
        if payment:
            # Em uma implementação real, integraria com o gateway de pagamento
            # para solicitar o reembolso
            
            # Marcar o pagamento como reembolsado
            await db.db.payments.update_one(
                {"_id": payment["_id"]},
                {"$set": {
                    "status": "refunded",
                    "updated_at": datetime.now()
                }}
            )
    
    # Buscar a reserva atualizada
    updated_booking = await db.db.bookings.find_one({"_id": ObjectId(booking_id)})
    updated_booking["_id"] = booking_id
    
    # Adicionar dados relacionados para resposta
    court = await db.db.courts.find_one({"_id": ObjectId(updated_booking["court_id"])})
    if court:
        updated_booking["court"] = {
            "id": str(court["_id"]),
            "name": court["name"],
            "type": court["type"]
        }
    
    updated_booking["arena"] = {
        "id": str(arena["_id"]),
        "name": arena["name"]
    }
    
    # Enviar notificações sobre o cancelamento
    user = await db.db.users.find_one({"_id": ObjectId(updated_booking["user_id"])})
    if user and is_arena_owner:
        # Se o cancelamento foi feito pela arena, notificar o cliente
        background_tasks.add_task(
            send_booking_update_email,
            email_to=user.get("email"),
            update_type="cancellation",
            booking_data={
                "court_name": court["name"],
                "date": updated_booking["timeslot"]["date"] if updated_booking["timeslot"] else updated_booking["monthly_config"]["start_date"],
                "time": f"{updated_booking['timeslot']['start_time'] if updated_booking['timeslot'] else updated_booking['monthly_config']['start_time']} - {updated_booking['timeslot']['end_time'] if updated_booking['timeslot'] else updated_booking['monthly_config']['end_time']}",
                "arena_name": arena["name"],
                "reason": cancel_data.reason
            }
        )
    elif is_owner:
        # Se o cancelamento foi feito pelo cliente, notificar a arena
        arena_owner = await db.db.users.find_one({"_id": ObjectId(arena["owner_id"])})
        if arena_owner:
            background_tasks.add_task(
                send_booking_update_email,
                email_to=arena_owner.get("email"),
                update_type="client_cancellation",
                booking_data={
                    "court_name": court["name"],
                    "date": updated_booking["timeslot"]["date"] if updated_booking["timeslot"] else updated_booking["monthly_config"]["start_date"],
                    "time": f"{updated_booking['timeslot']['start_time'] if updated_booking['timeslot'] else updated_booking['monthly_config']['start_time']} - {updated_booking['timeslot']['end_time'] if updated_booking['timeslot'] else updated_booking['monthly_config']['end_time']}",
                    "client_name": f"{user.get('first_name')} {user.get('last_name')}",
                    "reason": cancel_data.reason
                }
            )
    
    return updated_booking

@router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(
    booking_id: str,
    current_user = Depends(get_current_active_user)
):
    """Obter detalhes de uma reserva específica"""
    user_id = str(current_user["_id"])
    
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
    
    is_arena_owner = str(arena["owner_id"]) == user_id
    is_admin = current_user.get("role") == "admin"
    
    if not (is_owner or is_arena_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada"
        )
    
    # Adicionar dados relacionados
    court = await db.db.courts.find_one({"_id": ObjectId(booking["court_id"])})
    if court:
        booking["court"] = {
            "id": str(court["_id"]),
            "name": court["name"],
            "type": court["type"]
        }
    
    booking["arena"] = {
        "id": str(arena["_id"]),
        "name": arena["name"]
    }
    
    # Incluir informações do usuário para o dono da arena
    if is_arena_owner or is_admin:
        user = await db.db.users.find_one({"_id": ObjectId(booking["user_id"])})
        if user:
            booking["user"] = {
                "id": str(user["_id"]),
                "name": f"{user.get('first_name')} {user.get('last_name')}",
                "email": user.get("email"),
                "phone": user.get("phone")
            }
    
    # Converter ObjectId para string
    booking["_id"] = str(booking["_id"])
    
    return booking

@router.get("/bookings/{booking_id}/payment-status", response_model=Dict[str, Any])
async def get_booking_payment_status(
    booking_id: str,
    current_user = Depends(get_current_active_user)
):
    """Obter status de pagamento de uma reserva"""
    user_id = str(current_user["_id"])
    
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
    
    is_arena_owner = str(arena["owner_id"]) == user_id
    is_admin = current_user.get("role") == "admin"
    
    if not (is_owner or is_arena_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada"
        )
    
    # Buscar pagamento associado
    payment = await db.db.payments.find_one({"booking_id": booking_id})
    
    payment_status = {
        "booking_id": booking_id,
        "status": booking["status"],
        "requires_payment": booking.get("requires_payment", True),
        "payment_deadline": booking.get("payment_deadline"),
        "payment": None
    }
    
    if payment:
        payment["_id"] = str(payment["_id"])
        payment_status["payment"] = payment
    
    return payment_status