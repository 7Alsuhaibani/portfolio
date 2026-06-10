from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app import models
from app.routers import auth, profile, projects, reviews, admin
from pathlib import Path

# Create all DB tables
Base.metadata.create_all(bind=engine)

# Ensure upload directories exist
for folder in ["uploads/resumes", "uploads/avatars", "uploads/images"]:
    Path(folder).mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Portfolio Showcase Platform API",
    description="WeCloudData Student Portfolio System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(projects.router)
app.include_router(reviews.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "Portfolio Showcase Platform API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
