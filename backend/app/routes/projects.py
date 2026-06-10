from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.profile import StudentProfile
from ..models.project import PortfolioProject, ProjectImage, ProjectLink
from ..schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from ..utils.auth import get_current_active_user
from ..utils.files import save_upload_file, delete_file, validate_image

router = APIRouter(prefix="/projects", tags=["Projects"])


def get_user_profile(current_user: User, db: Session) -> StudentProfile:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please create your profile first.")
    return profile


@router.get("", response_model=List[ProjectResponse])
def get_my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = get_user_profile(current_user, db)
    return db.query(PortfolioProject).filter(
        PortfolioProject.profile_id == profile.id
    ).order_by(PortfolioProject.order_index).all()


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = get_user_profile(current_user, db)
    project = PortfolioProject(profile_id=profile.id, **data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = get_user_profile(current_user, db)
    project = db.query(PortfolioProject).filter(
        PortfolioProject.id == project_id,
        PortfolioProject.profile_id == profile.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = get_user_profile(current_user, db)
    project = db.query(PortfolioProject).filter(
        PortfolioProject.id == project_id,
        PortfolioProject.profile_id == profile.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = get_user_profile(current_user, db)
    project = db.query(PortfolioProject).filter(
        PortfolioProject.id == project_id,
        PortfolioProject.profile_id == profile.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for img in project.images:
        delete_file(img.image_url)
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}


@router.post("/{project_id}/images", status_code=201)
async def upload_project_image(
    project_id: int,
    file: UploadFile = File(...),
    caption: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    validate_image(file)
    profile = get_user_profile(current_user, db)
    project = db.query(PortfolioProject).filter(
        PortfolioProject.id == project_id,
        PortfolioProject.profile_id == profile.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    _, file_url, _ = await save_upload_file(file, "images")
    img_count = len(project.images)
    proj_image = ProjectImage(
        project_id=project.id,
        image_url=file_url,
        caption=caption,
        order_index=img_count
    )
    db.add(proj_image)
    db.commit()
    db.refresh(proj_image)
    return {"message": "Image uploaded", "image_url": file_url, "id": proj_image.id}


@router.delete("/{project_id}/images/{image_id}")
def delete_project_image(
    project_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    profile = get_user_profile(current_user, db)
    project = db.query(PortfolioProject).filter(
        PortfolioProject.id == project_id,
        PortfolioProject.profile_id == profile.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    img = db.query(ProjectImage).filter(ProjectImage.id == image_id, ProjectImage.project_id == project_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    delete_file(img.image_url)
    db.delete(img)
    db.commit()
    return {"message": "Image deleted"}
