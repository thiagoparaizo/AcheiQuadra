# app/services/payment.py
import logging
from typing import Dict, Any, Optional
import json
import httpx
from datetime import datetime, timedelta

from app.core.config import settings

logger = logging.getLogger(__name__)

# Função para criar um pagamento no gateway
async def create_payment(
    booking_id: str,
    amount: float,
    customer_data: Dict[str, Any],
    payment_method: str
) -> Dict[str, Any]:
    """
    Criar pagamento no gateway de pagamento.
    
    Args:
        booking_id: ID do agendamento
        amount: Valor do pagamento
        customer_data: Dados do cliente
        payment_method: Método de pagamento (pix, credit_card)
    
    Returns:
        Dict com resposta do gateway de pagamento
    """
    try:
        # Simulação de integração com o gateway
        if payment_method == "pix":
            # Simular resposta do Mercado Pago para PIX
            response = {
                "id": f"PAY-{booking_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "status": "pending",
                "payment_method_id": "pix",
                "transaction_amount": amount,
                "point_of_interaction": {
                    "transaction_data": {
                        "qr_code_base64": "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",
                        "qr_code": "00020101021226860014br.gov.bcb.pix2564qrcode-pix.mercadopago.com/instore/o/v2/5dcb6005-9cc8-4b15-8b9b-10e458a9bc4052040000530398654041.005802BR5925Quadras Ltda 6011Sao Paulo62070503***6304D8D4"
                    }
                }
            }
        elif payment_method == "credit_card":
            # Simular resposta para cartão de crédito
            response = {
                "id": f"PAY-{booking_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "status": "approved",
                "payment_method_id": "credit_card",
                "transaction_amount": amount,
                "card": {
                    "last_four_digits": customer_data.get("card_token", "")[-4:] if customer_data.get("card_token") else "1234",
                    "expiration_month": 12,
                    "expiration_year": 2030
                }
            }
        else:
            # Método de pagamento não suportado
            raise ValueError(f"Método de pagamento não suportado: {payment_method}")
        
        return response
    
    except Exception as e:
        logger.error(f"Erro ao processar pagamento: {str(e)}")
        raise

# Função para processar webhook do gateway de pagamento
async def process_webhook(webhook_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Processar webhook do gateway de pagamento."""
    try:
        # Extrair dados do webhook
        # Na implementação real, verificaria a assinatura do webhook
        
        # Simular processamento do webhook
        action = webhook_data.get("action")
        data = webhook_data.get("data", {})
        
        if action == "payment.updated":
            payment_id = data.get("id")
            status = data.get("status")
            
            # Mapear status do gateway para status interno
            status_map = {
                "approved": "approved",
                "rejected": "rejected",
                "refunded": "refunded",
                "cancelled": "rejected",
                "pending": "pending"
            }
            
            internal_status = status_map.get(status, "pending")
            
            return {
                "payment_id": payment_id,
                "status": internal_status
            }
        
        return None
    
    except Exception as e:
        logger.error(f"Erro ao processar webhook: {str(e)}")
        return None