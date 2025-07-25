from dotenv import load_dotenv
load_dotenv(dotenv_path=".env")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import dashboards
from backend.routers import appels_offres
from backend.auth import router as auth_router

app = FastAPI()

# Ajout du middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Autorise le frontend React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboards.router)
app.include_router(appels_offres.router)
app.include_router(auth_router) 