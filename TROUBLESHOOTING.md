# RedPill VC CRM - Troubleshooting Guide

## Quick Setup Checklist

After cloning or resetting the project:

1. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements-minimal.txt
   uvicorn app.main:app --reload --port 8000
   ```

2. **Database Seeding (CRITICAL)**
   ```bash
   cd backend
   python3 seed_companies.py
   ```
   This populates 12 portfolio companies with proper data.

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Common Issues & Solutions

### 1. Widget Showing Wrong Company Data

**Symptoms:** 
- Polkadot shows "Polkadot Digital advertising firm" instead of blockchain project
- Other companies show generic/incorrect information

**Root Cause:** Database not seeded with portfolio companies

**Solution:**
```bash
cd backend
python3 seed_companies.py
```

**Verification:**
```bash
python3 -c "
from app.database import engine
from app.models.companies import Company
from sqlmodel import Session, select

with Session(engine) as session:
    companies = session.exec(select(Company)).all()
    print(f'Companies in database: {len(companies)}')
    for c in companies:
        print(f'  - {c.name} ({c.company_type})')
"
```

### 2. Widget Refresh Returns 404 Error

**Symptoms:**
- Click "Refresh Data" button
- Error: "❌ Failed to refresh: HTTP 404: Not Found"

**Root Cause:** Frontend API_BASE URL doesn't match backend routes

**Solution:**
Check `frontend/src/lib/widgets/data.ts` line 8:
```javascript
const API_BASE = 'http://localhost:8000/api/v1/market';  // Correct
// NOT: const API_BASE = '/api/market';  // Wrong
```

**Backend routes are mounted at:**
- `/api/v1/market` - Market data (OpenBB Platform)  
- `/api/v1/data` - Company data (cost-optimized service)

### 3. Empty Database

**Symptoms:**
- No companies visible in dashboard
- All widgets show fallback/mock data

**Diagnosis:**
```bash
cd backend
python3 -c "
from app.database import engine
from sqlmodel import Session, text

with Session(engine) as session:
    result = session.exec(text('SELECT COUNT(*) FROM companies')).first()
    print(f'Company count: {result}')
"
```

**Solution:**
If count is 0 or very low, run the seed script:
```bash
python3 seed_companies.py
```

### 4. Crypto Widget Missing Token Data

**Symptoms:**
- Token price widget shows "N/A" or generic data
- Missing crypto-specific metrics

**Root Cause:** Company cache missing `crypto_data` field

**Solution:**
```bash
cd backend
python3 -c "
from app.database import engine
from app.models.cache import CompanyDataCache
from app.services.coingecko_service import coingecko_service
from sqlmodel import Session, select
from datetime import datetime

# Add crypto data for a specific company (e.g., Polkadot)
company_name = 'polkadot'
crypto_data = coingecko_service.search_token_by_company(company_name)

if crypto_data:
    with Session(engine) as session:
        cache_entry = session.exec(select(CompanyDataCache).where(
            CompanyDataCache.company_identifier == company_name,
            CompanyDataCache.data_type == 'profile'
        )).first()
        
        if cache_entry:
            cached_data = cache_entry.cached_data.copy()
            cached_data['crypto_data'] = crypto_data
            cache_entry.cached_data = cached_data
            cache_entry.updated_at = datetime.utcnow()
            
            session.add(cache_entry)
            session.commit()
            print(f'Added crypto data for {company_name}')
        else:
            print(f'No cache entry found for {company_name}')
else:
    print(f'No crypto data found for {company_name}')
