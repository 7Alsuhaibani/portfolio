from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
import os, shutil, uuid
from app.core.database import get_db
from app.models.models import User, StudentProfile, PortfolioProject, ProjectImage
from app.schemas.schemas import ProjectCreate, ProjectUpdate, ProjectOut, ProjectImageOut
from app.api.deps import get_current_student
from app.core.config import settings

router = APIRouter(prefix="/projects", tags=["Projects"])

UPLOAD_DIR = settings.UPLOAD_DIR


def get_profile_or_404(user: User, db: Session) -> StudentProfile:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Create your profile first.")
    return profile


def get_project_or_404(project_id: int, profile_id: int, db: Session) -> PortfolioProject:
    project = db.query(PortfolioProject).filter(
        PortfolioProject.id == project_id,
        PortfolioProject.profile_id == profile_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/", response_model=List[ProjectOut])
def get_my_projects(
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    return db.query(PortfolioProject).filter(
        PortfolioProject.profile_id == profile.id
    ).order_by(PortfolioProject.order_index).all()


@router.post("/", response_model=ProjectOut, status_code=201)
def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    project = PortfolioProject(profile_id=profile.id, **data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    return get_project_or_404(project_id, profile.id, db)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    project = get_project_or_404(project_id, profile.id, db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    project = get_project_or_404(project_id, profile.id, db)
    for img in project.images:
        if os.path.exists(img.file_path):
            os.remove(img.file_path)
    db.delete(project)
    db.commit()


@router.post("/{project_id}/images", response_model=ProjectImageOut, status_code=201)
async def upload_project_image(
    project_id: int,
    file: UploadFile = File(...),
    caption: str = "",
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp", "image/gif"]:
        raise HTTPException(status_code=400, detail="Invalid image type")

    profile = get_profile_or_404(current_user, db)
    project = get_project_or_404(project_id, profile.id, db)

    img_dir = os.path.join(UPLOAD_DIR, "images", str(project.id))
    os.makedirs(img_dir, exist_ok=True)

    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(img_dir, filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    count = db.query(ProjectImage).filter(ProjectImage.project_id == project.id).count()
    image = ProjectImage(
        project_id=project.id,
        filename=file.filename,
        file_path=file_path,
        caption=caption,
        order_index=count
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.delete("/{project_id}/images/{image_id}", status_code=204)
def delete_project_image(
    project_id: int,
    image_id: int,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    project = get_project_or_404(project_id, profile.id, db)
    image = db.query(ProjectImage).filter(
        ProjectImage.id == image_id,
        ProjectImage.project_id == project.id
    ).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    if os.path.exists(image.file_path):
        os.remove(image.file_path)
    db.delete(image)
    db.commit()


@router.put("/{project_id}/feature", response_model=ProjectOut)
def toggle_featured(
    project_id: int,
    current_user: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    profile = get_profile_or_404(current_user, db)
    project = get_project_or_404(project_id, profile.id, db)
    project.is_featured = not project.is_featured
    db.commit()
    db.refresh(project)
    return project
