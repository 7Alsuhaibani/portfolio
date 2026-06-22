#  Portfolio Showcase Platform
**WeCloudData — Student Portfolio Management System**

A full-stack web application for students to create professional portfolios and share them with employers.

---

##  Architecture

```
portfolio-platform/
├── backend/          ← FastAPI + SQLite + SQLAlchemy
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── models.py        # SQLAlchemy DB models
│   │   ├── schemas.py       # Pydantic validation schemas
│   │   ├── database.py      # DB connection
│   │   ├── security.py      # JWT auth & password hashing
│   │   ├── dependencies.py  # Route dependencies
│   │   └── routers/
│   │       ├── auth.py      # Register, login, me
│   │       ├── profile.py   # Profile CRUD, avatar, resume, links
│   │       ├── projects.py  # Project CRUD + image upload
│   │       ├── reviews.py   # Coach review workflow
│   │       └── admin.py     # Dashboard stats
│   ├── uploads/             # Uploaded files (avatars, resumes, images)
│   ├── seed.py              # Sample data seeder
│   ├── requirements.txt
│   └── .env
│
└── frontend/         ← React + Vite + React Router
    └── src/
        ├── App.jsx              # Router + protected routes
        ├── main.jsx             # Entry point
        ├── index.css            # Global styles
        ├── hooks/
        │   └── Layout.jsx  # Global auth state
        ├── utils/
        │   └── api.js           # Axios API layer
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── DashboardPage.jsx
            ├── ProfilePage.jsx       # Edit profile, avatar, resume, links
            ├── ProjectsPage.jsx      # List projects
            ├── ProjectEditPage.jsx   # Create/edit project with Markdown
            ├── SharePage.jsx         # Portfolio sharing
            ├── PreviewPage.jsx       # Preview own portfolio
            ├── PublicPortfolioPage.jsx  # Public portfolio view
            └── AdminProfilesPage.jsx    # Coach/Admin review panel
```

---

##  Quick Start

### 1. Backend (Terminal 1)
```bash
cd backend
pip install -r requirements.txt
python seed.py          # Seeds sample data
uvicorn app.main:app --reload --port 8000
```
Backend runs at: **http://localhost:8000**
API Docs: **http://localhost:8000/docs**

### 2. Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: **http://localhost:5173**

---

##  Demo Accounts

| Role    | Email                        | Password    |
|---------|------------------------------|-------------|
| Admin   | admin@weclouddata.com        | admin123    |
| Coach   | coach@weclouddata.com        | coach123    |
| Student | alice@student.com            | student123  |
| Student | bob@student.com              | student123  |
| Student | carol@student.com            | student123  |

---

##  Key Features

### For Students
- ✅ Professional profile with bio, skills, location, target roles
- ✅ Avatar photo upload
- ✅ Resume (PDF/Word) upload and management
- ✅ Social links (LinkedIn, GitHub, Website, Demo, Blog)
- ✅ Full project case studies with Markdown editor
- ✅ Project images/screenshots upload
- ✅ Private shareable portfolio link (token-based)
- ✅ Portfolio preview mode
- ✅ Submit portfolio for coach review

### For Coaches / Admins
- ✅ Dashboard with portfolio statistics
- ✅ View all student portfolios
- ✅ Filter by review status
- ✅ Submit reviews with feedback
- ✅ Approve (Publish) or request revisions

### For Employers
- ✅ View public portfolio via share link
- ✅ See projects, skills, resume, social links
- ✅ Project detail modal with full case study
- ✅ No account required

---

##  API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login (returns JWT)
- `GET  /api/auth/me` — Current user

### Profile
- `GET    /api/profile/me` — Get my profile
- `PUT    /api/profile/me` — Update profile
- `POST   /api/profile/me/avatar` — Upload avatar
- `POST   /api/profile/me/resume` — Upload resume
- `DELETE /api/profile/me/resume` — Delete resume
- `POST   /api/profile/me/links` — Add social link
- `DELETE /api/profile/me/links/{id}` — Remove link
- `POST   /api/profile/me/share-token` — Regenerate share token
- `GET    /api/profile/public/{token}` — Public portfolio view
- `GET    /api/profile/all` — List all profiles (coach/admin)

### Projects
- `POST   /api/projects/` — Create project
- `GET    /api/projects/me` — My projects
- `GET    /api/projects/{id}` — Single project
- `PUT    /api/projects/{id}` — Update project
- `DELETE /api/projects/{id}` — Delete project
- `POST   /api/projects/{id}/images` — Upload screenshot
- `DELETE /api/projects/{id}/images/{imgId}` — Remove screenshot

### Reviews
- `POST /api/reviews/submit-for-review` — Student submits portfolio
- `POST /api/reviews/{profileId}` — Coach creates review
- `GET  /api/reviews/{profileId}` — Get reviews

### Admin
- `GET /api/admin/dashboard` — Stats overview

---

##  Data Models

**User** → role (admin/student/coach/employer)  
**StudentProfile** → full_name, headline, bio, skills[], target_roles[], share_token  
**Resume** → filename, original_name, file_url  
**SocialLink** → link_type (linkedin/github/website...), url, label  
**Project** → title, summary, description (Markdown), business_problem, solution, architecture, tech_stack[], results, github_url, demo_url  
**ProjectImage** → filename, image_url, caption  
**PortfolioReview** → status (draft/ready/needs_revision/published), feedback  

---

##  Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Backend   | FastAPI 0.115, Python 3.12 |
| Database  | SQLite (dev) / PostgreSQL (prod) |
| ORM       | SQLAlchemy 2.0          |
| Auth      | JWT (python-jose) + bcrypt |
| Frontend  | React 18 + Vite         |
| Routing   | React Router v6         |
| HTTP      | Axios                   |
| Editor    | react-markdown + remark-gfm |
| Uploads   | react-dropzone          |
| Icons     | lucide-react            |
| Toasts    | react-hot-toast         |
