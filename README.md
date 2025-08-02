# RedpillAI - Your Secret Intelligence For Investment

Redpill VC is a secure, investor-focused AI platform engineered to elevate decision-making and streamline the workflows of venture capital professionals. It seamlessly blends traditional VC processes with cutting-edge artificial intelligence, serving as an AI co-pilot for fund managers and analysts

<img width="1606" height="1088" alt="Screenshot 2025-07-29 at 21 33 23" src="https://github.com/user-attachments/assets/39480e4e-1a1c-419d-974f-d38919811d3c" />

## 🚀 Features

### 🎯 **Deal Pipeline Management**
- **Visual Pipeline**: Intuitive Kanban-style deal tracking across stages (Planned, Research, Meeting, Due Diligence, Decision)
- **Project Details**: Comprehensive project profiles with team info, metrics, and investment data
- **Status Management**: Easy drag-and-drop or dropdown status updates

### 🤖 **AI-Powered Research Assistant**
- **Multi-Model Support**: Integrated with Redpill AI router (DeepSeek R1, GPT-4, Claude, etc.)
- **Crypto-Specialized**: Pre-trained on venture capital and crypto investment workflows
- **Research Automation**: Automated due diligence, competitive analysis, and market research
- **Reasoning Models**: Advanced reasoning capabilities with step-by-step analysis

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

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/UI** - Modern component library
- **Lucide Icons** - Beautiful icon set

### Backend (Service-First Architecture)
- **FastAPI** - Modern Python web framework with async-safe service layer
- **SQLModel** - Type-safe database operations
- **PostgreSQL** - Production database
- **Pydantic** - Data validation and serialization
- **AsyncIO** - Non-blocking I/O with ThreadPoolExecutor for legacy APIs
- **httpx** - Async HTTP client replacing requests for external APIs

### AI & Integrations (Async-Safe)
- **CopilotKit AI** - Modern AI interface with unified system integration
- **MarketDataService** - Async wrappers for OpenBB Platform (350+ providers)
- **AsyncCoinGeckoClient** - Non-blocking crypto market data
- **Consolidated Chat System** - Single AI chat service with debugging
- **OpenProject API** - Portfolio and document management
- **Three-Pillar Bridge** - Event-driven integration layer

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- PostgreSQL (optional, SQLite works for development)

### 1. Clone the Repository
```bash
git clone https://github.com/Marvin-Cypher/RedpillAI.git
cd RedpillAI
```

### 2. Environment Setup
Create `.env.local` files in both frontend and backend directories:

**Frontend (`frontend/.env.local`):**
```env
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

**Backend (`backend/.env`):**
```env
DATABASE_URL=postgresql://user:password@localhost/redpillai
OPENBB_PAT=your_openbb_token
FMP_API_KEY=your_fmp_key
POLYGON_API_KEY=your_polygon_key
OPENPROJECT_URL=your_openproject_url
OPENPROJECT_API_KEY=your_api_key
```

### 3. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

### 4. Database Setup & Seeding
```bash
cd backend
alembic upgrade head

# CRITICAL: Seed the database with portfolio companies
python3 seed_companies.py
```

### 5. Start Development Servers

**Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to access the application.

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
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/       # Next.js 14 App Router
│   │   ├── components/# React components
│   │   ├── lib/       # Utilities and AI integration
│   │   └── styles/    # Global styles
├── backend/           # FastAPI backend application
│   ├── models/        # Database models
│   ├── api/          # API routes
│   ├── services/     # Business logic
│   └── utils/        # Utilities
└── docs/             # Documentation
```

### Key Components
- **UnifiedAISystem**: CopilotKit AI context provider
- **OpenBBDataroom**: Financial data and analytics dashboard
- **PortfolioManager**: OpenProject integration interface
- **ThreePillarBridge**: Cross-system workflow coordination

### Three-Pillar Architecture
- **CopilotKit Integration**: Modern AI interface with context-aware sessions
- **OpenBB Service**: Professional financial data access
- **OpenProject Service**: Portfolio and document management
- **Event-Driven Bridge**: Integrated workflow automation

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
