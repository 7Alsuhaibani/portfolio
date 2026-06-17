from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_user, require_admin
import os
from pathlib import Path

router = APIRouter(prefix="/api/admin", tags=["Admin"])
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(cu=Depends(get_current_user), db: Session = Depends(get_db)):
    if cu.role not in [models.UserRole.admin, models.UserRole.coach]:
        raise HTTPException(status_code=403, detail="Access denied")
    return schemas.DashboardStats(
        total_profiles=db.query(models.StudentProfile).count(),
        published_profiles=db.query(models.StudentProfile).filter(models.StudentProfile.review_status == models.ReviewStatus.published).count(),
        needs_revision=db.query(models.StudentProfile).filter(models.StudentProfile.review_status == models.ReviewStatus.needs_revision).count(),
        total_projects=db.query(models.Project).count(),
        ready_profiles=db.query(models.StudentProfile).filter(models.StudentProfile.review_status == models.ReviewStatus.ready).count(),
    )


@router.delete("/profiles/{profile_id}")
def delete_portfolio(profile_id: int, cu=Depends(require_admin), db: Session = Depends(get_db)):
    """Admin-only: permanently delete a student portfolio and its owning account.

    Deleting the user cascades to the profile and all of its projects,
    project images, social links, resume record and reviews.
    """
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    owner = db.query(models.User).filter(models.User.id == profile.user_id).first()

    # Safety: never let an admin delete another admin account through this route.
    if owner and owner.role == models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Cannot delete an admin account")

    # Best-effort cleanup of uploaded files (avatar + resume) before DB delete.
    try:
        if profile.avatar_url:
            avatar_path = Path("." + profile.avatar_url)
            if avatar_path.exists():
                avatar_path.unlink()
        if profile.resume and profile.resume.filename:
            resume_path = Path(UPLOAD_DIR) / "resumes" / profile.resume.filename
            if resume_path.exists():
                resume_path.unlink()
    except Exception:
        # File cleanup must never block the deletion itself.
        pass

    if owner:
        # Cascades remove the profile and all related rows.
        db.delete(owner)
    else:
        db.delete(profile)
    db.commit()
    return {"message": "Portfolio deleted", "profile_id": profile_id}