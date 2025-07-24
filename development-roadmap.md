# Redpill Development Roadmap

## Long-term Project Access Guide

This document provides the complete path and structure for accessing all components of the Redpill project during long-term development.

## Project Location
**Main Directory**: `/Users/marvin/redpill-project/`

## Development Environment Setup

### Initial Setup Commands
```bash
# Navigate to project root
cd /Users/marvin/redpill-project

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup  
cd ../frontend
npm install

# Database setup
docker-compose up -d postgres redis
cd backend && alembic upgrade head
```

## Key File Paths for Development

### 🏗️ Backend Core Files
```bash
# Main application entry point
/Users/marvin/redpill-project/backend/app/main.py

# Database models
/Users/marvin/redpill-project/backend/app/models/deals.py
/Users/marvin/redpill-project/backend/app/models/conversations.py
/Users/marvin/redpill-project/backend/app/models/portfolio.py

# API endpoints
/Users/marvin/redpill-project/backend/app/api/deals.py
/Users/marvin/redpill-project/backend/app/api/chat.py
/Users/marvin/redpill-project/backend/app/api/documents.py

# AI services
/Users/marvin/redpill-project/backend/app/ai_agents/research_crew.py
/Users/marvin/redpill-project/backend/app/services/document_analysis.py
```

### 🎨 Frontend Core Files
```bash
# Main dashboard
/Users/marvin/redpill-project/frontend/src/app/page.tsx

# Deal management
/Users/marvin/redpill-project/frontend/src/app/deals/page.tsx
/Users/marvin/redpill-project/frontend/src/app/deals/[id]/page.tsx

# Chat interface
/Users/marvin/redpill-project/frontend/src/components/chat/ChatWindow.tsx
/Users/marvin/redpill-project/frontend/src/components/chat/MessageList.tsx

# Deal pipeline
/Users/marvin/redpill-project/frontend/src/components/deals/DealPipeline.tsx
/Users/marvin/redpill-project/frontend/src/components/deals/StatusSelector.tsx
```

### 📊 Database & Configuration
```bash
# Database schema
/Users/marvin/redpill-project/database/init.sql

# Environment configuration
/Users/marvin/redpill-project/.env
/Users/marvin/redpill-project/.env.example

# Docker setup
/Users/marvin/redpill-project/docker-compose.yml
```

### 🤖 AI & Integration Files
```bash
# Multi-agent system
/Users/marvin/redpill-project/backend/app/ai_agents/market_analyst.py
/Users/marvin/redpill-project/backend/app/ai_agents/tech_analyst.py
/Users/marvin/redpill-project/backend/app/ai_agents/financial_analyst.py

# External API integrations
/Users/marvin/redpill-project/integrations/coingecko/api.py
/Users/marvin/redpill-project/integrations/messari/api.py
```

## Development Phases & Priorities

### Phase 1: Core CRM (Weeks 1-2)
**Start Here**: Basic VC deal flow management

**Priority Files**:
1. `backend/app/main.py` - FastAPI setup
2. `backend/app/models/deals.py` - Deal database model
3. `backend/app/api/deals.py` - Deal CRUD operations
4. `frontend/src/app/page.tsx` - Dashboard
5. `frontend/src/components/deals/DealPipeline.tsx` - Pipeline UI

**Testing**:
```bash
# Backend
cd /Users/marvin/redpill-project/backend
uvicorn app.main:app --reload

# Frontend
cd /Users/marvin/redpill-project/frontend  
npm run dev
```

### Phase 2: AI Research Engine (Weeks 3-4)
**Focus**: Multi-agent research and document analysis

**Priority Files**:
1. `backend/app/ai_agents/research_crew.py` - Agent coordination
2. `backend/app/services/document_analysis.py` - RAG system
3. `backend/app/api/chat.py` - AI chat endpoints
4. `frontend/src/components/chat/ChatWindow.tsx` - Chat UI
5. `frontend/src/hooks/useChat.ts` - Chat functionality

