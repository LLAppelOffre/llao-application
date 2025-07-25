from fastapi import Depends, HTTPException, status, APIRouter, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
from backend.db import get_db
from bson import ObjectId

# À personnaliser pour ton projet
SECRET_KEY = "supersecretkey"  # À changer en prod !
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Modèle User
class User(BaseModel):
    username: str
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    role: str = "user"  # 'user' ou 'admin'

class UserInDB(User):
    hashed_password: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = None  # Optionnel à l'inscription

# Faux stockage d'utilisateurs (à remplacer par MongoDB)
fake_users_db = {
    "user123": {
        "username": "user123",
        "full_name": "Utilisateur Test",
        "hashed_password": "$2b$12$4n/NzHiTTWoLuhvLsGVnFuoxGlOFPG1cUD8L1bOZgQareR9bz2X7W",  # motdepasse
        "disabled": False,
    }
}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

async def get_user(db, username: str):
    user = await db["users"].find_one({"username": username})
    if user:
        return UserInDB(
            username=user["username"],
            full_name=user.get("full_name"),
            disabled=user.get("disabled", False),
            role=user.get("role", "user"),
            hashed_password=user["hashed_password"]
        )
    return None

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def authenticate_user(db, username: str, password: str):
    user = await get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await get_user(db, username)
    if user is None:
        raise credentials_exception
    return user

# Endpoint pour obtenir un token JWT
router = APIRouter()

@router.post("/register")
async def register(user: UserCreate = Body(...), db=Depends(get_db)):
    existing = await db["users"].find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "username": user.username,
        "full_name": user.full_name,
        "hashed_password": hashed_password,
        "disabled": False,
        "role": user.role or "user"
    }
    result = await db["users"].insert_one(user_doc)
    return {"id": str(result.inserted_id), "username": user.username}

@router.patch("/users/me/password")
async def change_password(
    old_password: str = Body(...),
    new_password: str = Body(...),
    current_user: UserInDB = Depends(get_current_user),
    db=Depends(get_db)
):
    user = await get_user(db, current_user.username)
    if not verify_password(old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Ancien mot de passe incorrect")
    hashed = get_password_hash(new_password)
    await db["users"].update_one({"username": user.username}, {"$set": {"hashed_password": hashed}})
    return {"msg": "Mot de passe changé"}

@router.patch("/users/{username}/disable")
async def set_user_disabled(
    username: str,
    disabled: bool = Body(...),
    current_user: UserInDB = Depends(get_current_user),
    db=Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    if username == current_user.username:
        raise HTTPException(status_code=400, detail="Impossible de se désactiver soi-même")
    result = await db["users"].update_one({"username": username}, {"$set": {"disabled": disabled}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"msg": f"Utilisateur {'désactivé' if disabled else 'réactivé'}"}

@router.delete("/users/{username}")
async def delete_user(
    username: str,
    current_user: UserInDB = Depends(get_current_user),
    db=Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    if username == current_user.username:
        raise HTTPException(status_code=400, detail="Impossible de se supprimer soi-même")
    result = await db["users"].delete_one({"username": username})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"msg": "Utilisateur supprimé"}

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.patch("/users/{username}/password")
async def admin_change_password(
    username: str,
    new_password: str = Body(...),
    current_user: UserInDB = Depends(get_current_user),
    db=Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    if username == current_user.username:
        raise HTTPException(status_code=400, detail="Impossible de changer son propre mot de passe ici")
    user = await get_user(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Impossible de changer le mot de passe d'un autre admin")
    hashed = get_password_hash(new_password)
    await db["users"].update_one({"username": username}, {"$set": {"hashed_password": hashed}})
    return {"msg": "Mot de passe modifié pour l'utilisateur"}
