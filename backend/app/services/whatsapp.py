# app/services/whatsapp.py
import logging
from typing import Dict, Any, Optional
from twilio.rest import Client

from app.core.config import settings

logger = logging.getLogger(__name__)

# Cliente Twilio
twilio_client = None

# O serviço de WhatsApp permite enviar mensagens de confirmação, notificações de novas reservas, confirmações de pagamento, 
# lembretes de reservas próximas e notificações de cancelamento, utilizando a API Twilio para integração com o WhatsApp.

def init_twilio_client():
    """Inicializar cliente Twilio."""
    global twilio_client
    
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        logger.info("Cliente Twilio inicializado.")
    else:
        logger.warning("Credenciais Twilio não configuradas. Mensagens WhatsApp não serão enviadas.")

async def send_whatsapp_message(to_number: str, message: str) -> bool:
    """
    Enviar mensagem WhatsApp via Twilio.
    
    Args:
        to_number: Número do destinatário (formato: +5511999999999)
        message: Conteúdo da mensagem
        
    Returns:
        bool: True se a mensagem foi enviada com sucesso, False caso contrário
    """
    if not twilio_client:
        init_twilio_client()
        if not twilio_client:
            logger.error("Cliente Twilio não configurado. Não foi possível enviar mensagem.")
            return False
    
    # Formatar número
    if not to_number.startswith('+'):
        # Adicionar código do país se não existir
        to_number = f"+55{to_number.lstrip('0')}"
    
    try:
        # Enviar mensagem WhatsApp
        twilio_client.messages.create(
            body=message,
            from_=f"whatsapp:{settings.TWILIO_PHONE_NUMBER}",
            to=f"whatsapp:{to_number}"
        )
        logger.info(f"Mensagem WhatsApp enviada para {to_number}")
        return True
    except Exception as e:
        logger.error(f"Erro ao enviar mensagem WhatsApp: {e}")
        # Em ambiente de desenvolvimento, mostrar o erro, mas não falhar
        if settings.ENVIRONMENT == "development":
            logger.info(f"Mensagem que seria enviada: {message}")
        return False

async def send_booking_confirmation_whatsapp(phone: str, booking_data: Dict[str, Any]) -> bool:
    """
    Enviar confirmação de agendamento por WhatsApp.
    
    Args:
        phone: Número de telefone do destinatário
        booking_data: Dados da reserva
        
    Returns:
        bool: True se a mensagem foi enviada com sucesso, False caso contrário
    """
    court_name = booking_data.get("court_name", "")
    date = booking_data.get("date", "")
    time = booking_data.get("time", "")
    arena_name = booking_data.get("arena_name", "")
    
    message = (
        f"✅ *Reserva Confirmada!*\n\n"
        f"Olá! Sua reserva foi confirmada com sucesso.\n\n"
        f"📍 *Arena:* {arena_name}\n"
        f"🏟️ *Quadra:* {court_name}\n"
        f"📅 *Data:* {date}\n"
        f"⏰ *Horário:* {time}\n\n"
        f"Guarde essas informações. Esperamos você!\n\n"
        f"Para mais detalhes, acesse sua área do cliente em nosso site ou aplicativo."
    )
    
    return await send_whatsapp_message(phone, message)

async def send_booking_request_to_arena(phone: str, booking_data: Dict[str, Any]) -> bool:
    """
    Enviar notificação de nova reserva para a arena.
    
    Args:
        phone: Número de telefone do proprietário da arena
        booking_data: Dados da reserva
        
    Returns:
        bool: True se a mensagem foi enviada com sucesso, False caso contrário
    """
    booking_id = booking_data.get("booking_id", "")
    court_name = booking_data.get("court_name", "")
    date = booking_data.get("date", "")
    time = booking_data.get("time", "")
    client_name = booking_data.get("client_name", "")
    
    # URL para acessar rapidamente a reserva
    confirmation_url = f"{settings.FRONTEND_URL}/arena-admin/bookings/{booking_id}"
    
    message = (
        f"🆕 *Nova Reserva!*\n\n"
        f"Você recebeu uma nova solicitação de reserva:\n\n"
        f"👤 *Cliente:* {client_name}\n"
        f"🏟️ *Quadra:* {court_name}\n"
        f"📅 *Data:* {date}\n"
        f"⏰ *Horário:* {time}\n\n"
        f"Acesse o sistema para confirmar ou recusar esta reserva:\n{confirmation_url}"
    )
    
    return await send_whatsapp_message(phone, message)

