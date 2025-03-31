# app/api/routes/payments.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from bson.objectid import ObjectId

from app.core.security import get_current_user, get_current_active_user
from app.db.database import db
from app.models.payment import Payment, PaymentCreate, PaymentUpdate, PaymentStatus, PaymentMethod
from app.models.booking import BookingStatus
from app.services.payment import create_payment as service_create_payment, process_webhook
from app.services.email import send_booking_request_to_arena, send_payment_confirmation_email
from app.services.whatsapp import send_payment_confirmation_whatsapp

router = APIRouter()

@router.post("/payments/", response_model=Payment)
async def create_payment(
    payment_data: PaymentCreate,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_active_user)
):
    """Iniciar um novo pagamento"""
    user_id = str(current_user["id"])
    
    # Buscar a reserva
    booking = await db.db.bookings.find_one({"_id": ObjectId(payment_data.booking_id)})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva não encontrada"
        )
    
    # Verificar se o usuário tem permissão (dono da reserva)
    if booking["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada"
        )
    
    # Verificar se a reserva requer pagamento
    if not booking.get("requires_payment", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta reserva não requer pagamento antecipado"
        )
    
    # Verificar se já existe um pagamento
    existing_payment = await db.db.payments.find_one({
        "booking_id": payment_data.booking_id,
        "status": {"$in": ["pending", "approved"]}
    })
    
    if existing_payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um pagamento em andamento para esta reserva"
        )
    
    # Verificar prazo de pagamento
    if booking.get("payment_deadline") and datetime.now() > booking["payment_deadline"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O prazo para pagamento desta reserva expirou"
        )
    
    # Verificar valor
    if payment_data.amount != booking["total_amount"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Valor incorreto. O valor correto é R$ {booking['total_amount']:.2f}"
        )
    
    # Preparar dados do cliente para o gateway de pagamento
    customer_data = {
        "email": current_user.get("email"),
        "first_name": current_user.get("first_name"),
        "last_name": current_user.get("last_name"),
        "cpf": current_user.get("cpf")
    }
    
    # Para pagamentos com cartão, adicionar dados do cartão
    if payment_data.payment_method == PaymentMethod.CREDIT_CARD and payment_data.card_data:
        customer_data.update({
            "card_token": payment_data.card_data.get("token"),
            "installments": payment_data.card_data.get("installments", 1)
        })
    
    try:
        # Integrar com gateway de pagamento (implementação fictícia)
        payment_response = await service_create_payment(
            payment_data.booking_id,
            payment_data.amount,
            customer_data,
            payment_data.payment_method
        )
        
        # Criar registro de pagamento
        new_payment = {
            "booking_id": payment_data.booking_id,
            "user_id": user_id,
            "arena_id": booking["arena_id"],
            "amount": payment_data.amount,
            "payment_method": payment_data.payment_method,
            "status": PaymentStatus.PENDING,
            "gateway_id": payment_response.get("id"),
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Adicionar dados específicos dependendo do método de pagamento
        if payment_data.payment_method == PaymentMethod.PIX:
            new_payment["pix_qrcode"] = payment_response.get("point_of_interaction", {}).get("transaction_data", {}).get("qr_code_base64")
            new_payment["pix_copy_paste"] = payment_response.get("point_of_interaction", {}).get("transaction_data", {}).get("qr_code")
            
            # Definir prazo de expiração (24 horas)
            new_payment["expires_at"] = datetime.now() + timedelta(hours=24)
            
        elif payment_data.payment_method == PaymentMethod.CREDIT_CARD:
            if payment_response.get("status") == "approved":
                new_payment["status"] = PaymentStatus.APPROVED
                new_payment["payment_date"] = datetime.now()
            
            # Últimos 4 dígitos do cartão
            if payment_data.card_data and payment_data.card_data.get("number"):
                new_payment["credit_card_last4"] = payment_data.card_data["number"][-4:]
        
        # Inserir pagamento no banco de dados
        result = await db.db.payments.insert_one(new_payment)
        payment_id = str(result.inserted_id)
        new_payment["_id"] = payment_id
        
        # Se o pagamento foi aprovado imediatamente (cartão), atualizar status da reserva
        if new_payment["status"] == PaymentStatus.APPROVED:
            await db.db.bookings.update_one(
                {"_id": ObjectId(payment_data.booking_id)},
                {"$set": {
                    "status": BookingStatus.PENDING,
                    "updated_at": datetime.now()
                }}
            )
            
            # Notificar arena sobre nova reserva
            booking_with_details = await get_booking_with_details(payment_data.booking_id)
            
            arena_owner = await db.db.users.find_one({"_id": ObjectId(booking_with_details["arena"]["owner_id"])})
            if arena_owner:
                background_tasks.add_task(
                    send_booking_request_to_arena,
                    phone=arena_owner.get("phone"),
                    booking_data={
                        "booking_id": payment_data.booking_id,
                        "court_name": booking_with_details["court"]["name"],
                        "date": booking_with_details["date_str"],
                        "time": booking_with_details["time_str"],
                        "client_name": f"{current_user.get('first_name')} {current_user.get('last_name')}"
                    }
                )
        
        return new_payment
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar pagamento: {str(e)}"
        )

