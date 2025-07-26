from typing import List, Dict, Union
from datetime import datetime

def patch_objectid(result):
    """Convertit les ObjectId en string dans les résultats"""
    for doc in result:
        if "_id" in doc and not isinstance(doc["_id"], (str, int, float, type(None))):
            doc["_id"] = str(doc["_id"])
    return result

def serialize_doc(doc):
    """Sérialise un document MongoDB pour l'API"""
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

def format_date(date_str: str) -> str:
    """Formate une date pour l'affichage"""
    if not date_str:
        return ""
    try:
        if isinstance(date_str, str):
            # Supposons que la date est au format ISO
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt.strftime("%d/%m/%Y")
    except:
        pass
    return str(date_str)

def format_currency(amount: float) -> str:
    """Formate un montant en euros"""
    if amount is None:
        return "0 €"
    return f"{amount:,.0f} €"

def format_percentage(value: float) -> str:
    """Formate un pourcentage"""
    if value is None:
        return "0%"
    return f"{value:.1f}%"

def validate_date_range(start_date: str, end_date: str) -> bool:
    """Valide une plage de dates"""
    try:
        if start_date and end_date:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
            return start <= end
        return True
    except:
        return False

def sanitize_string(text: str) -> str:
    """Nettoie une chaîne de caractères"""
    if not text:
        return ""
    return text.strip()

def build_query_filters(
    categorie: str = None,
    statut: str = None,
    pole: str = None,
    date_debut: str = None,
    date_fin: str = None
) -> Dict:
    """Construit un dictionnaire de filtres pour les requêtes MongoDB"""
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
    
    return query 