from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User, UserRole
from ..models.profile import StudentProfile, SocialLink, Skill
from ..models.resume import Resume
from ..schemas.profile import (
    ProfileCreate, ProfileUpdate, ProfileResponse,
    SocialLinkCreate, SocialLinkResponse, SkillCreate, SkillResponse
)
from ..utils.auth import get_current_active_user
from ..utils.files import save_upload_file, delete_file, validate_image, validate_resume

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.post("", response_model=ProfileResponse, status_code=201)
def create_profile(
    data: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first():
        raise HTTPException(status_code=400, detail="Profile already exists")
    profile = StudentProfile(user_id=current_user.id, **data.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/me", response_model=ProfileResponse)
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/me/avatar", response_model=ProfileResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    validate_image(file)
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.avatar_url:
        delete_file(profile.avatar_url)
    _, file_url, _ = await save_upload_file(file, "avatars")
    profile.avatar_url = file_url
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/me/resume", status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    validate_resume(file)
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    existing = db.query(Resume).filter(Resume.profile_id == profile.id).first()
    if existing:
        delete_file(existing.file_url)
        db.delete(existing)
        db.commit()

    filename, file_url, file_size = await save_upload_file(file, "resumes")
    resume = Resume(
        profile_id=profile.id,
        filename=file.filename,
        file_url=file_url,
        file_size=file_size,
        mime_type=file.content_type
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return {"message": "Resume uploaded successfully", "file_url": file_url, "filename": file.filename}


# Social Links
@router.post("/me/links", response_model=SocialLinkResponse, status_code=201)
def add_social_link(
    data: SocialLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    link = SocialLink(profile_id=profile.id, **data.model_dump())
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.delete("/me/links/{link_id}")
def delete_social_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    link = db.query(SocialLink).filter(SocialLink.id == link_id, SocialLink.profile_id == profile.id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    db.delete(link)
    db.commit()
    return {"message": "Link deleted"}


# Skills
@router.post("/me/skills", response_model=SkillResponse, status_code=201)
def add_skill(
    data: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    skill = Skill(profile_id=profile.id, **data.model_dump())
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.delete("/me/skills/{skill_id}")
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    skill = db.query(Skill).filter(Skill.id == skill_id, Skill.profile_id == profile.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()
    return {"message": "Skill deleted"}
