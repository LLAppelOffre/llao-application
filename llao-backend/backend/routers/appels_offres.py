from fastapi import APIRouter, Query, Depends, HTTPException
from backend.db import get_db_appels_offres
from typing import Optional, List
from datetime import datetime
from fastapi.responses import JSONResponse, StreamingResponse
import pandas as pd
import io
from backend.auth import get_current_user, User
from bson import ObjectId
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm

router = APIRouter(prefix="/appels_offres", tags=["appels_offres"])

def patch_objectid(result):
    for doc in result:
        if "_id" in doc and not isinstance(doc["_id"], (str, int, float, type(None))):
            doc["_id"] = str(doc["_id"])
    return result

def serialize_doc(doc):
    doc["_id"] = str(doc["_id"])
    for k, v in doc.items():
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
        # Gestion du format MongoDB Compass {"$date": ...}
        if isinstance(v, dict) and "$date" in v:
            try:
                doc[k] = datetime.fromtimestamp(v["$date"]/1000).isoformat()
            except Exception:
                doc[k] = str(v["$date"])
    return doc

@router.get("/")
async def get_appels_offres(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,  # format YYYY-MM-DD
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
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
    docs = await db["appels_offres"].find(query).to_list(length=1000)
    print(f"DEBUG: {len(docs)} documents trouvés dans appels_offres (requête: {query})")
    docs = [serialize_doc(doc) for doc in docs]
    return JSONResponse(content=patch_objectid(docs))

@router.get("/stats/gagne-perdu")
async def get_stats_gagne_perdu(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Statistiques pour les graphiques gagné/perdu"""
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
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/gagne-perdu-evolution-mois")
async def get_stats_gagne_perdu_evolution_mois(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
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
                "mois": {"$substr": ["$date_emission", 0, 7]},  # Format YYYY-MM
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
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/gagne-perdu-taux-succes-categorie")
async def get_stats_gagne_perdu_taux_succes_categorie(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
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
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/gagne-perdu-taux-succes-pole")
async def get_stats_gagne_perdu_taux_succes_pole(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Taux de succès par pôle"""
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
                    "pole": "$pole",
                    "statut": "$statut"
                },
                "count": {"$sum": 1}
            }
        },
        {
            "$group": {
                "_id": "$_id.pole",
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
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/par-categorie")
async def get_stats_par_categorie(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Statistiques par catégorie et statut"""
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
        {"$sort": {"_id.categorie": 1, "_id.statut": 1}}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/par-pole")
async def get_stats_par_pole(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Statistiques par pôle"""
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
                    "pole": "$pole",
                    "statut": "$statut"
                },
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id.pole": 1, "_id.statut": 1}}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/delais")
async def get_stats_delais(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
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
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/delais-par-ao")
async def get_stats_delais_par_ao(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Statistiques des délais par AO"""
    try:
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
                "$project": {
                    "nom_ao": "$nom_ao",
                    "delai_jours": "$delai_jours",
                    "categorie": "$categorie",
                    "statut": "$statut"
                }
            },
            {"$sort": {"delai_jours": -1}},
            {"$limit": 20}
        ]
        result = await db["appels_offres"].aggregate(pipeline).to_list(length=20)
        return JSONResponse(content=patch_objectid(result))
    except Exception as e:
        print("Erreur dans /stats/delais-par-ao :", e)
        from fastapi import status
        return JSONResponse(content={"error": str(e)}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@router.get("/stats/delais-tranches")
async def get_stats_delais_tranches(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Statistiques des délais par tranches"""
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
                "tranche_delai": {
                    "$switch": {
                        "branches": [
                            {"case": {"$lte": ["$delai_jours", 7]}, "then": "0-7 jours"},
                            {"case": {"$lte": ["$delai_jours", 15]}, "then": "8-15 jours"}
                        ],
                        "default": "16+ jours"
                    }
                }
            }
        },
        {
            "$group": {
                "_id": "$tranche_delai",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=10)
    return JSONResponse(content=patch_objectid(result))

@router.get("/top5/delais")
async def get_top5_delais(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Top 5 des délais les plus longs"""
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
            "$project": {
                "nom_ao": "$nom_ao",
                "delai_jours": "$delai_jours",
                "categorie": "$categorie",
                "statut": "$statut"
            }
        },
        {"$sort": {"delai_jours": -1}},
        {"$limit": 5}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=5)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/notes")
async def get_stats_notes(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
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
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/prix")
async def get_stats_prix(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
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
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/comparaison")
async def get_stats_comparaison(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
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
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/filtres/options")
async def get_filtres_options(db=Depends(get_db_appels_offres), current_user: User = Depends(get_current_user)):
    """Récupérer les options disponibles pour les filtres"""
    # Catégories
    categories = await db["appels_offres"].distinct("categorie")
    
    # Statuts
    statuts = await db["appels_offres"].distinct("statut")
    
    # Pôles
    poles = await db["appels_offres"].distinct("pole")
    
    return JSONResponse(content={
        "categories": categories,
        "statuts": statuts,
        "poles": poles
    })

@router.get("/top5/notes")
async def get_top5_notes(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Top 5 des meilleures notes techniques"""
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
        {"$sort": {"note_technique": -1}},
        {"$limit": 5},
        {
            "$project": {
                "nom_ao": "$nom_ao",
                "categorie": "$categorie",
                "note_technique": "$note_technique",
                "statut": "$statut"
            }
        }
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=5)
    return JSONResponse(content=patch_objectid(result))

@router.get("/top5/ecarts")
async def get_top5_ecarts(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Top 5 des plus gros écarts de score"""
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
        {"$sort": {"ecart_score": -1}},
        {"$limit": 5},
        {
            "$project": {
                "nom_ao": "$nom_ao",
                "categorie": "$categorie",
                "ecart_score": "$ecart_score",
                "statut": "$statut"
            }
        }
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=5)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/notes-tranches")
async def get_stats_notes_tranches(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Statistiques des notes par tranches"""
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
                "tranche_note": {
                    "$switch": {
                        "branches": [
                            {"case": {"$lte": ["$note_technique", 10]}, "then": "0-10"},
                            {"case": {"$lte": ["$note_technique", 15]}, "then": "11-15"},
                            {"case": {"$lte": ["$note_technique", 20]}, "then": "16-20"}
                        ],
                        "default": "20+"
                    }
                }
            }
        },
        {
            "$group": {
                "_id": "$tranche_note",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=10)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/notes-qualitatives")
async def get_stats_notes_qualitatives(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Statistiques des notes qualitatives par catégorie"""
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
                "note_technique_moyenne": {"$avg": "$note_technique"},
                "note_prix_moyenne": {"$avg": "$note_prix"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"note_technique_moyenne": -1}}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=20)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/notes-box")
async def get_stats_notes_box(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Données pour box plot des notes"""
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
            "$project": {
                "nom_ao": "$nom_ao",
                "categorie": "$categorie",
                "note_technique": "$note_technique",
                "note_prix": "$note_prix",
                "statut": "$statut"
            }
        },
        {"$sort": {"note_technique": -1}}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/prix-tranches")
async def get_stats_prix_tranches(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Statistiques des prix par tranches"""
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
                "tranche_prix": {
                    "$switch": {
                        "branches": [
                            {"case": {"$lte": ["$prix_client", 20000]}, "then": "0-20k€"},
                            {"case": {"$lte": ["$prix_client", 50000]}, "then": "20k-50k€"},
                            {"case": {"$lte": ["$prix_client", 100000]}, "then": "50k-100k€"}
                        ],
                        "default": "100k€+"
                    }
                }
            }
        },
        {
            "$group": {
                "_id": "$tranche_prix",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=10)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/positionnement-prix")
async def get_stats_positionnement_prix(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Statistiques du positionnement des prix"""
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
                "positionnement": {
                    "$switch": {
                        "branches": [
                            {"case": {"$gt": ["$prix_client", "$prix_gagnant"]}, "then": "Trop cher"},
                            {"case": {"$lt": ["$prix_client", {"$multiply": ["$prix_gagnant", 0.8]}]}, "then": "Trop bas"}
                        ],
                        "default": "Aligné"
                    }
                }
            }
        },
        {
            "$group": {
                "_id": "$positionnement",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=10)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/prix-box")
async def get_stats_prix_box(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Données pour box plot des prix"""
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
            "$project": {
                "nom_ao": "$nom_ao",
                "categorie": "$categorie",
                "prix_client": "$prix_client",
                "prix_gagnant": "$prix_gagnant",
                "statut": "$statut"
            }
        },
        {"$sort": {"prix_client": -1}}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/taux-succes-prix")
async def get_stats_taux_succes_prix(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Taux de succès par tranche de prix"""
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
                "tranche_prix": {
                    "$switch": {
                        "branches": [
                            {"case": {"$lte": ["$prix_client", 20000]}, "then": "0-20k€"},
                            {"case": {"$lte": ["$prix_client", 50000]}, "then": "20k-50k€"},
                            {"case": {"$lte": ["$prix_client", 100000]}, "then": "50k-100k€"}
                        ],
                        "default": "100k€+"
                    }
                }
            }
        },
        {
            "$group": {
                "_id": {
                    "tranche_prix": "$tranche_prix",
                    "statut": "$statut"
                },
                "count": {"$sum": 1}
            }
        },
        {
            "$group": {
                "_id": "$_id.tranche_prix",
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
                "taux_succes": {"$divide": ["$gagne", "$total"]}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=10)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/ecarts-categorie")
async def get_stats_ecarts_categorie(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Statistiques des écarts de score par catégorie"""
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
                "ecart_score": {"$subtract": ["$score_gagnant", "$score_client"]}
            }
        },
        {
            "$group": {
                "_id": "$categorie",
                "ecart_moyen": {"$avg": "$ecart_score"},
                "ecart_min": {"$min": "$ecart_score"},
                "ecart_max": {"$max": "$ecart_score"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"ecart_moyen": -1}}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=20)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/ecarts-tranches")
async def get_stats_ecarts_tranches(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Statistiques des écarts par tranches"""
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
                "ecart_score": {"$subtract": ["$score_gagnant", "$score_client"]},
                "tranche_ecart": {
                    "$switch": {
                        "branches": [
                            {"case": {"$lte": [{"$abs": {"$subtract": ["$score_gagnant", "$score_client"]}}, 5]}, "then": "0-5 points"},
                            {"case": {"$lte": [{"$abs": {"$subtract": ["$score_gagnant", "$score_client"]}}, 10]}, "then": "6-10 points"},
                            {"case": {"$lte": [{"$abs": {"$subtract": ["$score_gagnant", "$score_client"]}}, 20]}, "then": "11-20 points"}
                        ],
                        "default": "20+ points"
                    }
                }
            }
        },
        {
            "$group": {
                "_id": "$tranche_ecart",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=10)
    return JSONResponse(content=patch_objectid(result))

@router.get("/stats/ecarts-box")
async def get_stats_ecarts_box(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Données pour box plot des écarts"""
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
                "ecart_score": {"$subtract": ["$score_gagnant", "$score_client"]}
            }
        },
        {
            "$project": {
                "nom_ao": "$nom_ao",
                "categorie": "$categorie",
                "ecart_score": "$ecart_score",
                "score_client": "$score_client",
                "score_gagnant": "$score_gagnant",
                "statut": "$statut"
            }
        },
        {"$sort": {"ecart_score": -1}}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=100)
    return JSONResponse(content=patch_objectid(result))

@router.get("/top5/ecarts-faibles")
async def get_top5_ecarts_faibles(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Top 5 des écarts les plus faibles"""
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
                "ecart_score": {"$abs": {"$subtract": ["$score_gagnant", "$score_client"]}}
            }
        },
        {
            "$project": {
                "nom_ao": "$nom_ao",
                "ecart_score": "$ecart_score",
                "categorie": "$categorie",
                "statut": "$statut"
            }
        },
        {"$sort": {"ecart_score": 1}},
        {"$limit": 5}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=5)
    return JSONResponse(content=patch_objectid(result))

