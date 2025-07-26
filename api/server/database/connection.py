import os
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

class DatabaseManager:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database = None

    async def connect(self):
        """Connexion à MongoDB"""
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        database_name = os.getenv("MONGODB_DATABASE", "llao_db")
        
        self.client = AsyncIOMotorClient(mongodb_url)
        self.database = self.client[database_name]
        
        # Test de connexion
        await self.client.admin.command('ping')
        print(f"✅ Connecté à MongoDB: {database_name}")

    async def disconnect(self):
        """Déconnexion de MongoDB"""
        if self.client:
            self.client.close()
            print("✅ Déconnecté de MongoDB")

    def get_database(self):
        """Récupère la base de données"""
        return self.database

    def get_collection(self, collection_name: str):
        """Récupère une collection"""
        return self.database[collection_name]

# Instance globale
db_manager = DatabaseManager()

async def get_db():
    """Dependency pour FastAPI"""
    return db_manager.get_database()

async def get_tenders_collection():
    """Collection des appels d'offres"""
    return db_manager.get_collection("appels_offres")

async def get_dashboards_collection():
    """Collection des tableaux de bord"""
    return db_manager.get_collection("dashboards")

async def get_users_collection():
    """Collection des utilisateurs"""
    return db_manager.get_collection("users") 