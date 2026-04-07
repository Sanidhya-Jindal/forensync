# FORENSYNC - Quick Deployment Checklist

## Before Deploying

- [ ] Push code to GitHub repository
- [ ] Create Render.com account
- [ ] Review DEPLOYMENT.md for detailed steps

## Deployment Steps

### Option 1: One-Click (Blueprint)
1. Go to https://render.com/dashboard
2. Click "New" → "Blueprint"
3. Connect your GitHub repo
4. Render detects `render.yaml` automatically
5. Click "Apply"
6. Wait for deployment (5-10 min)

### Option 2: Manual
See DEPLOYMENT.md for step-by-step manual deployment

## After Deployment

- [ ] Update VITE_API_URL in frontend environment variables
- [ ] Test backend: https://YOUR-BACKEND.onrender.com/health
- [ ] Test frontend: https://YOUR-FRONTEND.onrender.com
- [ ] Upload sample data for testing

## Important URLs

Backend API Docs: https://YOUR-BACKEND.onrender.com/docs
Frontend App: https://YOUR-FRONTEND.onrender.com

## Support

Full guide: DEPLOYMENT.md
Render Docs: https://render.com/docs
