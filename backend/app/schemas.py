from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import json

class UserRole(str, Enum):
    admin = "admin"
    student = "student"
    coach = "coach"
    employer = "employer"

class ReviewStatus(str, Enum):
    draft = "draft"
    needs_revision = "needs_revision"
    ready = "ready"
    published = "published"

class LinkType(str, Enum):
    linkedin = "linkedin"
    github = "github"
    website = "website"
    demo = "demo"
    blog = "blog"
    other = "other"

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: UserRole = UserRole.student

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserOut(BaseModel):
    id: int
    email: str
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class ResumeOut(BaseModel):
    id: int
    filename: str
    original_name: str
    file_size: Optional[int]
    file_url: str
    uploaded_at: datetime
    model_config = {"from_attributes": True}

class SocialLinkCreate(BaseModel):
    link_type: LinkType
    url: str
    label: Optional[str] = None

class SocialLinkOut(BaseModel):
    id: int
    link_type: LinkType
    url: str
    label: Optional[str]
    model_config = {"from_attributes": True}

class ProjectImageOut(BaseModel):
    id: int
    filename: str
    image_url: str
    caption: Optional[str]
    order_index: int
    model_config = {"from_attributes": True}

class ProjectCreate(BaseModel):
    title: str
    summary: Optional[str] = None
    description: Optional[str] = None
    business_problem: Optional[str] = None
    solution: Optional[str] = None
    architecture: Optional[str] = None
    tech_stack: Optional[List[str]] = []
    skills_used: Optional[List[str]] = []
    role: Optional[str] = None
    duration: Optional[str] = None
    results: Optional[str] = None
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
    tech_stack: Optional[List[str]] = None
    skills_used: Optional[List[str]] = None
    role: Optional[str] = None
    duration: Optional[str] = None
    results: Optional[str] = None
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    is_featured: Optional[bool] = None
    order_index: Optional[int] = None

class ProjectOut(BaseModel):
    id: int
    title: str
    summary: Optional[str]
    description: Optional[str]
    business_problem: Optional[str]
    solution: Optional[str]
    architecture: Optional[str]
    tech_stack: List[str] = []
    skills_used: List[str] = []
    role: Optional[str]
    duration: Optional[str]
    results: Optional[str]
    github_url: Optional[str]
    demo_url: Optional[str]
    is_featured: bool
    order_index: int
    images: List[ProjectImageOut] = []
    created_at: datetime
    updated_at: Optional[datetime]
    model_config = {"from_attributes": True}

    @field_validator("tech_stack", "skills_used", mode="before")
    @classmethod
    def parse_json_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v or []

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    contact_email: Optional[str] = None
    target_roles: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    is_public: Optional[bool] = None

class ProfileOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    headline: Optional[str]
    bio: Optional[str]
    location: Optional[str]
    contact_email: Optional[str]
    avatar_url: Optional[str]
    target_roles: List[str] = []
    skills: List[str] = []
    review_status: ReviewStatus
    is_public: bool
    share_token: Optional[str]
    resume: Optional[ResumeOut]
    social_links: List[SocialLinkOut] = []
    projects: List[ProjectOut] = []
    created_at: datetime
    updated_at: Optional[datetime]
    user: Optional[UserOut] = None
    model_config = {"from_attributes": True}

    @field_validator("target_roles", "skills", mode="before")
    @classmethod
    def parse_json_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v or []

class ProfileSummary(BaseModel):
    id: int
    user_id: int
    full_name: str
    headline: Optional[str]
    location: Optional[str]
    avatar_url: Optional[str]
    skills: List[str] = []
    review_status: ReviewStatus
    is_public: bool
    share_token: Optional[str]
    projects_count: int = 0
    model_config = {"from_attributes": True}

    @field_validator("skills", mode="before")
    @classmethod
    def parse_skills(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v or []

class ReviewCreate(BaseModel):
    feedback: str
    status: ReviewStatus

class ReviewOut(BaseModel):
    id: int
    profile_id: int
    reviewer_id: Optional[int]
    status: ReviewStatus
    feedback: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    model_config = {"from_attributes": True}

class DashboardStats(BaseModel):
    total_profiles: int
    published_profiles: int
    needs_revision: int
    total_projects: int
    ready_profiles: int
