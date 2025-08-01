# RedPill VC - Quick Commands

## 🚀 Daily Development
```bash
# Start backend
cd backend && uvicorn app.main:app --reload --port 8000

# Start frontend  
cd frontend && npm run dev

# Access: http://localhost:3000
```

## 🛠 First Time Setup
```bash
# Backend
cd backend && pip install -r requirements-minimal.txt
python3 seed_companies.py  # CRITICAL
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

## 🔧 Common Fixes
```bash
# Wrong/missing data
cd backend && python3 seed_companies.py

# Backend won't start
pkill -f "uvicorn" && cd backend && uvicorn app.main:app --reload --port 8000

# Frontend cache issues
cd frontend && rm -rf .next node_modules/.cache && npm run dev
```

## ✅ Health Check
```bash
curl http://localhost:8000/health
curl http://localhost:3000
```

## 🆘 Emergency Reset
```bash
pkill -f "uvicorn" && pkill -f "next dev"
cd backend && rm -f redpill.db && python3 seed_companies.py
cd ../frontend && rm -rf .next node_modules/.cache
# Then restart both servers
```

---

**Remember**: `python3 backend/seed_companies.py` fixes most data issues!

**For detailed setup**: See `SETUP_GUIDE.md`