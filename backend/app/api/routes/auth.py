# app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError
import jwt
from pydantic import EmailStr, ValidationError
from bson.objectid import ObjectId

from app.core.security import create_access_token, get_password_hash, verify_password
from app.core.config import settings
from app.db.database import db
from app.models.user import User, UserCreate, Token, TokenPayload
from app.services.email import send_verification_email, send_password_reset_email

from pydantic import BaseModel

router = APIRouter()

class EmailRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    password: str

class GoogleToken(BaseModel):
    token: str

@router.post("/auth/register", response_model=User)
async def register_user(user_data: UserCreate, background_tasks: BackgroundTasks):
    """Registrar um novo usuário"""
    # Verificar se usuário/email já existe
    existing_user = await db.db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já está em uso."
        )
    
    existing_username = await db.db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome de usuário já está em uso."
        )
    
    existing_cpf = await db.db.users.find_one({"cpf": user_data.cpf})
    if existing_cpf:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF já está cadastrado."
        )
    
    # Criar hash da senha
    password_hash = get_password_hash(user_data.password)
    
    # Criar usuário
    new_user = {
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": password_hash,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "phone": user_data.phone,
        "cpf": user_data.cpf,
        "birth_date": user_data.birth_date,
        "role": user_data.role,
        "is_active": False,  # Usuário precisa confirmar email
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.db.users.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    
    # Gerar token de verificação (válido por 24 horas)
    verification_token = create_access_token(
        subject=new_user["_id"],
        expires_delta=timedelta(hours=24)
    )
    
    # Enviar email de verificação em background
    background_tasks.add_task(
        send_verification_email,
        email_to=user_data.email,
        name=user_data.first_name,
        token=verification_token
    )
    
    return User.from_mongo(new_user)

@router.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login com email/senha"""
    user_doc = await db.db.users.find_one({"email": form_data.username})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user_doc.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário não está ativo. Por favor, verifique seu email."
        )
    
    # Criar token de acesso
    access_token = create_access_token(subject=str(user_doc["_id"]))
    
    # Usar from_mongo para converter o documento
    user = User.from_mongo(user_doc)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/auth/google-login", response_model=Token)
async def google_login(token_data: GoogleToken):
    """Login com Google"""
    try:
        # Aqui você implementaria a validação do token do Google
        # usando a biblioteca google-auth-oauthlib
        
        # Para fins de exemplo, vamos simular que decodificamos o token
        # e obtivemos informações do usuário
        google_info = {
            "email": "user@example.com",
            "name": "John Doe",
            "sub": "google-user-id-123"
        }
        
        # Verificar se o usuário já existe
        user = await db.db.users.find_one({"email": google_info["email"]})
        
        if not user:
            # Criar novo usuário
            names = google_info["name"].split(" ", 1)
            first_name = names[0]
            last_name = names[1] if len(names) > 1 else ""
            
            new_user = {
                "username": google_info["email"].split("@")[0],
                "email": google_info["email"],
                "password_hash": None,  # Usuário Google não tem senha
                "first_name": first_name,
                "last_name": last_name,
                "phone": "",
                "cpf": "",  # Será necessário completar o perfil depois
                "birth_date": None,
                "role": "customer",
                "google_id": google_info["sub"],
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await db.db.users.insert_one(new_user)
            user_id = str(result.inserted_id)
        else:
            user_id = str(user["_id"])
            
            # Atualizar google_id se necessário
            if not user.get("google_id"):
                await db.db.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {"google_id": google_info["sub"], "updated_at": datetime.utcnow()}}
                )
        
        # Obter usuário atualizado
        user_doc = await db.db.users.find_one({"_id": ObjectId(user_id)})
        
        # Criar token de acesso
        access_token = create_access_token(subject=user_id)
        
        # Usar from_mongo para converter o documento
        user = User.from_mongo(user_doc)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Não foi possível autenticar com Google: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/auth/verify-email/{token}")
async def verify_email(token: str):
    """Verificar email com token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        token_data = TokenPayload(**payload)
        user_id = token_data.sub
        
        # Verificar se o token expirou
        if datetime.fromtimestamp(token_data.exp) < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de verificação expirado"
            )
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de verificação inválido"
        )
    
    # Ativar usuário
    result = await db.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": True, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    return {"message": "Email verificado com sucesso. Agora você pode fazer login."}

@router.post("/auth/forgot-password")
async def forgot_password(email_data: EmailRequest, background_tasks: BackgroundTasks):
    """Solicitar recuperação de senha"""
    user = await db.db.users.find_one({"email": email_data.email})
    
    # Mesmo se o usuário não for encontrado, retornamos uma mensagem de sucesso
    # por questões de segurança (não revelar quais emails estão cadastrados)
    if not user:
        return {"message": "Se o email estiver cadastrado, você receberá um link para redefinir sua senha."}
    
    # Gerar token de recuperação (válido por 1 hora)
    reset_token = create_access_token(
        subject=str(user["_id"]),
        expires_delta=timedelta(hours=1)
    )
    
    # Enviar email de recuperação em background
    background_tasks.add_task(
        send_password_reset_email,
        email_to=email_data.email,
        name=user["first_name"],
        token=reset_token
    )
    
    return {"message": "Se o email estiver cadastrado, você receberá um link para redefinir sua senha."}

@router.post("/auth/reset-password/{token}")
async def reset_password(token: str, password_data: PasswordReset):
    """Redefinir senha com token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        token_data = TokenPayload(**payload)
        user_id = token_data.sub
        
        # Verificar se o token expirou
        if datetime.fromtimestamp(token_data.exp) < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de redefinição expirado"
            )
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de redefinição inválido"
        )
    
    # Atualizar senha
    password_hash = get_password_hash(password_data.password)
    
    result = await db.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password_hash": password_hash, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    return {"message": "Senha redefinida com sucesso. Agora você pode fazer login com sua nova senha."}


@router.post("/auth/loginTeste", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login com email/senha"""
    user_doc = await db.db.users.find_one({"email": form_data.username})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user_doc.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário não está ativo. Por favor, verifique seu email."
        )
    
    # Criar token de acesso
    access_token = create_access_token(subject=str(user_doc["_id"]))
    
    # Usar from_mongo para converter o documento
    user = User.from_mongo(user_doc)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }