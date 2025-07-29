# 🏗️ RedpillAI: AG-UI + OpenBB Modular Architecture

## 🎯 Architecture Overview

**RedpillAI** has been completely transformed into a **modular, event-driven platform** that combines:

- **🤖 AG-UI Protocol**: Standardized AI agent communication framework
- **📊 OpenBB Platform**: Professional-grade financial data engine  
- **🔗 Integration Bridge**: Seamless connection between agents and financial data
- **💬 Chat Interface**: Project management and research workflows

---

## 🧩 System Components

### 1. 🤖 AG-UI Agent Layer (`/src/lib/agents/`)

**Purpose**: Standardized AI agent management and communication

#### Key Files:
- **`ag-ui-client.ts`**: Main client for agent communication
- **Component**: `/src/components/agents/ag-ui-interface.tsx`

#### Available Agents:
```typescript
const DEFAULT_AGENTS = [
  {
    id: 'research-agent',
    name: 'Research Agent',
    type: 'research',
    capabilities: ['due_diligence', 'competitive_analysis', 'team_research'],
    framework: 'langgraph'
  },
  {
    id: 'market-agent', 
    name: 'Market Agent',
    type: 'market',
    capabilities: ['price_analysis', 'technical_indicators', 'sentiment_analysis'],
    framework: 'crewai'
  },
  {
    id: 'risk-agent',
    name: 'Risk Agent',
    type: 'risk', 
    capabilities: ['portfolio_risk', 'var_calculation', 'stress_testing'],
    framework: 'pydantic'
  }
]
```

#### Agent Capabilities:
- **🔍 Research Agent**: Due diligence, competitive analysis, team background
- **📈 Market Agent**: Price analysis, technical indicators, market trends
- **⚠️ Risk Agent**: Portfolio risk, VaR calculation, stress testing
- **🔄 Event-Driven**: Real-time communication via AG-UI Protocol

---

### 2. 📊 OpenBB Financial Data Layer (`/src/components/dataroom/`)

**Purpose**: Professional financial data access and visualization

#### Key Files:
- **`openbb-dataroom.tsx`**: Main financial dashboard component  
- **Backend**: `/backend/app/services/openbb_service.py`

#### Features:
```typescript
interface OpenBBCapabilities {
  // Live Market Data
  crypto_prices: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX']
  
  // Portfolio Analytics  
  portfolio_tracking: {
    total_value: number
    daily_change: number
    allocation: AssetAllocation[]
  }
  
  // Technical Analysis
  indicators: ['SMA', 'RSI', 'Volume', 'Volatility']
  
  // Risk Metrics
  risk_analysis: ['Beta', 'Sharpe', 'Max Drawdown', 'Correlation']
}
```

#### API Endpoints:
```bash
GET /api/v1/market/health              # OpenBB health check
GET /api/v1/market/overview            # Market overview
GET /api/v1/market/crypto/{symbol}/price     # Live crypto price
GET /api/v1/market/crypto/{symbol}/historical # Historical data
GET /api/v1/market/crypto/{symbol}/analysis  # Technical analysis
GET /api/v1/market/news                # Market news
```

---

### 3. 🔗 Integration Bridge (`/src/lib/integrations/`)

**Purpose**: Connect AI agents with financial data services

#### Key Files:
- **`agent-openbb-bridge.ts`**: Main integration layer

#### Bridge Functions:
```typescript
class AgentOpenBBBridge {
  // Market Data Integration
  async handleMarketDataRequest(request: MarketDataRequest)
  
  // Research Integration  
  async handleResearchRequest(request: ResearchRequest)
  
  // Risk Analysis Integration
  async handleRiskAnalysisRequest(request: RiskRequest)
  
  // Direct API Access
  async requestMarketData(agentId: string, symbols: string[])
  async requestResearch(agentId: string, query: string) 
  async requestRiskAnalysis(agentId: string, portfolio: Portfolio)
}
```

#### Event Flow:
```
AG-UI Agent → Bridge Request → OpenBB API → Financial Data → Agent Response
     ↓             ↓              ↓             ↓              ↓
  Task Start → Market Query → Live Prices → Analysis → Task Complete
```

---

### 4. 💬 Frontend Interface Layer (`/src/app/`)

**Purpose**: User interface for agent management and data visualization

#### Key Components:
- **`page.tsx`**: Main dashboard with modular architecture
- **Control Panel**: Agent activation and dataroom toggle
- **AG-UI Interface**: Slide-out agent management panel  
- **OpenBB Dataroom**: Financial data visualization

#### UI Architecture:
```typescript
Dashboard {
  // Sidebar: Project management
  ConversationSidebar()
  
  // Main Content: Modular tools
  ControlPanel {
    AgentButton() → AGUIInterface()
    DataroomButton() → OpenBBDataroom() 
  }
  
  // Overlays: Agent interface
  AGUIInterface() // Slide-out panel
}
```

---

## 🚀 Workflow Examples

### 1. Investment Research Workflow

```typescript
// 1. User selects project and clicks "Research Agent" 
startAgentTask('research-agent', 'research')

// 2. Bridge requests market data for context
agentOpenBBBridge.requestResearch(agentId, 'Research Berachain')

// 3. OpenBB provides market data + news
const researchData = {
  market_overview: await fetchMarketOverview(),
  recent_news: await fetchMarketNews(),
  project_context: selectedProject
}

// 4. Agent processes and returns analysis
emit('research.result', researchData)
```

### 2. Portfolio Risk Analysis

