# RedPill AI Terminal - Project Structure

## Overview

**RedPill AI Terminal** - CLI-first investment terminal with natural language interface and optional web UI assistant.

## Core Architecture

### Primary Stack (CLI-First)
- **CLI Terminal**: Node.js + TypeScript (Primary Interface) - `cli-node/`
- **Backend**: FastAPI + AI-OpenBB Platform - `backend/`
- **Web UI**: Next.js 15 (Optional Assistant) - `frontend/`

## Directory Structure

```
redpill-project/
├── cli-node/                    # 🎯 PRIMARY CLI INTERFACE
│   ├── src/
│   │   ├── index.ts            # Main CLI entry point
│   │   ├── terminal.ts         # Terminal interface
│   │   ├── setup.ts            # Setup wizard
│   │   └── backend-launcher.ts # Auto backend management
│   └── package.json
│
├── backend/                     # 🔧 AI & DATA PROCESSING
│   ├── app/
│   │   ├── main.py             # FastAPI app
│   │   ├── api/                # API endpoints
│   │   │   ├── terminal.py     # Natural language interface
│   │   │   ├── deals.py        # Deal management
│   │   │   ├── companies.py    # Company data
│   │   │   └── portfolio.py    # Portfolio tracking
│   │   ├── services/           # Core services
│   │   │   ├── ai_openbb_service.py  # 🚀 AI-OpenBB integration
│   │   │   ├── ai_service.py         # AI processing
│   │   │   ├── company_service.py    # Company operations
│   │   │   └── portfolio_service.py  # Portfolio management
│   │   └── models/             # Database models
│   └── requirements-minimal.txt
│
├── frontend/                   # 🌐 OPTIONAL WEB UI
│   ├── src/
│   │   ├── app/               # Next.js 15 app router
│   │   ├── components/        # UI components
│   │   └── lib/              # Utilities
│   └── package.json
│
├── docs/                      # 📚 DOCUMENTATION
├── scripts/                   # 🛠️ UTILITY SCRIPTS
└── README.md                  # Main documentation
```

## Key Components

### 1. CLI Terminal (`cli-node/`)
- **Primary user interface**
- Natural language command processing
- Auto-launches and manages backend
- TypeScript + Node.js

### 2. Backend (`backend/`)
- **Minimal VC data management**:
  - Deal tracking and pipeline
  - Company database
  - Portfolio holdings
  - User sessions
- **AI-OpenBB Integration**:
  - Dynamic OpenBB command routing
  - All market data and analytics
  - Future-proof against OpenBB updates

### 3. Frontend (`frontend/`)
- **Optional web assistant**
- Portfolio visualization
- Deal management UI
- Next.js 15 with modern UI components

## Key Files

### Essential Files
- `cli-node/src/index.ts` - Main CLI application
- `backend/app/main.py` - FastAPI backend
- `backend/app/api/terminal.py` - Natural language processor
- `backend/app/services/ai_openbb_service.py` - AI-OpenBB integration
- `CLAUDE.md` - Claude Code instructions
- `README.md` - Project overview

### Configuration
- `backend/requirements-minimal.txt` - Python dependencies
- `cli-node/package.json` - Node.js dependencies
- `frontend/package.json` - Web UI dependencies

## Quick Start

### CLI Only (Recommended)
```bash
cd cli-node && npm install && npm run build
redpill-setup  # Interactive configuration
redpill        # Start terminal
```

### Full Development
```bash
# Backend
cd backend && uvicorn app.main:app --reload

# CLI
cd cli-node && npm run dev

# Web UI (optional)
cd frontend && npm run dev
```

## Architecture Benefits

✅ **CLI-First**: Terminal is the primary interface  
✅ **Minimal Backend**: Only handles VC-specific data  
✅ **Maximum OpenBB**: AI routes to any OpenBB function  
✅ **Future-Proof**: No hardcoded market data dependencies  
✅ **Optional Web UI**: Use when visualization needed