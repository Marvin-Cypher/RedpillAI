# 📁 File Structure & Organization Guide
**RedPill VC CRM - Complete Directory Layout and Purpose**

Last Updated: January 2025

## 🎯 Project Root Structure

```
redpill-project/
├── 📋 CLAUDE.md                          # Claude AI context & work memories
├── 📋 README.md                          # Project introduction
├── 📋 PRODUCT_REQUIREMENTS_DOCUMENT.md   # Product vision & requirements
├── 📋 TECHNICAL_ARCHITECTURE_GUIDE.md    # System architecture overview
├── 📋 THREE_PILLAR_ARCHITECTURE_COMPLETE.md  # Three-pillar integration guide
├── 📋 THREE_PILLAR_PLATFORM_STATUS.md    # Platform integration status
├── 📋 DESIGN_SYSTEM_DOCUMENTATION.md     # UI/UX design system
├── 📋 SETUP_GUIDE.md                     # Project setup instructions
├── 📋 QUICK_API_SETUP.md                 # Quick API key configuration
├── 📋 QUICK_REFERENCE.md                 # Quick command reference
├── 📋 LOCAL_SERVER_GUIDE.md              # Local development guide
├── 📋 API_KEYS_SETUP.md                  # API keys configuration guide
├── 📋 DEPLOYMENT.md                      # Deployment instructions
├── 📋 CONTRIBUTING.md                    # Contribution guidelines
├── 
├── 🗂️ docs/                              # 📚 COMPLETE KNOWLEDGE BASE
│   ├── 🔥 COMPLETE_DEVELOPER_ONBOARDING.md  # PRIMARY - Full system context
│   ├── 🔥 TECHNICAL_MEMORY.md               # Development decisions & history
│   ├── 🔥 AI_CHAT_ARCHITECTURE.md           # AI system technical deep-dive
│   ├── 🔥 FILE_STRUCTURE_GUIDE.md           # This file - directory guide
│   ├── PROJECT_STATUS.md                    # Current project status
│   ├── DEVELOPMENT_GUIDE.md                 # Development workflows
│   ├── architecture.md                      # Detailed architecture docs
│   └── archive/                             # Historical & obsolete code
│       ├── obsolete-code/                   # Old implementations
│       └── superseded-architectures/        # Previous architectural attempts
│
├── 🖥️ backend/                            # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                         # FastAPI application entry point
│   │   ├── config.py                       # System configuration
│   │   ├── database.py                     # Database connection & setup
│   │   ├── seed_data.py                    # Database seeding script
│   │   │
│   │   ├── api/                            # REST API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── 🔥 ai_chat.py              # Unified AI chat endpoint
│   │   │   ├── chat.py                     # Legacy chat endpoint
│   │   │   ├── companies.py                # Company management
│   │   │   ├── deals.py                    # Deal pipeline
│   │   │   ├── auth.py                     # Authentication
│   │   │   ├── market.py                   # Market data integration
│   │   │   ├── portfolio.py                # Portfolio management
│   │   │   └── workflows.py                # Workflow automation
│   │   │
│   │   ├── models/                         # SQLModel database models
│   │   │   ├── __init__.py
│   │   │   ├── companies.py                # Company entities
│   │   │   ├── deals.py                    # Deal entities
│   │   │   ├── conversations.py            # AI chat sessions
│   │   │   ├── users.py                    # User management
│   │   │   ├── portfolio.py                # Portfolio entities
│   │   │   └── workflows.py                # Workflow entities
│   │   │
│   │   ├── services/                       # Business logic layer
│   │   │   ├── 🔥 ai_service.py           # AI provider integration
│   │   │   ├── coingecko_service.py        # CoinGecko market data
│   │   │   ├── openbb_service.py           # OpenBB financial data
│   │   │   ├── openproject_service.py      # OpenProject integration
│   │   │   └── workflow_service.py         # Workflow automation
│   │   │
│   │   └── core/                           # Core utilities
│   │       ├── __init__.py
│   │       └── auth.py                     # JWT authentication logic
│   │
│   ├── alembic/                            # Database migrations
│   │   └── env.py                          # Alembic configuration
│   │
│   ├── requirements.txt                    # Python dependencies
│   ├── requirements-minimal.txt            # Minimal dependencies
│   ├── test_api_keys.py                    # API key testing script
│   └── Dockerfile.dev                      # Development container
│
├── 🎨 frontend/                            # Next.js Frontend
│   ├── src/
│   │   ├── app/                            # Next.js App Router pages
│   │   │   ├── layout.tsx                  # Root layout
│   │   │   ├── page.tsx                    # Landing page
│   │   │   ├── providers.tsx               # Context providers
│   │   │   ├── globals.css                 # Global styles
│   │   │   │
│   │   │   ├── dashboard/                  # Dashboard page
│   │   │   │   └── page.tsx
│   │   │   ├── portfolio/                  # Portfolio management
│   │   │   │   ├── page.tsx                # Portfolio list
│   │   │   │   └── [companyId]/           # Company detail pages
│   │   │   │       ├── page.tsx            # Company overview
│   │   │   │       └── deal/              # Deal management
│   │   │   │           └── page.tsx        # Deal detail page
│   │   │   ├── dealflow/                   # Deal pipeline
│   │   │   │   └── page.tsx
│   │   │   ├── companies/                  # Company management
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── deals/                      # Deal creation
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── workflow/                   # Workflow automation
│   │   │   │   └── page.tsx
│   │   │   ├── history/                    # Activity history
│   │   │   │   └── page.tsx
│   │   │   ├── mvp/                        # MVP demo page
│   │   │   │   └── page.tsx
│   │   │   ├── ai-chat/                    # Standalone AI chat
│   │   │   │   └── page.tsx
│   │   │   ├── ai-demo/                    # AI demo page
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── api/                        # API routes
│   │   │       ├── chat/                   # Chat endpoint
│   │   │       │   └── route.ts
│   │   │       ├── ai-chat/                # AI chat endpoint
│   │   │       │   └── route.ts
│   │   │       ├── search/                 # Search endpoint
│   │   │       │   └── route.ts
│   │   │       └── copilotkit/             # CopilotKit integration
│   │   │           └── route.ts
│   │   │
│   │   ├── components/                     # React components
│   │   │   ├── ai/                         # 🔥 AI Components (Unified System)
│   │   │   │   ├── index.ts                # AI component exports
│   │   │   │   ├── 🔥 UnifiedAISystem.tsx  # Core AI context provider
│   │   │   │   ├── 🔥 OpenResearchCanvas.tsx # Research interface
│   │   │   │   ├── 🔥 UnifiedAIButtons.tsx # AI action buttons
│   │   │   │   ├── 🔥 ChatHistory.tsx      # Chat history viewer
│   │   │   │   ├── EnhancedAIChat.tsx      # Enhanced chat UI
│   │   │   │   ├── AgenticChatInterface.tsx # Agent-based chat
│   │   │   │   ├── ResearchCanvasAI.tsx    # Research canvas
│   │   │   │   ├── SearchInterface.tsx     # Search UI
│   │   │   │   ├── AIProvider.tsx          # Legacy AI provider
│   │   │   │   ├── AIButton.tsx            # Legacy AI button
│   │   │   │   └── [other AI components]   # Various AI UI components
│   │   │   │
│   │   │   ├── chat/                       # Chat components
│   │   │   │   ├── ChatWindow.tsx          # Main chat window
│   │   │   │   ├── ThoughtProcess.tsx      # AI thinking display
│   │   │   │   ├── ConversationSidebar.tsx # Chat sidebar
│   │   │   │   └── openbb-chat.tsx         # OpenBB chat integration
│   │   │   │
│   │   │   ├── deals/                      # Deal management
│   │   │   │   ├── DealPipeline.tsx        # Kanban pipeline
│   │   │   │   ├── SimplifiedDealCard.tsx  # Deal card component
│   │   │   │   ├── CompactDealCard.tsx     # Compact deal view
│   │   │   │   ├── StatusSelector.tsx      # Deal status selector
│   │   │   │   └── NewProjectModal.tsx     # New project modal
│   │   │   │
│   │   │   ├── portfolio/                  # Portfolio components
│   │   │   │   └── portfolio-manager.tsx   # Portfolio management
│   │   │   │
│   │   │   ├── project/                    # Project detail components
│   │   │   │   ├── ProjectDetail.tsx       # Project details view
│   │   │   │   ├── DocumentUpload.tsx      # Document management
│   │   │   │   └── EditableProjectData.tsx # Editable fields
│   │   │   │
│   │   │   ├── layout/                     # Layout components
│   │   │   │   ├── AppLayout.tsx           # Main app layout
│   │   │   │   ├── Navigation.tsx          # Navigation menu
│   │   │   │   ├── Sidebar.tsx             # Sidebar component
│   │   │   │   ├── Header.tsx              # Header component
│   │   │   │   └── ResponsiveLayout.tsx    # Responsive wrapper
│   │   │   │
│   │   │   ├── ui/                         # Shadcn/UI components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── scroll-area.tsx
│   │   │   │   └── [other UI components]
│   │   │   │
│   │   │   ├── theme/                      # Theme management
│   │   │   │   ├── ThemeProvider.tsx       # Theme context
│   │   │   │   └── ThemeToggle.tsx         # Theme switcher
│   │   │   │
│   │   │   └── [other component folders]   # Various feature components
│   │   │
│   │   ├── lib/                            # Utility libraries
│   │   │   ├── ai/                         # AI utilities
│   │   │   │   ├── agents/                 # AI agents
│   │   │   │   │   ├── deep-research-agent.ts
│   │   │   │   │   ├── web-research-agent.ts
│   │   │   │   │   └── crypto-research-agent.ts
│   │   │   │   ├── vc-assistant.ts         # VC-specific AI logic
│   │   │   │   ├── redpill-provider.ts     # RedPill AI provider
│   │   │   │   ├── openbb-assistant.ts     # OpenBB integration
│   │   │   │   └── quick-research-agent.ts # Quick research logic
│   │   │   │
│   │   │   ├── services/                   # Service layer
│   │   │   │   ├── ai-service.ts           # AI service wrapper
│   │   │   │   ├── search-service.ts       # Search functionality
│   │   │   │   └── coingecko.ts            # Market data service
│   │   │   │
│   │   │   ├── integrations/               # Third-party integrations
│   │   │   │   ├── agent-openbb-bridge.ts  # AG-UI to OpenBB bridge
│   │   │   │   └── three-pillar-bridge.ts  # Three-pillar integration
│   │   │   │
│   │   │   ├── 🔥 companyDatabase.ts       # Local company storage
│   │   │   ├── 🔥 dealStatusSync.ts        # Deal status sync logic
│   │   │   ├── api.ts                      # API client utilities
│   │   │   └── utils.ts                    # General utilities
│   │   │
│   │   └── types/                          # TypeScript types
│   │       └── index.ts                    # Type definitions
│   │
│   ├── public/                             # Static assets
│   ├── package.json                        # NPM dependencies
│   ├── tsconfig.json                       # TypeScript config
│   ├── tailwind.config.js                  # Tailwind CSS config
│   ├── next.config.js                      # Next.js config
│   ├── vercel.json                         # Vercel deployment
│   └── AI_INTERFACE_UPGRADE.md             # AI interface documentation
│
├── 🐳 docker-compose.yml                   # Docker services config
├── 📄 .env.example                         # Environment variables template
├── 📄 .gitignore                           # Git ignore rules
└── 🔧 .claude/                             # Claude AI settings
    └── settings.local.json                 # Local Claude settings
```

