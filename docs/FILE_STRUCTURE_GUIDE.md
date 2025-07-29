# 📁 File Structure & Organization Guide
**RedPill VC CRM - Complete Directory Layout and Purpose**

## 🎯 Project Root Structure

```
redpill-project/
├── 📋 CLAUDE.md                          # Claude AI context & quick reference
├── 📋 PRODUCT_REQUIREMENTS_DOCUMENT.md   # Product vision & requirements
├── 📋 TECHNICAL_ARCHITECTURE_GUIDE.md    # System architecture overview
├── 📋 README.md                          # Project introduction
├── 
├── 🗂️ docs/                              # 📚 COMPLETE KNOWLEDGE BASE
│   ├── 🔥 COMPLETE_DEVELOPER_ONBOARDING.md  # PRIMARY - Full system context
│   ├── 🔥 TECHNICAL_MEMORY.md               # Development decisions & history
│   ├── 🔥 AI_CHAT_ARCHITECTURE.md           # AI system technical deep-dive
│   ├── 🔥 FILE_STRUCTURE_GUIDE.md           # This file - directory guide
│   ├── PROJECT_STATUS.md                    # Current project status
│   ├── DEVELOPMENT_GUIDE.md                 # Development workflows
│   └── archive/                             # Historical & obsolete code
│       ├── obsolete-code/                   # Old implementations (Suna, etc.)
│       └── superseded-architectures/        # Previous architectural attempts
│
├── 🖥️ backend/                            # FastAPI Backend
│   ├── app/
│   │   ├── api/                            # REST API endpoints
│   │   │   ├── 🔥 ai_chat.py              # NEW - Unified AI chat endpoint
│   │   │   ├── chat.py                     # Legacy chat (deprecated)
│   │   │   ├── companies.py                # Company management
│   │   │   ├── deals.py                    # Deal pipeline
│   │   │   ├── auth.py                     # Authentication
│   │   │   ├── market.py                   # Market data
│   │   │   ├── portfolio.py                # Portfolio management
│   │   │   └── workflows.py                # Workflow automation
│   │   ├── services/                       # Business logic
│   │   │   ├── 🔥 ai_service.py           # NEW - Simplified AI service
│   │   │   ├── coingecko_service.py        # Market data
│   │   │   ├── openbb_service.py           # Financial data
│   │   │   └── workflow_service.py         # Workflow management
│   │   ├── models/                         # Database models
│   │   │   ├── companies.py                # Company entities
│   │   │   ├── deals.py                    # Deal entities
│   │   │   ├── conversations.py            # AI chat sessions
│   │   │   ├── users.py                    # User management
│   │   │   └── workflows.py                # Workflow entities
│   │   ├── core/                           # Core utilities
│   │   │   └── auth.py                     # Authentication logic
│   │   ├── 🔥 config.py                   # System configuration (NO hardcoded keys!)
│   │   ├── database.py                     # Database connection
│   │   └── main.py                         # FastAPI application
│   ├── alembic/                            # Database migrations
│   ├── requirements-minimal.txt            # Essential dependencies
│   └── requirements.txt                    # Full dependencies
│
├── 🌐 frontend/                           # Next.js Frontend
│   ├── src/
│   │   ├── app/                           # Next.js 14 App Router
│   │   │   ├── 🔥 layout.tsx             # Root layout with UnifiedAISystem
│   │   │   ├── page.tsx                   # Home page
│   │   │   ├── 🔥 dashboard/              # Dashboard with unified AI
│   │   │   ├── 🔥 portfolio/              # Portfolio with unified AI
│   │   │   ├── 🔥 dealflow/               # Deal flow with unified AI
│   │   │   ├── companies/                 # Company management
│   │   │   ├── deals/                     # Deal management
│   │   │   ├── ai-chat/                   # Dedicated AI chat page
│   │   │   └── api/                       # API routes
│   │   ├── components/                    # React components
│   │   │   ├── 🔥 ai/                     # UNIFIED AI SYSTEM
│   │   │   │   ├── 🔥 UnifiedAISystem.tsx    # Core context provider
│   │   │   │   ├── 🔥 OpenResearchCanvas.tsx # Main chat interface
│   │   │   │   ├── 🔥 UnifiedAIButtons.tsx   # Entry point buttons
│   │   │   │   ├── index.ts                  # Clean exports
│   │   │   │   └── [legacy]/                 # Old components (reference only)
│   │   │   ├── layout/                    # Layout components
│   │   │   ├── deals/                     # Deal management UI
│   │   │   ├── portfolio/                 # Portfolio UI
│   │   │   ├── chat/                      # Chat utilities
│   │   │   └── ui/                        # Shadcn/UI components
│   │   ├── lib/                           # Utilities & services
│   │   │   ├── ai/                        # AI-related utilities
│   │   │   ├── services/                  # API clients
│   │   │   └── utils.ts                   # Helper functions
│   │   └── types/                         # TypeScript type definitions
│   ├── package.json                       # Dependencies & scripts
│   └── next.config.js                     # Next.js configuration
│
├── 🗄️ database/                          # Database setup
│   └── init.sql                           # Initial database schema
│
└── 🛠️ scripts/                           # Utility scripts
    ├── start-services.sh                  # Start all services
    ├── stop-services.sh                   # Stop all services
    └── health-check.sh                    # System health check
```

