# RedpillAI Deployment Guide

## 🚀 Vercel Deployment

### Option 1: Deploy Frontend Only (Recommended for Demo)

1. **Fork/Clone the Repository**
   ```bash
   git clone https://github.com/Marvin-Cypher/RedpillAI.git
   cd RedpillAI
   ```

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - **Set Root Directory to `frontend`**
   - Configure Environment Variables (see below)
   - Deploy

3. **Environment Variables (Required)**
   Add these in Vercel Dashboard → Settings → Environment Variables:
   ```env
   REDPILL_AI_API_KEY=your_redpill_ai_key
   COINGECKO_API_KEY=your_coingecko_key
   NEXTAUTH_SECRET=your_random_secret_32_chars
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

4. **Get API Keys**
   - **Redpill AI**: Sign up at [redpill.ai](https://redpill.ai)
   - **CoinGecko**: Get free API key at [coingecko.com/api](https://coingecko.com/api)
   - **NextAuth Secret**: Generate with `openssl rand -base64 32`

### Option 2: Full Stack Deployment

For production with backend, consider:

1. **Frontend on Vercel** (frontend directory)
2. **Backend on Railway/Render** (backend directory)
3. **Database on Supabase/PlanetScale**

### Vercel Configuration Files

The project includes:
- `frontend/vercel.json` - Vercel-specific configuration
- `frontend/next.config.js` - Next.js configuration optimized for Vercel

### Build Configuration

- **Framework**: Next.js 14
- **Node Version**: 18.x
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

## 🛠 Local Development

1. **Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Add your API keys to .env.local
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build and Test**
   ```bash
   npm run build
   npm run start
   ```

## 🔧 Troubleshooting

### Common Vercel Deployment Issues

1. **Build Errors**
   - Ensure all environment variables are set
   - Check TypeScript errors with `npm run type-check`
   - Verify all dependencies are in `package.json`

2. **Runtime Errors**
   - Check API keys are correctly configured
   - Verify NEXTAUTH_URL matches your domain
   - Check browser console for client-side errors

3. **API Timeouts**
   - Vercel functions have 30s timeout limit
   - AI responses might take longer - consider upgrading plan
   - Implement proper error handling for timeouts

### Environment Variables

```env
# Required
REDPILL_AI_API_KEY=sk-xxx
COINGECKO_API_KEY=CG-xxx
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-domain.vercel.app

# Optional (for production)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🌐 Custom Domain

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` environment variable
4. Redeploy

## 📊 Performance Optimization

- Static pages are pre-rendered
- API routes use Edge Runtime where possible
- Images are optimized with Next.js Image component
- Bundle is analyzed and optimized

## 🔒 Security

- Environment variables are encrypted in Vercel
- API keys are never exposed to client
- CORS is configured properly
- NextAuth handles authentication securely

## 🎯 Quick Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Marvin-Cypher/RedpillAI&project-name=redpillai&repository-name=RedpillAI&root-directory=frontend&env=REDPILL_AI_API_KEY,COINGECKO_API_KEY,NEXTAUTH_SECRET&envDescription=Required%20API%20keys%20for%20RedpillAI&envLink=https://github.com/Marvin-Cypher/RedpillAI/blob/main/README.md%23configuration)

## 📞 Support

If you encounter deployment issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Open an issue in the [GitHub repository](https://github.com/Marvin-Cypher/RedpillAI/issues)
- Review the deployment logs in Vercel Dashboard