from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import secrets
from app.database import get_db
from app.models import User, StudentProfile, ShareableLink
from app.schemas import ShareableLinkCreate, ShareableLinkOut, PublicProfileOut
from app.utils.auth import get_current_user, get_current_student

router = APIRouter(prefix="/api/share", tags=["Sharing"])


# ─── Generate Shareable Link ───────────────────────────────────────────
@router.post("/links", response_model=ShareableLinkOut, status_code=201)
def create_shareable_link(
    data: ShareableLinkCreate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    token = secrets.token_urlsafe(32)
    link = ShareableLink(
        profile_id=profile.id,
        token=token,
        expires_at=data.expires_at,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.get("/links", response_model=List[ShareableLinkOut])
def get_my_links(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        return []
    return (
        db.query(ShareableLink)
        .filter(ShareableLink.profile_id == profile.id)
        .order_by(ShareableLink.created_at.desc())
        .all()
    )


@router.delete("/links/{link_id}")
def deactivate_link(
    link_id: int,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    link = db.query(ShareableLink).filter(
        ShareableLink.id == link_id,
        ShareableLink.profile_id == profile.id,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    link.is_active = False
    db.commit()
    return {"message": "Link deactivated"}


# ─── Public Portfolio View via Token ──────────────────────────────────
@router.get("/view/{token}", response_model=PublicProfileOut)
def view_portfolio_by_token(
    token: str,
    db: Session = Depends(get_db),
):
    link = db.query(ShareableLink).filter(
        ShareableLink.token == token,
        ShareableLink.is_active == True,
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Portfolio link not found or inactive")

    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Portfolio link has expired")

    # Increment view count
    link.view_count += 1
    db.commit()

    return link.profile


# ─── Public Portfolio View via Slug ───────────────────────────────────
@router.get("/slug/{slug}", response_model=PublicProfileOut)
def view_portfolio_by_slug(
    slug: str,
    db: Session = Depends(get_db),
):
    profile = db.query(StudentProfile).filter(
        StudentProfile.slug == slug,
        StudentProfile.is_public == True,
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Portfolio not found or not public")

    return profile
