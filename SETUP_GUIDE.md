# RedPill VC Setup Guide

## 🎉 **CURRENT STATUS - SERVERS RUNNING!**

### ✅ **Backend Server**
- **URL**: http://127.0.0.1:8000
- **Status**: ✅ RUNNING 
- **API Documentation**: http://127.0.0.1:8000/docs
- **Health Check**: http://127.0.0.1:8000/health

### ✅ **Frontend Server** 
- **URL**: http://localhost:3000
- **Status**: ✅ READY
- **Note**: Running on standard port 3000

### 🆕 **NEW: Unified AI Chat System**
- ✅ All legacy AI buttons replaced with unified system
- ✅ Open-research-ANA style interface implemented
- ✅ Context-aware AI across all pages
- ✅ Memo saving and persistence working
- ✅ No floating buttons - clean UI

---

## 🧪 **TEST THE NEW AI SYSTEM NOW!**

### **Ready-to-Test Pages:**
1. **🏠 Dashboard**: http://localhost:3000/dashboard  
2. **📊 Portfolio**: http://localhost:3000/portfolio  
3. **💼 Company Pages**: http://localhost:3000/portfolio/[companyId]
4. **💰 Deal Pages**: http://localhost:3000/portfolio/[companyId]/deal
5. **➕ New Company**: http://localhost:3000/companies/new
6. **⚙️ Workflow**: http://localhost:3000/workflow
7. **📜 History**: http://localhost:3000/history

### **What to Test:**
- ✅ Click any "AI Assistant" or "Chat with AI" button
- ✅ Experience the unified sidebar → canvas expansion
- ✅ Type research queries to trigger approval workflow
- ✅ Save AI responses as memos using star button
- ✅ Context awareness (AI knows which page you're on)

---

## 🚀 Quick Start (Every Time Setup)

Follow these steps in order every time you need to start the services:

### 1. Environment Check
```bash
# Verify you're in the project root
cd /Users/marvin/redpill-project
pwd  # Should show: /Users/marvin/redpill-project

# Check required directories exist
ls -la  # Should see: backend/, frontend/, database/
```

### 2. Backend Setup & Start
```bash
# Navigate to backend
cd /Users/marvin/redpill-project/backend

# Verify database configuration (should be SQLite)
grep "database_url" app/config.py
# Expected output: database_url: str = "sqlite:///./redpill.db"

# Install/update dependencies if needed
pip install -r requirements-minimal.txt

# Start backend server
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 &

# Wait 3 seconds for startup
sleep 3

# Verify backend is running
curl -s http://localhost:8000/health | head -1
# Expected: {"status":"healthy",...}
```

### 3. Frontend Setup & Start
```bash
# Navigate to frontend
cd /Users/marvin/redpill-project/frontend

# Verify package.json exists and has dev script
grep -A 1 '"dev"' package.json
# Expected: "dev": "next dev"

# Install/update dependencies if needed
npm install

# Start frontend server
npm run dev &

# Wait 5 seconds for compilation
sleep 5

# Verify frontend is running
curl -I http://localhost:3000 2>/dev/null | head -1
# Expected: HTTP/1.1 200 OK
```

### 4. Service Verification
```bash
# Test backend API connectivity
curl -s "http://localhost:8000/api/v1/workflows/summary"
# Expected: JSON response with workflow stats

# Check both servers are running
ps aux | grep -E "(uvicorn|next dev)" | grep -v grep
# Expected: 2 processes (uvicorn and next dev)

# Test full stack connectivity
curl -s "http://localhost:8000/api/v1/workflows/workflows?limit=1" | wc -l
# Expected: > 0 (JSON response)
```

---

## 🔧 Configuration Files

### Backend Configuration (`backend/app/config.py`)
**Critical Settings:**
```python
# ✅ CORRECT - Use SQLite for development
database_url: str = "sqlite:///./redpill.db"

# ❌ WRONG - Don't use PostgreSQL unless specifically needed
# database_url: str = "postgresql://..."

# CORS settings for frontend connection
allowed_origins: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
```

### Frontend Configuration (`frontend/package.json`)
**Required Scripts:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start"
  }
}
```

---

## 🔍 Troubleshooting Guide

### Problem: "Failed to fetch" error in frontend
**Symptoms:** Dashboard shows "Failed to fetch" error, no workflow data
**Solution:**
```bash
# 1. Check if backend is running
curl http://localhost:8000/health
# If fails: restart backend