async def send_payment_confirmation_whatsapp(phone: str, payment_data: Dict[str, Any]) -> bool:
    """
    Enviar confirmação de pagamento por WhatsApp.
    
    Args:
        phone: Número de telefone do destinatário
        payment_data: Dados do pagamento
        
    Returns:
        bool: True se a mensagem foi enviada com sucesso, False caso contrário
    """
    amount = payment_data.get("amount", 0)
    method = payment_data.get("method", "")
    court_name = payment_data.get("court_name", "")
    date = payment_data.get("date", "")
    time = payment_data.get("time", "")
    arena_name = payment_data.get("arena_name", "")
    
    # Traduzir método de pagamento
    payment_methods = {
        "pix": "PIX",
        "credit_card": "Cartão de Crédito",
        "on_site": "No local"
    }
    method_display = payment_methods.get(method, method)
    
    message = (
        f"💰 *Pagamento Confirmado!*\n\n"
        f"Seu pagamento foi processado com sucesso:\n\n"
        f"💵 *Valor:* R$ {amount:.2f}\n"
        f"💳 *Método:* {method_display}\n\n"
        f"📍 *Arena:* {arena_name}\n"
        f"🏟️ *Quadra:* {court_name}\n"
        f"📅 *Data:* {date}\n"
        f"⏰ *Horário:* {time}\n\n"
        f"Sua reserva está aguardando confirmação da arena. Você será notificado quando for confirmada."
    )
    
    return await send_whatsapp_message(phone, message)

async def send_booking_cancellation_whatsapp(phone: str, booking_data: Dict[str, Any], reason: Optional[str] = None) -> bool:
    """
    Enviar notificação de cancelamento de reserva.
    
    Args:
        phone: Número de telefone do destinatário
        booking_data: Dados da reserva
        reason: Motivo do cancelamento (opcional)
        
    Returns:
        bool: True se a mensagem foi enviada com sucesso, False caso contrário
    """
    court_name = booking_data.get("court_name", "")
    date = booking_data.get("date", "")
    time = booking_data.get("time", "")
    arena_name = booking_data.get("arena_name", "")
    
    message = (
        f"❌ *Reserva Cancelada*\n\n"
        f"Informamos que sua reserva foi cancelada:\n\n"
        f"📍 *Arena:* {arena_name}\n"
        f"🏟️ *Quadra:* {court_name}\n"
        f"📅 *Data:* {date}\n"
        f"⏰ *Horário:* {time}\n"
    )
    
    if reason:
        message += f"\n*Motivo:* {reason}\n"
    
    message += (
        f"\nPara mais informações, acesse sua área do cliente em nosso site ou aplicativo, "
        f"ou entre em contato diretamente com a arena."
    )
    
    return await send_whatsapp_message(phone, message)

async def send_booking_reminder_whatsapp(phone: str, booking_data: Dict[str, Any]) -> bool:
    """
    Enviar lembrete de reserva próxima.
    
    Args:
        phone: Número de telefone do destinatário
        booking_data: Dados da reserva
        
    Returns:
        bool: True se a mensagem foi enviada com sucesso, False caso contrário
    """
    court_name = booking_data.get("court_name", "")
    date = booking_data.get("date", "")
    time = booking_data.get("time", "")
    arena_name = booking_data.get("arena_name", "")
    address = booking_data.get("address", "")
    
    message = (
        f"⏰ *Lembrete de Reserva*\n\n"
        f"Olá! Sua reserva está agendada para amanhã:\n\n"
        f"📍 *Arena:* {arena_name}\n"
        f"🏟️ *Quadra:* {court_name}\n"
        f"📅 *Data:* {date}\n"
        f"⏰ *Horário:* {time}\n"
    )
    
    if address:
        message += f"\n*Endereço:* {address}\n"
    
    message += (
        f"\nEstamos ansiosos para recebê-lo! Em caso de qualquer imprevisto, "
        f"por favor entre em contato diretamente com a arena."
    )
    
    return await send_whatsapp_message(phone, message)