@router.get("/top5/ecarts-forts")
async def get_top5_ecarts_forts(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    """Top 5 des écarts les plus forts"""
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
                "ecart_score": {"$abs": {"$subtract": ["$score_gagnant", "$score_client"]}}
            }
        },
        {
            "$project": {
                "nom_ao": "$nom_ao",
                "ecart_score": "$ecart_score",
                "categorie": "$categorie",
                "statut": "$statut"
            }
        },
        {"$sort": {"ecart_score": -1}},
        {"$limit": 5}
    ]
    
    result = await db["appels_offres"].aggregate(pipeline).to_list(length=5)
    return JSONResponse(content=patch_objectid(result))

@router.get("/export/excel")
async def export_ao_excel(
    categorie: Optional[str] = None,
    statut: Optional[str] = None,
    pole: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
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
    docs = await db["appels_offres"].find(query).to_list(length=1000)
    if not docs:
        raise HTTPException(status_code=404, detail="Aucun AO trouvé pour l'export")
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
async def search_ao(
    q: str = Query(None),
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    if not q or len(q) < 2:
        return []
    cursor = db["appels_offres"].find({"nom_ao": {"$regex": q, "$options": "i"}}).limit(10)
    results = []
    async for doc in cursor:
        results.append({"_id": str(doc["_id"]), "nom_ao": doc["nom_ao"]})
    return results

@router.get("/{ao_id}")
async def get_ao_detail(
    ao_id: str,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    try:
        doc = await db["appels_offres"].find_one({"_id": ObjectId(ao_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="AO non trouvé")
        return JSONResponse(content=serialize_doc(doc))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors de la récupération de l'AO: {e}")

@router.get("/{ao_id}/reports")
async def get_ao_reports(
    ao_id: str,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    # On suppose que la base MongoDB a une collection 'document_intelligence.reports'
    try:
        reports_collection = db.client['document_intelligence']['reports']
        cursor = reports_collection.find({"documents_inclus_ids": ObjectId(ao_id)})
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors de la récupération des rapports IA: {e}")

@router.get("/{ao_id}/export/pdf")
async def export_ao_pdf(
    ao_id: str,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    doc = await db["appels_offres"].find_one({"_id": ObjectId(ao_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="AO non trouvé")
    # Création du PDF en mémoire
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 2*cm
    c.setFont("Helvetica-Bold", 16)
    c.drawString(2*cm, y, f"Fiche Appel d'Offres : {doc.get('nom_ao', '')}")
    y -= 1.2*cm
    c.setFont("Helvetica", 12)
    champs = [
        ("Catégorie", doc.get("categorie", "")),
        ("Pôle", doc.get("pole", "")),
        ("Statut", doc.get("statut", "")),
        ("Date émission", doc.get("date_emission", "")),
        ("Date réponse", doc.get("date_reponse", "")),
        ("Année/Trimestre", doc.get("annee_trimestre", "")),
        ("Prix client", doc.get("prix_client", "")),
        ("Prix gagnant", doc.get("prix_gagnant", "")),
        ("Positionnement prix", doc.get("positionnement_prix", "")),
        ("Note technique", doc.get("note_technique", "")),
        ("Note prix", doc.get("note_prix", "")),
        ("Score client", doc.get("score_client", "")),
        ("Score gagnant", doc.get("score_gagnant", "")),
        ("Délai (jours)", doc.get("delai_jours", "")),
        ("Tranche délai", doc.get("tranche_delai", "")),
        ("Ecart score", doc.get("ecart_score", "")),
        ("Ecart prix", doc.get("ecart_prix", "")),
        ("Commentaires IA", doc.get("commentaires_ia", "")),
        ("Raison perte", doc.get("raison_perte", "")),
    ]
    for label, value in champs:
        if value:
            c.drawString(2*cm, y, f"{label} : {value}")
            y -= 0.8*cm
            if y < 2*cm:
                c.showPage()
                y = height - 2*cm
                c.setFont("Helvetica", 12)
    # Équipe projet
    equipe = doc.get("equipe_projet", [])
    if equipe:
        c.setFont("Helvetica-Bold", 13)
        c.drawString(2*cm, y, "Équipe projet :")
        y -= 0.7*cm
        c.setFont("Helvetica", 12)
        for membre in equipe:
            c.drawString(2.5*cm, y, f"- {membre.get('nom', '')} ({membre.get('role', '')})")
            y -= 0.6*cm
            if y < 2*cm:
                c.showPage()
                y = height - 2*cm
                c.setFont("Helvetica", 12)
    c.showPage()
    c.save()
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=fiche_ao_{ao_id}.pdf"}) 

@router.post("/favorites/ao/{ao_id}")
async def add_ao_favorite(
    ao_id: str,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    try:
        favorites_collection = db.client['llao_db']['ao_favorites']
        # Vérifie si déjà favori
        exists = await favorites_collection.find_one({"user_id": current_user.username, "ao_id": ao_id})
        if exists:
            return {"message": "Déjà en favori"}
        await favorites_collection.insert_one({
            "user_id": current_user.username,
            "ao_id": ao_id,
            "created_at": datetime.utcnow()
        })
        return {"message": "Ajouté aux favoris"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur ajout favori: {e}")

@router.delete("/favorites/ao/{ao_id}")
async def remove_ao_favorite(
    ao_id: str,
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    try:
        favorites_collection = db.client['llao_db']['ao_favorites']
        await favorites_collection.delete_one({"user_id": current_user.username, "ao_id": ao_id})
        return {"message": "Retiré des favoris"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur suppression favori: {e}")

@router.get("/favorites/ao")
async def list_ao_favorites(
    db=Depends(get_db_appels_offres),
    current_user: User = Depends(get_current_user)
):
    try:
        favorites_collection = db.client['llao_db']['ao_favorites']
        cursor = favorites_collection.find({"user_id": current_user.username})
        ao_ids = [fav["ao_id"] async for fav in cursor]
        # Optionnel : retourner les AO complets
        ao_cursor = db["appels_offres"].find({"_id": {"$in": [ObjectId(aid) for aid in ao_ids]}})
        ao_list = [serialize_doc(doc) async for doc in ao_cursor]
        return ao_list
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur récupération favoris: {e}") 