@router.post("/payments/webhook")
async def payment_webhook(
    webhook_data: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """Webhook para atualizações de status do gateway de pagamento"""
    try:
        # Processar dados do webhook
        result = await process_webhook(webhook_data)
        
        if not result or not result.get("payment_id"):
            return {"success": False, "message": "Dados do webhook inválidos"}
        
        payment_id = result["payment_id"]
        new_status = result["status"]
        
        # Atualizar status do pagamento
        payment = await db.db.payments.find_one({"gateway_id": payment_id})
        if not payment:
            return {"success": False, "message": "Pagamento não encontrado"}
        
        # Atualizar status do pagamento
        update_data = {
            "status": new_status,
            "updated_at": datetime.now()
        }
        
        if new_status == PaymentStatus.APPROVED:
            update_data["payment_date"] = datetime.now()
        
        await db.db.payments.update_one(
            {"gateway_id": payment_id},
            {"$set": update_data}
        )
        
        # Se o pagamento foi aprovado, atualizar status da reserva
        if new_status == PaymentStatus.APPROVED:
            booking = await db.db.bookings.find_one({"_id": ObjectId(payment["booking_id"])})
            if booking:
                await db.db.bookings.update_one(
                    {"_id": ObjectId(payment["booking_id"])},
                    {"$set": {
                        "status": BookingStatus.PENDING,
                        "updated_at": datetime.now()
                    }}
                )
                
                # Notificar cliente sobre confirmação de pagamento
                user = await db.db.users.find_one({"_id": ObjectId(payment["user_id"])})
                if user:
                    booking_with_details = await get_booking_with_details(payment["booking_id"])
                    
                    background_tasks.add_task(
                        send_payment_confirmation_email,
                        email_to=user.get("email"),
                        payment_data={
                            "amount": payment["amount"],
                            "method": payment["payment_method"],
                            "court_name": booking_with_details["court"]["name"],
                            "date": booking_with_details["date_str"],
                            "time": booking_with_details["time_str"],
                            "arena_name": booking_with_details["arena"]["name"]
                        }
                    )
                    
                    background_tasks.add_task(
                        send_payment_confirmation_whatsapp,
                        phone=user.get("phone"),
                        payment_data={
                            "amount": payment["amount"],
                            "method": payment["payment_method"],
                            "court_name": booking_with_details["court"]["name"],
                            "date": booking_with_details["date_str"],
                            "time": booking_with_details["time_str"],
                            "arena_name": booking_with_details["arena"]["name"]
                        }
                    )
                
                # Notificar arena sobre nova reserva
                arena_owner = await db.db.users.find_one({"_id": ObjectId(booking_with_details["arena"]["owner_id"])})
                if arena_owner:
                    background_tasks.add_task(
                        send_booking_request_to_arena,
                        phone=arena_owner.get("phone"),
                        booking_data={
                            "booking_id": payment["booking_id"],
                            "court_name": booking_with_details["court"]["name"],
                            "date": booking_with_details["date_str"],
                            "time": booking_with_details["time_str"],
                            "client_name": f"{user.get('first_name')} {user.get('last_name')}"
                        }
                    )
        
        return {"success": True}
    
    except Exception as e:
        # Logar erro, mas retornar sucesso para o gateway não reenviar o webhook
        print(f"Erro ao processar webhook: {str(e)}")
        return {"success": True, "message": "Processado com erros"}

@router.get("/payments/{payment_id}", response_model=Payment)
async def get_payment(
    payment_id: str,
    current_user = Depends(get_current_active_user)
):
    """Obter detalhes de um pagamento"""
    user_id = str(current_user["id"])
    
    # Buscar o pagamento
    payment = await db.db.payments.find_one({"_id": ObjectId(payment_id)})
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pagamento não encontrado"
        )
    
    # Verificar permissões
    is_owner = payment["user_id"] == user_id
    
    booking = await db.db.bookings.find_one({"_id": ObjectId(payment["booking_id"])})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva associada não encontrada"
        )
    
    arena = await db.db.arenas.find_one({"_id": ObjectId(payment["arena_id"])})
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
    
    # Adicionar dados da reserva para resposta
    court = await db.db.courts.find_one({"_id": ObjectId(booking["court_id"])})
    
    payment["booking"] = {
        "id": str(booking["_id"]),
        "status": booking["status"],
        "total_amount": booking["total_amount"],
        "court": {
            "id": str(court["_id"]) if court else None,
            "name": court["name"] if court else "Desconhecida"
        },
        "arena": {
            "id": str(arena["_id"]),
            "name": arena["name"]
        }
    }
    
    # Converter ObjectId para string
    payment["_id"] = str(payment["_id"])
    
    return payment

# Função auxiliar para obter detalhes completos de uma reserva
async def get_booking_with_details(booking_id: str) -> Dict[str, Any]:
    """Obter reserva com detalhes relacionados"""
    booking = await db.db.bookings.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        return None
    
    court = await db.db.courts.find_one({"_id": ObjectId(booking["court_id"])})
    arena = await db.db.arenas.find_one({"_id": ObjectId(booking["arena_id"])})
    
    result = {
        "booking": booking,
        "court": court,
        "arena": arena,
        "date_str": "",
        "time_str": ""
    }
    
    # Preparar string de data e horário
    if booking.get("booking_type") == "single" and booking.get("timeslot"):
        result["date_str"] = booking["timeslot"]["date"]
        result["time_str"] = f"{booking['timeslot']['start_time']} - {booking['timeslot']['end_time']}"
    elif booking.get("booking_type") == "monthly" and booking.get("monthly_config"):
        result["date_str"] = booking["monthly_config"]["start_date"]
        result["time_str"] = f"{booking['monthly_config']['start_time']} - {booking['monthly_config']['end_time']}"
    
    return result