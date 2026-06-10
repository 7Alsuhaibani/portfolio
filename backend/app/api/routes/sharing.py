from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import User, StudentProfile, ShareableLink, PortfolioReview
from app.schemas.schemas import (
    ShareableLinkCreate, ShareableLinkOut,
    ReviewCreate, ReviewOut
)
from app.api.deps import get_current_student, get_current_user, get_current_coach_or_admin

share_router = APIRouter(prefix="/share", tags=["Shareable Links"])
review_router = APIRouter(prefix="/reviews", tags=["Reviews"])


def get_profile_or_404(user: User, db: Session) -> StudentProfile:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


# ─── Shareable Links ──────────────────────────────────────────────────────────

@share_router.get("/", response_model=List[ShareableLinkOut])
def get_my_links(
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    return db.query(ShareableLink).filter(ShareableLink.profile_id == profile.id).all()


@share_router.post("/", response_model=ShareableLinkOut, status_code=201)
def create_share_link(
    data: ShareableLinkCreate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    link = ShareableLink(
        profile_id=profile.id,
        visibility=data.visibility,
        expires_at=data.expires_at
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@share_router.delete("/{link_id}", status_code=204)
def deactivate_link(
    link_id: int,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    link = db.query(ShareableLink).filter(
        ShareableLink.id == link_id,
        ShareableLink.profile_id == profile.id
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    link.is_active = False
    db.commit()


# ─── Reviews ─────────────────────────────────────────────────────────────────

@review_router.get("/my", response_model=List[ReviewOut])
def get_my_reviews(
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    return db.query(PortfolioReview).filter(PortfolioReview.profile_id == profile.id).all()


@review_router.post("/{profile_id}", response_model=ReviewOut, status_code=201)
def create_review(
    profile_id: int,
    data: ReviewCreate,
    current_user: User = Depends(get_current_coach_or_admin),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    review = PortfolioReview(
        profile_id=profile.id,
        reviewer_id=current_user.id,
        status=data.status,
        feedback=data.feedback
    )
    db.add(review)
    profile.status = data.status
    db.commit()
    db.refresh(review)
    return review


@review_router.get("/profile/{profile_id}", response_model=List[ReviewOut])
def get_profile_reviews(
    profile_id: int,
    current_user: User = Depends(get_current_coach_or_admin),
    db: Session = Depends(get_db)
):
    return db.query(PortfolioReview).filter(PortfolioReview.profile_id == profile_id).all()
