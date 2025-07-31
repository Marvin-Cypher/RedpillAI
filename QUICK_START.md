# RedPill VC - Quick Start Guide

## Essential Commands

### Fresh Setup
```bash
# Backend
cd backend
pip install -r requirements-minimal.txt
python3 seed_companies.py  # CRITICAL - populates database
uvicorn app.main:app --reload --port 8000

# Frontend  
cd frontend
npm install
npm run dev
```

### Daily Development
```bash
# Start backend
cd backend && uvicorn app.main:app --reload --port 8000

# Start frontend
cd frontend && npm run dev

# Access: http://localhost:3000
```

### Fix Common Issues
```bash
# Wrong company data → Re-seed database
cd backend && python3 seed_companies.py

# Widget 404 errors → Check API URLs match backend routes
# Frontend should use 'http://localhost:8000/api/v1/market' not '/api/market'

# Empty dashboard → Database not seeded
cd backend && python3 seed_companies.py

# Backend won't start → Kill existing process
pkill -f "uvicorn" && cd backend && uvicorn app.main:app --reload --port 8000
```

### Check System Health
```bash
# Backend health
curl http://localhost:8000/health

# Check companies in database
cd backend && python3 -c "
from app.database import engine
from app.models.companies import Company  
from sqlmodel import Session, select
with Session(engine) as session:
    count = len(session.exec(select(Company)).all())
    print(f'Companies in database: {count}')
"

# Test API endpoints
curl "http://localhost:8000/api/v1/data/companies/polkadot/profile" | jq '.data.name'
curl "http://localhost:8000/api/v1/market/crypto/DOT/price" -H "Authorization: Bearer fake-token" | jq '.current_price'
```

## File Locations (Key Files)

### Configuration
- `backend/app/main.py` - FastAPI app setup, route mounting
- `frontend/src/lib/widgets/data.ts` - Widget API client (line 8: API_BASE URL)
- `backend/seed_companies.py` - Portfolio companies data

### Models & Database  
- `backend/app/models/companies.py` - Company database model
- `backend/app/models/cache.py` - Cache models
- `backend/app/database.py` - Database setup

### API Routes
- `backend/app/api/v1/data.py` - Company data API (main data endpoint)
- `backend/app/api/market.py` - Market data API (OpenBB Platform)

### Frontend Components
- `frontend/src/components/widgets/` - All dashboard widgets
- `frontend/src/components/widgets/TokenPriceWidget.tsx` - Crypto price display
- `frontend/src/components/widgets/BaseWidget.tsx` - Widget wrapper with refresh

## Data Flow Quick Reference

1. **Widget renders** → calls `fetchWidgetData()`
2. **Data fetcher** → calls `/api/v1/data/companies/{name}/profile`  
3. **Backend checks**:
   - Companies database (primary)
   - CompanyDataCache (seeded data)
   - Tavily API (external - can be wrong)
   - Fallback to hardcoded data
4. **Widget receives** structured data and displays

## Portfolio Companies (After Seeding)

The system includes these 12 companies:
- **Crypto**: Phala Network (PHA), Chainlink (LINK), Polygon (MATIC), Solana Labs (SOL), Uniswap Labs (UNI), Aave (AAVE), The Graph (GRT), **Polkadot (DOT)**
- **AI**: NVIDIA Corporation (NVDA), OpenAI  
- **Traditional**: Amazon (AMZN)
- **Trading**: Coinbase

All have realistic metrics, crypto data, and proper widget support.

## Emergency Recovery

If system is completely broken:
```bash
# Full reset
pkill -f "uvicorn" && pkill -f "next dev"
cd backend && rm -f redpill.db
cd ../frontend && rm -rf .next node_modules/.cache
cd ../backend && python3 seed_companies.py
# Then restart both servers
```

## Documentation

- `CLAUDE.md` - Complete project documentation for Claude Code
- `TROUBLESHOOTING.md` - Detailed issue resolution guide  
- `README.md` - Project overview and setup instructions

Remember: `python3 backend/seed_companies.py` solves most data issues!