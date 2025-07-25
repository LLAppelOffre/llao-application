import os
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Request, Depends
from functools import lru_cache
from dotenv import load_dotenv

# Charger l'URI MongoDB depuis la variable d'environnement
MONGODB_URI = os.getenv("MONGODB_URI")
# Nom de la base (à adapter si besoin)
MONGODB_DB = os.getenv("MONGODB_DB", "llao_db")

# DEBUG: Afficher l'URI et la base utilisés
print("DEBUG MONGODB_URI:", MONGODB_URI)
print("DEBUG MONGODB_DB:", MONGODB_DB)

# Charge le .env du dossier courant (dashboard_V2)
load_dotenv(dotenv_path=".env")

@lru_cache
def get_client():
    if not MONGODB_URI:
        raise RuntimeError("MONGODB_URI non défini dans les variables d'environnement")
    return AsyncIOMotorClient(MONGODB_URI)

def get_db():
    client = get_client()
    return client[MONGODB_DB]

def get_db_dashboards():
    client = get_client()
    return client["llao_db"]

def get_db_appels_offres():
    client = get_client()
    return client["document_intelligence"] 