## 🔥 Critical Files for AI Chat System

### Frontend - Unified AI System
```
frontend/src/components/ai/
├── 🎯 UnifiedAISystem.tsx     # Global context provider - CORE OF EVERYTHING
├── 🎯 OpenResearchCanvas.tsx  # Main UI - Sidebar → Fullscreen pattern
├── 🎯 UnifiedAIButtons.tsx    # Entry points - All AI buttons across platform
├── 🎯 index.ts               # Clean exports - Import from here
├── AIProvider.tsx            # Legacy - kept for reference
├── EnhancedAIChat.tsx        # Legacy - superseded by unified system
└── [other legacy files]     # Historical implementations
```

### Backend - AI Service Layer
```
backend/app/
├── api/ai_chat.py            # 🎯 NEW API endpoint - POST /chat/ai-chat
├── services/ai_service.py    # 🎯 AI logic - OpenAI client + Redpill integration  
├── config.py                 # 🎯 Settings - NEVER hardcode API keys here!
└── models/conversations.py   # Chat session storage
```

### Pages Using Unified System
```
frontend/src/app/
├── layout.tsx               # 🎯 Wraps entire app with UnifiedAISystem
├── dashboard/page.tsx       # ✅ Updated - ChatWithAIButton in header
├── portfolio/page.tsx       # ✅ Updated - AI buttons on cards & header
├── dealflow/page.tsx        # ✅ Updated - Unified chat throughout
└── [company]/page.tsx       # ✅ Updated - Company-specific AI context
```

## 📚 Documentation Hierarchy

### 🔥 Priority Documentation (READ FIRST)
1. **`docs/COMPLETE_DEVELOPER_ONBOARDING.md`** - Complete system knowledge
2. **`docs/TECHNICAL_MEMORY.md`** - All decisions and problem-solving context
3. **`docs/AI_CHAT_ARCHITECTURE.md`** - Technical deep-dive into AI system
4. **`CLAUDE.md`** - Quick reference for Claude AI context

### 📋 Product & Architecture
- **`PRODUCT_REQUIREMENTS_DOCUMENT.md`** - Product vision and requirements
- **`TECHNICAL_ARCHITECTURE_GUIDE.md`** - System architecture overview
- **`THREE_PILLAR_ARCHITECTURE_COMPLETE.md`** - Three-pillar framework
- **`DESIGN_SYSTEM_DOCUMENTATION.md`** - UI/UX guidelines

### 🛠️ Setup & Operations
- **`SETUP_GUIDE.md`** - Development environment setup
- **`API_KEYS_SETUP.md`** - API configuration guide
- **`QUICK_REFERENCE.md`** - Command reference
- **`docs/DEVELOPMENT_GUIDE.md`** - Development workflows

## 🎯 File Naming Conventions

