# 🚀 RedPill VC Quick Reference

## Essential Commands

```bash
# Start everything
./scripts/start-services.sh

# Check status
./scripts/health-check.sh

# Stop everything  
./scripts/stop-services.sh

# Reset database (clean slate)
./scripts/reset-database.sh
```

## Manual Commands (if scripts fail)

```bash
# Backend only
cd backend && python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

# Frontend only  
cd frontend && npm run dev

# Kill processes
pkill -f uvicorn && pkill -f "next dev"
```

## Quick Tests

```bash
# Test backend
curl http://localhost:8000/health

# Test API
curl "http://localhost:8000/api/v1/workflows/summary"

# Test frontend
open http://localhost:3000
```

## Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| "Failed to fetch" | Backend down → `./scripts/start-services.sh` |
| Port 3000 busy | Use `npx next dev --port 3001` |
| Database errors | Check `backend/app/config.py` → should be `sqlite:///./redpill.db` |
| Module not found | Wrong directory → `cd backend` or `cd frontend` |

## File Locations

- **Setup Guide**: `SETUP_GUIDE.md`
- **Scripts**: `scripts/`
- **Backend Config**: `backend/app/config.py`
- **Database**: `backend/redpill.db`
- **AI Components**: `frontend/src/components/ai/`

## AI Features Test

1. Open http://localhost:3000
2. Click purple "AI" button in dashboard header
3. Navigate to `/portfolio` and test AI buttons
4. Try company-specific AI chats

---
*💡 For detailed setup instructions, see `SETUP_GUIDE.md`*