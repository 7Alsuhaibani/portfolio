from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    admin = "admin"
    student = "student"
    career_coach = "career_coach"
    employer = "employer"


class PortfolioStatus(str, enum.Enum):
    draft = "draft"
    needs_revision = "needs_revision"
    ready = "ready"
    published = "published"


class VisibilityType(str, enum.Enum):
    public = "public"
    private = "private"
    token = "token"


class LinkType(str, enum.Enum):
    linkedin = "linkedin"
    github = "github"
    website = "website"
    demo = "demo"
    blog = "blog"
    other = "other"


# ─── User ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.student, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"


# ─── Student Profile ─────────────────────────────────────────────────────────

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False, default="")
    headline = Column(String(255), default="")
    bio = Column(Text, default="")
    location = Column(String(255), default="")
    contact_email = Column(String(255), default="")
    target_roles = Column(Text, default="")   # comma-separated
    skills = Column(Text, default="")          # comma-separated
    avatar_url = Column(String(500), nullable=True)
    status = Column(Enum(PortfolioStatus), default=PortfolioStatus.draft)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile")
    resume = relationship("Resume", back_populates="profile", uselist=False, cascade="all, delete-orphan")
    social_links = relationship("SocialLink", back_populates="profile", cascade="all, delete-orphan")
    projects = relationship("PortfolioProject", back_populates="profile", cascade="all, delete-orphan", order_by="PortfolioProject.order_index")
    shareable_links = relationship("ShareableLink", back_populates="profile", cascade="all, delete-orphan")
    reviews = relationship("PortfolioReview", back_populates="profile", cascade="all, delete-orphan")


# ─── Resume ──────────────────────────────────────────────────────────────────

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id"), unique=True, nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("StudentProfile", back_populates="resume")


# ─── Social Link ─────────────────────────────────────────────────────────────

class SocialLink(Base):
    __tablename__ = "social_links"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    link_type = Column(Enum(LinkType), nullable=False)
    url = Column(String(500), nullable=False)
    label = Column(String(255), default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("StudentProfile", back_populates="social_links")


# ─── Portfolio Project ────────────────────────────────────────────────────────

class PortfolioProject(Base):
    __tablename__ = "portfolio_projects"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text, default="")
    description = Column(Text, default="")       # Markdown content
    business_problem = Column(Text, default="")
    solution = Column(Text, default="")
    architecture = Column(Text, default="")
    role = Column(String(255), default="")
    duration = Column(String(100), default="")
    tech_stack = Column(Text, default="")         # comma-separated
    skills_used = Column(Text, default="")        # comma-separated
    results = Column(Text, default="")
    github_url = Column(String(500), nullable=True)
    demo_url = Column(String(500), nullable=True)
    is_featured = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    profile = relationship("StudentProfile", back_populates="projects")
    images = relationship("ProjectImage", back_populates="project", cascade="all, delete-orphan")


# ─── Project Image ────────────────────────────────────────────────────────────

class ProjectImage(Base):
    __tablename__ = "project_images"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("portfolio_projects.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    caption = Column(String(500), default="")
    order_index = Column(Integer, default=0)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("PortfolioProject", back_populates="images")


# ─── Shareable Link ───────────────────────────────────────────────────────────

class ShareableLink(Base):
    __tablename__ = "shareable_links"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    token = Column(String(100), unique=True, index=True, default=generate_uuid)
    visibility = Column(Enum(VisibilityType), default=VisibilityType.public)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("StudentProfile", back_populates="shareable_links")


# ─── Portfolio Review ─────────────────────────────────────────────────────────

class PortfolioReview(Base):
    __tablename__ = "portfolio_reviews"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(PortfolioStatus), default=PortfolioStatus.draft)
    feedback = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    profile = relationship("StudentProfile", back_populates="reviews")
    reviewer = relationship("User")
