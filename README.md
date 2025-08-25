# RedpillAI - AI-Driven Investment Terminal

RedpillAI is an AI-powered command-line interface for investment professionals, designed to revolutionize how VCs and investors interact with financial data and make decisions. At its core is a natural language terminal that understands ANY investment request and executes it through AI-driven automation, with an optional web UI for visualization and portfolio management.

<img width="1606" height="1088" alt="Screenshot 2025-07-29 at 21 33 23" src="https://github.com/user-attachments/assets/39480e4e-1a1c-419d-974f-d38919811d3c" />

## 🚀 Core Features

### 🤖 **AI-Driven Terminal Interface (Primary)**
- **Natural Language Commands**: Type anything - "analyze Tesla fundamentals", "crypto market overview", "track Chainlink founders"  
- **Claude Code-Level Intelligence**: Understands complex multi-step requests and executes them autonomously
- **Multi-Provider AI**: Redpill AI primary, OpenAI fallback, with specialized VC prompts
- **OpenBB Integration**: Direct access to 350+ financial data providers through natural language
- **Real-Time Processing**: Live crypto prices, stock data, news, and market intelligence
- **Setup Wizard**: Comprehensive API key management with guided configuration

### 💻 **Command-Line First Architecture**
```bash
npm install -g redpill-terminal
redpill

❯ what's the price of PHA token?
❯ compare Tesla vs Apple performance 
❯ show me crypto market overview
❯ analyze NVIDIA fundamentals
❯ research AI companies in healthcare
```

### 🌐 **Web UI (Assistant Interface)**
- **Portfolio Visualization**: Interactive dashboards and widgets for visual analysis
- **Deal Flow Management**: Visual pipeline for investment tracking and decision-making
- **Document Management**: Upload and AI analysis of pitch decks, whitepapers, financial documents
- **Collaborative Tools**: Team-based investment memo creation and sharing

### 📊 **Enhanced Widget & Market Intelligence**
- **User-Triggered Widget Refresh**: Click refresh to generate complete financial metrics for any company
- **MarketDataService**: Non-blocking access to 350+ financial data providers via OpenBB
- **AsyncCoinGeckoClient**: Real-time crypto market data with proper error handling
- **Dynamic Data Generation**: Intelligent metrics generation for crypto, AI, and traditional companies
- **Portfolio Tracking**: Real-time portfolio performance and analytics with complete widget support
- **Market Analysis**: Automated market position and competitive landscape analysis
- **Comprehensive Fallbacks**: Multi-tier fallback system with realistic data generation

### 💼 **Investment Memo System**
- **AI-Generated Memos**: Automatically generate comprehensive investment analysis
- **Collaborative Editing**: Team collaboration on investment decisions
- **Template Library**: Pre-built memo templates for different investment stages
- **One-Click Export**: Export memos to PDF or share with stakeholders

### 💬 **Consolidated AI Chat System** 
- **Unified Interface**: Single consolidated chat service with comprehensive debugging
- **Project-Specific Conversations**: Dedicated chat threads for each investment opportunity  
- **Context-Aware**: AI remembers previous conversations and project details
- **Chat ID Debugging**: Unique chat IDs for easy troubleshooting with debug endpoints
- **Deal-Specific Features**: Quick analysis, investment memos, and AI insights
- **Research Integration**: Seamlessly integrate research findings into conversations

### 📁 **Knowledge Management**
- **Document Upload**: Centralized document storage for each project
- **AI Document Analysis**: Automated analysis of pitch decks, whitepapers, and financial documents
- **Smart Search**: AI-powered search across all project documents and conversations

## 🛠 Tech Stack

### CLI Terminal (Primary Interface)
- **Node.js 18+** - JavaScript runtime for CLI 
- **TypeScript** - Type-safe development
- **Commander.js** - CLI framework with argument parsing
- **Inquirer.js** - Interactive command-line prompts
- **Chalk** - Terminal string styling and colors
- **Axios** - HTTP client for API integration
- **OpenAI/Redpill AI** - Natural language understanding

### Backend (AI & Data Processing)
- **FastAPI** - Modern Python web framework with async-safe service layer
- **SQLModel** - Type-safe database operations
- **PostgreSQL** - Production database  
- **OpenBB Platform** - 350+ financial data providers
- **MarketDataService** - Async wrappers for external APIs
- **AsyncCoinGeckoClient** - Non-blocking crypto market data
- **AI Service** - Multi-provider AI with conversation context

### Web UI (Assistant Interface - Optional)
- **Next.js 15.1.7** - Modern React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling  
- **Shadcn/UI** - Enhanced modern component library
- **React Markdown** - Full-screen memo rendering

## 🚀 Quick Start

### Method 1: CLI Only (Recommended for Most Users)

**Install the CLI globally:**
```bash
npm install -g redpill-terminal
```

**Run the setup wizard:**
```bash
redpill-setup
# Or if no setup needed:
redpill
```

**Start using natural language:**
```bash
❯ what's the price of bitcoin?
❯ crypto market overview  
❯ analyze Tesla stock fundamentals
❯ research AI companies in healthcare
❯ show me Chainlink token metrics
```

### Method 2: Full Development Setup (CLI + Web UI + Backend)

**Prerequisites:**
- Node.js 18+ and npm  
- Python 3.8+
- PostgreSQL (optional, SQLite works for development)

**1. Clone the Repository:**
```bash
git clone https://github.com/Marvin-Cypher/RedpillAI.git
cd RedpillAI
```

