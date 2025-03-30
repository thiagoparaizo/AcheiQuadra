# app/core/constants.py
from enum import Enum

# Duração do token JWT em minutos
ACCESS_TOKEN_EXPIRATION = 60 * 24 * 7  # 7 dias

# Estados brasileiros
BRAZILIAN_STATES = [
    "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT",
    "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"
]

# Tipos de quadras esportivas
class CourtTypeEnum(str, Enum):
    SOCCER = "soccer"  # Futebol Campo
    FUTSAL = "futsal"  # Futsal
    SOCIETY = "society"  # Society
    TENNIS = "tennis"  # Tênis
    BEACH_TENNIS = "beach_tennis"  # Beach Tennis
    VOLLEYBALL = "volleyball"  # Vôlei
    FUTEVOLEI = "futevolei"  # Vôlei
    BEACH_VOLLEYBALL = "beach_volleyball"  # Vôlei de Praia
    BASKETBALL = "basketball"  # Basquete
    PADDLE = "paddle"  # Padel
    SQUASH = "squash"  # Squash
    RACQUETBALL = "racquetball"  # Raquetebol
    BADMINTON = "badminton"  # Badminton
    MULTISPORT = "multisport"  # Poliesportiva
    OTHER = "other"  # Outros

# Tipos de quadras em português para exibição
COURT_TYPE_DISPLAY = {
    "soccer": "Futebol Campo",
    "futsal": "Futsal",
    "society": "Society",
    "tennis": "Tênis",
    "beach_tennis": "Beach Tennis",
    "futevolei": "Futevolei",
    "volleyball": "Vôlei",
    "beach_volleyball": "Vôlei de Praia",
    "basketball": "Basquete",
    "paddle": "Padel",
    "squash": "Squash",
    "racquetball": "Raquetebol",
    "badminton": "Badminton",
    "multisport": "Poliesportiva",
    "other": "Outros"
}

# Status de reservas
class BookingStatusEnum(str, Enum):
    PENDING = "pending"  # Aguardando confirmação da arena
    WAITING_PAYMENT = "waiting_payment"  # Aguardando pagamento
    CONFIRMED = "confirmed"  # Confirmado
    CANCELLED = "cancelled"  # Cancelado
    COMPLETED = "completed"  # Finalizado

# Status de reservas em português para exibição
BOOKING_STATUS_DISPLAY = {
    "pending": "Aguardando confirmação",
    "waiting_payment": "Aguardando pagamento",
    "confirmed": "Confirmado",
    "cancelled": "Cancelado",
    "completed": "Finalizado"
}

# Tipos de reservas
class BookingTypeEnum(str, Enum):
    SINGLE = "single"  # Aluguel avulso
    MONTHLY = "monthly"  # Aluguel mensal

# Tipos de reservas em português para exibição
BOOKING_TYPE_DISPLAY = {
    "single": "Avulso",
    "monthly": "Mensal"
}

# Status de pagamentos
class PaymentStatusEnum(str, Enum):
    PENDING = "pending"  # Pendente
    APPROVED = "approved"  # Aprovado
    REJECTED = "rejected"  # Rejeitado
    REFUNDED = "refunded"  # Reembolsado

# Status de pagamentos em português para exibição
PAYMENT_STATUS_DISPLAY = {
    "pending": "Pendente",
    "approved": "Aprovado",
    "rejected": "Rejeitado",
    "refunded": "Reembolsado"
}

# Métodos de pagamento
class PaymentMethodEnum(str, Enum):
    PIX = "pix"  # PIX
    CREDIT_CARD = "credit_card"  # Cartão de crédito
    ON_SITE = "on_site"  # No local

# Métodos de pagamento em português para exibição
PAYMENT_METHOD_DISPLAY = {
    "pix": "PIX",
    "credit_card": "Cartão de Crédito",
    "on_site": "No local"
}

# Papéis de usuários
class UserRoleEnum(str, Enum):
    ADMIN = "admin"  # Administrador
    ARENA_OWNER = "arena_owner"  # Dono de arena
    CUSTOMER = "customer"  # Cliente

# Papéis de usuários em português para exibição
USER_ROLE_DISPLAY = {
    "admin": "Administrador",
    "arena_owner": "Proprietário de Arena",
    "customer": "Cliente"
}

