from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import User, StudentProfile, SocialLink
from app.schemas.schemas import SocialLinkCreate, SocialLinkOut
from app.api.deps import get_current_student

router = APIRouter(prefix="/links", tags=["Social Links"])


def get_profile_or_404(user: User, db: Session) -> StudentProfile:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/", response_model=List[SocialLinkOut])
def get_links(
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    return db.query(SocialLink).filter(SocialLink.profile_id == profile.id).all()


@router.post("/", response_model=SocialLinkOut, status_code=201)
def add_link(
    data: SocialLinkCreate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    link = SocialLink(profile_id=profile.id, **data.model_dump())
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.put("/{link_id}", response_model=SocialLinkOut)
def update_link(
    link_id: int,
    data: SocialLinkCreate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    link = db.query(SocialLink).filter(
        SocialLink.id == link_id,
        SocialLink.profile_id == profile.id
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    for field, value in data.model_dump().items():
        setattr(link, field, value)
    db.commit()
    db.refresh(link)
    return link


@router.delete("/{link_id}", status_code=204)
def delete_link(
    link_id: int,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    link = db.query(SocialLink).filter(
        SocialLink.id == link_id,
        SocialLink.profile_id == profile.id
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    db.delete(link)
    db.commit()
