import uuid
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, Field, constr
from typing import List, Dict, Optional, Union
from bson import ObjectId
from datetime import datetime

from api.server.database.models import User, Dashboard, DashboardCreate, Chart
from api.server.database.connection import get_dashboards_collection
from api.server.auth.jwt_handler import get_current_user
from api.server.utils.data_helpers import clean_filtres

router = APIRouter(prefix="/dashboards", tags=["dashboards"])

class DashboardRename(BaseModel):
    nom: constr(min_length=1, max_length=100)

class LayoutItem(BaseModel):
    instance_id: str
    x: int
    y: int
    w: int
    h: int

def dashboard_from_mongo(doc):
    """Convertit un document MongoDB en objet Dashboard"""
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

@router.get("/")
async def list_dashboards(
    current_user: User = Depends(get_current_user), 
    db=Depends(get_dashboards_collection)
):
    """Lister les tableaux de bord de l'utilisateur connecté"""
    dashboards = []
    cursor = db.find({"user_id": current_user.username})
    async for doc in cursor:
        try:
            dashboards.append(dashboard_from_mongo(doc))
        except Exception as e:
            print(f"Erreur lors du traitement du dashboard {doc.get('_id')}: {e}")
            continue
    return dashboards

@router.post("/")
async def create_dashboard(
    dashboard: DashboardCreate, 
    current_user: User = Depends(get_current_user), 
    db=Depends(get_dashboards_collection)
):
    """Créer un nouveau tableau de bord personnalisé"""
    data = dashboard.dict()
    data["user_id"] = current_user.username
    data["date_creation"] = datetime.utcnow()
    data["date_maj"] = datetime.utcnow()
    
    result = await db.insert_one(data)
    data["_id"] = str(result.inserted_id)
    return Dashboard(**data)