```typescript
// 1. User activates Risk Agent for portfolio
startAgentTask('risk-agent', 'risk_assessment')

// 2. Bridge fetches current asset prices
const portfolio = { assets: ['BTC', 'ETH'], allocation: [0.6, 0.4] }
const currentPrices = await fetchMarketData(portfolio.assets)

// 3. Calculate risk metrics
const riskMetrics = {
  portfolio_beta: 1.2,
  sharpe_ratio: 0.85,
  max_drawdown: -15.2,
  volatility: 22.3
}

// 4. Agent provides risk recommendations
emit('risk.alert', { portfolio, metrics: riskMetrics })
```

### 3. Market Analysis Workflow

```typescript
// 1. User requests market analysis 
startAgentTask('market-agent', 'market_analysis')

// 2. Bridge requests technical analysis
agentOpenBBBridge.requestMarketData(agentId, ['BTC', 'ETH'], 'analysis')

// 3. OpenBB provides technical indicators
const technicalData = {
  prices: await fetchMarketData(['BTC', 'ETH']),
  indicators: await fetchTechnicalAnalysis(['BTC', 'ETH'])
}

// 4. Agent provides market insights
emit('market.update', technicalData)
```

---

## 🏛️ Directory Structure

```
/frontend/src/
├── app/
│   └── page.tsx                    # Main dashboard with modular UI
├── components/
│   ├── agents/
│   │   └── ag-ui-interface.tsx     # Agent management panel
│   ├── dataroom/
│   │   └── openbb-dataroom.tsx     # Financial data dashboard
│   └── ui/                         # Reusable UI components
├── lib/
│   ├── agents/
│   │   └── ag-ui-client.ts         # AG-UI Protocol client
│   └── integrations/
│       └── agent-openbb-bridge.ts  # Integration bridge

/backend/app/
├── services/
│   └── openbb_service.py          # OpenBB Platform wrapper
└── api/
    └── market.py                  # Market data API endpoints
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_OPENBB_API_URL=http://localhost:8000/api/v1/market

# Backend (.env)  
OPENBB_PAT=your_openbb_token
TAVILY_API_KEY=your_tavily_key
GOOGLE_API_KEY=your_google_key
```

### Agent Configuration
```typescript
// Customize agents in ag-ui-client.ts
const CUSTOM_AGENTS = [
  {
    id: 'defi-agent',
    name: 'DeFi Specialist', 
    type: 'market',
    capabilities: ['yield_farming', 'liquidity_analysis', 'protocol_risk']
  }
]
```

---

## 🎯 Benefits Achieved

### 🔄 Modular Architecture
- **Independent Components**: Agents, data, and UI work independently
- **Event-Driven**: Loose coupling via event communication
- **Scalable**: Easy to add new agents or data sources
- **Maintainable**: Clear separation of concerns

### 🤖 Standardized Agents  
- **AG-UI Protocol**: Industry-standard agent communication
- **Multi-Framework**: Support for LangGraph, CrewAI, Pydantic AI
- **Real-Time**: Live agent status and task progress
- **Extensible**: Easy to add custom agent types

### 📊 Professional Financial Data
- **OpenBB Platform**: 350+ financial data providers
- **Real-Time**: Live market data and technical indicators  
- **Professional Grade**: Institutional-quality data sources
- **Self-Hosted**: Complete control over data access

### 🔗 Seamless Integration
- **Bridge Layer**: Automatic connection between agents and data
- **Context-Aware**: Agents receive relevant financial context
- **Bi-Directional**: Agents can request specific data and receive updates
- **Error Handling**: Graceful degradation when services unavailable

---

## 🚀 Next Steps

### 🔑 Enhanced Data Access
Add API keys for premium data providers:
- **Financial Modeling Prep**: Enhanced company financials
- **Polygon**: Professional market data  
- **Alpha Vantage**: Additional technical indicators
- **Benzinga**: Professional news feeds

### 🤖 Advanced Agents
Develop specialized agents:
- **DeFi Agent**: Protocol analysis, yield optimization
- **Compliance Agent**: Regulatory analysis, risk assessment
- **Portfolio Agent**: Optimization, rebalancing recommendations

### 📈 Advanced Analytics  
Add sophisticated financial analysis:
- **Monte Carlo**: Portfolio simulation and optimization
- **Options Pricing**: Black-Scholes, Greeks calculations
- **Macro Analysis**: Economic indicators and correlations
- **Sentiment Analysis**: Social media and news sentiment

---

## 🎊 Success Metrics

- ✅ **Modular Architecture**: Independent, scalable components
- ✅ **AG-UI Integration**: Standardized agent communication  
- ✅ **OpenBB Integration**: Professional financial data access
- ✅ **Bridge Layer**: Seamless agent-data integration
- ✅ **Real-Time Data**: Live market data and agent communication
- ✅ **Frontend UI**: Intuitive agent and data management interface

## 🏆 Conclusion

**RedpillAI now features a world-class, modular architecture** that combines:

- **🤖 Standardized AI Agents** via AG-UI Protocol
- **📊 Professional Financial Data** via OpenBB Platform  
- **🔗 Seamless Integration** via custom bridge layer
- **💻 Intuitive Interface** for investment professionals

**This architecture provides the foundation for building sophisticated AI-powered investment research and portfolio management tools.**

---

**Status**: ✅ **AG-UI + OpenBB Architecture Complete**  
**Modules**: 🤖 Agents | 📊 Data | 🔗 Bridge | 💻 UI  
**Ready For**: Investment Research | Portfolio Analysis | Risk Assessment

**RedpillAI = AG-UI Protocol + OpenBB Platform + Custom Integration** 🚀