# 2. Check database configuration
cd /Users/marvin/redpill-project/backend
grep "database_url" app/config.py
# Should be: sqlite:///./redpill.db

# 3. Restart backend with correct database
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

### Problem: "Connection refused" on port 3000
**Symptoms:** Browser can't connect to localhost:3000
**Solution:**
```bash
# 1. Kill any existing Next.js processes
pkill -f "next dev"

# 2. Navigate to frontend directory
cd /Users/marvin/redpill-project/frontend

# 3. Start fresh
npm run dev

# 4. If port 3000 busy, try different port
npx next dev --port 3001
```

### Problem: Backend database errors
**Symptoms:** PostgreSQL connection errors, "connection refused" to port 5432, or "no such column" SQLite errors
**Solution:**
```bash
# For PostgreSQL connection issues - switch to SQLite
cd /Users/marvin/redpill-project/backend
sed -i '' 's/postgresql:\/\/.*$/sqlite:\/\/\/\/.\\/redpill.db/' app/config.py

# For SQLite schema errors (missing columns) - reset database
cd /Users/marvin/redpill-project/backend
rm -f redpill.db
python -c "
from app.database import engine
from app.models import *
import sqlmodel
sqlmodel.SQLModel.metadata.create_all(engine)
print('✅ Database recreated with current schema')
"

# Restart backend
pkill -f uvicorn
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

### Problem: Module not found errors
**Symptoms:** "No module named 'app'" (backend) or "Can't resolve '@/lib/dealStatusSync'" (frontend)
**Solution:**
```bash
# Backend module errors
cd /Users/marvin/redpill-project/backend
pip install -r requirements-minimal.txt

# Frontend module resolution errors (especially @/lib/dealStatusSync)
pkill -f "next dev"
cd /Users/marvin/redpill-project/frontend
rm -rf .next node_modules/.cache
npm run dev

# If persistent, check if module exists:
ls src/lib/dealStatusSync.ts || echo "File missing - may need to create or import"
```

---

## 📋 Service Management Scripts

### Start All Services (`start-services.sh`)
```bash
#!/bin/bash
echo "🚀 Starting RedPill VC Services..."

# Kill existing processes
pkill -f "uvicorn"
pkill -f "next dev"
sleep 2

# Start Backend
echo "Starting backend..."
cd /Users/marvin/redpill-project/backend
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend  
echo "Starting frontend..."
cd /Users/marvin/redpill-project/frontend
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Verify services
echo "Verifying services..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend running on http://localhost:8000"
else
    echo "❌ Backend failed to start"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend running on http://localhost:3000"
else
    echo "❌ Frontend failed to start"
fi

echo "🎉 Setup complete! Open http://localhost:3000"
```

### Stop All Services (`stop-services.sh`)
```bash
#!/bin/bash
echo "🛑 Stopping RedPill VC Services..."

# Kill processes
pkill -f "uvicorn"
pkill -f "next dev"

echo "✅ All services stopped"
```

### Health Check (`health-check.sh`)
```bash
#!/bin/bash
echo "🔍 Health Check..."

# Check Backend
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend: http://localhost:8000"
else
    echo "❌ Backend: DOWN"
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend: http://localhost:3000"  
else
    echo "❌ Frontend: DOWN"
fi

# Check API connectivity
if curl -s "http://localhost:8000/api/v1/workflows/summary" > /dev/null; then
    echo "✅ API: Workflows endpoint working"
