from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.portfolio import ReviewStatus


class ShareableLinkCreate(BaseModel):
    expires_days: Optional[int] = None


class ShareableLinkResponse(BaseModel):
    id: int
    token: str
    is_active: bool
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    status: ReviewStatus
    feedback: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    profile_id: int
    reviewer_id: int
    status: ReviewStatus
    feedback: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    reviewer_name: Optional[str] = None

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_profiles: int
    published_portfolios: int
    needs_revision: int
    total_projects: int
    ready_portfolios: int
