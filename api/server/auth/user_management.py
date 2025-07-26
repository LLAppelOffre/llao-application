from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional
from api.server.database.models import User, UserCreate, UserInDB
from api.server.database.connection import get_users_collection
from api.server.auth.jwt_handler import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()

@router.post("/register")
async def register(user: UserCreate, db=Depends(get_users_collection)):
    """Inscription d'un nouvel utilisateur"""
    # Vérifier si l'utilisateur existe déjà
    existing = await db.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà utilisé")
    
    # Créer le nouvel utilisateur
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "username": user.username,
        "full_name": user.full_name,
        "hashed_password": hashed_password,
        "disabled": False,
        "role": user.role or "user",
        "date_creation": datetime.utcnow()
    }
    
    result = await db.insert_one(user_doc)
    return {
        "id": str(result.inserted_id), 
        "username": user.username,
        "message": "Utilisateur créé avec succès"
    }

@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db=Depends(get_users_collection)
):
    """Connexion et obtention d'un token JWT"""
    from api.server.auth.jwt_handler import authenticate_user
    
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Nom d'utilisateur ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.get("/users/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Récupère les informations de l'utilisateur connecté"""
    return {
        "username": current_user.username,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "disabled": current_user.disabled
    }

@router.patch("/users/me/password")
async def change_password(
    old_password: str = Body(...),
    new_password: str = Body(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_users_collection)
):
    """Change le mot de passe de l'utilisateur connecté"""
    # Récupérer l'utilisateur avec le mot de passe hashé
    user_doc = await db.find_one({"username": current_user.username})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Vérifier l'ancien mot de passe
    if not verify_password(old_password, user_doc["hashed_password"]):
        raise HTTPException(status_code=400, detail="Ancien mot de passe incorrect")
    
    # Hash et sauvegarder le nouveau mot de passe
    hashed = get_password_hash(new_password)
    await db.update_one(
        {"username": current_user.username}, 
        {"$set": {"hashed_password": hashed}}
    )
    
    return {"message": "Mot de passe modifié avec succès"}

@router.patch("/users/{username}/disable")
async def set_user_disabled(
    username: str,
    disabled: bool = Body(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_users_collection)
):
    """Active/désactive un utilisateur (admin seulement)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    if username == current_user.username:
        raise HTTPException(status_code=400, detail="Impossible de se désactiver soi-même")
    
    result = await db.update_one(
        {"username": username}, 
        {"$set": {"disabled": disabled}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return {"message": f"Utilisateur {'désactivé' if disabled else 'réactivé'}"}

@router.delete("/users/{username}")
async def delete_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_users_collection)
):
    """Supprime un utilisateur (admin seulement)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    if username == current_user.username:
        raise HTTPException(status_code=400, detail="Impossible de se supprimer soi-même")
    
    result = await db.delete_one({"username": username})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return {"message": "Utilisateur supprimé"}

@router.patch("/users/{username}/password")
async def admin_change_password(
    username: str,
    new_password: str = Body(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_users_collection)
):
    """Change le mot de passe d'un utilisateur (admin seulement)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    if username == current_user.username:
        raise HTTPException(status_code=400, detail="Impossible de changer son propre mot de passe ici")
    
    user_doc = await db.find_one({"username": username})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    if user_doc.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Impossible de changer le mot de passe d'un autre admin")
    
    hashed = get_password_hash(new_password)
    await db.update_one(
        {"username": username}, 
        {"$set": {"hashed_password": hashed}}
    )
    
    return {"message": "Mot de passe modifié pour l'utilisateur"} 