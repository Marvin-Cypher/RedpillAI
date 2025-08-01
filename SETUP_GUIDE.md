# RedPill VC Setup Guide

## 🚀 Quick Commands (Daily Development)

```bash
# Start backend
cd backend && uvicorn app.main:app --reload --port 8000

# Start frontend
cd frontend && npm run dev

# Access: http://localhost:3000
```

## 🛠 Detailed Setup (First Time)

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

### 1. Clone & Navigate
```bash
git clone https://github.com/Marvin-Cypher/RedpillAI.git
cd RedpillAI
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements-minimal.txt

# CRITICAL: Seed database with portfolio companies
python3 seed_companies.py

# Start backend
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Verify Installation
- **Backend**: http://localhost:8000/health
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

---

## 🔧 Common Issues & Solutions

### Database Issues
```bash
# Wrong company data → Re-seed database
cd backend && python3 seed_companies.py

# Empty dashboard → Database not seeded  
cd backend && python3 seed_companies.py

# Schema errors → Reset database
cd backend && rm -f redpill.db
python -c "
from app.database import engine
from app.models import *
import sqlmodel
sqlmodel.SQLModel.metadata.create_all(engine)
"
python3 seed_companies.py
```

### Server Issues  
```bash
# Backend won't start → Kill existing process
pkill -f "uvicorn" && cd backend && uvicorn app.main:app --reload --port 8000

# Frontend compilation fails → Clear cache
pkill -f "next dev"
cd frontend && rm -rf .next node_modules/.cache && npm run dev

# Widget 404 errors → Check API URLs
# Frontend should use 'http://localhost:8000/api/v1/market' not '/api/market'
```

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Check companies in database  
cd backend && python -c "
from app.database import engine
from app.models.companies import Company
from sqlmodel import Session, select
with Session(engine) as session:
    count = len(session.exec(select(Company)).all())
    print(f'Companies in database: {count}')
"

# Test API endpoints
curl 'http://localhost:8000/api/v1/data/companies/polkadot/profile' | head -5
```

---

## 📋 Essential Configuration

### Backend (`backend/app/config.py`)
```python
# Development database (SQLite)
database_url: str = "sqlite:///./redpill.db"

# CORS for frontend access
allowed_origins: str = "http://localhost:3000,http://localhost:3001"
```

### Environment Variables (Optional)
```bash
# Backend AI providers
REDPILL_API_KEY=your_redpill_key
OPENAI_API_KEY=your_openai_key
COINGECKO_API_KEY=your_coingecko_key

# Frontend (frontend/.env.local)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

---

## 🏗️ Project Structure
```
redpill-project/
├── backend/                 # FastAPI backend
│   ├── app/main.py         # Main application  
│   ├── app/config.py       # Configuration
│   ├── redpill.db          # SQLite database
│   └── seed_companies.py   # Database seeding
├── frontend/               # Next.js frontend
│   ├── src/app/            # Pages (dashboard, portfolio, etc.)
│   ├── src/components/     # React components
│   └── package.json        # NPM configuration
└── docs/                   # Documentation
```

## 📖 Additional Resources

- **Full Documentation**: See `README.md` for complete overview
- **Architecture Details**: `THREE_PILLAR_ARCHITECTURE_COMPLETE.md`
- **Development Guide**: `docs/DEVELOPMENT_GUIDE.md`  
- **File Structure**: `docs/FILE_STRUCTURE_GUIDE.md`
- **AI Context**: `CLAUDE.md` for AI development assistance
- **Troubleshooting**: `TROUBLESHOOTING.md` for detailed issue resolution

## 🎯 Success Indicators

✅ **Backend**: `curl http://localhost:8000/health` returns `{"status":"healthy"}`  
✅ **Frontend**: http://localhost:3000 loads with dashboard and navigation  
✅ **Database**: 12 portfolio companies loaded (run `python3 seed_companies.py`)  
✅ **API**: `curl http://localhost:8000/api/v1/workflows/summary` returns JSON

---

**Remember**: `python3 backend/seed_companies.py` solves most data issues!