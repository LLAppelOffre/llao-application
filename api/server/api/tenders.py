from fastapi import APIRouter, Query, Depends, HTTPException, Body
from typing import Optional, List
from datetime import datetime
from fastapi.responses import JSONResponse, StreamingResponse
import pandas as pd
import io
from bson import ObjectId
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm

from api.server.database.models import User, Tender, TenderCreate
from api.server.database.connection import get_tenders_collection
from api.server.auth.jwt_handler import get_current_user
from api.server.utils.data_helpers import patch_objectid, serialize_doc

router = APIRouter(prefix="/tenders", tags=["tenders"])

@router.get("/")
async def get_tenders(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_tenders_collection),
    current_user: User = Depends(get_current_user)
):
    """Récupère la liste des appels d'offres avec filtres"""
    query = {}
    if categorie:
        query["categorie"] = categorie
    if statut:
        query["statut"] = statut
    if pole:
        query["pole"] = pole
    if date_debut or date_fin:
        date_query = {}
        if date_debut:
            date_query["$gte"] = date_debut
        if date_fin:
            date_query["$lte"] = date_fin
        query["date_emission"] = date_query
    
    docs = await db.find(query).to_list(length=1000)
    docs = [serialize_doc(doc) for doc in docs]
    return JSONResponse(content=patch_objectid(docs))

@router.get("/stats/win-loss")
async def get_stats_win_loss(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_tenders_collection),
    current_user: User = Depends(get_current_user)
):
    """Statistiques gagné/perdu"""
    match_stage = {}
    if categorie:
        match_stage["categorie"] = categorie
    if statut:
        match_stage["statut"] = statut
    if pole:
        match_stage["pole"] = pole
    if date_debut or date_fin:
        date_query = {}
        if date_debut:
            date_query["$gte"] = date_debut
        if date_fin:
            date_query["$lte"] = date_fin
        match_stage["date_emission"] = date_query

    pipeline = [
        {"$match": match_stage} if match_stage else {"$match": {}},
        {
            "$group": {
                "_id": "$statut",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}}
    ]
    
    result = await db.aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/win-loss-evolution-month")
async def get_stats_win_loss_evolution_month(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_tenders_collection),
    current_user: User = Depends(get_current_user)
):
    """Évolution du taux de succès par mois"""
    match_stage = {}
    if categorie:
        match_stage["categorie"] = categorie
    if statut:
        match_stage["statut"] = statut
    if pole:
        match_stage["pole"] = pole
    if date_debut or date_fin:
        date_query = {}
        if date_debut:
            date_query["$gte"] = date_debut
        if date_fin:
            date_query["$lte"] = date_fin
        match_stage["date_emission"] = date_query

    pipeline = [
        {"$match": match_stage} if match_stage else {"$match": {}},
        {
            "$addFields": {
                "mois": {"$substr": ["$date_emission", 0, 7]},
                "annee": {"$substr": ["$date_emission", 0, 4]},
                "mois_num": {"$substr": ["$date_emission", 5, 2]}
            }
        },
        {
            "$group": {
                "_id": {
                    "mois": "$mois",
                    "annee": "$annee",
                    "mois_num": "$mois_num",
                    "statut": "$statut"
                },
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id.annee": 1, "_id.mois_num": 1}}
    ]
    
    result = await db.aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/success-rate-by-category")
async def get_stats_success_rate_by_category(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_tenders_collection),
    current_user: User = Depends(get_current_user)
):
    """Taux de succès par catégorie"""
    match_stage = {}
    if categorie:
        match_stage["categorie"] = categorie
    if statut:
        match_stage["statut"] = statut
    if pole:
        match_stage["pole"] = pole
    if date_debut or date_fin:
        date_query = {}
        if date_debut:
            date_query["$gte"] = date_debut
        if date_fin:
            date_query["$lte"] = date_fin
        match_stage["date_emission"] = date_query

    pipeline = [
        {"$match": match_stage} if match_stage else {"$match": {}},
        {
            "$group": {
                "_id": {
                    "categorie": "$categorie",
                    "statut": "$statut"
                },
                "count": {"$sum": 1}
            }
        },
        {
            "$group": {
                "_id": "$_id.categorie",
                "total": {"$sum": "$count"},
                "gagne": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$_id.statut", "Gagné"]},
                            "$count",
                            0
                        ]
                    }
                }
            }
        },
        {
            "$addFields": {
                "taux_succes": {
                    "$multiply": [
                        {"$divide": ["$gagne", "$total"]},
                        100
                    ]
                }
            }
        },
        {"$sort": {"taux_succes": -1}}
    ]
    
    result = await db.aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/delays")