"
```

### 5. Backend Won't Start

**Symptoms:**
- `uvicorn app.main:app --reload` fails
- Import errors or database connection issues

**Common Causes & Solutions:**

**Wrong Directory:**
```bash
# Make sure you're in the backend directory
cd backend  
uvicorn app.main:app --reload --port 8000
```

**Missing Dependencies:**
```bash
cd backend
pip install -r requirements-minimal.txt
```

**Port Already in Use:**
```bash
# Kill existing process
pkill -f "uvicorn"
# Or use different port
uvicorn app.main:app --reload --port 8001
```

**Database Issues:**
```bash
cd backend
# Reset database if corrupted
rm -f redpill.db
python3 -c "
from app.database import engine
from app.models import *
import sqlmodel
sqlmodel.SQLModel.metadata.create_all(engine)
"
# Re-seed
python3 seed_companies.py
```

### 6. Frontend Build Errors

**Symptoms:**
- `npm run dev` fails
- Module resolution errors
- TypeScript compilation errors

**Solutions:**

**Clear Cache:**
```bash
cd frontend
rm -rf .next node_modules/.cache
npm install
npm run dev
```

**Check API URLs:**
If getting network errors, verify API URLs in:
- `frontend/src/lib/widgets/data.ts` (line 8)
- Any other API client files

**TypeScript Errors:**
```bash
cd frontend
npm run build  # Check for TypeScript errors
npm run lint   # Check for linting issues
```

## Data Flow Debugging

### Understanding the Data Pipeline

1. **Widget Request** → `fetchWidgetData()` in `frontend/src/lib/widgets/data.ts`
2. **API Call** → `/api/v1/data/companies/{name}/profile`
3. **Backend Logic** → `generate_realistic_company_data()` in `backend/app/api/v1/data.py`
4. **Data Sources** (in order):
   - Companies database (primary)
   - CompanyDataCache (seeded data)
   - Tavily API (external, can be wrong)
   - Hardcoded fallbacks

### Debugging API Responses

**Test Company Data:**
```bash
curl -X GET "http://localhost:8000/api/v1/data/companies/polkadot/profile" \
  -H "Content-Type: application/json" | jq '.'
```

**Test Market Data:**
```bash
curl -X GET "http://localhost:8000/api/v1/market/crypto/DOT/price" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" | jq '.'
```

**Check Database State:**
```bash
cd backend
python3 -c "
from app.database import engine
from app.models.companies import Company
from app.models.cache import CompanyDataCache
from sqlmodel import Session, select

with Session(engine) as session:
    companies = session.exec(select(Company)).all()
    cache_entries = session.exec(select(CompanyDataCache)).all()
    
    print(f'Companies: {len(companies)}')
    print(f'Cache entries: {len(cache_entries)}')
    
    # Check specific company
    polkadot = session.exec(select(Company).where(Company.name.ilike('%polkadot%'))).first()
    if polkadot:
        print(f'Polkadot found: {polkadot.name} ({polkadot.company_type})')
    else:
        print('Polkadot NOT found in database')
"
```

## Performance Issues

### Slow Widget Loading

**Causes:**
- External API calls (Tavily, CoinGecko)
- Missing cache entries
- Network timeouts

**Solutions:**
- Ensure database is properly seeded (reduces external API calls)
- Check cache hit rates
- Monitor API response times

### Memory Issues

**Database Growth:**
```bash
cd backend
# Check database size
ls -lh redpill.db

# Clean up if needed (will lose data)
rm redpill.db
python3 seed_companies.py
```

## Recovery Procedures

### Complete Reset

If the system is in an unknown state:

```bash
# 1. Stop all processes
pkill -f "uvicorn"
pkill -f "next dev"

# 2. Clean backend
cd backend
rm -f redpill.db
pip install -r requirements-minimal.txt

# 3. Clean frontend
cd ../frontend
rm -rf .next node_modules/.cache
npm install

# 4. Restart backend
cd ../backend
uvicorn app.main:app --reload --port 8000 &

# 5. Seed database
python3 seed_companies.py

# 6. Restart frontend
cd ../frontend
npm run dev
```

### Backup Important Data

Before major changes:
```bash
cd backend
# Backup database
cp redpill.db redpill.db.backup

# Export company data
python3 -c "
from app.database import engine
from app.models.companies import Company
from sqlmodel import Session, select
import json

with Session(engine) as session:
    companies = session.exec(select(Company)).all()
    data = [{'name': c.name, 'sector': c.sector, 'company_type': c.company_type} for c in companies]
    
with open('companies_backup.json', 'w') as f:
    json.dump(data, f, indent=2)

print('Companies backed up to companies_backup.json')
"
```

## Contact & Escalation

If none of these solutions work:

1. Check the Work Memories section in `CLAUDE.md` for recent issues
2. Look for similar issues in project commit history
3. Verify all environment variables are set correctly
4. Check if the issue is related to external API limits or outages

Remember: The seed script (`python3 seed_companies.py`) solves 80% of data-related issues.