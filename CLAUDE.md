# CLAUDE.md

This file provides guidance to Claude Code when working with RedPill AI Terminal.

## Project Overview

**RedPill AI Terminal** - CLI-first investment terminal with natural language interface and optional web UI assistant.

## Current Status (2025-08-29)

✅ **UNIFIED CHROMA INTELLIGENCE** - Complete ChromaDB integration for persistent memory and semantic search  
✅ **CONVERSATION MEMORY** - Full conversation persistence across CLI sessions with context awareness  
✅ **PORTFOLIO-AWARE AI** - Remembers tracked companies, holdings, watchlists from conversation history  
✅ **MULTI-STEP AUTONOMOUS EXECUTION** - Complex requests trigger comprehensive analysis workflows  
✅ **ENTITY EXTRACTION & STORAGE** - Automatic symbol/company detection and storage in vector database  
✅ **SEMANTIC CONTEXT RETRIEVAL** - Intelligent pronoun resolution and portfolio-first responses  
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
- **Memory Layer**: ChromaDB vector database for unified intelligence
- **Web UI**: Next.js 15 (Optional Assistant)
- **AI**: OpenAI/Redpill AI with persistent memory and context awareness

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

## Unified Intelligence Architecture

### ChromaDB Memory System
- **11 Specialized Collections**: conversations, portfolio, companies, research, reports, meetings, deals, market data, fund performance, imports, action items
- **Tenant Isolation**: Multi-user support with workspace separation
- **Semantic Search**: Context-aware retrieval using vector embeddings
- **Entity Extraction**: Automatic symbol/company detection and storage
- **Portfolio Awareness**: Remembers tracked companies across sessions

### Memory Collections Schema
```python
collections = {
    "user_conversations": "All chat history with entity extraction",
    "portfolio_memory": "Holdings, watchlists, tracked symbols",
    "company_profiles": "Company data, fundamentals, analysis",
    "research_reports": "Research memos, analysis, insights",
    "market_intelligence": "OpenBB data, trends, sentiment",
    "fund_performance": "Fund metrics, benchmarks, analysis"
    # ... 5 more specialized collections
}
```

### Intelligence Features
- **Context-Aware Queries**: "my tracking companies" → retrieves portfolio symbols
- **Multi-Step Execution**: Complex requests trigger comprehensive workflows
- **Pronoun Resolution**: "them/these/those" → refers to previously mentioned entities
- **Conversation Persistence**: Full memory across CLI sessions
- **Portfolio-First Responses**: Prioritizes user's holdings and watchlist

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
- ✅ **UNIFIED CHROMA INTELLIGENCE**: Complete vector database integration with semantic search
- ✅ **PERSISTENT MEMORY**: Full conversation memory across CLI sessions with context retention  
- ✅ **PORTFOLIO INTELLIGENCE**: AI remembers tracked companies and provides portfolio-aware responses
- ✅ **MULTI-STEP AUTONOMOUS EXECUTION**: Complex queries trigger comprehensive analysis workflows
- ✅ **ENTITY RECOGNITION**: Automatic symbol/company extraction and storage in memory collections
- ✅ **SEMANTIC CONTEXT RETRIEVAL**: Intelligent pronoun resolution using conversation history
- ✅ **AI-FIRST ARCHITECTURE**: True AI reasoning with function calling (no hardcoded patterns)
- ✅ **PORTFOLIO OPERATIONS**: Add/remove/import holdings with CSV/Excel support
- ✅ **MARKET DATA**: Real-time quotes, indices, and chart generation working
- ✅ **NATURAL LANGUAGE**: Complete understanding without command syntax
- ✅ **INTELLIGENT VALIDATION**: AI asks for missing parameters instead of failing
- ✅ **MULTI-STEP OPERATIONS**: Complex commands like "add BTC then show indices" work perfectly

## Working AI Tools

### Core Intelligence
1. `execute_multi_step_request` - Comprehensive multi-step analysis workflows
2. `conduct_deep_research` - AI-powered research with synthesis
3. `research_and_analyze_companies` - Company comparison and analysis

### Portfolio Management  
4. `get_portfolio` - View holdings with memory context
5. `add_portfolio_holding` - Add assets with entity storage
6. `remove_portfolio_holding` - Remove assets with memory update
7. `import_portfolio` - Import CSV/Excel files with entity extraction

### Market Data & Analysis
8. `get_equity_quote` - Stock quotes with OHLC data
9. `get_crypto_price` - Cryptocurrency prices with fallbacks
10. `create_chart` - Generate price charts with context
11. `get_market_overview` - Comprehensive market summary
12. `get_trending_stocks` - Trending stocks with sector awareness
13. `get_indices` - Market indices (US/EU/Global)

### Research & Intelligence
14. `get_companies` - Company database with sector mapping
15. `get_news` - News search (Exa.ai integrated)
16. `map_companies_to_symbols` - Intelligent ticker mapping
17. `check_api_keys` - API configuration status

### Memory & Context
18. **Unified ChromaDB Integration** - Persistent conversation and portfolio memory
19. **Semantic Search** - Context-aware entity retrieval across all collections
20. **Portfolio Awareness** - Remembers tracked companies from conversation history

The system is **production-ready** with unified intelligence achieving **Claude Code level intelligence** - persistent memory, context awareness, and autonomous multi-step execution exactly like advanced AI assistants.