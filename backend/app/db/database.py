# ARQUIVO: backend/app/db/database.py
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    """Conectar ao MongoDB."""
    logger.info("Conectando ao MongoDB...")
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.db = db.client[settings.MONGODB_DB]
    logger.info("Conectado ao MongoDB.")

async def close_mongo_connection():
    """Fechar conexão com MongoDB."""
    logger.info("Fechando conexão com MongoDB...")
    if db.client:
        db.client.close()
    logger.info("Conexão com MongoDB fechada.")


