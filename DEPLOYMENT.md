# FORENSYNC Deployment Guide

## Deploy to Render.com

This guide will help you deploy FORENSYNC (backend + frontend) to Render.com.

---

## Prerequisites

- GitHub account
- Render.com account (free tier available)
- Git repository with your code

---

## Method 1: Using render.yaml (Recommended)

### Step 1: Push Code to GitHub

```bash
cd e:\Machine Learning\Hack4Safety\backend\backend
git init
git add .
git commit -m "Initial commit - FORENSYNC"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/forensync.git
git push -u origin main
```

### Step 2: Connect to Render

1. Go to https://render.com
2. Sign up or log in
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect `render.yaml` and create services

### Step 3: Configure Environment Variables

Backend service environment variables:
- `PYTHON_VERSION`: 3.11.0
- `DATABASE_URL`: sqlite:///./missing_persons.db
- `QDRANT_HOST`: localhost
- `QDRANT_PORT`: 6333

Frontend service environment variables:
- `VITE_API_URL`: https://YOUR-BACKEND-NAME.onrender.com

### Step 4: Deploy

- Click "Apply" to start deployment
- Wait 5-10 minutes for build to complete
- Your apps will be live at:
  - Backend: https://forensync-backend.onrender.com
  - Frontend: https://forensync-frontend.onrender.com

---

## Method 2: Manual Deployment

### Deploy Backend

1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: `forensync-backend`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements_production.txt && python setup_database.py`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Instance Type: `Free`

5. Add Environment Variables:
   - `PYTHON_VERSION` = `3.11.0`
   - `DATABASE_URL` = `sqlite:///./missing_persons.db`

6. Click "Create Web Service"

### Deploy Frontend

1. Go to Render Dashboard
2. Click "New" → "Static Site"
3. Connect your GitHub repository
4. Configure:
   - Name: `forensync-frontend`
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

5. Add Environment Variables:
   - `VITE_API_URL` = `https://forensync-backend.onrender.com`

6. Click "Create Static Site"

---

## Important Notes

### Free Tier Limitations

- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month free (enough for one service 24/7)

### Database Persistence

- SQLite database will reset on each deployment
- For production, consider upgrading to:
  - Render PostgreSQL database
  - External database service

### Face Recognition

- Face recognition models (~200MB) download on first build
- May increase build time on free tier
- Models are cached between deployments

### File Uploads

- Uploaded photos stored in ephemeral filesystem
- Files will be lost on service restart
- For production, use cloud storage:
  - AWS S3
  - Cloudinary
  - Render Disks (paid feature)

---

## Updating Your Deployment

### Auto-Deploy (Recommended)

1. Enable "Auto-Deploy" in Render dashboard
2. Every push to `main` branch triggers deployment
3. No manual action needed

### Manual Deploy

1. Go to Render dashboard
2. Select your service
3. Click "Manual Deploy" → "Deploy latest commit"

---

## Monitoring

### Check Logs

1. Go to service in Render dashboard
2. Click "Logs" tab
3. View real-time application logs

### Health Check

Your backend should respond at:
```
GET https://forensync-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "qdrant": "connected"
}
```

---

## Troubleshooting

### Build Fails

- Check build logs in Render dashboard
- Verify all dependencies in requirements.txt
- Check Python version compatibility

### Service Won't Start

- Check start command is correct
- Verify PORT environment variable usage
- Check logs for error messages

### Database Errors

- Ensure setup_database.py runs in build command
- Check DATABASE_URL environment variable
- Verify SQLite permissions

### Frontend Can't Connect to Backend

- Check VITE_API_URL is set correctly
- Verify CORS settings in main.py
- Test backend endpoint directly

---

## Production Recommendations

When ready for production:

1. Use PostgreSQL instead of SQLite
   - Add Render PostgreSQL database
   - Update DATABASE_URL

2. Enable HTTPS
   - Render provides SSL certificates automatically

3. Add Authentication
   - Implement JWT or OAuth
   - Protect sensitive endpoints

4. Use Cloud Storage
   - AWS S3 for photo uploads
   - Or upgrade to Render Disks

5. Monitor Performance
   - Enable application monitoring
   - Set up alerts for downtime

6. Upgrade from Free Tier
   - Prevent service spin-down
   - Faster build times
   - More resources

---

## Cost Estimate

Free Tier:
- Backend: $0/month (with spin-down)
- Frontend: $0/month
- Total: $0/month

Starter Plan:
- Backend: $7/month (always-on)
- Frontend: $0/month (static sites always free)
- PostgreSQL: $7/month (optional)
- Total: $7-14/month

---

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- FORENSYNC Issues: Check your repository issues

---

## Next Steps

After deployment:

1. ✅ Test all endpoints
2. ✅ Upload sample data
3. ✅ Test face recognition
4. ✅ Monitor performance
5. ✅ Share your live URL!

Your FORENSYNC platform is now live and accessible worldwide! 🚀
