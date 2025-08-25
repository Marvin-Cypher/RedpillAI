# CLI-First Architecture Guide

This document outlines the restructured CLI-first architecture for RedPill AI Terminal.

## 🏗 Architecture Overview

RedPill AI Terminal is now designed with a **CLI-first approach**, where the command-line interface is the primary user interaction method, supported by optional backend services and web UI for enhanced functionality.

```
┌─────────────────────────────────────────────────────────┐
│                 CLI Terminal (Primary)                  │
│              Node.js + TypeScript                       │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────────────────────┐│
│  │   AI Terminal   │  │      Setup Wizard               ││
│  │  (ai-terminal)  │  │   (setup-wizard)                ││
│  │                 │  │                                 ││
│  │ Natural Language│  │ Interactive API                 ││
│  │ Command Parser  │  │ Configuration                   ││
│  └─────────────────┘  └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                Backend Services (Optional)              │
│               FastAPI + Python                          │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────────────────────┐│
│  │ Terminal API    │  │    Market Data Service         ││
│  │ (terminal.py)   │  │   (market_data_service.py)     ││
│  │                 │  │                                 ││
│  │ Command Router  │  │ OpenBB + CoinGecko             ││
│  │ AI Integration  │  │ Async Wrappers                 ││
│  └─────────────────┘  └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                 Web UI Assistant (Optional)             │
│                Next.js + React                          │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────────────────────┐│
│  │  Portfolio UI   │  │       Widget System             ││
│  │   (dashboard)   │  │      (components)               ││
│  │                 │  │                                 ││
│  │ Visual Analysis │  │ Data Visualization              ││
│  │ Team Features   │  │ Interactive Charts              ││
│  └─────────────────┘  └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
RedpillAI/
├── cli-node/                    # 🎯 PRIMARY INTERFACE
│   ├── src/
│   │   ├── ai-terminal.ts       # Main AI-powered terminal
│   │   ├── setup-wizard.ts      # Interactive API configuration
│   │   ├── simple.ts            # Lightweight crypto-focused version
│   │   └── index.ts             # Entry point routing
│   ├── dist/                    # Built JavaScript files
│   ├── package.json            # NPM package configuration
│   ├── tsconfig.json           # TypeScript configuration  
│   └── README.md               # CLI-specific documentation
│
├── backend/                    # 🔧 AI & DATA PROCESSING
│   ├── app/
│   │   ├── api/
│   │   │   ├── terminal.py     # Terminal command interpreter
│   │   │   ├── market.py       # Market data endpoints
│   │   │   └── companies.py    # Company data endpoints
│   │   ├── services/
│   │   │   ├── ai_service.py   # Multi-provider AI integration
│   │   │   ├── market_data_service.py  # Async market data
│   │   │   └── openbb_service.py       # OpenBB Platform wrapper
│   │   └── models/             # Database models
│   ├── requirements-minimal.txt  # Minimal backend dependencies
│   └── main.py                 # FastAPI application
│
├── frontend/                   # 🌐 WEB UI ASSISTANT (Optional)
│   ├── src/
│   │   ├── app/                # Next.js app router
│   │   ├── components/         # React components
│   │   │   ├── widgets/        # Data visualization widgets
│   │   │   ├── terminal/       # Web terminal interface
│   │   │   └── dashboard/      # Portfolio management UI
│   │   └── lib/               # Utilities and API clients
│   ├── package.json           # Frontend dependencies
│   └── README.md              # Frontend documentation
│
└── docs/                      # 📚 DOCUMENTATION
    ├── CLI_FIRST_ARCHITECTURE.md  # This document
    ├── SETUP_GUIDE.md             # Setup instructions
    └── API_INTEGRATION.md         # API integration guide
```

## 🔄 Data Flow Architecture

### 1. CLI-First Flow (Primary)
```
User Input (Natural Language)
          ↓
    AI Terminal Parser
          ↓
  Intent Recognition (OpenAI/Redpill AI)  
          ↓
    Command Execution
          ↓
  ┌─────────────────┐  ┌─────────────────────────────┐
  │ Direct API Calls│  │    Backend Integration      │
  │ (CoinGecko etc) │  │ (Terminal API + Services)   │
  └─────────────────┘  └─────────────────────────────┘
          ↓                           ↓
    Terminal Output  ←←←←←←←←←←←←←  Structured Response
```

### 2. Web UI Assistant Flow (Optional)
```
Web Dashboard Request
          ↓
    Frontend API Client
          ↓
    Backend REST API
          ↓
    Service Layer (Async)
          ↓
    Data Processing & AI
          ↓
    Widget Visualization
```

## 🎯 Usage Patterns

### Primary Usage: CLI Terminal
```bash
# Global installation
npm install -g redpill-terminal

# Interactive setup
redpill-setup

# Natural language commands
redpill
❯ what's the price of bitcoin?
❯ crypto market overview
❯ analyze Tesla fundamentals
❯ research AI companies
```

### Enhanced Usage: CLI + Backend
```bash
# Terminal 1: Start backend services
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: CLI with full backend integration
redpill
❯ import portfolio from Notion
❯ show portfolio performance 
❯ analyze my holdings vs market
```

### Full-Stack Usage: CLI + Backend + Web UI
```bash
# Terminal 1: Backend
cd backend && uvicorn app.main:app --reload

# Terminal 2: Web UI  
cd frontend && npm run dev

# Terminal 3: CLI
redpill
# All features available across CLI and Web UI
```

## 🔧 Configuration Hierarchy

### 1. Standalone CLI Configuration
- `.env` file with OpenAI API key
- Direct CoinGecko integration for crypto data
- Lightweight, self-contained experience

### 2. Backend-Integrated Configuration  
- Full API key setup via `redpill-setup`
- OpenBB Platform integration
- Advanced analytics and portfolio management

### 3. Full-Stack Configuration
- All backend features
- Web UI for visualization
- Team collaboration features

## 🚀 Development Priorities

### Phase 1: CLI Excellence (Current)
- ✅ Natural language command parsing
- ✅ Real-time crypto data integration
- ✅ AI-powered intent recognition
- ✅ Interactive setup wizard
- ✅ Comprehensive error handling

### Phase 2: Backend Integration (Next)
- [ ] Enhanced portfolio import functionality
- [ ] Streaming responses for long operations
- [ ] Advanced analytics via OpenBB
- [ ] Multi-user support and data persistence

### Phase 3: Web UI Enhancement
- [ ] CLI command history visualization
- [ ] Interactive charting and analysis
- [ ] Team collaboration features
- [ ] Advanced portfolio management

## 🎪 Key Principles

1. **CLI-First Design**: Every feature must work excellently in the terminal before considering web UI
2. **Progressive Enhancement**: Each layer (CLI → Backend → Web) adds capabilities without breaking core functionality
3. **Natural Language Priority**: Commands should feel conversational, not technical
4. **Graceful Degradation**: System works with minimal setup, enhanced with additional configuration
5. **Developer Experience**: Simple installation, clear documentation, intuitive usage

## 📊 Success Metrics

### CLI Terminal Success
- Installation time < 30 seconds (`npm install -g`)
- First command execution < 60 seconds (including setup)
- 90%+ command success rate with natural language input
- Sub-3-second response time for data queries

### User Adoption Flow
```
1. npm install -g redpill-terminal
2. redpill-setup (API configuration)
3. redpill (start natural language interaction)
4. Immediate value from crypto/market data
5. Optional: Backend setup for advanced features
6. Optional: Web UI for team/visualization features
```

This CLI-first architecture ensures RedPill AI Terminal delivers immediate value while providing a clear path for enhanced functionality as users' needs grow.