async def get_stats_delays(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_tenders_collection),
    current_user: User = Depends(get_current_user)
):
    """Statistiques des délais"""
    match_stage = {}
    if categorie:
        match_stage["categorie"] = categorie
    if statut:
        match_stage["statut"] = statut
    if pole:
        match_stage["pole"] = pole
    if date_debut or date_fin:
        date_query = {}
        if date_debut:
            date_query["$gte"] = date_debut
        if date_fin:
            date_query["$lte"] = date_fin
        match_stage["date_emission"] = date_query

    pipeline = [
        {"$match": match_stage} if match_stage else {"$match": {}},
        {
            "$group": {
                "_id": "$categorie",
                "delai_moyen": {"$avg": "$delai_jours"},
                "delai_min": {"$min": "$delai_jours"},
                "delai_max": {"$max": "$delai_jours"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"delai_moyen": -1}}
    ]
    
    result = await db.aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/scores")
async def get_stats_scores(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_tenders_collection),
    current_user: User = Depends(get_current_user)
):
    """Statistiques des notes techniques"""
    match_stage = {}
    if categorie:
        match_stage["categorie"] = categorie
    if statut:
        match_stage["statut"] = statut
    if pole:
        match_stage["pole"] = pole
    if date_debut or date_fin:
        date_query = {}
        if date_debut:
            date_query["$gte"] = date_debut
        if date_fin:
            date_query["$lte"] = date_fin
        match_stage["date_emission"] = date_query

    pipeline = [
        {"$match": match_stage} if match_stage else {"$match": {}},
        {
            "$group": {
                "_id": "$categorie",
                "note_moyenne": {"$avg": "$note_technique"},
                "note_min": {"$min": "$note_technique"},
                "note_max": {"$max": "$note_technique"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"note_moyenne": -1}}
    ]
    
    result = await db.aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/pricing")
async def get_stats_pricing(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_tenders_collection),
    current_user: User = Depends(get_current_user)
):
    """Statistiques des prix"""
    match_stage = {}
    if categorie:
        match_stage["categorie"] = categorie
    if statut:
        match_stage["statut"] = statut
    if pole:
        match_stage["pole"] = pole
    if date_debut or date_fin:
        date_query = {}
        if date_debut:
            date_query["$gte"] = date_debut
        if date_fin:
            date_query["$lte"] = date_fin
        match_stage["date_emission"] = date_query

    pipeline = [
        {"$match": match_stage} if match_stage else {"$match": {}},
        {
            "$group": {
                "_id": "$categorie",
                "prix_moyen": {"$avg": "$prix_client"},
                "prix_min": {"$min": "$prix_client"},
                "prix_max": {"$max": "$prix_client"},
                "ecart_prix_moyen": {"$avg": "$ecart_prix"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"prix_moyen": -1}}
    ]
    
    result = await db.aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/comparison")
async def get_stats_comparison(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_tenders_collection),
    current_user: User = Depends(get_current_user)
):
    """Statistiques pour comparaison avec gagnant"""
    match_stage = {}
    if categorie:
        match_stage["categorie"] = categorie
    if statut:
        match_stage["statut"] = statut
    if pole:
        match_stage["pole"] = pole
    if date_debut or date_fin:
        date_query = {}
        if date_debut:
            date_query["$gte"] = date_debut
        if date_fin:
            date_query["$lte"] = date_fin
        match_stage["date_emission"] = date_query

    pipeline = [
        {"$match": match_stage} if match_stage else {"$match": {}},
        {
            "$group": {
                "_id": "$categorie",
                "ecart_score_moyen": {"$avg": "$ecart_score"},
                "ecart_score_min": {"$min": "$ecart_score"},
                "ecart_score_max": {"$max": "$ecart_score"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"ecart_score_moyen": -1}}
    ]
    
    result = await db.aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/filters/options")
async def get_filters_options(
    db=Depends(get_tenders_collection), 
    current_user: User = Depends(get_current_user)
):
    """Récupérer les options disponibles pour les filtres"""
    categories = await db.distinct("categorie")
    statuts = await db.distinct("statut")
    poles = await db.distinct("pole")
    
    return JSONResponse(content={
        "categories": categories,
        "statuts": statuts,
        "poles": poles
    })

@router.get("/export/excel")
async def export_tenders_excel(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_tenders_collection),
    current_user: User = Depends(get_current_user)
):
    """Export Excel des appels d'offres"""
    query = {}
    if categorie:
        query["categorie"] = categorie
    if statut:
        query["statut"] = statut
    if pole:
        query["pole"] = pole
    if date_debut or date_fin:
        date_query = {}
        if date_debut:
            date_query["$gte"] = date_debut
        if date_fin:
            date_query["$lte"] = date_fin
        query["date_emission"] = date_query
    
    docs = await db.find(query).to_list(length=1000)
    if not docs:
        raise HTTPException(status_code=404, detail="Aucun appel d'offres trouvé pour l'export")
    
    # Nettoyage et conversion
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    
    df = pd.DataFrame(docs)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="AppelsOffres")
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=appels_offres.xlsx"}
    )

