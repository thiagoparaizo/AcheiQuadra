# app/services/email.py
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from jinja2 import Environment, select_autoescape, FileSystemLoader

from app.core.config import settings

logger = logging.getLogger(__name__)

# Verificar se o diretório de templates existe, senão criar
template_dir = Path(__file__).parent.parent / "templates" / "email"
if not template_dir.exists():
    os.makedirs(template_dir, exist_ok=True)
    # Criar template básico para verificação de e-mail
    with open(template_dir / "verify_email.html", "w") as f:
        f.write("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Verificação de E-mail</title>
        </head>
        <body>
            <h1>Olá {{ name }},</h1>
            <p>Obrigado por se cadastrar no Sistema de Quadras. Por favor, confirme seu e-mail clicando no link abaixo:</p>
            <p><a href="{{ verification_url }}">Confirmar E-mail</a></p>
            <p>Se você não solicitou este e-mail, por favor ignore-o.</p>
        </body>
        </html>
        """)

# Configuração de e-mail atualizada para compatibilidade com Pydantic v2
email_config = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM or "noreply@example.com",  # Email padrão se não estiver configurado
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_TLS,  # Usando o valor de TLS
    MAIL_SSL_TLS=settings.MAIL_SSL,  # Usando o valor de SSL
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=str(template_dir)  # Convertendo para string para compatibilidade
)

# FastMail instance
fm = FastMail(email_config)

# Jinja2 para templates de e-mail
jinja_env = None

def configure_email_templates():
    """Configurar ambiente Jinja2 para templates de e-mail."""
    global jinja_env
    
    jinja_env = Environment(
        loader=FileSystemLoader(template_dir),
        autoescape=select_autoescape(['html', 'xml'])
    )

async def send_email(
    email_to: List[EmailStr],
    subject: str,
    template_name: str,
    template_data: Dict[str, Any]
) -> None:
    """
    Enviar e-mail usando template.
    
    Args:
        email_to: Lista de e-mails destinatários
        subject: Assunto do e-mail
        template_name: Nome do template (sem extensão)
        template_data: Dados para o template
    """
    try:
        # Renderizar template
        template = jinja_env.get_template(f"{template_name}.html")
        html_content = template.render(**template_data)
        
        # Preparar mensagem
        message = MessageSchema(
            subject=subject,
            recipients=email_to,
            body=html_content,
            subtype="html"
        )
        
        # Enviar e-mail
        await fm.send_message(message)
        logger.info(f"E-mail enviado para {email_to}")
    except Exception as e:
        logger.error(f"Erro ao enviar e-mail: {e}")
        # Em desenvolvimento, logar o e-mail que seria enviado
        if settings.ENVIRONMENT == "development":
            logger.info(f"E-mail que seria enviado para {email_to}:\nAssunto: {subject}\nConteúdo:\n{html_content}")

async def send_verification_email(email_to: EmailStr, name: str, token: str) -> None:
    """Enviar e-mail de verificação."""
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    await send_email(
        email_to=[email_to],
        subject="Verificação de E-mail - Sistema de Quadras",
        template_name="verify_email",
        template_data={"name": name, "verification_url": verification_url}
    )

async def send_booking_confirmation(email_to: EmailStr, booking_data: Dict[str, Any]) -> None:
    """Enviar e-mail de confirmação de agendamento."""
    # Implementar após criar o template
    pass


# ARQUIVO: backend/app/services/whatsapp.py
import logging
from typing import Dict, Any
from twilio.rest import Client

from app.core.config import settings

logger = logging.getLogger(__name__)

# Cliente Twilio
twilio_client = None

def init_twilio_client():
    """Inicializar cliente Twilio."""
    global twilio_client
    
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        logger.info("Cliente Twilio inicializado.")
    else:
        logger.warning("Credenciais Twilio não configuradas. Mensagens WhatsApp não serão enviadas.")

async def send_whatsapp_message(to_number: str, message: str) -> None:
    """
    Enviar mensagem WhatsApp via Twilio.
    
    Args:
        to_number: Número do destinatário (formato: +5511999999999)
        message: Conteúdo da mensagem
    """
    if not twilio_client:
        init_twilio_client()
        if not twilio_client:
            logger.error("Cliente Twilio não configurado. Não foi possível enviar mensagem.")
            return
    
    try:
        twilio_client.messages.create(
            body=message,
            from_=f"whatsapp:{settings.TWILIO_PHONE_NUMBER}",
            to=f"whatsapp:{to_number}"
        )
        logger.info(f"Mensagem WhatsApp enviada para {to_number}")
    except Exception as e:
        logger.error(f"Erro ao enviar mensagem WhatsApp: {e}")
        raise

async def send_booking_confirmation_whatsapp(phone: str, booking_data: Dict[str, Any]) -> None:
    """Enviar confirmação de agendamento por WhatsApp."""
    court_name = booking_data.get("court_name", "")
    date = booking_data.get("date", "")
    time = booking_data.get("time", "")
    arena_name = booking_data.get("arena_name", "")
    
    message = (
        f"Olá! Seu agendamento foi *confirmado*\n\n"
        f"*Quadra:* {court_name}\n"
        f"*Data:* {date}\n"
        f"*Horário:* {time}\n"
        f"*Arena:* {arena_name}\n\n"
        f"Para mais detalhes, acesse sua área do cliente."
    )
    
    await send_whatsapp_message(phone, message)

async def send_booking_request_to_arena(phone: str, booking_data: Dict[str, Any]) -> None:
    """Enviar solicitação de agendamento para a arena."""
    court_name = booking_data.get("court_name", "")
    date = booking_data.get("date", "")
    time = booking_data.get("time", "")
    client_name = booking_data.get("client_name", "")
    booking_id = booking_data.get("booking_id", "")
    
    confirmation_url = f"{settings.FRONTEND_URL}/arena/bookings/confirm/{booking_id}"
    
    message = (
        f"Nova solicitação de agendamento! 📅\n\n"
        f"*Cliente:* {client_name}\n"
        f"*Quadra:* {court_name}\n"
        f"*Data:* {date}\n"
        f"*Horário:* {time}\n\n"
        f"Para confirmar, acesse: {confirmation_url}"
    )
    
    await send_whatsapp_message(phone, message)


# ARQUIVO: backend/app/services/payment.py
import logging
from typing import Dict, Any, Optional
import mercadopago

from app.core.config import settings

logger = logging.getLogger(__name__)

# Cliente MercadoPago
mp_client = None

def init_mercadopago_client():
    """Inicializar cliente MercadoPago."""
    global mp_client
    
    if settings.PAYMENT_GATEWAY_API_KEY:
        mp_client = mercadopago.SDK(settings.PAYMENT_GATEWAY_API_KEY)
        logger.info("Cliente MercadoPago inicializado.")
    else:
        logger.warning("Credenciais MercadoPago não configuradas. Pagamentos não serão processados.")

async def create_payment(
    booking_id: str, 
    amount: float, 
    customer_data: Dict[str, Any],
    payment_method: str = "pix"
) -> Dict[str, Any]:
    """
    Criar pagamento no MercadoPago.
    
    Args:
        booking_id: ID do agendamento
        amount: Valor do pagamento
        customer_data: Dados do cliente
        payment_method: Método de pagamento (pix, credit_card)
    
    Returns:
        Dict com resposta do gateway de pagamento
    """
    if not mp_client:
        init_mercadopago_client()
        if not mp_client:
            logger.error("Cliente MercadoPago não configurado. Não foi possível processar pagamento.")
            raise Exception("Gateway de pagamento não configurado")
    
    try:
        payment_data = {
            "transaction_amount": float(amount),
            "description": f"Pagamento de Reserva #{booking_id}",
            "payment_method_id": payment_method,
            "payer": {
                "email": customer_data.get("email"),
                "first_name": customer_data.get("first_name"),
                "last_name": customer_data.get("last_name"),
                "identification": {
                    "type": "CPF",
                    "number": customer_data.get("cpf")
                }
            },
            "external_reference": booking_id
        }
        
        # Adicionar detalhes específicos para cartão de crédito
        if payment_method == "credit_card":
            payment_data["token"] = customer_data.get("card_token")
            payment_data["installments"] = customer_data.get("installments", 1)
            
        response = mp_client.payment().create(payment_data)
        
        if response["status"] == 201:
            logger.info(f"Pagamento criado com sucesso: {response['response']['id']}")
            return response["response"]
        else:
            logger.error(f"Erro ao criar pagamento: {response}")
            raise Exception(f"Erro ao processar pagamento: {response.get('message', 'Erro desconhecido')}")
    
    except Exception as e:
        logger.error(f"Erro ao processar pagamento: {e}")
        raise

async def get_payment_status(payment_id: str) -> Optional[Dict[str, Any]]:
    """Verificar status de um pagamento."""
    if not mp_client:
        init_mercadopago_client()
        if not mp_client:
            return None
    
    try:
        response = mp_client.payment().get(payment_id)
        
        if response["status"] == 200:
            return response["response"]
        else:
            logger.error(f"Erro ao consultar pagamento: {response}")
            return None
    
    except Exception as e:
        logger.error(f"Erro ao consultar pagamento: {e}")
        return None

async def process_webhook(webhook_data: Dict[str, Any]) -> bool:
    """Processar webhook do MercadoPago."""
    # Implementar lógica de verificação de assinatura
    # e processamento de mudança de status do pagamento
    
    payment_id = webhook_data.get("data", {}).get("id")
    if not payment_id:
        logger.error("ID de pagamento não encontrado no webhook")
        return False
    
    payment_info = await get_payment_status(payment_id)
    if not payment_info:
        return False
    
    # Atualizar status do pagamento no banco de dados
    # Implementar lógica de atualização de status do agendamento
    
    return True


# ARQUIVO: backend/app/services/maps.py
import logging
import httpx
from typing import Dict, Any, List, Optional, Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)

async def geocode_address(address: Dict[str, Any]) -> Optional[Dict[str, float]]:
    """
    Converter endereço em coordenadas geográficas.
    
    Args:
        address: Dicionário com dados do endereço
    
    Returns:
        Dict com latitude e longitude
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        logger.warning("Google Maps API Key não configurada. Geocodificação não será realizada.")
        return None
    
    # Criar string de endereço
    address_str = f"{address.get('street')} {address.get('number')}, {address.get('neighborhood')}, {address.get('city')}, {address.get('state')}, {address.get('zipcode')}"
    
    try:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "address": address_str,
            "key": settings.GOOGLE_MAPS_API_KEY
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            data = response.json()
            
            if data["status"] == "OK" and data["results"]:
                location = data["results"][0]["geometry"]["location"]
                return {"latitude": location["lat"], "longitude": location["lng"]}
            else:
                logger.error(f"Erro ao geocodificar endereço: {data['status']}")
                return None
    
    except Exception as e:
        logger.error(f"Erro ao geocodificar endereço: {e}")
        return None

async def calculate_distance(
    origin: Tuple[float, float], 
    destination: Tuple[float, float]
) -> Optional[float]:
    """
    Calcular distância entre dois pontos geográficos.
    
    Args:
        origin: Tuple (latitude, longitude) da origem
        destination: Tuple (latitude, longitude) do destino
    
    Returns:
        Distância em quilômetros
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        logger.warning("Google Maps API Key não configurada. Cálculo de distância não será realizado.")
        return None
    
    try:
        url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        params = {
            "origins": f"{origin[0]},{origin[1]}",
            "destinations": f"{destination[0]},{destination[1]}",
            "mode": "driving",
            "key": settings.GOOGLE_MAPS_API_KEY
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            data = response.json()
            
            if (data["status"] == "OK" and 
                data["rows"] and 
                data["rows"][0]["elements"] and 
                data["rows"][0]["elements"][0]["status"] == "OK"):
                
                distance = data["rows"][0]["elements"][0]["distance"]["value"] / 1000  # Converter metros para km
                return distance
            else:
                logger.error(f"Erro ao calcular distância: {data['status']}")
                return None
    
    except Exception as e:
        logger.error(f"Erro ao calcular distância: {e}")
        return None
    
    # Adicionar esta função ao arquivo app/services/email.py

async def send_verification_email(email_to: EmailStr, name: str, token: str) -> None:
    """Enviar e-mail de verificação."""
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    await send_email(
        email_to=[email_to],
        subject="Verificação de E-mail - QuadrasApp",
        template_name="verify_email",
        template_data={"name": name, "verification_url": verification_url}
    )

async def send_password_reset_email(email_to: EmailStr, name: str, token: str) -> None:
    """Enviar e-mail de redefinição de senha."""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    # Verificar se existe o template, senão criar
    template_path = Path(__file__).parent.parent / "templates" / "email" / "password_reset.html"
    if not template_path.exists():
        # Garantir que o diretório existe
        template_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Criar template básico para redefinição de senha
        with open(template_path, "w") as f:
            f.write("""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Redefinição de Senha</title>
            </head>
            <body>
                <h1>Olá {{ name }},</h1>
                <p>Recebemos uma solicitação para redefinir sua senha no QuadrasApp.</p>
                <p>Clique no link abaixo para criar uma nova senha:</p>
                <p><a href="{{ reset_url }}">Redefinir Senha</a></p>
                <p>Este link é válido por 1 hora.</p>
                <p>Se você não solicitou a redefinição de senha, por favor ignore este e-mail.</p>
                <p>Atenciosamente,<br>Equipe QuadrasApp</p>
            </body>
            </html>
            """)
    
    await send_email(
        email_to=[email_to],
        subject="Redefinição de Senha - QuadrasApp",
        template_name="password_reset",
        template_data={"name": name, "reset_url": reset_url}
    )

async def send_booking_confirmation_email(email_to: EmailStr, booking_data: Dict[str, Any]) -> None:
    """Enviar e-mail de confirmação de agendamento."""
    template_path = Path(__file__).parent.parent / "templates" / "email" / "booking_confirmation.html"
    if not template_path.exists():
        # Garantir que o diretório existe
        template_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Criar template para confirmação de reserva
        with open(template_path, "w") as f:
            f.write("""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Confirmação de Reserva</title>
            </head>
            <body>
                <h1>Reserva Confirmada!</h1>
                <p>Sua reserva foi confirmada com sucesso.</p>
                <div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px;">
                    <p><strong>Quadra:</strong> {{ court_name }}</p>
                    <p><strong>Arena:</strong> {{ arena_name }}</p>
                    <p><strong>Data:</strong> {{ date }}</p>
                    <p><strong>Horário:</strong> {{ time }}</p>
                </div>
                <p>Guarde essas informações. Esperamos você na data e horário marcados!</p>
                <p>Atenciosamente,<br>Equipe QuadrasApp</p>
            </body>
            </html>
            """)
    
    await send_email(
        email_to=[email_to],
        subject="Confirmação de Reserva - QuadrasApp",
        template_name="booking_confirmation",
        template_data=booking_data
    )

async def send_payment_confirmation_email(email_to: EmailStr, payment_data: Dict[str, Any]) -> None:
    """Enviar e-mail de confirmação de pagamento."""
    template_path = Path(__file__).parent.parent / "templates" / "email" / "payment_confirmation.html"
    if not template_path.exists():
        # Garantir que o diretório existe
        template_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Criar template para confirmação de pagamento
        with open(template_path, "w") as f:
            f.write("""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Confirmação de Pagamento</title>
            </head>
            <body>
                <h1>Pagamento Confirmado!</h1>
                <p>Seu pagamento foi processado com sucesso.</p>
                <div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px;">
                    <p><strong>Valor:</strong> R$ {{ amount }}</p>
                    <p><strong>Método:</strong> {{ method }}</p>
                    <p><strong>Quadra:</strong> {{ court_name }}</p>
                    <p><strong>Arena:</strong> {{ arena_name }}</p>
                    <p><strong>Data:</strong> {{ date }}</p>
                    <p><strong>Horário:</strong> {{ time }}</p>
                </div>
                <p>Sua reserva está aguardando confirmação da arena. Você será notificado quando for confirmada.</p>
                <p>Atenciosamente,<br>Equipe QuadrasApp</p>
            </body>
            </html>
            """)
    
    await send_email(
        email_to=[email_to],
        subject="Confirmação de Pagamento - QuadrasApp",
        template_name="payment_confirmation",
        template_data=payment_data
    )

async def send_booking_update_email(email_to: EmailStr, update_type: str, booking_data: Dict[str, Any]) -> None:
    """Enviar e-mail de atualização de agendamento."""
    template_name = f"booking_{update_type}"
    subject = ""
    
    if update_type == "cancellation":
        subject = "Reserva Cancelada - QuadrasApp"
        template_path = Path(__file__).parent.parent / "templates" / "email" / f"{template_name}.html"
        if not template_path.exists():
            # Criar template para cancelamento
            with open(template_path, "w") as f:
                f.write("""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Reserva Cancelada</title>
                </head>
                <body>
                    <h1>Reserva Cancelada</h1>
                    <p>Informamos que sua reserva foi cancelada:</p>
                    <div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px;">
                        <p><strong>Quadra:</strong> {{ court_name }}</p>
                        <p><strong>Arena:</strong> {{ arena_name }}</p>
                        <p><strong>Data:</strong> {{ date }}</p>
                        <p><strong>Horário:</strong> {{ time }}</p>
                        {% if reason %}
                        <p><strong>Motivo:</strong> {{ reason }}</p>
                        {% endif %}
                    </div>
                    <p>Para mais informações, acesse sua área do cliente em nosso site ou aplicativo.</p>
                    <p>Atenciosamente,<br>Equipe QuadrasApp</p>
                </body>
                </html>
                """)
    elif update_type == "client_cancellation":
        subject = "Cancelamento de Reserva - QuadrasApp"
        template_path = Path(__file__).parent.parent / "templates" / "email" / f"{template_name}.html"
        if not template_path.exists():
            # Criar template para cancelamento pelo cliente
            with open(template_path, "w") as f:
                f.write("""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Cancelamento de Reserva</title>
                </head>
                <body>
                    <h1>Cancelamento de Reserva</h1>
                    <p>Um cliente cancelou uma reserva:</p>
                    <div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px;">
                        <p><strong>Cliente:</strong> {{ client_name }}</p>
                        <p><strong>Quadra:</strong> {{ court_name }}</p>
                        <p><strong>Data:</strong> {{ date }}</p>
                        <p><strong>Horário:</strong> {{ time }}</p>
                        {% if reason %}
                        <p><strong>Motivo:</strong> {{ reason }}</p>
                        {% endif %}
                    </div>
                    <p>Este horário agora está disponível para novas reservas.</p>
                    <p>Atenciosamente,<br>Equipe QuadrasApp</p>
                </body>
                </html>
                """)
    else:
        subject = "Atualização de Reserva - QuadrasApp"
    
    await send_email(
        email_to=[email_to],
        subject=subject,
        template_name=template_name,
        template_data=booking_data
    )