## 🔥 Key Files & Their Purpose

### Core Documentation
- **CLAUDE.md**: Work memories and context for Claude AI
- **PRODUCT_REQUIREMENTS_DOCUMENT.md**: Complete product vision
- **TECHNICAL_ARCHITECTURE_GUIDE.md**: System design and architecture
- **docs/COMPLETE_DEVELOPER_ONBOARDING.md**: Primary developer reference
- **docs/AI_CHAT_ARCHITECTURE.md**: Deep dive into AI system implementation

### Backend Key Files
- **backend/app/api/ai_chat.py**: New unified AI chat endpoint
- **backend/app/services/ai_service.py**: AI provider integration (RedPill + OpenAI)
- **backend/app/models/conversations.py**: Chat session persistence
- **backend/app/config.py**: Environment configuration (uses .env)

### Frontend Key Files
- **frontend/src/components/ai/UnifiedAISystem.tsx**: Core AI state management
- **frontend/src/components/ai/OpenResearchCanvas.tsx**: Research interface
- **frontend/src/components/ai/ChatHistory.tsx**: Session history viewer
- **frontend/src/lib/companyDatabase.ts**: Local company data management
- **frontend/src/lib/dealStatusSync.ts**: Deal status synchronization

## 📝 File Naming Conventions

### TypeScript/React Files
- Components: `PascalCase.tsx` (e.g., `ChatWindow.tsx`)
- Utilities: `camelCase.ts` (e.g., `dealStatusSync.ts`)
- Types: `PascalCase.ts` or in `types/index.ts`
- Hooks: `use{Feature}.ts` (e.g., `useToast.ts`)