else
    echo "❌ API: Workflows endpoint failed"
fi
```

---

## 🗂️ Directory Structure Reference
```
/Users/marvin/redpill-project/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # Main application
│   │   ├── config.py       # Configuration (check database_url!)
│   │   └── api/            # API endpoints
│   ├── redpill.db          # SQLite database file
│   └── requirements-minimal.txt
├── frontend/               # Next.js frontend  
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/  # Dashboard with AI integration
│   │   │   └── portfolio/  # Portfolio with AI integration
│   │   └── components/
│   │       └── ai/         # Custom AI sidebar components
│   ├── package.json        # Contains dev script
│   └── node_modules/
└── SETUP_GUIDE.md         # This file
```

---

## 🎯 Key Success Indicators

When setup is successful, you should see:

1. **Backend logs:** 
   ```
   INFO: Uvicorn running on http://0.0.0.0:8000
   🚀 Starting Redpill VC CRM...
   ✅ Database tables created
   ```

2. **Frontend logs:**
   ```
   ▲ Next.js 14.0.4
   - Local: http://localhost:3000
   ✓ Ready in 1163ms
   ```

3. **Browser test:** http://localhost:3000 loads dashboard with:
   - Workflow statistics (not empty state)
   - Purple "AI" buttons in header
   - Portfolio data in sidebar navigation

4. **API test:** 
   ```bash
   curl "http://localhost:8000/api/v1/workflows/summary"
   # Returns: {"total_workflows":X,"completed_workflows":Y,...}
   ```

---

## 🔄 Maintenance Notes

- **Database:** Currently using SQLite (`redpill.db`) - no external dependencies
- **AI Features:** Custom sidebar implementation, no external AI API required for testing
- **Dependencies:** Keep `requirements-minimal.txt` and `package.json` updated
- **Ports:** Backend=8000, Frontend=3000 (can use 3001 if 3000 busy)
- **CORS:** Frontend origins configured in `backend/app/config.py`

---

---

## 🤖 **NEW AI FEATURES - IMPLEMENTATION COMPLETE**

### **Unified AI Chat System**
✅ **Complete migration from legacy AI implementations to unified system**

**Key Improvements:**
- **Single Context Provider**: Global AI state management across all pages
- **Open-Research-ANA Interface**: Professional research experience  
- **Type Safety**: Full TypeScript implementation throughout
- **Better Performance**: Smaller bundle sizes, optimized components
- **Future-Ready**: Extensible architecture for easy feature additions

**Technical Details:**
- **UnifiedAISystem.tsx**: Core context provider with global AI state
- **UnifiedAIButtons.tsx**: Multiple button variants (AIButton, ChatWithAIButton, etc.)
- **OpenResearchCanvas.tsx**: Research interface with approval workflow
- **Role Mapping**: Automatic ai → assistant conversion for API compatibility
- **Memo Persistence**: LocalStorage integration with cross-tab updates

**Pages Updated:**
- ✅ Dashboard (`/dashboard`) - Removed EnhancedAIChat wrapper
- ✅ Portfolio (`/portfolio/[companyId]`) - Updated all AI interactions  
- ✅ Deal Pages (`/portfolio/[companyId]/deal`) - Migrated AI buttons
- ✅ New Company (`/companies/new`) - Updated AI assistance
- ✅ Workflow (`/workflow`) - Updated workflow AI guidance
- ✅ Global Layout - Removed floating AI button

**Features Available:**
- 🔍 **Research Mode**: Type research queries → approval workflow → detailed research
- ⭐ **Memo Saving**: Star button to save AI responses as persistent memos
- 📋 **Context Awareness**: AI knows current page, project, and deal context
- 🎯 **Smart Triggers**: Keywords like "research", "analyze" trigger approval workflow
- 💾 **Cross-Tab Sync**: Memos sync across browser tabs using events

---

*Last updated: July 29, 2025 - Unified AI System Implementation Complete*