from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProjectImageResponse(BaseModel):
    id: int
    image_url: str
    caption: Optional[str] = None
    order_index: int
    class Config:
        from_attributes = True


class ProjectLinkBase(BaseModel):
    link_type: str
    url: str
    label: Optional[str] = None


class ProjectLinkResponse(ProjectLinkBase):
    id: int
    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    title: str
    summary: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[str] = None
    skills_used: Optional[str] = None
    role: Optional[str] = None
    duration: Optional[str] = None
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    results: Optional[str] = None
    is_featured: bool = False
    order_index: int = 0


class ProjectUpdate(ProjectCreate):
    pass


class ProjectResponse(BaseModel):
    id: int
    profile_id: int
    title: str
    summary: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[str] = None
    skills_used: Optional[str] = None
    role: Optional[str] = None
    duration: Optional[str] = None
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    results: Optional[str] = None
    is_featured: bool
    order_index: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    images: List[ProjectImageResponse] = []
    links: List[ProjectLinkResponse] = []

    class Config:
        from_attributes = True
