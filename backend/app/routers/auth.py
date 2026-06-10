from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.security import get_password_hash, verify_password, create_access_token
from app.dependencies import get_current_user
import secrets, json

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.Token, status_code=201)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(models.User).filter(models.User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    user = models.User(
        email=user_data.email, username=user_data.username,
        hashed_password=get_password_hash(user_data.password), role=user_data.role,
    )
    db.add(user)
    db.flush()
    if user_data.role == models.UserRole.student:
        db.add(models.StudentProfile(
            user_id=user.id, full_name=user_data.username,
            share_token=secrets.token_urlsafe(32),
            target_roles=json.dumps([]), skills=json.dumps([]),
        ))
    db.commit()
    db.refresh(user)
    return {"access_token": create_access_token({"sub": str(user.id), "role": user.role}), "token_type": "bearer"}

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")
    return {"access_token": create_access_token({"sub": str(user.id), "role": user.role}), "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user=Depends(get_current_user)):
    return current_user