@router.patch("/{dashboard_id}/rename")
async def rename_dashboard(
    dashboard_id: str,
    data: DashboardRename,
    current_user: User = Depends(get_current_user),
    db=Depends(get_dashboards_collection)
):
    """Renomme un tableau de bord"""
    result = await db.update_one(
        {"_id": ObjectId(dashboard_id), "user_id": current_user.username},
        {"$set": {"nom": data.nom, "date_maj": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tableau de bord non trouvé ou vous n'avez pas la permission de le renommer.")
    
    doc = await db.find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(doc)

@router.patch("/{dashboard_id}")
async def update_dashboard(
    dashboard_id: str, 
    dashboard: Dashboard, 
    current_user: User = Depends(get_current_user), 
    db=Depends(get_dashboards_collection)
):
    """Modifier un tableau de bord"""
    current_dashboard = await db.find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not current_dashboard:
        raise HTTPException(status_code=404, detail="Tableau de bord non trouvé")
    
    data = dashboard.dict(by_alias=True, exclude_unset=True, exclude={"id", "user_id"})
    data["date_maj"] = datetime.utcnow()
    
    # Préserver les filtres_globaux existants
    if "filtres_globaux" in current_dashboard:
        data["filtres_globaux"] = current_dashboard["filtres_globaux"]
    
    result = await db.update_one(
        {"_id": ObjectId(dashboard_id), "user_id": current_user.username}, 
        {"$set": data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tableau de bord non trouvé")
    
    doc = await db.find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(doc)

@router.delete("/{dashboard_id}")
async def delete_dashboard(
    dashboard_id: str, 
    current_user: User = Depends(get_current_user), 
    db=Depends(get_dashboards_collection)
):
    """Supprimer un tableau de bord"""
    result = await db.delete_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tableau de bord non trouvé")
    return {"success": True, "message": "Tableau de bord supprimé"}

@router.post("/{dashboard_id}/add-chart")
async def add_chart_to_dashboard(
    dashboard_id: str,
    chart: Chart = Body(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_dashboards_collection)
):
    """Ajouter un graphique à un tableau de bord existant"""
    dashboard = await db.find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Tableau de bord non trouvé")
    
    charts = dashboard.get("graphiques", [])
    chart_data = chart.dict()
    chart_data['instance_id'] = str(uuid.uuid4())
    chart_data["filtres"] = clean_filtres(chart_data.get("filtres", {}))
    charts.append(chart_data)
    
    update_data = {"graphiques": charts, "date_maj": datetime.utcnow()}
    if "filtres_globaux" in dashboard:
        update_data["filtres_globaux"] = dashboard["filtres_globaux"]
    
    await db.update_one(
        {"_id": ObjectId(dashboard_id)},
        {"$set": update_data}
    )
    dashboard = await db.find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(dashboard)

@router.delete("/{dashboard_id}/remove-chart/{instance_id}")
async def remove_chart_from_dashboard(
    dashboard_id: str,
    instance_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_dashboards_collection)
):
    """Supprimer un graphique d'un tableau de bord"""
    dashboard = await db.find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Tableau de bord non trouvé")
    
    charts = dashboard.get("graphiques", [])
    
    # S'assurer que les anciens widgets ont un instance_id
    for c in charts:
        if 'instance_id' not in c or c['instance_id'] is None:
            c['instance_id'] = str(uuid.uuid4())

    new_charts = [c for c in charts if c.get("instance_id") != instance_id]
    
    if len(new_charts) == len(charts):
        raise HTTPException(status_code=404, detail="Graphique non trouvé dans ce tableau de bord")
    
    update_data = {"graphiques": new_charts, "date_maj": datetime.utcnow()}
    if "filtres_globaux" in dashboard:
        update_data["filtres_globaux"] = dashboard["filtres_globaux"]
    
    await db.update_one(
        {"_id": ObjectId(dashboard_id)},
        {"$set": update_data}
    )
    dashboard = await db.find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(dashboard)

@router.get("/{dashboard_id}")
async def get_dashboard(
    dashboard_id: str, 
    current_user: User = Depends(get_current_user), 
    db=Depends(get_dashboards_collection)
):
    """Récupérer un tableau de bord unique par son id"""
    doc = await db.find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not doc:
        raise HTTPException(status_code=404, detail="Tableau de bord non trouvé")
    return dashboard_from_mongo(doc)

@router.post("/{dashboard_id}/update-chart-filters")
async def update_chart_filters(
    dashboard_id: str,
    data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_dashboards_collection)
):
    """Met à jour les filtres d'un graphique dans un tableau de bord"""
    chart_id = data.get("chart_id")
    filtres = data.get("filtres")
    if not chart_id or filtres is None:
        raise HTTPException(status_code=400, detail="chart_id et filtres requis")
    
    dashboard = await db.find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Tableau de bord non trouvé")
    
    charts = dashboard.get("graphiques", [])
    updated = False
    for c in charts:
        if c.get("chart_id") == chart_id:
            c["filtres"] = clean_filtres(filtres)
            updated = True
    
    if not updated:
        raise HTTPException(status_code=404, detail="Graphique non trouvé dans le tableau de bord")
    
    await db.update_one(
        {"_id": ObjectId(dashboard_id)}, 
        {"$set": {"graphiques": charts, "date_maj": datetime.utcnow()}}
    )
    doc = await db.find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(doc)

@router.post("/{dashboard_id}/update-global-filters")
async def update_global_filters(
    dashboard_id: str,
    data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_dashboards_collection)
):
    """Met à jour les filtres globaux d'un tableau de bord"""
    filtres = data.get("filtres")
    if filtres is None:
        raise HTTPException(status_code=400, detail="filtres requis")
    
    dashboard = await db.find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Tableau de bord non trouvé")
    
    filtres_globaux = clean_filtres(filtres)
    
    await db.update_one(
        {"_id": ObjectId(dashboard_id)},
        {"$set": {"filtres_globaux": filtres_globaux, "date_maj": datetime.utcnow()}}
    )
    
    doc = await db.find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(doc)

@router.post("/{dashboard_id}/update-chart-title")
async def update_chart_title(
    dashboard_id: str,
    data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_dashboards_collection)
):
    """Met à jour le titre personnalisé d'un graphique"""
    chart_id = data.get("chart_id")
    custom_title = data.get("customTitle")
    if not chart_id or custom_title is None:
        raise HTTPException(status_code=400, detail="chart_id et customTitle requis")
    
    dashboard = await db.find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Tableau de bord non trouvé")
    
    charts = dashboard.get("graphiques", [])
    updated = False
    for c in charts:
        if c.get("chart_id") == chart_id:
            c["customTitle"] = custom_title
            updated = True
    
    if not updated:
        raise HTTPException(status_code=404, detail="Graphique non trouvé dans le tableau de bord")
    
    await db.update_one(
        {"_id": ObjectId(dashboard_id)}, 
        {"$set": {"graphiques": charts, "date_maj": datetime.utcnow()}}
    )
    doc = await db.find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(doc)

@router.post("/{dashboard_id}/update-chart-text")
async def update_chart_text(
    dashboard_id: str,
    data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_dashboards_collection)
):
    """Met à jour le texte d'un widget section"""
    chart_id = data.get("chart_id")
    text = data.get("text")
    if not chart_id or text is None:
        raise HTTPException(status_code=400, detail="chart_id et text requis")
    
    dashboard = await db.find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Tableau de bord non trouvé")
    
    charts = dashboard.get("graphiques", [])
    updated = False
    for c in charts:
        if c.get("chart_id") == chart_id:
            c["text"] = text
            updated = True
    
    if not updated:
        raise HTTPException(status_code=404, detail="Widget section non trouvé dans le tableau de bord")
    
    await db.update_one(
        {"_id": ObjectId(dashboard_id)}, 
        {"$set": {"graphiques": charts, "date_maj": datetime.utcnow()}}
    )
    doc = await db.find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(doc)

@router.post("/{dashboard_id}/layout")
async def update_dashboard_layout(
    dashboard_id: str,
    layout: List[LayoutItem],
    current_user: User = Depends(get_current_user),
    db=Depends(get_dashboards_collection)
):
    """Met à jour la disposition des graphiques d'un tableau de bord"""
    dashboard = await db.find_one({"_id": ObjectId(dashboard_id), "user_id": current_user.username})
    if not dashboard:
        raise HTTPException(status_code=404, detail="Tableau de bord non trouvé")

    charts = dashboard.get("graphiques", [])
    
    # Assigner un instance_id aux anciens widgets qui n'en ont pas
    for c in charts:
        if 'instance_id' not in c or c['instance_id'] is None:
            c['instance_id'] = str(uuid.uuid4())

    charts_dict = {c['instance_id']: c for c in charts}

    for item in layout:
        if item.instance_id in charts_dict:
            charts_dict[item.instance_id]['x'] = item.x
            charts_dict[item.instance_id]['y'] = item.y
            charts_dict[item.instance_id]['w'] = item.w
            charts_dict[item.instance_id]['h'] = item.h

    updated_charts = list(charts_dict.values())

    await db.update_one(
        {"_id": ObjectId(dashboard_id)},
        {"$set": {"graphiques": updated_charts, "date_maj": datetime.utcnow()}}
    )

    doc = await db.find_one({"_id": ObjectId(dashboard_id)})
    return dashboard_from_mongo(doc) 