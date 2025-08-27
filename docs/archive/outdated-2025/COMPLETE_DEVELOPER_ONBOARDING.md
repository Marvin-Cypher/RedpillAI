# 🚀 Complete Developer Onboarding Guide
**RedPill VC CRM - AI-Powered Venture Capital Platform**

> This document contains ALL critical knowledge needed to understand, maintain, and extend this project. It preserves our complete development context, architectural decisions, and technical memory.

## 📋 Table of Contents
1. [Project Overview & Architecture](#project-overview--architecture)
2. [Recent Critical Work & Context](#recent-critical-work--context)
3. [AI Chat System (Unified Architecture)](#ai-chat-system-unified-architecture)
4. [Technical Stack & Dependencies](#technical-stack--dependencies)
5. [File Structure & Organization](#file-structure--organization)
6. [Development Workflow](#development-workflow)
7. [API Configuration & Security](#api-configuration--security)
8. [Debugging & Troubleshooting](#debugging--troubleshooting)
9. [Known Issues & Solutions](#known-issues--solutions)
10. [Future Development Guidelines](#future-development-guidelines)

---

## 🎯 Project Overview & Architecture

### Mission
RedPill VC CRM is an AI-powered venture capital platform designed for modern VC firms specializing in blockchain, DeFi, and Web3 investments.

### Three-Pillar Architecture
1. **CopilotKit AI** - Modern AI interface with unified system integration
2. **OpenBB Platform** - Professional financial data access  
3. **OpenProject** - Portfolio management and document workflow

### Core Technology Stack
- **Backend**: FastAPI + SQLModel + PostgreSQL + Redis + MinIO
- **Frontend**: Next.js 14 + TypeScript + Tailwind + Shadcn/UI
- **AI**: Dual provider (Redpill AI + OpenAI fallback) with specialized VC prompts
- **Database**: SQLModel with type-safe operations, Alembic migrations

---

## 🔄 Recent Critical Work & Context

### 🎨 Unified AI Chat System Implementation (COMPLETED)
**Status**: ✅ Fully implemented and working
**Date**: Latest development cycle
**Critical Decision**: Replaced all fragmented AI chat components with unified system

#### What Was Built:
1. **UnifiedAISystem.tsx** - Global AI context provider
2. **OpenResearchCanvas.tsx** - Open-research-ANA style interface
3. **UnifiedAIButtons.tsx** - Consistent AI buttons across platform
4. **Backend AI Service** - Simplified using OpenAI client with Redpill baseURL

#### Key Technical Decisions:
- **Pattern**: Sidebar → fullscreen expansion (open-research-ANA style)
- **State Management**: React Context API with localStorage persistence
- **API Strategy**: OpenAI client with custom baseURL for Redpill AI compatibility
- **Error Handling**: Graceful fallback chain: Redpill AI → OpenAI → Mock responses

#### Files Modified/Created:
- `frontend/src/components/ai/UnifiedAISystem.tsx` (Core context provider)
- `frontend/src/components/ai/OpenResearchCanvas.tsx` (Main chat interface)
- `frontend/src/components/ai/UnifiedAIButtons.tsx` (Button components)
- `backend/app/services/ai_service.py` (Simplified AI service)
- `frontend/src/app/dashboard/page.tsx` (Updated to use unified system)
- `frontend/src/app/portfolio/page.tsx` (Updated to use unified system)
- `frontend/src/app/dealflow/page.tsx` (Updated to use unified system)

### 🔧 Backend AI Service Modernization
**Problem Solved**: Complex aiohttp-based Redpill API calls were unreliable
**Solution**: Simplified to use OpenAI client with custom baseURL

```python
# Before: Complex aiohttp implementation
async def _call_redpill_api(self, messages, ...):
    async with aiohttp.ClientSession() as session:
        # Complex error-prone implementation
        
# After: Clean OpenAI client approach
self.client = OpenAI(
    base_url="https://api.redpill.ai/v1",
    api_key=settings.redpill_api_key
)
```

### 🗂️ Code Architecture Cleanup
- **Archived obsolete code** in `docs/archive/obsolete-code/`
- **Removed Suna integration** (superseded by native Redpill AI)
- **Unified all AI chat entry points** across the platform
- **Eliminated floating AI button** per user preference

---

## 🤖 AI Chat System (Unified Architecture)

### Core Components

#### 1. UnifiedAISystem (Context Provider)
**File**: `frontend/src/components/ai/UnifiedAISystem.tsx`
**Purpose**: Global AI state management and session handling

```typescript
interface AIContextType {
  currentSession: AISession | null
  isOpen: boolean
  openAI: (options?: OpenAIOptions) => void
  closeAI: () => void
  sendMessage: (content: string) => Promise<void>
  clearSession: () => void
  isTyping: boolean
  isResearching: boolean
}
```

**Key Features**:
- Session management with unique IDs
- LocalStorage persistence
- Cross-tab synchronization
- Project context injection
- Memo saving capability

#### 2. OpenResearchCanvas (Main Interface)
**File**: `frontend/src/components/ai/OpenResearchCanvas.tsx`
**Purpose**: The actual chat interface with open-research-ANA pattern

**UI Pattern**: 
- Starts as sidebar (320px width)
- Expands to fullscreen on user action
- Research plan approval workflow
- Real-time typing indicators
- Message history with metadata

**Backend Integration**:
- Calls `/api/v1/chat/ai-chat` endpoint
- Handles role mapping (ai → assistant)
- Supports conversation history
- Generates unique chat IDs for debugging

#### 3. UnifiedAIButtons (Entry Points)
**File**: `frontend/src/components/ai/UnifiedAIButtons.tsx`
**Purpose**: Consistent AI button components across platform

**Button Types**:
- `ChatWithAIButton` - Standard chat button
- `AIResearchButton` - Research-focused button
- `AIMemoButton` - Memo generation button
- `QuickAIButton` - Compact button for cards

### API Integration

#### Backend Endpoint
**File**: `backend/app/api/ai_chat.py`
**Endpoint**: `POST /api/v1/chat/ai-chat`

**Parameters**:
- `message`: User input
- `project_id`: Optional project context
- `project_type`: "company", "deal", or "open"
- `conversation_history`: Previous messages

**Response Format**:
```json
{
  "content": "AI response",
  "model": "phala/deepseek-chat-v3-0324",
  "usage": {"total_tokens": 150},
  "chat_id": "chat_abc12345"
}
```

#### AI Service Configuration
**File**: `backend/app/services/ai_service.py`

```python
# Redpill AI Configuration
self.client = OpenAI(
    base_url="https://api.redpill.ai/v1",
    api_key=settings.redpill_api_key
)
self.default_model = "phala/deepseek-chat-v3-0324"
```

### Integration Points

#### How Pages Use the System
1. **Wrap with UnifiedAISystem**:
```tsx
<UnifiedAISystem globalProjectType="company" globalProjectName="Portfolio">
  {/* Page content */}
</UnifiedAISystem>
```

2. **Add AI Buttons**:
```tsx
<ChatWithAIButton 
  projectType="company"
  projectName={company.name}
  projectId={company.id}
/>
```

3. **The system handles everything else** - no additional setup needed

---

## 🛠️ Technical Stack & Dependencies

### Backend Dependencies
**File**: `backend/requirements-minimal.txt`
```
fastapi==0.104.1
sqlmodel==0.0.14
alembic==1.12.1
psycopg2-binary==2.9.7
openai==1.3.7
aiohttp==3.9.1
```

### Frontend Dependencies
**File**: `frontend/package.json`
```json
{
  "dependencies": {
    "next": "14.0.3",
    "react": "^18.2.0",
    "typescript": "^5.2.2",
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.3.6",
    "lucide-react": "^0.294.0"
  }
}
```

### Database Models
**Key Models** (`backend/app/models/`):
- **Companies**: Crypto/traditional company tracking
- **Deals**: VC pipeline management  
- **Conversations**: AI chat sessions with debugging
- **Users**: Authentication and permissions

### Development Environment
```bash
# Backend
cd backend && pip install -r requirements-minimal.txt
uvicorn app.main:app --reload --port 8000

# Frontend  
cd frontend && npm install && npm run dev

# Database
alembic upgrade head
```

---

## 📁 File Structure & Organization

### Project Root Structure
```
redpill-project/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Auth & security
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── config.py       # Settings
│   ├── alembic/            # Database migrations
│   └── requirements*.txt   # Dependencies
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js 14 app router
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities & services
│   │   └── types/         # TypeScript types
│   └── package.json
├── docs/                  # Documentation
│   ├── archive/           # Archived/obsolete code
│   └── *.md              # Current documentation
├── database/              # SQL initialization
└── scripts/              # Utility scripts
```

### Critical AI System Files
```
frontend/src/components/ai/
├── UnifiedAISystem.tsx      # 🔥 Core context provider
├── OpenResearchCanvas.tsx   # 🔥 Main chat interface  
├── UnifiedAIButtons.tsx     # 🔥 Button components
├── index.ts                 # Exports
└── [legacy]/               # Old components (kept for reference)

backend/app/
├── api/ai_chat.py          # 🔥 Main AI endpoint
├── services/ai_service.py  # 🔥 AI service logic
└── config.py               # 🔥 API keys & settings
```

### Page Integration Examples
```
frontend/src/app/
├── dashboard/page.tsx      # ✅ Uses unified system
├── portfolio/page.tsx      # ✅ Uses unified system  
├── dealflow/page.tsx       # ✅ Uses unified system
└── layout.tsx              # ✅ Wrapped with UnifiedAISystem
```

---

## ⚙️ Development Workflow

### Starting Development
1. **Backend Setup**:
```bash
cd backend
pip install -r requirements-minimal.txt
uvicorn app.main:app --reload --port 8000
```

2. **Frontend Setup**:
```bash
cd frontend
npm install
npm run dev  # Port 3000
```

3. **Database Setup**:
```bash
cd backend
alembic upgrade head
```

### Code Quality Standards
- **TypeScript**: Strict mode enabled
- **Testing**: Jest + React Testing Library (frontend), pytest (backend)
- **Linting**: ESLint + Prettier (frontend), Black + isort (backend)
- **Git Flow**: Feature branches, PR reviews required

### Making Changes to AI System
1. **Context Changes**: Modify `UnifiedAISystem.tsx`
2. **UI Changes**: Modify `OpenResearchCanvas.tsx`
3. **Backend Changes**: Modify `ai_service.py` or `ai_chat.py`
4. **New Buttons**: Add to `UnifiedAIButtons.tsx`
5. **Page Integration**: Use existing buttons, wrap with UnifiedAISystem

---

## 🔐 API Configuration & Security

### Environment Variables
**File**: `backend/.env` (NOT committed to git)
```env
# AI Services
REDPILL_API_KEY=your_redpill_api_key_here
OPENAI_API_KEY=your_openai_fallback_key_here

# Database  
DATABASE_URL=postgresql://user:pass@localhost:5432/redpill

# Redis
REDIS_URL=redis://localhost:6379

# External APIs
COINGECKO_API_KEY=your_coingecko_key_here
```

### Security Notes
- **API Keys**: NEVER commit to git, use .env files
- **CORS**: Configured for localhost:3000 in development
- **Authentication**: JWT-based with secure token handling
- **Rate Limiting**: Implemented for AI endpoints

### Configuration File
**File**: `backend/app/config.py`
```python
class Settings(BaseSettings):
    # AI Services - NO hardcoded keys!
    openai_api_key: Optional[str] = None
    redpill_api_key: Optional[str] = None
    
    class Config:
        env_file = ".env"
```

**⚠️ CRITICAL**: The config file should NEVER contain hardcoded API keys. Always use environment variables.

---

## 🐛 Debugging & Troubleshooting

### AI Chat Debugging

#### Debug Logs Available
**Frontend Console**:
```javascript
// UnifiedAISystem logs
🟦 UnifiedAISystem render - isOpen: true currentSession: true

// Button interaction logs  
🟢 ChatWithAIButton clicked! {projectType: "company", projectName: "Tesla"}
🟢 openAI called successfully

// Canvas rendering logs
🎨 OpenResearchCanvas render: {isOpen: true, projectName: "Tesla"}
```

**Backend Logs**:
```python
# In ai_chat.py
🚀 AI Chat Request - chat_abc12345
📝 Message: Tell me about Tesla's market position...
🏷️ Project: company/tesla-123
```

#### Common Issues & Solutions

**Issue**: AI chat button doesn't respond
- **Check**: Browser console for click event logs
- **Check**: UnifiedAISystem is wrapping the page
- **Check**: useAI hook returns valid context

**Issue**: Backend API errors
- **Check**: `backend.log` for error messages
- **Check**: API keys are set in environment
- **Check**: Backend is running on port 8000

**Issue**: Frontend build errors
- **Check**: TypeScript compilation errors
- **Check**: Import paths are correct
- **Check**: All dependencies installed

### Debug Endpoints
- **Chat Debug**: `GET /api/v1/chat/debug/{chat_id}`
- **Health Check**: `GET /api/v1/health`
- **API Status**: Check backend logs for startup messages

---

## ⚠️ Known Issues & Solutions

### 1. Company Data Mixup Issue
**Problem**: `/portfolio/anthropic` was showing Nvidia's description
**Status**: Identified but not yet fixed
**Location**: Company database seeding or routing
**Next Steps**: Check `lib/companyDatabase.ts` and portfolio routing

### 2. API Key Security
**Problem**: API keys were accidentally committed
**Solution**: ✅ Removed from git history using force push
**Prevention**: Always use `.env` files, never hardcode keys

### 3. Legacy Component Conflicts
**Problem**: Old AI components still referenced in some files
**Solution**: ✅ Systematically replaced with unified system
**Prevention**: Use unified imports from `@/components/ai`

### 4. Redpill AI Model Configuration
**Current Model**: `phala/deepseek-chat-v3-0324`
**Alternative Models**: Can be changed in `ai_service.py`
**Note**: Model selection affects response quality and cost

---

## 🚀 Future Development Guidelines

### Adding New AI Features
1. **Use Unified System**: Always build on UnifiedAISystem
2. **Follow Patterns**: Copy existing button patterns
3. **Context Awareness**: Leverage project context injection
4. **Error Handling**: Implement graceful fallbacks

### Database Changes
1. **Migrations**: Use Alembic for schema changes
2. **Models**: Follow SQLModel patterns
3. **Relationships**: Maintain foreign key integrity
4. **Seeding**: Update seed data for new models

### Frontend Architecture
1. **Components**: Use composition over inheritance
2. **State**: Prefer Context API for global state
3. **Styling**: Tailwind + Shadcn/UI components
4. **Types**: Maintain TypeScript coverage

### AI Service Evolution
1. **Provider Strategy**: Maintain dual-provider approach
2. **Model Updates**: Easy to swap models in config
3. **Response Parsing**: Centralized in ai_service.py
4. **Context Injection**: Leverage conversation history

### Code Quality
1. **Testing**: Add tests for new features
2. **Documentation**: Update this guide for major changes
3. **Performance**: Monitor AI response times
4. **Security**: Regular dependency updates

---

## 📞 Emergency Contacts & Resources

### Critical Files to Know
- `docs/COMPLETE_DEVELOPER_ONBOARDING.md` (this file)
- `CLAUDE.md` (Claude AI context)
- `backend/app/config.py` (system configuration)
- `frontend/src/components/ai/index.ts` (AI exports)

### Quick Commands
```bash
# Kill all servers
pkill -f uvicorn && pkill -f "next"

# Restart everything
cd backend && uvicorn app.main:app --reload --port 8000 &
cd frontend && npm run dev &

# Check logs
tail -f backend.log
tail -f frontend.log
```

### Git Repository
- **URL**: https://github.com/Marvin-Cypher/RedpillAI
- **Main Branch**: `main`
- **Deployment**: Manual (no auto-deploy configured)

---

## ✅ Developer Onboarding Checklist

- [ ] Clone repository
- [ ] Set up backend environment (.env file)
- [ ] Install backend dependencies
- [ ] Set up database (PostgreSQL + Redis)
- [ ] Install frontend dependencies  
- [ ] Start both servers
- [ ] Test AI chat functionality
- [ ] Read AI system architecture (this doc)
- [ ] Understand unified system patterns
- [ ] Make a test change and commit
- [ ] Verify deployment process

---

**Last Updated**: January 2025
**Maintained By**: Development Team
**Next Review**: When major architectural changes occur

> 💡 **Remember**: This document is your single source of truth. Keep it updated as the system evolves. Future developers (including Claude AI) should be able to understand the entire system from this document alone.