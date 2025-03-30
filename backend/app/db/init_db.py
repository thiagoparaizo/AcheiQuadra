# ARQUIVO: backend/app/db/init_db.py
import logging
import asyncio
from app.db.database import db
from app.core.security import get_password_hash
from app.models.user import UserRole
from datetime import datetime

logger = logging.getLogger(__name__)

async def init_db():
    """Inicializar o banco de dados com dados básicos."""
    # Verificar se já existe um usuário admin
    admin_exists = await db.db.users.find_one({"role": UserRole.ADMIN})
    
    if not admin_exists:
        # Criar usuário admin
        admin_user = {
            "username": "admin",
            "email": "admin@quadras.com",
            "password_hash": get_password_hash("admin123"),  # Mudar em produção!
            "first_name": "Admin",
            "last_name": "Sistema",
            "phone": "11999999999",
            "cpf": "99999999999",
            "birth_date": datetime.now(),
            "role": UserRole.ADMIN,
            "is_active": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        await db.db.users.insert_one(admin_user)
        logger.info("Usuário admin criado com sucesso.")
    
    # Criar índices para melhorar a performance das consultas
    
    # Índice para busca de usuários por email/username (login)
    await db.db.users.create_index("email", unique=True)
    await db.db.users.create_index("username", unique=True)
    await db.db.users.create_index("cpf", unique=True)
    
    # Índice para busca geoespacial de arenas
    await db.db.arenas.create_index([("address.coordinates", "2dsphere")])
    
    # Índices para agendamentos
    await db.db.bookings.create_index("user_id")
    await db.db.bookings.create_index("arena_id")
    await db.db.bookings.create_index("court_id")
    await db.db.bookings.create_index([
        ("court_id", 1), 
        ("status", 1), 
        ("timeslot.date", 1)
    ])
    
    # Índices para avaliações
    await db.db.reviews.create_index([("arena_id", 1), ("rating", -1)])
    
    logger.info("Índices do banco de dados criados com sucesso.")

# if __name__ == "__main__":
#     # Executar inicialização independentemente
#     asyncio.run(init_db())