# Categorias de amenidades/comodidades
AMENITY_CATEGORIES = {
    "structure": "Estrutura",
    "services": "Serviços",
    "comfort": "Conforto",
    "security": "Segurança",
    "entertainment": "Entretenimento",
    "accessibility": "Acessibilidade"
}

# Lista de amenidades/comodidades por categoria
AMENITIES = {
    "structure": [
        {"id": "parking", "name": "Estacionamento"},
        {"id": "locker_room", "name": "Vestiário"},
        {"id": "shower", "name": "Chuveiro"},
        {"id": "lighting", "name": "Iluminação"},
        {"id": "covered", "name": "Quadra Coberta"},
        {"id": "outdoor", "name": "Quadra ao Ar Livre"},
        {"id": "heating", "name": "Aquecimento"}
    ],
    "services": [
        {"id": "equipment_rental", "name": "Aluguel de Equipamentos"},
        {"id": "instructor", "name": "Instrutor/Professor"},
        {"id": "snack_bar", "name": "Lanchonete"},
        {"id": "bar", "name": "Bar"},
        {"id": "restaurant", "name": "Restaurante"},
        {"id": "sports_shop", "name": "Loja de Artigos Esportivos"}
    ],
    "comfort": [
        {"id": "wifi", "name": "Wi-Fi"},
        {"id": "air_conditioning", "name": "Ar Condicionado"},
        {"id": "waiting_area", "name": "Área de Espera"},
        {"id": "water_fountain", "name": "Bebedouro"}
    ],
    "security": [
        {"id": "security_cameras", "name": "Câmeras de Segurança"},
        {"id": "security_guard", "name": "Segurança"},
        {"id": "first_aid", "name": "Primeiros Socorros"}
    ],
    "entertainment": [
        {"id": "tv", "name": "TV"},
        {"id": "game_transmission", "name": "Transmissão de Jogos"},
        {"id": "music", "name": "Música"},
        {"id": "kids_area", "name": "Área Infantil"}
    ],
    "accessibility": [
        {"id": "wheelchair_access", "name": "Acesso para Cadeirantes"},
        {"id": "accessible_bathroom", "name": "Banheiro Acessível"},
        {"id": "pet_friendly", "name": "Pet Friendly"}
    ]
}

# Dias da semana
WEEKDAYS = [
    {"id": 0, "name": "Segunda-feira", "short": "Seg"},
    {"id": 1, "name": "Terça-feira", "short": "Ter"},
    {"id": 2, "name": "Quarta-feira", "short": "Qua"},
    {"id": 3, "name": "Quinta-feira", "short": "Qui"},
    {"id": 4, "name": "Sexta-feira", "short": "Sex"},
    {"id": 5, "name": "Sábado", "short": "Sáb"},
    {"id": 6, "name": "Domingo", "short": "Dom"}
]

# Mensagens padrão
DEFAULT_MESSAGES = {
    "booking_created": "Sua reserva foi criada com sucesso. Aguarde a confirmação da arena.",
    "booking_confirmed": "Sua reserva foi confirmada. Esperamos você na data e horário marcados!",
    "booking_cancelled": "Sua reserva foi cancelada.",
    "payment_required": "É necessário realizar o pagamento para confirmar sua reserva.",
    "payment_success": "Pagamento realizado com sucesso!",
    "payment_failed": "Ocorreu um erro ao processar o pagamento. Por favor, tente novamente."
}

# Configurações de paginação
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# URLs de redes sociais
SOCIAL_MEDIA_URLS = {
    "facebook": "https://facebook.com/quadrasapp",
    "instagram": "https://instagram.com/quadrasapp",
    "twitter": "https://twitter.com/quadrasapp"
}

# Configurações de upload de arquivos
ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
MAX_IMAGE_SIZE_MB = 5  # tamanho máximo de imagem em MB
MAX_IMAGES_PER_ARENA = 10  # número máximo de imagens por arena
MAX_IMAGES_PER_COURT = 5  # número máximo de imagens por quadra

# Tempo mínimo de antecedência para reservas (em horas)
MIN_BOOKING_ADVANCE_HOURS = 2

# Tempo máximo de antecedência para reservas (em dias)
MAX_BOOKING_ADVANCE_DAYS = 60

# Número máximo de reservas ativas por usuário
MAX_ACTIVE_BOOKINGS_PER_USER = 10