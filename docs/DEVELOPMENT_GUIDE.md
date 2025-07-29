# 🚀 Three-Pillar Development Guide

## 🏛️ Architecture Overview

RedpillAI is built on a **Three-Pillar Architecture** that combines three specialized systems:

```
┌─────────────────┬─────────────────┬─────────────────┐
│   🤖 AG-UI      │   📊 OpenBB     │   🏢 OpenProject │
│   Protocol      │   Platform      │   Portfolio     │
│                 │                 │   Manager       │
└─────────────────┴─────────────────┴─────────────────┘
         │                │                 │
         └────────────────┼─────────────────┘
                          │
                ┌─────────────────┐
                │ Three-Pillar    │
                │ Bridge System   │
                └─────────────────┘
```

## 🎯 Quick Start

### Prerequisites
- Docker Desktop
- Node.js 18+
- Python 3.8+

### 1. Start Core Services
```bash
# Start database and cache
docker-compose up -d postgres redis

# Initialize database
cd backend && alembic upgrade head
```

### 2. Start Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🏗️ Three-Pillar Development

### 🤖 Pillar 1: AG-UI Protocol (AI Agents)

**Location**: `frontend/src/lib/agents/`

**Key Files**:
- `ag-ui-client.ts` - Agent communication client
- `three-pillar-bridge.ts` - Cross-pillar integration
- `frontend/src/components/agents/` - Agent interface components

**Development**:
```bash
# Test agent communication
curl -X POST http://localhost:3000/api/agents/research \
  -d '{"query": "Research Company X", "context": {"project_id": "123"}}'
```

### 📊 Pillar 2: OpenBB Platform (Financial Data)

**Location**: `backend/app/services/openbb_service.py`

**Key Files**:
- `openbb_service.py` - OpenBB platform integration
- `backend/app/api/market.py` - Market data endpoints
- `frontend/src/components/openbb/` - Financial data UI

**Development**:
```bash
# Test financial data
curl http://localhost:8000/api/v1/market/crypto/BTC/price

# Add API keys for premium data
export OPENBB_PAT=your_openbb_token
export FMP_API_KEY=your_fmp_key
export POLYGON_API_KEY=your_polygon_key
```

### 🏢 Pillar 3: OpenProject (Portfolio Management)

**Location**: `backend/app/services/openproject_service.py`

**Key Files**:
- `openproject_service.py` - OpenProject API integration
- `backend/app/api/portfolio.py` - Portfolio endpoints
- `frontend/src/components/portfolio/` - Portfolio management UI

**Development**:
```bash
# Test portfolio management
curl http://localhost:8000/api/v1/portfolio/projects

# Configure OpenProject instance
export OPENPROJECT_URL=your_openproject_url
export OPENPROJECT_API_KEY=your_api_key
```

## 🔧 Environment Configuration

### Backend Environment (`backend/.env`)
```env
# Database
DATABASE_URL=postgresql://redpill:redpill@localhost:5432/redpill
REDIS_URL=redis://localhost:6379

# OpenBB Platform (Financial Data)
OPENBB_PAT=your_openbb_token
FMP_API_KEY=your_fmp_key
POLYGON_API_KEY=your_polygon_key

# OpenProject (Portfolio Management)
OPENPROJECT_URL=your_openproject_url
OPENPROJECT_API_KEY=your_api_key

# Application
DEBUG=true
SECRET_KEY=your_secret_key
```

### Frontend Environment (`frontend/.env.local`)
```env
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🧪 Testing Three-Pillar Integration

### Test All Pillars
```bash
# 1. Test AG-UI Agents
curl -X POST http://localhost:3000/api/agents/research \
  -d '{"query": "Research LayerZero protocol", "context": {"project_id": "test"}}'

# 2. Test OpenBB Financial Data
curl http://localhost:8000/api/v1/market/crypto/BTC/price

# 3. Test Portfolio Management
curl http://localhost:8000/api/v1/portfolio/projects
```

### Integrated Workflow Test
```bash
# Start due diligence workflow (combines all three pillars)
curl -X POST http://localhost:8000/api/v1/workflows/due-diligence \
  -d '{"company": "LayerZero", "project_id": "123"}'
```

## 📁 Project Structure

```
redpill-project/
├── frontend/                    # Next.js frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── agents/         # AG-UI agent interface
│   │   │   ├── openbb/         # Financial data components  
│   │   │   └── portfolio/      # Portfolio management UI
│   │   └── lib/
│   │       ├── agents/         # AG-UI client
│   │       └── integrations/   # Three-pillar bridge
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── api/                # API endpoints
│   │   ├── services/           # Three-pillar services
│   │   │   ├── openbb_service.py
│   │   │   └── openproject_service.py
│   │   └── models/             # Database models
└── docs/                       # Documentation
    ├── DEVELOPMENT_GUIDE.md    # This file
    └── THREE_PILLAR_ARCHITECTURE_COMPLETE.md
```

## 🔄 Common Development Tasks

### Add New Agent Type
```bash
# 1. Define agent in frontend
touch frontend/src/lib/agents/new-agent.ts

# 2. Add agent interface component
touch frontend/src/components/agents/new-agent-interface.tsx

# 3. Register in AG-UI client
# Edit: frontend/src/lib/agents/ag-ui-client.ts
```

### Add New Financial Data Provider
```bash
# 1. Extend OpenBB service
# Edit: backend/app/services/openbb_service.py

# 2. Add API endpoint
# Edit: backend/app/api/market.py

# 3. Update frontend components
# Edit: frontend/src/components/openbb/
```

### Add Portfolio Feature
```bash
# 1. Extend OpenProject service
# Edit: backend/app/services/openproject_service.py

# 2. Add portfolio endpoint
# Edit: backend/app/api/portfolio.py

# 3. Update UI components
# Edit: frontend/src/components/portfolio/
```

## 🐛 Debugging

### View Logs
```bash
# Backend logs
cd backend && uvicorn app.main:app --reload --log-level debug

# Database logs
docker logs redpill-postgres

# Frontend logs
cd frontend && npm run dev
```

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Database connection
docker exec redpill-postgres pg_isready -U redpill

# Three-pillar status
curl http://localhost:8000/api/v1/status/pillars
```

## 🚀 Production Deployment

### Build for Production
```bash
# Backend
cd backend && pip install -r requirements.txt

# Frontend
cd frontend && npm run build

# Docker
docker-compose up -d
```

### Environment Variables (Production)
- Replace localhost URLs with production URLs
- Use production database credentials
- Add production API keys for all three pillars
- Configure CORS for production domains

## 📚 Further Reading

- **Architecture**: `THREE_PILLAR_ARCHITECTURE_COMPLETE.md`
- **API Documentation**: http://localhost:8000/docs
- **AG-UI Protocol**: https://github.com/ag-ui-protocol/ag-ui
- **OpenBB Platform**: https://docs.openbb.co
- **OpenProject**: https://docs.openproject.org

---

**Status**: Three-Pillar Architecture Ready 🚀