from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
import os, shutil, uuid
from app.core.database import get_db
from app.models.models import User, StudentProfile, Resume
from app.schemas.schemas import ProfileCreate, ProfileUpdate, ProfileOut, ResumeOut
from app.api.deps import get_current_user, get_current_student
from app.core.config import settings

router = APIRouter(prefix="/profiles", tags=["Profiles"])

UPLOAD_DIR = settings.UPLOAD_DIR


def get_or_create_profile(user: User, db: Session) -> StudentProfile:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        profile = StudentProfile(user_id=user.id, contact_email=user.email)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/me", response_model=ProfileOut)
def get_my_profile(
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_or_create_profile(current_user, db)
    return profile


@router.put("/me", response_model=ProfileOut)
def update_my_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_or_create_profile(current_user, db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/me/avatar", response_model=ProfileOut)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Invalid image type. Use JPEG, PNG, or WebP")

    avatar_dir = os.path.join(UPLOAD_DIR, "avatars")
    os.makedirs(avatar_dir, exist_ok=True)

    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(avatar_dir, filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    profile = get_or_create_profile(current_user, db)
    profile.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/me/resume", response_model=ResumeOut)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    allowed_types = ["application/pdf", "application/msword",
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Resume must be PDF or Word document")

    file_content = await file.read()
    if len(file_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    resume_dir = os.path.join(UPLOAD_DIR, "resumes")
    os.makedirs(resume_dir, exist_ok=True)

    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(resume_dir, filename)

    with open(file_path, "wb") as f:
        f.write(file_content)

    profile = get_or_create_profile(current_user, db)

    if profile.resume:
        old_path = profile.resume.file_path
        if os.path.exists(old_path):
            os.remove(old_path)
        db.delete(profile.resume)
        db.flush()

    resume = Resume(
        profile_id=profile.id,
        filename=file.filename,
        file_path=file_path,
        file_size=len(file_content),
        mime_type=file.content_type,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.delete("/me/resume", status_code=204)
def delete_resume(
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_or_create_profile(current_user, db)
    if not profile.resume:
        raise HTTPException(status_code=404, detail="No resume found")
    if os.path.exists(profile.resume.file_path):
        os.remove(profile.resume.file_path)
    db.delete(profile.resume)
    db.commit()


# ─── Public profile view by token ────────────────────────────────────────────

@router.get("/public/{token}", response_model=ProfileOut)
def get_public_profile(token: str, db: Session = Depends(get_db)):
    from app.models.models import ShareableLink, VisibilityType
    from datetime import datetime

    link = db.query(ShareableLink).filter(
        ShareableLink.token == token,
        ShareableLink.is_active == True
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Portfolio link has expired")

    link.view_count += 1
    db.commit()

    profile = db.query(StudentProfile).filter(StudentProfile.id == link.profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


# ─── Admin: list all profiles ─────────────────────────────────────────────────

@router.get("/admin/all", response_model=List[ProfileOut])
def get_all_profiles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.models import UserRole
    if current_user.role not in [UserRole.admin, UserRole.career_coach]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(StudentProfile).all()
