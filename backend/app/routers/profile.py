from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_user
import os, shutil, secrets, json
from pathlib import Path

router = APIRouter(prefix="/api/profile", tags=["Profile"])
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

@router.get("/me", response_model=schemas.ProfileOut)
def get_my_profile(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/me", response_model=schemas.ProfileOut)
def update_my_profile(data: schemas.ProfileUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    update_data = data.model_dump(exclude_unset=True)
    for f in ["target_roles", "skills"]:
        if f in update_data and isinstance(update_data[f], list):
            update_data[f] = json.dumps(update_data[f])
    for key, value in update_data.items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile

@router.post("/me/avatar", response_model=schemas.ProfileOut)
async def upload_avatar(file: UploadFile = File(...), current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    d = Path(UPLOAD_DIR) / "avatars"
    d.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix.lower()
    fn = f"avatar_{current_user.id}{ext}"
    with open(d / fn, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    profile.avatar_url = f"/uploads/avatars/{fn}"
    db.commit()
    db.refresh(profile)
    return profile

@router.post("/me/resume", response_model=schemas.ResumeOut)
async def upload_resume(file: UploadFile = File(...), current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    allowed = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only PDF and Word files allowed")
    content = await file.read()
    if len(content) > 10485760:
        raise HTTPException(status_code=400, detail="File exceeds 10MB")
    d = Path(UPLOAD_DIR) / "resumes"
    d.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix.lower()
    fn = f"resume_{current_user.id}_{secrets.token_hex(8)}{ext}"
    with open(d / fn, "wb") as f:
        f.write(content)
    if profile.resume:
        old = Path(UPLOAD_DIR) / "resumes" / profile.resume.filename
        if old.exists():
            old.unlink()
        db.delete(profile.resume)
    resume = models.Resume(profile_id=profile.id, filename=fn, original_name=file.filename, file_size=len(content), file_url=f"/uploads/resumes/{fn}")
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume

@router.delete("/me/resume")
def delete_resume(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile or not profile.resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    old = Path(UPLOAD_DIR) / "resumes" / profile.resume.filename
    if old.exists():
        old.unlink()
    db.delete(profile.resume)
    db.commit()
    return {"message": "Resume deleted"}

@router.post("/me/links", response_model=schemas.SocialLinkOut, status_code=201)
def add_social_link(data: schemas.SocialLinkCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    link = models.SocialLink(profile_id=profile.id, link_type=data.link_type, url=str(data.url), label=data.label)
    db.add(link)
    db.commit()
    db.refresh(link)
    return link

@router.delete("/me/links/{link_id}")
def delete_social_link(link_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    link = db.query(models.SocialLink).filter(models.SocialLink.id == link_id, models.SocialLink.profile_id == profile.id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    db.delete(link)
    db.commit()
    return {"message": "Link deleted"}

@router.post("/me/share-token", response_model=schemas.ProfileOut)
def regenerate_share_token(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile.share_token = secrets.token_urlsafe(32)
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/public/{share_token}", response_model=schemas.ProfileOut)
def get_public_portfolio(share_token: str, db: Session = Depends(get_db)):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.share_token == share_token).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return profile

@router.get("/all", response_model=List[schemas.ProfileSummary])
def list_all_profiles(status: Optional[str] = None, skip: int = 0, limit: int = 50, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [models.UserRole.admin, models.UserRole.coach]:
        raise HTTPException(status_code=403, detail="Access denied")
    q = db.query(models.StudentProfile)
    if status:
        q = q.filter(models.StudentProfile.review_status == status)
    return [schemas.ProfileSummary(
        id=p.id, user_id=p.user_id, full_name=p.full_name, headline=p.headline,
        location=p.location, avatar_url=p.avatar_url, skills=p.skills,
        review_status=p.review_status, is_public=p.is_public, share_token=p.share_token,
        projects_count=len(p.projects)
    ) for p in q.offset(skip).limit(limit).all()]
