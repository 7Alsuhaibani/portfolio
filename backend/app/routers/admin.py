from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])

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
