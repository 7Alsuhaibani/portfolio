import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException
from ..config import settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_RESUME_TYPES = {"application/pdf", "application/msword",
                         "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}


async def save_upload_file(file: UploadFile, folder: str) -> tuple[str, str, int]:
    """Save uploaded file and return (filename, url, size)"""
    upload_dir = os.path.join(settings.UPLOAD_DIR, folder)
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    async with aiofiles.open(file_path, 'wb') as out_file:
        await out_file.write(content)

    file_url = f"/uploads/{folder}/{unique_filename}"
    return unique_filename, file_url, len(content)


def delete_file(file_url: str):
    """Delete a file from disk"""
    if file_url:
        file_path = file_url.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)


def validate_image(file: UploadFile):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, GIF, WEBP images are allowed")


def validate_resume(file: UploadFile):
    if file.content_type not in ALLOWED_RESUME_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF and Word documents are allowed")
