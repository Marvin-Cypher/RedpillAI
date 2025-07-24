# 🚀 Vercel Deployment Fix for 404 Error

If you're getting a 404 NOT_FOUND error, follow these **exact steps**:

## ✅ Correct Deployment Steps

### 1. Deploy from GitHub
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select "Import Git Repository"
4. Choose your `RedpillAI` repository

### 2. **CRITICAL**: Set Correct Directories
- In the deployment configuration:
- **Root Directory**: `frontend` ⚠️ **THIS IS REQUIRED**
- **Framework Preset**: Next.js (should auto-detect)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` ⚠️ **NOT "public"**
- **Install Command**: `npm install` (default)

### 3. Environment Variables
Add these in Vercel Dashboard:
```
REDPILL_AI_API_KEY=your_key_here
COINGECKO_API_KEY=your_key_here  
NEXTAUTH_SECRET=generate_32_char_secret
NEXTAUTH_URL=https://your-app.vercel.app
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 4. Deploy
Click "Deploy" and wait for build to complete.

## 🔧 If Still Getting 404

### Check These Settings:
1. **Root Directory MUST be `frontend`**
2. **Framework MUST be Next.js**
3. **All environment variables added**

### Re-deploy Steps:
1. Go to Vercel Dashboard → Your Project
2. Settings → General
3. **Root Directory**: Change to `frontend`
4. Save and redeploy

### Alternative: Manual File Upload
If Git deployment fails:
1. Download the repository
2. Navigate to `frontend` folder
3. Run `npm run build` locally
4. Upload the `frontend` folder to Vercel

## 🎯 One-Click Deploy (Correct Configuration)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Marvin-Cypher/RedpillAI&project-name=redpillai&repository-name=RedpillAI&root-directory=frontend&env=REDPILL_AI_API_KEY,COINGECKO_API_KEY,NEXTAUTH_SECRET&envDescription=Required%20API%20keys%20for%20RedpillAI)

**This button automatically sets `frontend` as root directory.**

## 🐛 Common Issues

### Issue: 404 on Root Page
**Solution**: Root directory not set to `frontend`

### Issue: "No Output Directory named 'public' found"
**Solution**: Set Output Directory to `.next` (NOT "public")
- Go to Project Settings → General
- Output Directory: `.next`
- Save and redeploy

### Issue: Build Fails
**Solution**: Missing environment variables

### Issue: API Routes 500 Error  
**Solution**: Check API keys are correct

### Issue: Deployment Timeout
**Solution**: The build is working, just takes time on first deploy

## ✅ Verify Deployment

After successful deployment:
1. Visit your Vercel URL
2. You should see the RedpillAI dashboard
3. Test the AI chat with a simple message
4. Check that deals can be created

## 📞 Still Having Issues?

1. Check Vercel deployment logs
2. Ensure all environment variables are set
3. Verify repository has latest code
4. Try redeploying from Vercel dashboard

The key is ensuring **Root Directory = `frontend`** in Vercel settings!