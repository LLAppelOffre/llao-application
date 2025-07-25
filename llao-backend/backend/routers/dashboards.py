import uuid
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, Field, constr
from typing import List, Dict, Optional, Union
from bson import ObjectId
from backend.auth import get_current_user, User
from fastapi.responses import JSONResponse
from backend.db import get_db_dashboards

# TODO: importer la dépendance d'authentification
# from ..dependencies import get_current_user

router = APIRouter(prefix="/dashboards", tags=["dashboards"])

# Pydantic models
class Graphique(BaseModel):
    graph_id: str
    titre: str
    instance_id: Optional[str] = None # Ajout de l'ID d'instance unique
    filtres: Dict[str, Union[list, str]] = {}
    text: Optional[str] = None  # Pour les widgets section/commentaire
    # Ajouter les props de layout
    x: Optional[int] = None
    y: Optional[int] = None
    w: Optional[int] = None
    h: Optional[int] = None
    size: Optional[str] = None
    height: Optional[str] = None
    order: Optional[int] = None

class Dashboard(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    nom: str
    graphiques: List[Graphique] = []
    filtres_globaux: Optional[Dict[str, Union[list, str]]] = {}
    date_creation: Optional[str] = None
    date_maj: Optional[str] = None

# Nouveau modèle pour la création
class DashboardCreate(BaseModel):
    nom: str
    graphiques: List[Graphique] = []

class DashboardRename(BaseModel):
    nom: constr(min_length=1, max_length=100)

# TODO: connexion MongoDB (motor ou pymongo)
from ..db import get_db
from fastapi import Request, Depends

COLLECTION = "dashboards"

def clean_filtres(filtres):
    """Nettoie les filtres pour assurer la compatibilité"""
    if not filtres:
        return {}
    
    cleaned = {}
    for key, value in filtres.items():
        if key in ['dateDebut', 'dateFin']:
            # Pour les dates, on accepte les chaînes vides ou les listes
            if isinstance(value, str):
                cleaned[key] = value
            elif isinstance(value, list):
                cleaned[key] = value[0] if value else ''
            else:
                cleaned[key] = ''
        else:
            # Pour les autres filtres, on s'assure que c'est une liste
            if isinstance(value, list):
                cleaned[key] = value
            elif isinstance(value, str):
                cleaned[key] = [value] if value else []
            else:
                cleaned[key] = []
    
    return cleaned

def dashboard_from_mongo(doc):
    if not doc:
        return None
    
    # Nettoyer les filtres de chaque graphique
    if "graphiques" in doc:
        for graphique in doc["graphiques"]:
            if "filtres" in graphique:
                graphique["filtres"] = clean_filtres(graphique["filtres"])
    
    # Nettoyer les filtres globaux
    if "filtres_globaux" in doc:
        doc["filtres_globaux"] = clean_filtres(doc["filtres_globaux"])
    
    doc["_id"] = str(doc["_id"])
    return Dashboard(**doc)

@router.get("/", response_model=List[Dashboard])
async def list_dashboards(current_user: User = Depends(get_current_user), db=Depends(get_db)):
    """Lister les dashboards de l'utilisateur connecté"""
    dashboards = []
    cursor = db[COLLECTION].find({"user_id": current_user.username})
    async for doc in cursor:
        try:
            dashboards.append(dashboard_from_mongo(doc))
        except Exception as e:
            print(f"Erreur lors du traitement du dashboard {doc.get('_id')}: {e}")
            # Skip ce dashboard en cas d'erreur
            continue
    return dashboards

@router.post("/", response_model=Dashboard)
async def create_dashboard(dashboard: DashboardCreate, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    """Créer un nouveau dashboard personnalisé"""
    data = dashboard.dict()
    data["user_id"] = current_user.username
    result = await db[COLLECTION].insert_one(data)
    data["_id"] = str(result.inserted_id)
    return Dashboard(**data)

@router.patch("/{dashboard_id}/rename", response_model=Dashboard)
async def rename_dashboard(
    dashboard_id: str,
    data: DashboardRename,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """Renomme un dashboard."""
    result = await db[COLLECTION].update_one(
        {"_id": ObjectId(dashboard_id), "user_id": current_user.username},
        {"$set": {"nom": data.nom}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Dashboard non trouvé ou vous n'avez pas la permission de le renommer.")
    
    doc = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(doc)

@router.patch("/{dashboard_id}", response_model=Dashboard)
async def update_dashboard(dashboard_id: str, dashboard: Dashboard, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    """Modifier un dashboard (ajout/suppression graphique, renommage, filtres)"""
    # Récupérer le dashboard actuel pour préserver les filtres_globaux
    current_dashboard = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not current_dashboard:
        raise HTTPException(status_code=404, detail="Dashboard non trouvé")
    
    # Préparer les données à mettre à jour
    data = dashboard.dict(by_alias=True, exclude_unset=True, exclude={"id", "user_id"})
    
    # Préserver les filtres_globaux existants
    if "filtres_globaux" in current_dashboard:
        data["filtres_globaux"] = current_dashboard["filtres_globaux"]
    
    result = await db[COLLECTION].update_one(
        {"_id": ObjectId(dashboard_id), "user_id": current_user.username}, 
        {"$set": data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Dashboard non trouvé")
    doc = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(doc)

@router.delete("/{dashboard_id}")
async def delete_dashboard(dashboard_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    """Supprimer un dashboard"""
    result = await db[COLLECTION].delete_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dashboard non trouvé")
    return {"ok": True}

@router.post("/{dashboard_id}/add_graphique", response_model=Dashboard)
async def add_graphique_to_dashboard(
    dashboard_id: str,
    graphique: Graphique = Body(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """Ajouter un graphique (avec filtres) à un dashboard existant"""
    dashboard = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard non trouvé")
    graphiques = dashboard.get("graphiques", [])
    graphique_data = graphique.dict()
    graphique_data['instance_id'] = str(uuid.uuid4()) # Attribuer un ID unique
    # Nettoyer les filtres avant sauvegarde
    graphique_data["filtres"] = clean_filtres(graphique_data.get("filtres", {}))
    graphiques.append(graphique_data)
    
    # Préserver les filtres_globaux existants
    update_data = {"graphiques": graphiques}
    if "filtres_globaux" in dashboard:
        update_data["filtres_globaux"] = dashboard["filtres_globaux"]
    
    await db[COLLECTION].update_one(
        {"_id": ObjectId(dashboard_id)},
        {"$set": update_data}
    )
    dashboard = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(dashboard)

@router.delete("/{dashboard_id}/remove_graphique/{instance_id}", response_model=Dashboard)
async def remove_graphique_from_dashboard(
    dashboard_id: str,
    instance_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """Supprimer un graphique d'un dashboard existant en utilisant son instance_id."""
    dashboard = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard non trouvé")
    
    graphiques = dashboard.get("graphiques", [])
    
    # S'assurer que les anciens widgets ont un instance_id pour éviter les erreurs
    for g in graphiques:
        if 'instance_id' not in g or g['instance_id'] is None:
            g['instance_id'] = str(uuid.uuid4())

    new_graphiques = [g for g in graphiques if g.get("instance_id") != instance_id]
    
    if len(new_graphiques) == len(graphiques):
        raise HTTPException(status_code=404, detail="Graphique non trouvé dans ce dashboard")
    
    update_data = {"graphiques": new_graphiques}
    if "filtres_globaux" in dashboard:
        update_data["filtres_globaux"] = dashboard["filtres_globaux"]
    
    await db[COLLECTION].update_one(
        {"_id": ObjectId(dashboard_id)},
        {"$set": update_data}
    )
    dashboard = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(dashboard)

@router.get("/{dashboard_id}", response_model=Dashboard)
async def get_dashboard(dashboard_id: str, current_user: User = Depends(get_current_user), db=Depends(get_db)):
    """Récupérer un dashboard unique par son id"""
    doc = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not doc:
        raise HTTPException(status_code=404, detail="Dashboard non trouvé")
    return dashboard_from_mongo(doc)

@router.post("/{dashboard_id}/update_graphique_filtres")
async def update_graphique_filtres(
    dashboard_id: str,
    data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """Met à jour les filtres d'un graphique dans un dashboard"""
    graph_id = data.get("graph_id")
    filtres = data.get("filtres")
    if not graph_id or filtres is None:
        raise HTTPException(status_code=400, detail="graph_id et filtres requis")
    dashboard = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard non trouvé")
    graphiques = dashboard.get("graphiques", [])
    updated = False
    for g in graphiques:
        if g.get("graph_id") == graph_id:
            g["filtres"] = clean_filtres(filtres)
            updated = True
    if not updated:
        raise HTTPException(status_code=404, detail="Graphique non trouvé dans le dashboard")
    await db[COLLECTION].update_one({"_id": ObjectId(dashboard_id)}, {"$set": {"graphiques": graphiques}})
    doc = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(doc)

@router.post("/{dashboard_id}/update_global_filtres")
async def update_global_filtres(
    dashboard_id: str,
    data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """Met à jour les filtres globaux d'un dashboard"""
    filtres = data.get("filtres")
    if filtres is None:
        raise HTTPException(status_code=400, detail="filtres requis")
    
    dashboard = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard non trouvé")
    
    # Nettoyer les filtres globaux
    filtres_globaux = clean_filtres(filtres)
    
    await db[COLLECTION].update_one(
        {"_id": ObjectId(dashboard_id)},
        {"$set": {"filtres_globaux": filtres_globaux}}
    )
    
    doc = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(doc)

@router.post("/{dashboard_id}/update_graphique_titre")
async def update_graphique_titre(
    dashboard_id: str,
    data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """Met à jour le titre personnalisé d'un graphique dans un dashboard"""
    graph_id = data.get("graph_id")
    customTitle = data.get("customTitle")
    if not graph_id or customTitle is None:
        raise HTTPException(status_code=400, detail="graph_id et customTitle requis")
    dashboard = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard non trouvé")
    graphiques = dashboard.get("graphiques", [])
    updated = False
    for g in graphiques:
        if g.get("graph_id") == graph_id:
            g["customTitle"] = customTitle
            updated = True
    if not updated:
        raise HTTPException(status_code=404, detail="Graphique non trouvé dans le dashboard")
    await db[COLLECTION].update_one({"_id": ObjectId(dashboard_id)}, {"$set": {"graphiques": graphiques}})
    doc = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(doc)

@router.post("/{dashboard_id}/update_graphique_texte")
async def update_graphique_texte(
    dashboard_id: str,
    data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """Met à jour le texte d'un widget section dans un dashboard"""
    graph_id = data.get("graph_id")
    text = data.get("text")
    if not graph_id or text is None:
        raise HTTPException(status_code=400, detail="graph_id et text requis")
    dashboard = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard non trouvé")
    graphiques = dashboard.get("graphiques", [])
    updated = False
    for g in graphiques:
        if g.get("graph_id") == graph_id:
            g["text"] = text
            updated = True
    if not updated:
        raise HTTPException(status_code=404, detail="Widget section non trouvé dans le dashboard")
    await db[COLLECTION].update_one({"_id": ObjectId(dashboard_id)}, {"$set": {"graphiques": graphiques}})
    doc = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(doc) 

class LayoutItem(BaseModel):
    instance_id: str
    x: int
    y: int
    w: int
    h: int

@router.post("/{dashboard_id}/layout")
async def update_dashboard_layout(
    dashboard_id: str,
    layout: List[LayoutItem],
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """Met à jour la disposition (x, y, w, h) des graphiques d'un dashboard."""
    dashboard = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard non trouvé")

    graphiques = dashboard.get("graphiques", [])
    
    # Assigner un instance_id aux anciens widgets qui n'en ont pas
    for g in graphiques:
        if 'instance_id' not in g or g['instance_id'] is None:
            g['instance_id'] = str(uuid.uuid4())

    graphiques_dict = {g['instance_id']: g for g in graphiques}

    for item in layout:
        if item.instance_id in graphiques_dict:
            graphiques_dict[item.instance_id]['x'] = item.x
            graphiques_dict[item.instance_id]['y'] = item.y
            graphiques_dict[item.instance_id]['w'] = item.w
            graphiques_dict[item.instance_id]['h'] = item.h

    updated_graphiques = list(graphiques_dict.values())

    await db[COLLECTION].update_one(
        {"_id": ObjectId(dashboard_id)},
        {"$set": {"graphiques": updated_graphiques}}
    )

    doc = await db[COLLECTION].find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(doc) 