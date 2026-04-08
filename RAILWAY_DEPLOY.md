# FORENSYNC - Railway Deployment Guide

## Deploy Backend to Railway

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway to access your GitHub account
4. Verify your email

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose "Sanidhya-Jindal/forensync"
4. Railway will detect it's a Python app

### Step 3: Configure Backend Service

Railway will auto-detect Python. Just verify:

**Root Directory:** `/` (leave as default)
**Build Command:** Auto-detected
**Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 4: Add Environment Variables

Go to "Variables" tab and add:

```
PYTHON_VERSION=3.11.0
DATABASE_URL=sqlite:///./missing_persons.db
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

### Step 5: Deploy!

Click "Deploy" - Railway will:
- Install Python 3.11
- Install dependencies (takes 5-10 min for ML libraries)
- Run database setup
- Start the server

Your backend URL will be: `https://forensync-production.up.railway.app`

---

## Deploy Frontend to Railway

### Step 1: Add Frontend Service

1. In same project, click "New Service"
2. Select "Deploy from GitHub repo"
3. Choose same repository
4. Click "Add Service"

### Step 2: Configure Frontend

**Settings:**
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Start Command: Leave empty (static site)

### Step 3: Add Environment Variable

In Variables tab:
```
VITE_API_URL=https://forensync-production.up.railway.app
```
(Use your actual backend URL from Step 5 above)

### Step 4: Enable Static Site Serving

1. Go to "Settings"
2. Find "Static Outbound Path"
3. Set to: `dist`

### Step 5: Deploy Frontend

Click "Deploy" - takes 2-3 minutes

Your frontend URL will be: `https://forensync-frontend-production.up.railway.app`

---

## After Deployment

### Test Your App

1. Visit frontend URL
2. Try text search
3. Try face recognition upload
4. Report a missing person

### Monitor Usage

Railway free tier includes:
- $5 credit/month
- 8GB RAM
- 500 hours/month

Check usage in Railway dashboard.

---

## Update VITE_API_URL

After backend deploys:
1. Copy backend URL
2. Go to frontend service → Variables
3. Update `VITE_API_URL` to your backend URL
4. Redeploy frontend

---

## Troubleshooting

**Out of Memory?**
- Railway has 8GB, should be fine
- If still failing, enable swap: Settings → RAM → Enable Swap

**Build Timeout?**
- Increase timeout: Settings → Build → Timeout → 20 minutes

**Database not persisting?**
- Add Railway volume: Settings → Volumes → Add Volume → Mount at `/app`

---

## For Your Resume

**Project Name:** FORENSYNC - AI-Powered Missing Persons Identification

**Live Demo:** https://forensync-frontend-production.up.railway.app

**Tech Stack:**
- Frontend: React, Vite, Tailwind CSS
- Backend: FastAPI, Python
- AI/ML: InsightFace (face recognition), Sentence Transformers (text search)
- Database: SQLite, Qdrant (vector DB)
- Deployment: Railway.app

---

## Next Steps

1. Add custom domain (optional)
2. Set up monitoring
3. Add to your GitHub README
4. Include in resume with live link!

🎉 Your project is live!