### Phase 3: Portfolio & Fund Admin (Weeks 5-6)
**Focus**: Portfolio tracking and fund administration

**Priority Files**:
1. `backend/app/models/portfolio.py` - Portfolio models
2. `backend/app/api/fund_admin.py` - Fund administration
3. `frontend/src/app/portfolio/page.tsx` - Portfolio dashboard
4. `frontend/src/app/fund-admin/page.tsx` - Fund admin interface

### Phase 4: TEE Integration (Weeks 7-8)
**Focus**: Privacy-first architecture with Phala TEE

**Priority Files**:
1. `ai-services/tee-deployment/` - TEE integration
2. `backend/app/core/tee_client.py` - TEE communication
3. Privacy-enhanced components

## Quick Access Commands

### Development Workflow
```bash
# Start development environment
cd /Users/marvin/redpill-project
docker-compose up -d

# Backend development
cd backend && uvicorn app.main:app --reload

# Frontend development  
cd frontend && npm run dev

# Database migrations
cd backend && alembic revision --autogenerate -m "description"
cd backend && alembic upgrade head
```

### Common Tasks
```bash
# Add new AI agent
touch /Users/marvin/redpill-project/backend/app/ai_agents/new_agent.py

# Add new API endpoint
touch /Users/marvin/redpill-project/backend/app/api/new_endpoint.py

# Add new React component
touch /Users/marvin/redpill-project/frontend/src/components/new_component.tsx

# Add new database model
# Edit: /Users/marvin/redpill-project/backend/app/models/new_model.py
```

## Configuration Files to Monitor

### Backend Configuration
- `/Users/marvin/redpill-project/backend/app/config.py` - App settings
- `/Users/marvin/redpill-project/backend/requirements.txt` - Python deps
- `/Users/marvin/redpill-project/backend/alembic.ini` - Database migrations

### Frontend Configuration  
- `/Users/marvin/redpill-project/frontend/package.json` - Node deps
- `/Users/marvin/redpill-project/frontend/next.config.js` - Next.js config
- `/Users/marvin/redpill-project/frontend/tailwind.config.js` - Styling

### Infrastructure
- `/Users/marvin/redpill-project/docker-compose.yml` - Local development
- `/Users/marvin/redpill-project/infrastructure/kubernetes/` - Production deployment

## Testing & Quality Assurance

### Test File Locations
```bash
# Backend tests
/Users/marvin/redpill-project/backend/tests/test_deals.py
/Users/marvin/redpill-project/backend/tests/test_ai_agents.py

# Frontend tests
/Users/marvin/redpill-project/frontend/__tests__/components/
/Users/marvin/redpill-project/frontend/__tests__/pages/
```

### Running Tests
```bash
# Backend tests
cd /Users/marvin/redpill-project/backend
pytest

# Frontend tests
cd /Users/marvin/redpill-project/frontend
npm test
```

## Documentation Access

### Key Documentation Files
- `/Users/marvin/redpill-project/README.md` - Project overview
- `/Users/marvin/redpill-project/docs/architecture.md` - System architecture
- `/Users/marvin/redpill-project/docs/api-specification.md` - API docs
- `/Users/marvin/redpill-project/docs/database-schema.md` - Database design

## Monitoring & Logging

### Log Files (Development)
```bash
# Application logs
/Users/marvin/redpill-project/logs/app.log
/Users/marvin/redpill-project/logs/ai-agents.log

# Database logs
docker logs redpill-postgres

# AI service logs  
/Users/marvin/redpill-project/ai-services/logs/
```

## Environment Variables

### Required Environment Setup
```bash
# Copy example and edit
cp /Users/marvin/redpill-project/.env.example /Users/marvin/redpill-project/.env

# Key variables to set:
DATABASE_URL=postgresql://user:pass@localhost:5432/redpill
OPENAI_API_KEY=your_openai_key
REDIS_URL=redis://localhost:6379
SECRET_KEY=your_secret_key
```

This roadmap ensures you can quickly navigate and develop the Redpill project over the long term, with clear paths to all components and development workflows.