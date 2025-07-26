from dotenv import load_dotenv
load_dotenv(dotenv_path=".env")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.server.api import dashboards, tenders
from api.server.auth import router as auth_router

app = FastAPI(
    title="LLAO API",
    description="API pour la gestion et l'analyse d'appels d'offres",
    version="1.0.0"
)

# Ajout du middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Autorise le frontend React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(dashboards.router, prefix="/api")
app.include_router(tenders.router, prefix="/api")
app.include_router(auth_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "LLAO API - Gestion des Appels d'Offres"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "llao-api"} 