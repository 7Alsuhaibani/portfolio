from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class SocialLinkBase(BaseModel):
    link_type: str
    url: str
    label: Optional[str] = None


class SocialLinkCreate(SocialLinkBase):
    pass


class SocialLinkResponse(SocialLinkBase):
    id: int
    class Config:
        from_attributes = True


class SkillBase(BaseModel):
    name: str
    category: Optional[str] = None


class SkillCreate(SkillBase):
    pass


class SkillResponse(SkillBase):
    id: int
    class Config:
        from_attributes = True


class ProfileCreate(BaseModel):
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    target_roles: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    is_public: bool = True


class ProfileUpdate(ProfileCreate):
    pass


class ResumeResponse(BaseModel):
    id: int
    filename: str
    file_url: str
    file_size: Optional[int] = None
    uploaded_at: datetime
    class Config:
        from_attributes = True


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    target_roles: Optional[str] = None
    contact_email: Optional[str] = None
    avatar_url: Optional[str] = None
    is_public: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    social_links: List[SocialLinkResponse] = []
    skills: List[SkillResponse] = []
    resume: Optional[ResumeResponse] = None

    class Config:
        from_attributes = True


class PublicProfileResponse(ProfileResponse):
    owner_name: str
    owner_email: str
