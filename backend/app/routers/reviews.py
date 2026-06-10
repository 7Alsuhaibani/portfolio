from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_user, require_coach_or_admin

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

@router.post("/submit-for-review")
def submit_for_review(cu=Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == cu.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile.review_status = models.ReviewStatus.ready
    db.commit()
    return {"message": "Portfolio submitted for review", "status": "ready"}

@router.post("/{profile_id}", response_model=schemas.ReviewOut, status_code=201)
def create_review(profile_id: int, data: schemas.ReviewCreate, cu=Depends(require_coach_or_admin), db: Session = Depends(get_db)):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    review = models.PortfolioReview(profile_id=profile_id, reviewer_id=cu.id, status=data.status, feedback=data.feedback)
    db.add(review)
    profile.review_status = data.status
    db.commit()
    db.refresh(review)
    return review

@router.get("/{profile_id}", response_model=List[schemas.ReviewOut])
def get_reviews(profile_id: int, cu=Depends(get_current_user), db: Session = Depends(get_db)):
    if cu.role == models.UserRole.student:
        my = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == cu.id).first()
        if not my or my.id != profile_id:
            raise HTTPException(status_code=403, detail="Access denied")
    return db.query(models.PortfolioReview).filter(models.PortfolioReview.profile_id == profile_id).order_by(models.PortfolioReview.created_at.desc()).all()
