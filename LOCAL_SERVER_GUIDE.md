# 🚀 Local Server Startup Guide
**RedPill VC CRM - Complete Local Development Environment Setup**

## ⚡ Quick Start (2 Minutes)

### Prerequisites Check
```bash
# Check if required tools are installed
python --version      # Need Python 3.9+
node --version        # Need Node.js 18+
postgres --version    # Need PostgreSQL 14+
redis-server --version # Need Redis 6+
```

### 🎯 Fastest Server Startup

**Option 1: Using Scripts (Recommended)**
```bash
# Start everything with one command
./scripts/start-services.sh

# Or if scripts don't have execute permissions
chmod +x scripts/*.sh
./scripts/start-services.sh
```

**Option 2: Manual Startup**
```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements-minimal.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev

# Terminal 3 - Database (if not already running)
brew services start postgresql  # macOS
brew services start redis       # macOS
```

## 📋 Complete Setup Guide

### 1️⃣ Database Setup

**PostgreSQL Setup:**
```bash
# macOS
brew install postgresql
brew services start postgresql

# Create database and user
createuser -s redpill
createdb redpill -O redpill

# Or use psql
psql postgres
CREATE USER redpill WITH PASSWORD 'redpill';
CREATE DATABASE redpill OWNER redpill;
\q
```

**Redis Setup:**
```bash
# macOS
brew install redis
brew services start redis

# Test Redis
redis-cli ping  # Should return PONG
```

### 2️⃣ Backend Setup

**Environment Configuration:**
```bash
cd backend

# Create .env file
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://redpill:redpill@localhost:5432/redpill

# Redis
REDIS_URL=redis://localhost:6379

# AI Services (REQUIRED - Get from your provider)
REDPILL_API_KEY=your_redpill_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Optional External APIs
COINGECKO_API_KEY=optional_api_key
FMP_API_KEY=optional_api_key
EOF
```

**Install Dependencies & Start:**
```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements-minimal.txt

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --port 8000

# Backend will be available at: http://localhost:8000
# API docs at: http://localhost:8000/docs
```

### 3️⃣ Frontend Setup

**Environment Configuration:**
```bash
cd frontend

# Create .env.local file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
```

**Install & Start:**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Frontend will be available at: http://localhost:3000
```

## 🛠️ Development Commands

### Backend Commands
```bash
cd backend

# Start server
uvicorn app.main:app --reload --port 8000

# Run with specific host (for network access)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
alembic upgrade head          # Apply migrations
alembic revision --autogenerate -m "Description"  # Create new migration
alembic downgrade -1          # Rollback one migration

# Seed database with sample data
python app/seed_data.py

# Run tests
pytest

# Format code
black app/
isort app/
```

### Frontend Commands
```bash
cd frontend

# Development
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues

# Type checking
npm run type-check   # Run TypeScript compiler check

# Clean install (if issues)
rm -rf node_modules package-lock.json
npm install
```

## 🔍 Verify Everything is Working

### 1. Check Backend Health
```bash
# API Health check
curl http://localhost:8000/api/v1/health

# Or open in browser
open http://localhost:8000/docs
```

### 2. Check Frontend
```bash
# Open in browser
open http://localhost:3000

# Should see the RedPill VC homepage
```

### 3. Test AI Chat
1. Navigate to http://localhost:3000/dashboard
2. Click "Chat with AI" button
3. Type a message
4. Should get AI response

### 4. Check Logs
```bash
# Backend logs (in the terminal running uvicorn)
# Look for:
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
🚀 AI Chat Request - chat_abc12345  # When using AI chat

# Frontend logs (in browser console - F12)
# Look for:
🟦 UnifiedAISystem render
🟢 ChatWithAIButton clicked!
🎨 OpenResearchCanvas render
```

## 🐳 Docker Alternative (All-in-One)

```bash
# Start everything with Docker Compose
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🚨 Troubleshooting

### Common Issues & Fixes

**"Cannot connect to database"**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql
# If not running: brew services start postgresql

# Check connection
psql -U redpill -d redpill -h localhost
```

**"Redis connection refused"**
```bash
# Check Redis is running
redis-cli ping
# If not running: brew services start redis
```

**"Module not found" (Python)**
```bash
cd backend
pip install -r requirements-minimal.txt
```

**"Cannot find module" (Node.js)**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**"API key errors"**
```bash
# Check .env file exists and has keys
cd backend
cat .env  # Should show your API keys

# Make sure NO SPACES around = in .env file
REDPILL_API_KEY=your_key_here  # ✅ Correct
REDPILL_API_KEY = your_key_here  # ❌ Wrong
```

**"Port already in use"**
```bash
# Find what's using the port
lsof -i :8000  # Backend port
lsof -i :3000  # Frontend port

# Kill the process
kill -9 <PID>

# Or kill all
pkill -f uvicorn
pkill -f "next"
```

## 🎯 Quick Commands Reference

### Start Everything
```bash
# Option 1: Use script
./scripts/start-services.sh

# Option 2: Manual in separate terminals
cd backend && uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```

### Stop Everything
```bash
# Option 1: Use script
./scripts/stop-services.sh

# Option 2: Manual
pkill -f uvicorn
pkill -f "next"
brew services stop postgresql
brew services stop redis
```

### Reset Everything
```bash
# Nuclear option - reset database
cd backend
alembic downgrade base
alembic upgrade head
python app/seed_data.py

# Clear Redis
redis-cli FLUSHALL

# Clear frontend cache
cd frontend
rm -rf .next
npm run dev
```

### Monitor Services
```bash
# Check what's running
ps aux | grep uvicorn
ps aux | grep next
brew services list

# Check ports
lsof -i :8000
lsof -i :3000
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# View logs
tail -f backend/backend.log
# Frontend logs in browser console
```

## 📊 Performance Tips

### Backend Optimization
```bash
# Run with multiple workers (production-like)
uvicorn app.main:app --workers 4 --port 8000

# Enable SQL query logging (debug)
# In backend/.env add:
DATABASE_ECHO=true
```

### Frontend Optimization
```bash
# Analyze bundle size
npm run analyze

# Build and preview production
npm run build
npm run start
```

## 🔐 Security Checklist

- [ ] Never commit `.env` files
- [ ] API keys are in environment variables only
- [ ] Database has non-default password
- [ ] Redis is not exposed to network
- [ ] CORS is configured properly

## 📝 Next Steps

Once everything is running:

1. **Test AI Chat**: Go to Dashboard → Click "Chat with AI"
2. **Create Company**: Go to Companies → Add New
3. **Manage Deals**: Go to Deal Pipeline
4. **Check API Docs**: http://localhost:8000/docs

---

**Quick Reference Card:**
```bash
# Start backend:  cd backend && uvicorn app.main:app --reload --port 8000
# Start frontend: cd frontend && npm run dev
# Kill all:       pkill -f uvicorn && pkill -f "next"
# Check health:   curl http://localhost:8000/api/v1/health
```

**Typical Development Session:**
1. Start PostgreSQL & Redis (usually already running)
2. Start backend in Terminal 1
3. Start frontend in Terminal 2
4. Open http://localhost:3000
5. Check browser console for errors
6. Happy coding! 🚀