**2. Install CLI:**
```bash
cd cli-node
npm install
npm run build
npm link  # Makes 'redpill' command available globally
```

**3. Setup Backend (Optional - for full features):**
```bash
cd backend
pip install -r requirements-minimal.txt
uvicorn app.main:app --reload --port 8000
```

**4. Setup Web UI (Optional - for visualization):**
```bash
cd frontend  
npm install
npm run dev  # Visit http://localhost:3000
```

**5. Configure APIs:**
```bash
redpill-setup  # Interactive API key configuration
```

## 🛠️ Troubleshooting

If you encounter issues (wrong company data, 404 errors, etc.), see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions.

**Quick fixes:**
- **Wrong company data?** Run `python3 backend/seed_companies.py`  
- **Widget 404 errors?** Check API URLs in `frontend/src/lib/widgets/data.ts`
- **Empty dashboard?** Database needs seeding (see above)

## 🌐 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Marvin-Cypher/RedpillAI&project-name=redpillai&repository-name=RedpillAI&root-directory=frontend&env=REDPILL_AI_API_KEY,COINGECKO_API_KEY,NEXTAUTH_SECRET&envDescription=Required%20API%20keys%20for%20RedpillAI)

### ⚠️ Important: Avoid 404 Errors
**Root Directory MUST be set to `frontend`** - this is the most common deployment issue.

### Quick Vercel Deployment Steps:
1. Click the "Deploy with Vercel" button above
2. **Verify Root Directory is set to `frontend`** 
3. Add environment variables:
   - `OPENBB_PAT` - Get from [OpenBB Hub](https://my.openbb.co)
   - `FMP_API_KEY` - Get from [Financial Modeling Prep](https://financialmodelingprep.com)
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your Vercel app URL (e.g., `https://your-app.vercel.app`)
4. Deploy!

🔧 **Getting 404 errors?** See [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)  
📖 **Detailed deployment guide:** [DEPLOYMENT.md](DEPLOYMENT.md)

## 📖 Usage Guide

### Creating Your First Project
1. Click "Add Deal" in the pipeline sidebar
2. Fill in basic project information (company name, stage, round size)
3. Upload relevant documents (pitch deck, whitepaper, etc.)
4. Start a research conversation with the AI assistant

### AI Research Workflow
1. **Initial Research**: Ask the AI to analyze the project's market position
2. **Technical Analysis**: Request technical review of whitepapers or code
3. **Competitive Analysis**: Compare with similar projects in the space
4. **Risk Assessment**: Generate comprehensive risk analysis
5. **Investment Memo**: Convert research into formal investment memo

### Market Data Integration
- Search for projects by token name to get real-time market data
- AI automatically incorporates market metrics into analysis
- Track portfolio performance across all investments

## 🔧 Configuration

### Three-Pillar Configuration
The platform integrates three core systems:
- **CopilotKit AI**: Modern AI interface with unified system integration
- **OpenBB Platform**: Professional financial data with 350+ providers
- **OpenProject**: Portfolio management and document collaboration

### API Keys Required
1. **OpenBB**: Sign up at [my.openbb.co](https://my.openbb.co) for financial data access
2. **Financial Modeling Prep**: Get API key at [financialmodelingprep.com](https://financialmodelingprep.com)
3. **OpenProject**: Set up instance at [openproject.org](https://openproject.org)

## 🧪 Development

### Project Structure
```
RedpillAI/
├── cli-node/          # Primary CLI interface (Node.js/TypeScript)
│   ├── src/
│   │   ├── ai-terminal.ts    # Main AI-powered terminal
│   │   ├── setup-wizard.ts   # Interactive API setup
│   │   ├── simple.ts         # Lightweight version
│   │   └── index.ts          # CLI entry point
├── backend/           # AI & data processing backend (Python/FastAPI)
│   ├── app/
│   │   ├── api/              # REST API endpoints
│   │   ├── services/         # AI and data services
│   │   └── models/           # Database models
├── frontend/          # Optional web UI assistant (Next.js)
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # React components  
│   │   └── lib/              # Utilities
└── docs/              # Documentation
```

### Key Components
- **AI Terminal**: Natural language command interpreter with OpenAI/Redpill AI
- **Setup Wizard**: Interactive API key configuration system  
- **Terminal Interpreter**: Backend service that routes commands to appropriate handlers
- **Market Data Service**: Async-safe wrappers for OpenBB Platform and CoinGecko
- **Web UI Assistant**: Optional visualization layer for complex data analysis

### CLI-First Architecture
- **Primary Interface**: Command-line terminal with natural language processing
- **AI Service**: Multi-provider AI with specialized VC prompts and context
- **Backend Services**: FastAPI services for data processing and AI coordination  
- **Web Assistant**: Optional React-based UI for portfolio visualization and team collaboration

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [CopilotKit](https://copilotkit.ai) for modern AI interface integration
- [OpenBB Platform](https://openbb.co) for professional financial data access
- [OpenProject](https://openproject.org) for open-source portfolio management
- [Shadcn/UI](https://ui.shadcn.com) for beautiful UI components
- [Lucide](https://lucide.dev) for the icon library

## 📞 Support

- **Documentation**: [docs.redpillai.com](https://docs.redpillai.com) (coming soon)
- **Issues**: [GitHub Issues](https://github.com/Marvin-Cypher/RedpillAI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Marvin-Cypher/RedpillAI/discussions)

---

**Built with ❤️ for the crypto VC community**

Streamline your investment workflow with AI-powered research and real-time market intelligence.
