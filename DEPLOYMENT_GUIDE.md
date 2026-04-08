# FORENSYNC - Complete Deployment Guide

**Frontend:** Vercel (React app)  
**Backend:** Railway (FastAPI with AI)

---

## Part 1: Deploy Backend on Railway (Do This First!)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click **"Login with GitHub"**
3. Authorize Railway
4. Verify your email

### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **"Sanidhya-Jindal/forensync"**
4. Railway detects Python automatically

### Step 3: Configure Backend
Railway auto-configures most things, but verify:
- **Start Command:** Should be auto-detected from railway.json
- **Root Directory:** `/` (default)

### Step 4: Add Environment Variables (Optional)
Click "Variables" tab:
```
PYTHON_VERSION=3.11.0
```

### Step 5: Deploy Backend
1. Click **"Deploy"**
2. Wait 10-15 minutes (installing ML libraries)
3. Watch build logs for progress
4. Once done, you'll see: ✅ **"Success"**

### Step 6: Get Your Backend URL
1. Click on your service
2. Click **"Settings"** → **"Domains"**
3. Click **"Generate Domain"**
4. Copy the URL (looks like: `https://forensync-production.up.railway.app`)
5. **SAVE THIS URL** - you'll need it for frontend!

---

## Part 2: Deploy Frontend on Vercel (Do This After Backend is Live)

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel

### Step 2: Create New Project
1. Click **"Add New..."** → **"Project"**
2. Find **"forensync"** repository
3. Click **"Import"**

### Step 3: Configure Build Settings
Vercel auto-detects Vite, but verify:
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Step 4: Add Environment Variable
Click **"Environment Variables"**:

**Name:** `VITE_API_URL`  
**Value:** (paste your Railway backend URL from Part 1, Step 6)  
Example: `https://forensync-production.up.railway.app`

### Step 5: Deploy Frontend
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. ✅ **"Congratulations!"** page appears

### Step 6: Get Your Frontend URL
Your app is live at: `https://forensync-xxxxxxx.vercel.app`

Click **"Visit"** to see your live app!

---

## Part 3: Test Your Deployment

### Visit Your Frontend
Open: `https://forensync-xxxxxxx.vercel.app`

### Test Features
1. ✅ Homepage loads
2. ✅ View Records (Missing Persons & Unidentified Bodies)
3. ✅ Text Search
4. ✅ Image Upload (Face Recognition)
5. ✅ Report Missing Person
6. ✅ Report Unidentified Body

---

## Part 4: For Your Resume

### Add to Resume
**Project Name:** FORENSYNC - AI-Powered Missing Persons Identification System

**Live Demo:** https://forensync-xxxxxxx.vercel.app

**GitHub:** https://github.com/Sanidhya-Jindal/forensync

**Tech Stack:**
- Frontend: React 18, Vite, Tailwind CSS, React Router
- Backend: FastAPI, Python 3.11
- AI/ML: InsightFace (facial recognition), Sentence Transformers (semantic search)
- Database: SQLite, Qdrant Vector DB
- Deployment: Vercel (frontend), Railway (backend)

**Features:**
- AI-powered facial recognition matching
- Semantic text search across descriptions
- Real-time case management
- GPS location tracking
- Multi-photo evidence support

---

## Troubleshooting

### Frontend Can't Connect to Backend
- Check `VITE_API_URL` is correct in Vercel
- Make sure backend URL has `https://` (not `http://`)
- Redeploy frontend after fixing

### Backend Out of Memory
- Railway has 8GB, should work
- Check build logs for errors
- Try redeploying

### Frontend Shows Blank Page
- Check browser console (F12)
- Verify build completed successfully
- Check Vercel deployment logs

---

## Free Tier Limits

**Vercel:**
- ✅ Unlimited bandwidth
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Always on (no sleep)

**Railway:**
- ✅ $5 credit/month
- ✅ 8GB RAM
- ✅ 500 hours/month
- ⚠️ Monitor usage in dashboard

---

## Next Steps

1. ✅ Add custom domain (optional)
2. ✅ Update GitHub README with live link
3. ✅ Add screenshots to README
4. ✅ Share on LinkedIn
5. ✅ Add to resume with live demo link!

---

🎉 **Your project is LIVE!**
