# CLAUDE.md

This file provides guidance to Claude Code when working with RedPill AI Terminal.

## Project Overview

**RedPill AI Terminal** - CLI-first investment terminal with natural language interface and optional web UI assistant.

## Current Status (2025-08)

✅ **CLI-First Architecture** - Restructured project to prioritize terminal interface  
✅ **AI Terminal** - Natural language investment commands with Claude Code-level intelligence  
✅ **Setup Wizard** - Interactive API configuration system  
✅ **Real-Time Data** - Live crypto prices, market data via CoinGecko/OpenBB  
✅ **Fallback Systems** - Graceful degradation when services unavailable  
✅ **Web UI Assistant** - Optional visualization layer for portfolio management

## Architecture

### Primary Stack (CLI-First)
- **CLI Terminal**: Node.js + TypeScript + Inquirer.js (Primary Interface)
- **Backend**: FastAPI + OpenBB Platform (AI & Data Processing)
- **Web UI**: Next.js 15 (Optional Assistant)
- **AI**: OpenAI/Redpill AI with specialized VC prompts

## Quick Start

### CLI Only (Recommended)
```bash
cd cli-node && npm install && npm run build
redpill-setup  # Interactive API configuration
redpill        # Start natural language terminal
```

### Full Development
```bash
# Backend: cd backend && uvicorn app.main:app --reload
# Frontend: cd frontend && npm run dev  
# CLI: cd cli-node && npm run dev
```

## Key Files & Troubleshooting

### Database Setup
```bash
cd backend && python3 seed_companies.py  # Required after fresh setup
```

### Common Issues
- **404 Errors**: Check API_BASE URLs match `/api/v1/` endpoints
- **Module Errors**: Clear cache: `rm -rf .next node_modules/.cache && npm run dev`
- **DB Issues**: Run `alembic upgrade head` then re-seed

## Core Architecture

### Key Services
- **MarketDataService**: Async CoinGecko/OpenBB integration
- **AI Service**: Multi-provider AI (Redpill/OpenAI) 
- **Terminal API**: Natural language command interpreter
- **Widget System**: Real-time data visualization

### Project Structure
```
cli-node/          # Primary CLI interface
├── src/ai-terminal.ts      # Main AI terminal
├── src/setup-wizard.ts     # API configuration
└── src/simple.ts           # Lightweight version

backend/           # AI & data processing
├── app/api/terminal.py     # Command interpreter
├── app/services/           # AI and data services
└── app/models/             # Database models

frontend/          # Optional web assistant
├── src/components/widgets/ # Data visualization
└── src/lib/               # API clients
```

## Development Commands

### CLI Terminal
```bash
npm run build     # Build TypeScript
npm run dev       # Development mode
npm link          # Install globally
```

### Backend  
```bash
pip install -r requirements-minimal.txt
uvicorn app.main:app --reload --port 8000
alembic upgrade head
```

### Frontend
```bash
npm install && npm run dev
npm run build && npm run lint
```

## Current System Status
- ✅ **Core Platform**: Fully operational with AI-powered discovery, deal management, and portfolio tracking
- ✅ **CLI Terminal**: Natural language investment commands working with real-time data
- ✅ **Data Flow**: Consistent data structure across all creation methods
- ✅ **Fallback Systems**: Graceful degradation when APIs are unavailable
- ✅ **Real-Time Integration**: Live crypto prices and market data via CoinGecko/OpenBB

The system is production-ready for investment operations with comprehensive CLI-first architecture.