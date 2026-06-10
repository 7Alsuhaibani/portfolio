import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User, UserRole
from ..models.profile import StudentProfile
from ..models.project import PortfolioProject
from ..models.portfolio import ShareableLink, PortfolioReview, ReviewStatus
from ..schemas.portfolio import (
    ShareableLinkCreate, ShareableLinkResponse,
    ReviewCreate, ReviewResponse, DashboardStats
)
from ..schemas.profile import ProfileResponse
from ..schemas.project import ProjectResponse
from ..utils.auth import get_current_active_user

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


# ── Shareable Links ──────────────────────────────────────────────────────────

@router.post("/links", response_model=ShareableLinkResponse, status_code=201)
def create_shareable_link(
    data: ShareableLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    expires_at = None
    if data.expires_days:
        expires_at = datetime.utcnow() + timedelta(days=data.expires_days)

    token = secrets.token_urlsafe(32)
    link = ShareableLink(profile_id=profile.id, token=token, expires_at=expires_at)
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.get("/links", response_model=List[ShareableLinkResponse])
def get_my_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        return []
    return db.query(ShareableLink).filter(ShareableLink.profile_id == profile.id).all()


@router.delete("/links/{link_id}")
def deactivate_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    link = db.query(ShareableLink).filter(
        ShareableLink.id == link_id,
        ShareableLink.profile_id == profile.id
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    link.is_active = False
    db.commit()
    return {"message": "Link deactivated"}


# ── Public Portfolio View via Token ──────────────────────────────────────────

@router.get("/view/{token}")
def view_portfolio_by_token(token: str, db: Session = Depends(get_db)):
    link = db.query(ShareableLink).filter(
        ShareableLink.token == token,
        ShareableLink.is_active == True
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Portfolio link not found or inactive")
    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Portfolio link has expired")

    profile = link.profile
    projects = db.query(PortfolioProject).filter(
        PortfolioProject.profile_id == profile.id
    ).order_by(PortfolioProject.order_index).all()

    return {
        "profile": {
            "id": profile.id,
            "headline": profile.headline,
            "bio": profile.bio,
            "location": profile.location,
            "target_roles": profile.target_roles,
            "contact_email": profile.contact_email,
            "avatar_url": profile.avatar_url,
            "social_links": [{"type": l.link_type, "url": l.url, "label": l.label} for l in profile.social_links],
            "skills": [{"name": s.name, "category": s.category} for s in profile.skills],
            "resume": {"file_url": profile.resume.file_url, "filename": profile.resume.filename} if profile.resume else None,
            "owner_name": profile.user.full_name,
            "owner_email": profile.user.email,
        },
        "projects": [
            {
                "id": p.id,
                "title": p.title,
                "summary": p.summary,
                "description": p.description,
                "tech_stack": p.tech_stack,
                "skills_used": p.skills_used,
                "role": p.role,
                "duration": p.duration,
                "github_url": p.github_url,
                "demo_url": p.demo_url,
                "results": p.results,
                "is_featured": p.is_featured,
                "images": [{"url": i.image_url, "caption": i.caption} for i in p.images],
            }
            for p in projects
        ]
    }


# ── Reviews ──────────────────────────────────────────────────────────────────

@router.post("/reviews/{profile_id}", response_model=ReviewResponse, status_code=201)
def add_review(
    profile_id: int,
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.career_coach, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Only coaches and admins can review portfolios")

    profile = db.query(StudentProfile).filter(StudentProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    review = PortfolioReview(
        profile_id=profile_id,
        reviewer_id=current_user.id,
        status=data.status,
        feedback=data.feedback
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    result = ReviewResponse.model_validate(review)
    result.reviewer_name = current_user.full_name
    return result


@router.get("/reviews/me", response_model=List[ReviewResponse])
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        return []
    reviews = db.query(PortfolioReview).filter(PortfolioReview.profile_id == profile.id).all()
    result = []
    for r in reviews:
        rv = ReviewResponse.model_validate(r)
        rv.reviewer_name = r.reviewer.full_name
        result.append(rv)
    return result


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.admin, UserRole.career_coach]:
        raise HTTPException(status_code=403, detail="Access denied")

    total = db.query(StudentProfile).count()
    published = db.query(PortfolioReview).filter(PortfolioReview.status == ReviewStatus.published).count()
    needs_rev = db.query(PortfolioReview).filter(PortfolioReview.status == ReviewStatus.needs_revision).count()
    ready = db.query(PortfolioReview).filter(PortfolioReview.status == ReviewStatus.ready).count()
    proj_count = db.query(PortfolioProject).count()

    return DashboardStats(
        total_profiles=total,
        published_portfolios=published,
        needs_revision=needs_rev,
        ready_portfolios=ready,
        total_projects=proj_count
    )


# ── List All Profiles (Coach/Admin) ──────────────────────────────────────────

@router.get("/all-profiles")
def get_all_profiles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.admin, UserRole.career_coach]:
        raise HTTPException(status_code=403, detail="Access denied")

    profiles = db.query(StudentProfile).all()
    return [
        {
            "id": p.id,
            "user_id": p.user_id,
            "owner_name": p.user.full_name,
            "owner_email": p.user.email,
            "headline": p.headline,
            "is_public": p.is_public,
            "project_count": len(p.projects),
            "latest_review": p.reviews[-1].status if p.reviews else "draft",
        }
        for p in profiles
    ]
