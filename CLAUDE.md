# CLAUDE.md

This file provides guidance to Claude Code when working with RedPill AI Terminal.

## Project Overview

**RedPill AI Terminal** - CLI-first investment terminal with natural language interface and optional web UI assistant.

## Current Status (2025-08-27)

✅ **TRUE AI-FIRST ARCHITECTURE** - Complete transformation from hardcoded patterns to AI reasoning  
✅ **GEMINI CLI-LEVEL INTELLIGENCE** - Natural language understanding with autonomous tool selection  
✅ **FUNCTION CALLING** - Proper OpenAI-style function calling with 12+ integrated tools  
✅ **PORTFOLIO MANAGEMENT** - Full CRUD operations with CSV/Excel import  
✅ **MARKET DATA INTEGRATION** - Real-time quotes, indices, and chart generation  
✅ **INTELLIGENT VALIDATION** - AI requests missing parameters instead of failing  
✅ **MULTI-STEP REASONING** - Handles complex operations like "add BTC then show indices"

## Architecture

### Primary Stack (CLI-First)
- **CLI Terminal**: Node.js + TypeScript + Inquirer.js (Primary Interface)
- **Backend**: FastAPI + OpenBB Platform (AI & Data Processing)
- **Web UI**: Next.js 15 (Optional Assistant)
- **AI**: OpenAI/Redpill AI with specialized VC prompts

### Work Principle

- Prefer declarative over imperative. Describe capabilities, constraints, success criteria; let the model plan steps.
- One canonical intent schema. Every command becomes {intent, entities, timeframe, format, confidence}.
- Tool contracts are the API. Tools are self-describing (name, input JSON schema, side effects, error surface).
- Few-shot > feature flags. Teach with 6–10 crisp examples that cover: easy, edge case, missing data, safe failure.
- Reasoning, then routing. Force a short hidden plan before tool use; never call tools blindly.
- Observability built in. Always return trace: detected intent, chosen tool(s), assumptions, and retry hints.
- Graceful degradation. When uncertain: ask for one missing field, or produce a stub output + next step.
- Always use context7 MCP to read API docs

Anti-hardcode rules

❌ No intent encoded in Python if/else trees.
✅ All intents live in the router table + few-shots.

❌ No ad-hoc tool params in code.
✅ Tools expose schemas; validation at runtime.

❌ No feature toggles via environment flags.
✅ Capabilities are declared in the prompt & router.

❌ No silent failures.
✅ Always return trace + next best action.

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
- ✅ **AI-FIRST ARCHITECTURE**: True AI reasoning with function calling (no hardcoded patterns)
- ✅ **PORTFOLIO OPERATIONS**: Add/remove/import holdings with CSV/Excel support
- ✅ **MARKET DATA**: Real-time quotes, indices, and chart generation working
- ✅ **NATURAL LANGUAGE**: Complete understanding without command syntax
- ✅ **INTELLIGENT VALIDATION**: AI asks for missing parameters instead of failing
- ✅ **MULTI-STEP OPERATIONS**: Complex commands like "add BTC then show indices" work perfectly

## Working AI Tools
1. `get_portfolio` - View holdings
2. `add_portfolio_holding` - Add assets
3. `remove_portfolio_holding` - Remove assets
4. `import_portfolio` - Import CSV/Excel files
5. `get_equity_quote` - Stock quotes with OHLC
6. `get_crypto_price` - Cryptocurrency prices
7. `create_chart` - Generate price charts
8. `get_market_overview` - Market summary
9. `get_companies` - Company database
10. `check_api_keys` - API configuration status
11. `get_news` - News search (Exa.ai ready)
12. `get_indices` - Market indices (US/EU/Global)

The system is **production-ready** with true AI-first architecture exactly like Gemini CLI.