from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.dependencies import get_current_user
import os, shutil, secrets, json
from pathlib import Path

router = APIRouter(prefix="/api/projects", tags=["Projects"])
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

def _profile(uid, db):
    p = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == uid).first()
    if not p:
        raise HTTPException(status_code=404, detail="Profile not found")
    return p

@router.post("/", response_model=schemas.ProjectOut, status_code=201)
def create_project(data: schemas.ProjectCreate, cu=Depends(get_current_user), db: Session = Depends(get_db)):
    p = _profile(cu.id, db)
    proj = models.Project(
        profile_id=p.id, title=data.title, summary=data.summary, description=data.description,
        business_problem=data.business_problem, solution=data.solution, architecture=data.architecture,
        tech_stack=json.dumps(data.tech_stack or []), skills_used=json.dumps(data.skills_used or []),
        role=data.role, duration=data.duration, results=data.results,
        github_url=data.github_url, demo_url=data.demo_url,
        is_featured=data.is_featured, order_index=data.order_index,
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj

@router.get("/me", response_model=List[schemas.ProjectOut])
def get_my_projects(cu=Depends(get_current_user), db: Session = Depends(get_db)):
    p = _profile(cu.id, db)
    return db.query(models.Project).filter(models.Project.profile_id == p.id).order_by(models.Project.order_index).all()

@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(project_id: int, cu=Depends(get_current_user), db: Session = Depends(get_db)):
    p = _profile(cu.id, db)
    proj = db.query(models.Project).filter(models.Project.id == project_id, models.Project.profile_id == p.id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj

@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(project_id: int, data: schemas.ProjectUpdate, cu=Depends(get_current_user), db: Session = Depends(get_db)):
    p = _profile(cu.id, db)
    proj = db.query(models.Project).filter(models.Project.id == project_id, models.Project.profile_id == p.id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    upd = data.model_dump(exclude_unset=True)
    for f in ["tech_stack", "skills_used"]:
        if f in upd and isinstance(upd[f], list):
            upd[f] = json.dumps(upd[f])
    for k, v in upd.items():
        setattr(proj, k, v)
    db.commit()
    db.refresh(proj)
    return proj

@router.delete("/{project_id}")
def delete_project(project_id: int, cu=Depends(get_current_user), db: Session = Depends(get_db)):
    p = _profile(cu.id, db)
    proj = db.query(models.Project).filter(models.Project.id == project_id, models.Project.profile_id == p.id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    for img in proj.images:
        fp = Path(UPLOAD_DIR) / "images" / img.filename
        if fp.exists():
            fp.unlink()
    db.delete(proj)
    db.commit()
    return {"message": "Project deleted"}

@router.post("/{project_id}/images", response_model=schemas.ProjectImageOut)
async def upload_image(project_id: int, file: UploadFile = File(...), caption: str = Query(default=""), cu=Depends(get_current_user), db: Session = Depends(get_db)):
    p = _profile(cu.id, db)
    proj = db.query(models.Project).filter(models.Project.id == project_id, models.Project.profile_id == p.id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    d = Path(UPLOAD_DIR) / "images"
    d.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix.lower()
    fn = f"proj_{project_id}_{secrets.token_hex(8)}{ext}"
    with open(d / fn, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    img = models.ProjectImage(project_id=proj.id, filename=fn, original_name=file.filename, image_url=f"/uploads/images/{fn}", caption=caption, order_index=len(proj.images))
    db.add(img)
    db.commit()
    db.refresh(img)
    return img

@router.delete("/{project_id}/images/{image_id}")
def delete_image(project_id: int, image_id: int, cu=Depends(get_current_user), db: Session = Depends(get_db)):
    p = _profile(cu.id, db)
    proj = db.query(models.Project).filter(models.Project.id == project_id, models.Project.profile_id == p.id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    img = db.query(models.ProjectImage).filter(models.ProjectImage.id == image_id, models.ProjectImage.project_id == project_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    fp = Path(UPLOAD_DIR) / "images" / img.filename
    if fp.exists():
        fp.unlink()
    db.delete(img)
    db.commit()
    return {"message": "Image deleted"}
