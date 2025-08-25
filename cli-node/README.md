# RedPill AI Terminal 🚀

AI-driven command-line interface for investment operations with Claude Code-level intelligence. Transform your terminal into an AI-powered investment workstation.

## 🚀 Quick Install

```bash
npm install -g redpill-terminal
```

## 💻 Usage

```bash
# Run the interactive setup wizard (first time)
redpill-setup

# Start the AI terminal
redpill

# Alternative commands:
rp                    # Short alias
redpill-simple       # Lightweight version (crypto-focused)
```

**Natural Language Commands:**
```bash
❯ what's the price of PHA token?
❯ crypto market overview
❯ analyze Tesla fundamentals  
❯ compare Apple vs Microsoft
❯ research AI companies in healthcare
❯ show me today's market movers
❯ import portfolio from Notion
```

## ✨ Features

### 🤖 **AI-Powered Intelligence**
- **Claude Code-Level Understanding**: Comprehends complex multi-step investment requests
- **Natural Language Processing**: No commands to memorize - just speak naturally
- **Context Awareness**: Remembers conversation history and maintains context
- **Multi-Provider AI**: Redpill AI primary, OpenAI fallback for reliability

### 📊 **Real-Time Market Data** 
- **Live Crypto Prices**: Real-time data from CoinGecko API
- **Stock Market Integration**: Access to multiple financial data providers via OpenBB
- **Global Market Stats**: Market cap, volume, dominance, and trend analysis
- **Professional Analytics**: Fundamentals, technicals, news sentiment

### 🛠 **Investment Operations**
- **Portfolio Management**: Import from CSV, Excel, Notion, and other sources
- **Research Automation**: AI-powered due diligence and competitive analysis  
- **Risk Assessment**: Comprehensive risk metrics and scenario analysis
- **News Intelligence**: Real-time news aggregation with sentiment analysis

### 🎯 **Setup & Configuration**
- **Interactive Setup Wizard**: Guided API key configuration
- **Multiple Deployment Options**: Standalone CLI or integrated with full backend
- **Fallback Systems**: Graceful degradation when services are unavailable

## 🔧 Configuration

### Method 1: Interactive Setup (Recommended)
```bash
redpill-setup
```

### Method 2: Manual Configuration
Create a `.env` file:
```bash
# Required for AI functionality
OPENAI_API_KEY=your_openai_key_here

# Optional for enhanced features  
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FMP_API_KEY=your_fmp_key
NEWS_API_KEY=your_news_api_key
POLYGON_API_KEY=your_polygon_key

# Backend integration (optional)
REDPILL_API_URL=http://localhost:8000/api/v1
```

### 🔗 **API Key Sources**
- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys) *(Required)*
- **Alpha Vantage**: [alphavantage.co](https://www.alphavantage.co/support/#api-key) *(Optional)*
- **Financial Modeling Prep**: [financialmodelingprep.com](https://financialmodelingprep.com) *(Optional)*
- **News API**: [newsapi.org](https://newsapi.org/register) *(Optional)*
- **Polygon.io**: [polygon.io](https://polygon.io/dashboard/api-keys) *(Optional)*

## 💡 Example Sessions

### Real-Time Market Data
```bash
❯ what's the price of PHA token?
📊 PHA Price:
PHA
  Price: $0.1113
  24h Change: -12.88%
  Market Cap: $90.0M

❯ crypto market overview
📊 Crypto Market Overview:
Top 10 Cryptocurrencies:
----------------------------------------
BTC (Bitcoin)  Price: $112,347  24h: -2.09%  Cap: $2.2T
ETH (Ethereum) Price: $4,576   24h: -7.20%  Cap: $553B
[... additional crypto data]

Global Market Stats:
Total Market Cap: $4.0T | 24h Volume: $209.1B
Bitcoin Dominance: 56.6% | Ethereum Dominance: 14.0%
```

### AI-Powered Analysis
```bash
❯ analyze Tesla fundamentals
🤖 Understanding your request...
📊 Tesla Fundamentals Analysis:
[AI would provide comprehensive analysis including:]
- Financial metrics and ratios
- Revenue growth trends  
- Profitability analysis
- Competitive positioning
- Investment recommendation
```

### Portfolio Operations
```bash
❯ import portfolio from CSV
📂 Portfolio Import:
✅ Detected 15 holdings from portfolio.csv
📊 Total Portfolio Value: $250,000
🔄 Syncing real-time prices...
✅ Portfolio imported and analyzed
```

## 🛠 Development

### Local Development
```bash
git clone https://github.com/Marvin-Cypher/RedpillAI.git
cd RedpillAI/cli-node
npm install
npm run dev
```

### Testing Different Modes
```bash
npm run dev          # Full AI terminal
npm run dev:setup    # Setup wizard
npm run dev:simple   # Lightweight crypto version
```

### Building for Production
```bash
npm run build
npm link            # Test globally
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Marvin-Cypher/RedpillAI/issues)
- **Main Project**: [RedpillAI Repository](https://github.com/Marvin-Cypher/RedpillAI)
- **Discussions**: [GitHub Discussions](https://github.com/Marvin-Cypher/RedpillAI/discussions)

---

**Transform your terminal into an AI-powered investment workstation** 🚀