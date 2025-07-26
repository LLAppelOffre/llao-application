from pydantic import BaseModel, Field, constr
from typing import List, Dict, Optional, Union
from datetime import datetime
from bson import ObjectId

# Modèles pour les Appels d'Offres
class TenderBase(BaseModel):
    nom_ao: str
    categorie: str
    pole: str
    statut: str
    date_emission: str
    date_reponse: Optional[str] = None
    prix_client: Optional[float] = None
    prix_gagnant: Optional[float] = None
    note_technique: Optional[float] = None
    note_prix: Optional[float] = None
    score_client: Optional[float] = None
    score_gagnant: Optional[float] = None
    delai_jours: Optional[int] = None
    commentaires_ia: Optional[str] = None
    raison_perte: Optional[str] = None

class TenderCreate(TenderBase):
    pass

class Tender(TenderBase):
    id: Optional[str] = Field(None, alias="_id")
    date_creation: Optional[datetime] = None
    date_maj: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

# Modèles pour les Tableaux de Bord
class Chart(BaseModel):
    chart_id: str
    titre: str
    instance_id: Optional[str] = None
    filtres: Dict[str, Union[list, str]] = {}
    text: Optional[str] = None
    x: Optional[int] = None
    y: Optional[int] = None
    w: Optional[int] = None
    h: Optional[int] = None
    size: Optional[str] = None
    height: Optional[str] = None
    order: Optional[int] = None

class DashboardBase(BaseModel):
    nom: str
    graphiques: List[Chart] = []
    filtres_globaux: Optional[Dict[str, Union[list, str]]] = {}

class DashboardCreate(DashboardBase):
    pass

class Dashboard(DashboardBase):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    date_creation: Optional[datetime] = None
    date_maj: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

# Modèles pour les Utilisateurs
class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    role: str = "user"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: Optional[str] = Field(None, alias="_id")
    disabled: bool = False
    date_creation: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

class UserInDB(User):
    hashed_password: str

# Modèles pour les Favoris
class Favorite(BaseModel):
    user_id: str
    tender_id: str
    date_creation: Optional[datetime] = None

    class Config:
        json_encoders = {ObjectId: str}

# Modèles pour les Réponses API
class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict] = None

class PaginatedResponse(BaseModel):
    items: List[Dict]
    total: int
    page: int
    size: int
    pages: int 