@router.get("/search")
async def search_tenders(
    q: str = Query(None),
    db=Depends(get_tenders_collection),
    current_user: User = Depends(get_current_user)
):
    """Recherche d'appels d'offres"""
    if not q or len(q) < 2:
        return []
    
    cursor = db.find({"nom_ao": {"$regex": q, "$options": "i"}}).limit(10)
    results = []
    async for doc in cursor:
        results.append({"_id": str(doc["_id"]), "nom_ao": doc["nom_ao"]})
    return results

@router.get("/{tender_id}")
async def get_tender_detail(
    tender_id: str,
    db=Depends(get_tenders_collection),
    current_user: User = Depends(get_current_user)
):
    """Récupère les détails d'un appel d'offres"""
    try:
        doc = await db.find_one({"_id": ObjectId(tender_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Appel d'offres non trouvé")
        return JSONResponse(content=serialize_doc(doc))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors de la récupération: {e}")

@router.post("/favorites/{tender_id}")
async def add_tender_favorite(
    tender_id: str,
    db=Depends(get_tenders_collection),
    current_user: User = Depends(get_current_user)
):
    """Ajouter un appel d'offres aux favoris"""
    try:
        favorites_collection = db.database['tender_favorites']
        # Vérifie si déjà favori
        exists = await favorites_collection.find_one({"user_id": current_user.username, "tender_id": tender_id})
        if exists:
            return {"message": "Déjà en favori"}
        
        await favorites_collection.insert_one({
            "user_id": current_user.username,
            "tender_id": tender_id,
            "created_at": datetime.utcnow()
        })
        return {"message": "Ajouté aux favoris"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur ajout favori: {e}")

@router.delete("/favorites/{tender_id}")
async def remove_tender_favorite(
    tender_id: str,
    db=Depends(get_tenders_collection),
    current_user: User = Depends(get_current_user)
):
    """Retirer un appel d'offres des favoris"""
    try:
        favorites_collection = db.database['tender_favorites']
        await favorites_collection.delete_one({"user_id": current_user.username, "tender_id": tender_id})
        return {"message": "Retiré des favoris"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur suppression favori: {e}")

@router.get("/favorites/")
async def list_tender_favorites(
    db=Depends(get_tenders_collection),
    current_user: User = Depends(get_current_user)
):
    """Lister les appels d'offres favoris"""
    try:
        favorites_collection = db.database['tender_favorites']
        cursor = favorites_collection.find({"user_id": current_user.username})
        tender_ids = [fav["tender_id"] async for fav in cursor]
        
        # Récupérer les appels d'offres complets
        tender_cursor = db.find({"_id": {"$in": [ObjectId(tid) for tid in tender_ids]}})
        tender_list = [serialize_doc(doc) async for doc in tender_cursor]
        return tender_list
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur récupération favoris: {e}") 