### Documentation Files
- **UPPERCASE.md** - Root-level important documents
- **docs/[CATEGORY]_[PURPOSE].md** - Categorized documentation
- **docs/archive/** - Historical/obsolete content

### Code Files  
- **PascalCase.tsx** - React components
- **camelCase.ts** - Utilities and services
- **kebab-case.py** - Python modules (FastAPI convention)
- **snake_case.py** - Python files following PEP 8

### Directory Structure
- **lowercase/** - Standard directories
- **PascalCase/** - Component directories (React)
- **kebab-case/** - Multi-word directories

## 🔍 Key File Purposes

### Configuration Files
```
backend/app/config.py          # 🔐 System settings - NO hardcoded secrets!
frontend/package.json          # 📦 Dependencies and build scripts
backend/requirements-minimal.txt # 📦 Essential Python packages
docker-compose.yml             # 🐳 Development environment
```

### Entry Points
```
backend/app/main.py            # 🚀 FastAPI application startup
frontend/src/app/layout.tsx    # 🚀 Next.js root layout + AI context
frontend/src/components/ai/index.ts # 🚀 AI system exports
```

### Database & Migrations
```
backend/alembic/               # 📊 Database schema migrations
backend/app/models/            # 📊 SQLModel database entities
database/init.sql              # 📊 Initial database setup
```

## 🧹 Code Organization Principles

### 1. Separation of Concerns
- **API Layer**: Handle HTTP requests/responses
- **Service Layer**: Business logic and external integrations
- **Model Layer**: Data structures and database operations
- **UI Layer**: React components and user interactions

### 2. Import Patterns
```typescript
// ✅ Good - Clean imports from index files
import { ChatWithAIButton, useAI } from '@/components/ai'
import { Company, Deal } from '@/types'

// ❌ Bad - Direct file imports create coupling
import { ChatWithAIButton } from '@/components/ai/UnifiedAIButtons'
import { useAI } from '@/components/ai/UnifiedAISystem'
```

### 3. File Responsibility
- **One primary export per file** (except index files)
- **Related utilities grouped together**
- **Clear naming that matches purpose**
- **Comprehensive TypeScript types**

## 🗂️ Archive Strategy

### What Goes in docs/archive/
- **obsolete-code/** - Old implementations that are superseded
- **superseded-architectures/** - Previous architectural attempts
- **experimental/** - Proof-of-concept code

### Archive Principles
- **Never delete working code** - move to archive
- **Preserve context** - include README files explaining why archived
- **Maintain git history** - use git mv when archiving
- **Reference in current docs** - explain what replaced archived code

## 🚀 Development Workflow Files

### Environment Setup
```
backend/.env                   # 🔐 Environment variables (NOT in git)
frontend/.env.local            # 🔐 Frontend environment (NOT in git)
frontend/.env.example          # 📋 Environment template (in git)
```

### Build & Deploy
```
frontend/next.config.js        # ⚙️ Next.js configuration
backend/Dockerfile.dev         # 🐳 Development container
docker-compose.yml             # 🐳 Multi-service development
scripts/start-services.sh      # 🚀 Development startup
```

## 📊 File Organization Metrics

### Documentation Coverage
- **✅ Complete**: AI Chat System, Architecture, Development
- **✅ Complete**: Product Requirements, Technical Memory
- **✅ Complete**: File Structure, API Documentation
- **📝 In Progress**: Testing Guidelines, Deployment Guide

### Code Organization Health
- **✅ Unified**: All AI interactions use single system
- **✅ Consistent**: TypeScript throughout frontend
- **✅ Secure**: No hardcoded API keys
- **✅ Documented**: All major components have purpose documentation

---

**Navigation Tips**:
- **New Developer?** → Start with `docs/COMPLETE_DEVELOPER_ONBOARDING.md`
- **Need AI Context?** → Read `docs/AI_CHAT_ARCHITECTURE.md`
- **Working on Features?** → Check `docs/TECHNICAL_MEMORY.md` for decisions
- **Quick Reference?** → Use `CLAUDE.md` and `QUICK_REFERENCE.md`

**Last Updated**: January 2025
**Maintained By**: Development Team