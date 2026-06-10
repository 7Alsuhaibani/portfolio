"""Seed route to populate database with mock data for testing"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User, UserRole
from ..models.profile import StudentProfile, SocialLink, Skill
from ..models.project import PortfolioProject
from ..utils.auth import get_password_hash
import secrets

router = APIRouter(prefix="/seed", tags=["Development"])

MOCK_STUDENTS = [
    {"name": "Sara Al-Rashid", "email": "sara@demo.com", "headline": "Data Scientist | Python & ML",
     "bio": "Passionate about turning raw data into actionable insights.", "location": "Riyadh, SA",
     "target_roles": "Data Scientist, ML Engineer", "skills": ["Python", "TensorFlow", "SQL", "Tableau"]},
    {"name": "Ahmed Khalid", "email": "ahmed@demo.com", "headline": "Full-Stack Developer | React & FastAPI",
     "bio": "Building scalable web apps with modern tech.", "location": "Dubai, UAE",
     "target_roles": "Full-Stack Developer, Backend Engineer", "skills": ["React", "FastAPI", "PostgreSQL", "Docker"]},
    {"name": "Layla Hassan", "email": "layla@demo.com", "headline": "AI Engineer | NLP & Computer Vision",
     "bio": "Specialized in NLP and deep learning applications.", "location": "Cairo, EG",
     "target_roles": "AI Engineer, Research Scientist", "skills": ["PyTorch", "Transformers", "OpenCV", "AWS"]},
]

MOCK_PROJECTS = [
    {"title": "Sales Forecasting Dashboard", "summary": "ML model predicting sales with 94% accuracy",
     "tech_stack": "Python, scikit-learn, Streamlit, PostgreSQL",
     "description": "## Overview\nBuilt a complete sales forecasting pipeline...\n\n## Results\n- 94% accuracy on test set\n- Reduced manual forecasting time by 80%",
     "github_url": "https://github.com/example/sales-forecast", "demo_url": "https://demo.example.com/sales"},
    {"title": "Portfolio Platform (This Project!)", "summary": "Full-stack student portfolio system",
     "tech_stack": "React, FastAPI, SQLAlchemy, SQLite",
     "description": "## Overview\nBuilt the platform you are currently viewing...\n\n## Features\n- Authentication\n- Project Management\n- Shareable Links",
     "github_url": "https://github.com/example/portfolio"},
    {"title": "NLP Sentiment Analyzer", "summary": "Real-time tweet sentiment analysis API",
     "tech_stack": "Python, HuggingFace, FastAPI, Redis",
     "description": "## Overview\nDeployed a BERT-based model for real-time sentiment analysis.",
     "demo_url": "https://demo.example.com/sentiment"},
]


@router.post("/run")
def seed_database(db: Session = Depends(get_db)):
    # Check if already seeded
    if db.query(User).filter(User.email == "admin@demo.com").first():
        return {"message": "Database already seeded"}

    # Create admin
    admin = User(
        email="admin@demo.com",
        full_name="Admin User",
        hashed_password=get_password_hash("admin123"),
        role=UserRole.admin
    )
    db.add(admin)

    # Create coach
    coach = User(
        email="coach@demo.com",
        full_name="Career Coach",
        hashed_password=get_password_hash("coach123"),
        role=UserRole.career_coach
    )
    db.add(coach)
    db.flush()

    # Create students with profiles and projects
    created_tokens = []
    for i, student_data in enumerate(MOCK_STUDENTS):
        user = User(
            email=student_data["email"],
            full_name=student_data["name"],
            hashed_password=get_password_hash("student123"),
            role=UserRole.student
        )
        db.add(user)
        db.flush()

        profile = StudentProfile(
            user_id=user.id,
            headline=student_data["headline"],
            bio=student_data["bio"],
            location=student_data["location"],
            target_roles=student_data["target_roles"],
            contact_email=student_data["email"],
            is_public=True
        )
        db.add(profile)
        db.flush()

        for skill_name in student_data["skills"]:
            db.add(Skill(profile_id=profile.id, name=skill_name, category="technical"))

        db.add(SocialLink(profile_id=profile.id, link_type="github", url="https://github.com/example", label="GitHub"))
        db.add(SocialLink(profile_id=profile.id, link_type="linkedin", url="https://linkedin.com/in/example", label="LinkedIn"))

        proj_data = MOCK_PROJECTS[i % len(MOCK_PROJECTS)]
        project = PortfolioProject(
            profile_id=profile.id,
            title=proj_data["title"],
            summary=proj_data["summary"],
            tech_stack=proj_data["tech_stack"],
            description=proj_data["description"],
            github_url=proj_data.get("github_url"),
            demo_url=proj_data.get("demo_url"),
            is_featured=True
        )
        db.add(project)
        db.flush()

        # Shareable link
        from ..models.portfolio import ShareableLink
        token = secrets.token_urlsafe(32)
        db.add(ShareableLink(profile_id=profile.id, token=token, is_active=True))
        created_tokens.append({"student": student_data["name"], "token": token})

    db.commit()
    return {
        "message": "Database seeded successfully",
        "accounts": {
            "admin": {"email": "admin@demo.com", "password": "admin123"},
            "coach": {"email": "coach@demo.com", "password": "coach123"},
            "students": [{"email": s["email"], "password": "student123"} for s in MOCK_STUDENTS]
        },
        "shareable_links": created_tokens
    }