### Python Files
- Modules: `snake_case.py` (e.g., `ai_service.py`)
- Classes: `PascalCase` within files
- Constants: `UPPER_SNAKE_CASE`

### Documentation
- Guides: `UPPER_SNAKE_CASE.md` (e.g., `SETUP_GUIDE.md`)
- Technical docs: Regular case (e.g., `architecture.md`)

## 🚀 Quick Navigation

### For AI Integration Work
- Start with: `docs/AI_CHAT_ARCHITECTURE.md`
- Key files: `UnifiedAISystem.tsx`, `OpenResearchCanvas.tsx`, `ai_service.py`

### For Deal Management
- Components: `frontend/src/components/deals/`
- API: `backend/app/api/deals.py`
- Models: `backend/app/models/deals.py`

### For Portfolio Features
- Pages: `frontend/src/app/portfolio/`
- Components: `frontend/src/components/portfolio/`
- Storage: `frontend/src/lib/companyDatabase.ts`

### For Deployment
- Config: `vercel.json`, `docker-compose.yml`
- Docs: `DEPLOYMENT.md`, `LOCAL_SERVER_GUIDE.md`

## 🔄 Recent Updates (Jan 2025)

1. **Unified AI System**: Complete overhaul with `UnifiedAISystem.tsx`
2. **Chat History**: New `ChatHistory.tsx` component with session persistence
3. **Research Canvas**: `OpenResearchCanvas.tsx` with approval workflow
4. **Simplified Backend**: Single `ai_chat.py` endpoint with multi-provider support
5. **Local Storage**: Enhanced `companyDatabase.ts` and `dealStatusSync.ts`

## ⚠️ Deprecated/Archive

- `backend/app/api/chat.py`: Legacy chat endpoint (use `ai_chat.py`)
- `docs/archive/`: Historical implementations and architectures