from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, PortfolioStatus, VisibilityType, LinkType


# ─── Auth Schemas ────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.student


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Social Link Schemas ──────────────────────────────────────────────────────

class SocialLinkCreate(BaseModel):
    link_type: LinkType
    url: str
    label: str = ""


class SocialLinkOut(SocialLinkCreate):
    id: int
    profile_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Resume Schemas ───────────────────────────────────────────────────────────

class ResumeOut(BaseModel):
    id: int
    profile_id: int
    filename: str
    file_size: Optional[int]
    mime_type: Optional[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ─── Project Image Schemas ────────────────────────────────────────────────────

class ProjectImageOut(BaseModel):
    id: int
    project_id: int
    filename: str
    file_path: str
    caption: str
    order_index: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ─── Portfolio Project Schemas ────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    title: str
    summary: str = ""
    description: str = ""
    business_problem: str = ""
    solution: str = ""
    architecture: str = ""
    role: str = ""
    duration: str = ""
    tech_stack: str = ""
    skills_used: str = ""
    results: str = ""
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    is_featured: bool = False
    order_index: int = 0


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    business_problem: Optional[str] = None
    solution: Optional[str] = None
    architecture: Optional[str] = None
    role: Optional[str] = None
    duration: Optional[str] = None
    tech_stack: Optional[str] = None
    skills_used: Optional[str] = None
    results: Optional[str] = None
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    is_featured: Optional[bool] = None
    order_index: Optional[int] = None


class ProjectOut(BaseModel):
    id: int
    profile_id: int
    title: str
    summary: str
    description: str
    business_problem: str
    solution: str
    architecture: str
    role: str
    duration: str
    tech_stack: str
    skills_used: str
    results: str
    github_url: Optional[str]
    demo_url: Optional[str]
    is_featured: bool
    order_index: int
    created_at: datetime
    updated_at: Optional[datetime]
    images: List[ProjectImageOut] = []

    class Config:
        from_attributes = True


# ─── Student Profile Schemas ──────────────────────────────────────────────────

class ProfileCreate(BaseModel):
    full_name: str
    headline: str = ""
    bio: str = ""
    location: str = ""
    contact_email: str = ""
    target_roles: str = ""
    skills: str = ""


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    contact_email: Optional[str] = None
    target_roles: Optional[str] = None
    skills: Optional[str] = None
    status: Optional[PortfolioStatus] = None


class ProfileOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    headline: str
    bio: str
    location: str
    contact_email: str
    target_roles: str
    skills: str
    avatar_url: Optional[str]
    status: PortfolioStatus
    created_at: datetime
    updated_at: Optional[datetime]
    resume: Optional[ResumeOut] = None
    social_links: List[SocialLinkOut] = []
    projects: List[ProjectOut] = []

    class Config:
        from_attributes = True


# ─── Shareable Link Schemas ───────────────────────────────────────────────────

class ShareableLinkCreate(BaseModel):
    visibility: VisibilityType = VisibilityType.public
    expires_at: Optional[datetime] = None


class ShareableLinkOut(BaseModel):
    id: int
    profile_id: int
    token: str
    visibility: VisibilityType
    is_active: bool
    expires_at: Optional[datetime]
    view_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Portfolio Review Schemas ─────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    status: PortfolioStatus
    feedback: str = ""


class ReviewOut(BaseModel):
    id: int
    profile_id: int
    reviewer_id: int
    status: PortfolioStatus
    feedback: str
    created_at: datetime
    updated_at: Optional[datetime]
    reviewer: UserOut

    class Config:
        from_attributes = True


# ─── Dashboard Schemas ────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_profiles: int
    published_profiles: int
    ready_profiles: int
    needs_revision_profiles: int
    draft_profiles: int
    total_projects: int
    total_users: int


# Update forward reference
Token.model_rebuild()
