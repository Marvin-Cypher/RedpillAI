# Redpill VC CRM - Development Guide

## 🎯 Professional Development Environment Setup

This guide shows you how to set up a **stable, production-like development environment** that solves common UI testing problems.

### 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   Backend       │───▶│   Database      │
│  localhost:3004 │    │ Docker Container│    │ PostgreSQL      │
│   (Local Dev)   │    │   (Stable)      │    │ (Persistent)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Benefits:**
- ✅ **Stable Backend**: No more crashes during UI testing
- ✅ **Persistent Database**: Data survives restarts
- ✅ **Fast Frontend**: Hot reload for UI changes
- ✅ **Production-like**: Same tech stack as production

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed
- Git

### 1. Setup Development Environment
```bash
# Clone and navigate to project
cd redpill-project

# Setup stable backend + database (one-time setup)
./scripts/dev-setup.sh
```

### 2. Start Frontend Development
```bash
# Start frontend with hot reload
./scripts/frontend-dev.sh
```

### 3. Access Your Application
- **Frontend**: http://localhost:3004
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔧 Development Workflow

### Daily Development
```bash
# 1. Start your development session
./scripts/frontend-dev.sh

# 2. Make frontend changes - auto-reloads
# Edit files in: suna/frontend/src/

# 3. Backend is stable - no restarts needed
# Data persists across sessions
```

### Backend Changes (When Needed)
```bash
# If you need to modify backend code:
docker-compose -f docker-compose.dev.yml restart backend

# If you need fresh data:
./scripts/dev-reset.sh
```

## 📊 Services Overview

| Service | URL | Purpose | Persistence |
|---------|-----|---------|-------------|
| **Frontend** | http://localhost:3004 | UI Development | Local files |
| **Backend** | http://localhost:8000 | API Server | Docker container |
| **Database** | localhost:5432 | PostgreSQL | Docker volume |
| **Redis** | localhost:6379 | Caching | Docker volume |

## 🎨 Frontend Development

### Hot Reload Enabled
- Make changes to React components
- Automatic browser refresh
- TypeScript compilation
- Error overlay in browser

### Key Directories
```
suna/frontend/src/
├── components/vc/          # Your VC-specific components
├── app/(dashboard)/        # Page routes
├── lib/vc-api.ts          # API client
└── styles/                # Styling
```

### API Integration
Your frontend automatically connects to the stable backend:
```typescript
// Configured in .env.local
NEXT_PUBLIC_VC_BACKEND_URL="http://localhost:8000/api/v1"
```

## 🗄️ Database Management

### Sample Data
The database comes pre-loaded with:
- 5 VC portfolio companies (LayerZero, Celestia, etc.)
- 5 investment deals in various stages
- Demo user account

### Reset Data
```bash
# Clean slate with fresh sample data
./scripts/dev-reset.sh
```

### Database Access
```bash
# Connect to PostgreSQL directly
docker exec -it redpill-postgres psql -U redpill -d redpill

# View tables
\dt

# Query deals
SELECT company_name, status, stage FROM deals;
```

## 🐛 Debugging & Monitoring

### View Logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Database connection
docker exec redpill-postgres pg_isready -U redpill
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Connection refused" | Run `./scripts/dev-setup.sh` |
| "Database not found" | Run `./scripts/dev-reset.sh` |
| Frontend won't start | Check Node.js version (18+) |
| Docker errors | Restart Docker Desktop |

## 🔄 Environment Management

### Development States

**Clean Start:**
```bash
./scripts/dev-setup.sh  # Fresh environment
./scripts/frontend-dev.sh
```

**Daily Development:**
```bash
./scripts/frontend-dev.sh  # Just frontend
```

**Reset Everything:**
```bash
./scripts/dev-reset.sh    # Nuclear option
./scripts/frontend-dev.sh
```

## 🎯 UI Testing Strategy

### Stable Testing Environment
1. **Backend Never Crashes** - Containerized and supervised
2. **Data Always Available** - Pre-seeded with realistic VC data
3. **Fast Iteration** - Frontend hot reload for UI changes
4. **Consistent State** - Database persists across sessions

### Testing Scenarios
- **Portfolio Dashboard**: View real deal data
- **AI Chat**: Test with sample companies
- **Deal Management**: CRUD operations with persistent data
- **Authentication**: Mock user automatically logged in

### Best Practices
1. **Make UI changes** → Automatic reload
2. **Test with stable data** → No backend restarts needed  
3. **Need fresh data?** → `./scripts/dev-reset.sh`
4. **Backend changes?** → Restart backend container only

## 🚀 Production Readiness

This development setup mirrors production:
- **PostgreSQL** (same as production)
- **Redis** (same as production)
- **Docker containers** (same as production)
- **Environment variables** (same pattern as production)

When ready to deploy:
1. Replace localhost URLs with production URLs
2. Use production database credentials
3. Deploy containers to your cloud provider

## 📝 Next Steps

1. **Start developing**: `./scripts/frontend-dev.sh`
2. **Build VC features** in stable environment
3. **Test thoroughly** with persistent data
4. **Deploy confidently** using same architecture

---

**Need help?** Check the logs first:
```bash
docker-compose -f docker-compose.dev.yml logs -f
```