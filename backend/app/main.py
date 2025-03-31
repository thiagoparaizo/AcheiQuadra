# ARQUIVO: backend/app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi

import pydantic


from app.api.api import api_router
from app.core.config import settings
from app.db.database import connect_to_mongo, close_mongo_connection
from app.services.email import configure_email_templates

app = FastAPI(
    title="Quadras API",
    description="Sistema de gerenciamento de quadras esportivas",
    version="0.1.0",
    docs_url=None,
    redoc_url=None,
    redirect_slashes=False,
)

# Configurar CORS
if settings.ENVIRONMENT == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Em produção, use uma lista específica
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Eventos de inicialização e encerramento
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()
    configure_email_templates()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Arquivos estáticos
# app.mount("/static", StaticFiles(directory="static"), name="static")

# # Documentação Swagger customizada
# @app.get("/docs", include_in_schema=False)
# async def custom_swagger_ui_html():
#     return get_swagger_ui_html(
#         openapi_url="/openapi.json",
#         title="Quadras API - Documentação",
#         swagger_js_url="/static/swagger-ui-bundle.js",
#         swagger_css_url="/static/swagger-ui.css",
#     )

# @app.get("/openapi.json", include_in_schema=False)
# async def get_open_api_endpoint():
#     return get_openapi(
#         title="Quadras API",
#         version="0.1.0",
#         description="Sistema de gerenciamento de quadras esportivas",
#         routes=app.routes,
#     )

# Incluir rotas da API
app.include_router(api_router, prefix="/api")

# Rota raiz
@app.get("/")
async def root():
    return {"message": "Bem-vindo à API de Quadras Esportivas", "status": "online"}

# Se executado diretamente
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)