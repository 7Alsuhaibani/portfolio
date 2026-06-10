from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    student = "student"
    coach = "coach"
    employer = "employer"

class ReviewStatus(str, enum.Enum):
    draft = "draft"
    needs_revision = "needs_revision"
    ready = "ready"
    published = "published"

class LinkType(str, enum.Enum):
    linkedin = "linkedin"
    github = "github"
    website = "website"
    demo = "demo"
    blog = "blog"
    other = "other"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.student)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    full_name = Column(String(200), nullable=False)
    headline = Column(String(300))
    bio = Column(Text)
    location = Column(String(200))
    contact_email = Column(String(255))
    avatar_url = Column(String(500))
    target_roles = Column(Text)
    skills = Column(Text)
    review_status = Column(Enum(ReviewStatus), default=ReviewStatus.draft)
    is_public = Column(Boolean, default=False)
    share_token = Column(String(100), unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    user = relationship("User", back_populates="profile")
    resume = relationship("Resume", back_populates="profile", uselist=False, cascade="all, delete-orphan")
    social_links = relationship("SocialLink", back_populates="profile", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="profile", cascade="all, delete-orphan", order_by="Project.order_index")
    reviews = relationship("PortfolioReview", back_populates="profile", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), unique=True)
    filename = Column(String(500))
    original_name = Column(String(500))
    file_size = Column(Integer)
    file_url = Column(String(500))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    profile = relationship("StudentProfile", back_populates="resume")

class SocialLink(Base):
    __tablename__ = "social_links"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"))
    link_type = Column(Enum(LinkType), default=LinkType.other)
    url = Column(String(1000), nullable=False)
    label = Column(String(200))
    profile = relationship("StudentProfile", back_populates="social_links")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"))
    title = Column(String(300), nullable=False)
    summary = Column(String(500))
    description = Column(Text)
    business_problem = Column(Text)
    solution = Column(Text)
    architecture = Column(Text)
    tech_stack = Column(Text)
    skills_used = Column(Text)
    role = Column(String(200))
    duration = Column(String(100))
    results = Column(Text)
    github_url = Column(String(1000))
    demo_url = Column(String(1000))
    is_featured = Column(Boolean, default=False)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    profile = relationship("StudentProfile", back_populates="projects")
    images = relationship("ProjectImage", back_populates="project", cascade="all, delete-orphan")

class ProjectImage(Base):
    __tablename__ = "project_images"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    filename = Column(String(500))
    original_name = Column(String(500))
    image_url = Column(String(500))
    caption = Column(String(500))
    order_index = Column(Integer, default=0)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    project = relationship("Project", back_populates="images")

class PortfolioReview(Base):
    __tablename__ = "portfolio_reviews"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"))
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(ReviewStatus), default=ReviewStatus.draft)
    feedback = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    profile = relationship("StudentProfile", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
