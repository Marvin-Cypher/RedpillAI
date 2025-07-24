# RedpillAI - AI-Powered Crypto VC CRM

A comprehensive venture capital CRM platform specifically designed for crypto investments, powered by advanced AI research capabilities and real-time market data integration.

![RedpillAI Dashboard](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=RedpillAI+Dashboard)

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

### 📊 **Real-Time Market Intelligence**
- **CoinGecko Integration**: Live crypto market data, prices, and metrics
- **Portfolio Tracking**: Real-time portfolio performance and analytics
- **Market Analysis**: Automated market position and competitive landscape analysis

### 💼 **Investment Memo System**
- **AI-Generated Memos**: Automatically generate comprehensive investment analysis
- **Collaborative Editing**: Team collaboration on investment decisions
- **Template Library**: Pre-built memo templates for different investment stages
- **One-Click Export**: Export memos to PDF or share with stakeholders

### 💬 **Intelligent Chat Interface**
- **Project-Specific Conversations**: Dedicated chat threads for each investment opportunity
- **Context-Aware**: AI remembers previous conversations and project details
- **Research Integration**: Seamlessly integrate research findings into conversations
- **Memo Creation**: One-click conversion of chat insights to investment memos

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

### Backend
- **FastAPI** - Modern Python web framework
- **SQLModel** - Type-safe database operations
- **PostgreSQL** - Production database
- **Pydantic** - Data validation and serialization

### AI & Integrations
- **Redpill AI** - Multi-model AI router with reasoning capabilities
- **OpenAI SDK** - Standardized AI model interface
- **CoinGecko API** - Real-time crypto market data
- **DeepSeek R1** - Advanced reasoning model for complex analysis

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
REDPILL_AI_API_KEY=your_redpill_ai_key
COINGECKO_API_KEY=your_coingecko_key
NEXTAUTH_SECRET=your_nextauth_secret
```

**Backend (`backend/.env`):**
```env
DATABASE_URL=postgresql://user:password@localhost/redpillai
REDPILL_AI_API_KEY=your_redpill_ai_key
COINGECKO_API_KEY=your_coingecko_key
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

### 4. Database Setup
```bash
cd backend
alembic upgrade head
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

### AI Model Configuration
The platform supports multiple AI models through Redpill AI router:
- **DeepSeek R1**: Advanced reasoning for complex analysis
- **GPT-4**: General-purpose research and writing
- **Claude**: Long-form document analysis
- **Llama 3**: Open-source alternative

### API Keys Required
1. **Redpill AI**: Sign up at [redpill.ai](https://redpill.ai) for AI model access
2. **CoinGecko**: Get free API key at [coingecko.com](https://coingecko.com/api)

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
- **DealPipeline**: Main pipeline interface with drag-and-drop
- **ChatWindow**: AI chat interface with context awareness
- **ProjectDetail**: Comprehensive project management interface
- **InvestmentMemoManager**: Memo creation and management system

### AI Integration Architecture
- **VCAssistant**: Main AI coordinator class
- **RedpillAIProvider**: Redpill AI API integration
- **CryptoResearchAgent**: Specialized crypto research workflows
- **CoinGeckoService**: Market data integration

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

- [Redpill AI](https://redpill.ai) for providing advanced AI model routing
- [CoinGecko](https://coingecko.com) for comprehensive crypto market data
- [Shadcn/UI](https://ui.shadcn.com) for beautiful UI components
- [Lucide](https://lucide.dev) for the icon library

## 📞 Support

- **Documentation**: [docs.redpillai.com](https://docs.redpillai.com) (coming soon)
- **Issues**: [GitHub Issues](https://github.com/Marvin-Cypher/RedpillAI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Marvin-Cypher/RedpillAI/discussions)

---

**Built with ❤️ for the crypto VC community**

Streamline your investment workflow with AI-powered research and real-time market intelligence.