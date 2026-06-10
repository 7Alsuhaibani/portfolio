"""Seed database with sample data"""
import sys, json, secrets
sys.path.insert(0, ".")

from app.database import SessionLocal, engine, Base
from app import models
from app.security import get_password_hash

Base.metadata.create_all(bind=engine)
db = SessionLocal()

if db.query(models.User).count() > 0:
    print("Database already has data. Skipping seed.")
    db.close()
    sys.exit(0)

print("Seeding database...")

users_data = [
    {"email": "admin@weclouddata.com",  "username": "admin",       "password": "admin123",   "role": models.UserRole.admin},
    {"email": "coach@weclouddata.com",  "username": "coach_sarah", "password": "coach123",   "role": models.UserRole.coach},
    {"email": "alice@student.com",      "username": "alice_ml",    "password": "student123", "role": models.UserRole.student},
    {"email": "bob@student.com",        "username": "bob_data",    "password": "student123", "role": models.UserRole.student},
    {"email": "carol@student.com",      "username": "carol_ai",    "password": "student123", "role": models.UserRole.student},
]

created_users = []
for u in users_data:
    user = models.User(
        email=u["email"], username=u["username"],
        hashed_password=get_password_hash(u["password"]),
        role=u["role"],
    )
    db.add(user)
    db.flush()
    created_users.append(user)

profiles_data = [
    {
        "full_name": "Alice Johnson",
        "headline": "Machine Learning Engineer | Python | TensorFlow",
        "bio": "Passionate ML engineer with experience in NLP and computer vision. Looking for roles in AI-driven startups.",
        "location": "Toronto, ON",
        "target_roles": ["ML Engineer", "Data Scientist", "AI Engineer"],
        "skills": ["Python", "TensorFlow", "PyTorch", "SQL", "Docker", "FastAPI"],
        "review_status": models.ReviewStatus.published,
        "is_public": True,
    },
    {
        "full_name": "Bob Martinez",
        "headline": "Data Engineer | Spark | Airflow | dbt",
        "bio": "Building robust data pipelines. Experienced with cloud platforms (AWS, GCP).",
        "location": "Vancouver, BC",
        "target_roles": ["Data Engineer", "Analytics Engineer"],
        "skills": ["Python", "Apache Spark", "Airflow", "dbt", "PostgreSQL", "AWS"],
        "review_status": models.ReviewStatus.ready,
        "is_public": True,
    },
    {
        "full_name": "Carol Chen",
        "headline": "AI/NLP Researcher | Transformers | LLMs",
        "bio": "Fascinated by large language models and their applications.",
        "location": "Montreal, QC",
        "target_roles": ["NLP Engineer", "Research Scientist"],
        "skills": ["Python", "HuggingFace", "PyTorch", "LangChain"],
        "review_status": models.ReviewStatus.draft,
        "is_public": False,
    },
]

student_users = [u for u in created_users if u.role == models.UserRole.student]
created_profiles = []
for user, p in zip(student_users, profiles_data):
    profile = models.StudentProfile(
        user_id=user.id, full_name=p["full_name"], headline=p["headline"],
        bio=p["bio"], location=p["location"], contact_email=user.email,
        target_roles=json.dumps(p["target_roles"]), skills=json.dumps(p["skills"]),
        review_status=p["review_status"], is_public=p["is_public"],
        share_token=secrets.token_urlsafe(32),
    )
    db.add(profile)
    db.flush()
    created_profiles.append(profile)
    for lt, url in [("linkedin", f"https://linkedin.com/in/{user.username}"),
                    ("github",   f"https://github.com/{user.username}")]:
        db.add(models.SocialLink(profile_id=profile.id, link_type=lt, url=url, label=lt.capitalize()))

# Projects for Alice
for p_data in [
    {
        "title": "Customer Churn Prediction System",
        "summary": "End-to-end ML pipeline predicting churn with 92% accuracy",
        "description": "## Overview\nBuilt a complete ML pipeline using **Python** and **Scikit-learn**.\n\n## Key Features\n- Feature engineering pipeline\n- XGBoost with hyperparameter tuning\n- REST API with FastAPI\n- Docker deployment",
        "business_problem": "The client was losing 15% of customers monthly without knowing why.",
        "solution": "Developed a classification model using customer behavior data from the last 6 months.",
        "tech_stack": ["Python", "Scikit-learn", "XGBoost", "FastAPI", "Docker", "PostgreSQL"],
        "skills_used": ["Machine Learning", "Feature Engineering", "Model Deployment"],
        "role": "Lead ML Engineer", "duration": "3 months",
        "results": "Reduced churn by 23%. Model accuracy: 92%.",
        "github_url": "https://github.com/alice_ml/churn-prediction",
        "demo_url": "https://demo.example.com", "is_featured": True, "order_index": 0,
    },
    {
        "title": "NLP Sentiment Dashboard",
        "summary": "Real-time sentiment analysis on Twitter using BERT",
        "description": "## Description\nReal-time dashboard using **BERT** fine-tuned on Twitter data.",
        "tech_stack": ["Python", "HuggingFace", "Streamlit", "Redis"],
        "skills_used": ["NLP", "Deep Learning"],
        "role": "ML Developer", "duration": "6 weeks",
        "results": "Processed 50K tweets/day with 89% accuracy.",
        "github_url": "https://github.com/alice_ml/sentiment-dashboard",
        "is_featured": True, "order_index": 1,
    },
]:
    db.add(models.Project(
        profile_id=created_profiles[0].id, title=p_data["title"],
        summary=p_data["summary"], description=p_data.get("description"),
        business_problem=p_data.get("business_problem"), solution=p_data.get("solution"),
        tech_stack=json.dumps(p_data.get("tech_stack", [])),
        skills_used=json.dumps(p_data.get("skills_used", [])),
        role=p_data.get("role"), duration=p_data.get("duration"),
        results=p_data.get("results"), github_url=p_data.get("github_url"),
        demo_url=p_data.get("demo_url"), is_featured=p_data.get("is_featured", False),
        order_index=p_data.get("order_index", 0),
    ))

# Project for Bob
db.add(models.Project(
    profile_id=created_profiles[1].id,
    title="Real-time E-Commerce Data Pipeline",
    summary="Kafka + Spark Streaming pipeline processing 1M events/day",
    description="## Architecture\n**Lambda Architecture** for e-commerce analytics.",
    tech_stack=json.dumps(["Apache Kafka", "Spark Streaming", "dbt", "Snowflake", "Airflow"]),
    skills_used=json.dumps(["Data Engineering", "Stream Processing"]),
    role="Data Engineer", duration="4 months",
    results="Reduced data latency from 24 hours to 5 minutes.",
    github_url="https://github.com/bob_data/ecom-pipeline",
    is_featured=True, order_index=0,
))

db.commit()
print("✅ Database seeded successfully!")
print("\n📧 Login credentials:")
print("  Admin:   admin@weclouddata.com / admin123")
print("  Coach:   coach@weclouddata.com / coach123")
print("  Student: alice@student.com    / student123")
print("  Student: bob@student.com      / student123")
print("  Student: carol@student.com    / student123")
db.close()
