from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from slugify import slugify
from app.database import get_db
from app.models import User, StudentProfile, SocialLink
from app.schemas import (
    ProfileCreate, ProfileUpdate, ProfileOut,
    SocialLinkCreate, SocialLinkOut,
)
from app.utils.auth import get_current_user, get_current_student
from app.utils.files import save_upload_file, delete_file
from app.config import settings
import json

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])


def get_or_create_profile(user: User, db: Session) -> StudentProfile:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please create one first.")
    return profile


# ─── Create / Get My Profile ───────────────────────────────────────────
@router.post("", response_model=ProfileOut, status_code=201)
def create_profile(
    data: ProfileCreate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    existing = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")

    base_slug = slugify(current_user.full_name)
    slug = base_slug
    counter = 1
    while db.query(StudentProfile).filter(StudentProfile.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    profile = StudentProfile(
        user_id=current_user.id,
        slug=slug,
        **data.model_dump(),
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/me", response_model=ProfileOut)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/me", response_model=ProfileOut)
def update_my_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(current_user, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


# ─── Upload Photo ──────────────────────────────────────────────────────
@router.post("/me/photo", response_model=ProfileOut)
async def upload_profile_photo(
    photo: UploadFile = File(...),
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(current_user, db)

    # Delete old photo
    if profile.profile_photo:
        delete_file(profile.profile_photo)

    file_path = await save_upload_file(
        photo, "photos", settings.ALLOWED_IMAGE_TYPES
    )
    profile.profile_photo = file_path
    db.commit()
    db.refresh(profile)
    return profile


# ─── Upload Resume ─────────────────────────────────────────────────────
@router.post("/me/resume", response_model=ProfileOut)
async def upload_resume(
    resume: UploadFile = File(...),
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(current_user, db)

    if profile.resume_file:
        delete_file(profile.resume_file)

    file_path = await save_upload_file(
        resume, "resumes", settings.ALLOWED_RESUME_TYPES
    )
    profile.resume_file = file_path
    profile.resume_filename = resume.filename
    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/me/resume", response_model=ProfileOut)
def delete_resume(
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(current_user, db)
    if profile.resume_file:
        delete_file(profile.resume_file)
    profile.resume_file = None
    profile.resume_filename = None
    db.commit()
    db.refresh(profile)
    return profile


# ─── Social Links ──────────────────────────────────────────────────────
@router.post("/me/links", response_model=SocialLinkOut, status_code=201)
def add_social_link(
    data: SocialLinkCreate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(current_user, db)
    link = SocialLink(profile_id=profile.id, **data.model_dump())
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.get("/me/links", response_model=List[SocialLinkOut])
def get_social_links(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(current_user, db)
    return profile.social_links


@router.delete("/me/links/{link_id}")
def delete_social_link(
    link_id: int,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(current_user, db)
    link = db.query(SocialLink).filter(
        SocialLink.id == link_id,
        SocialLink.profile_id == profile.id,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    db.delete(link)
    db.commit()
    return {"message": "Link deleted"}


# ─── Visibility ────────────────────────────────────────────────────────
@router.patch("/me/visibility")
def update_visibility(
    is_public: bool,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    profile = get_or_create_profile(current_user, db)
    profile.is_public = is_public
    db.commit()
    return {"is_public": profile.is_public}


# ─── All Profiles (Admin / Coach) ─────────────────────────────────────
@router.get("", response_model=List[ProfileOut])
def list_all_profiles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models import UserRole
    if current_user.role not in [UserRole.admin, UserRole.coach]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(StudentProfile).all()
