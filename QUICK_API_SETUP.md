# 🚀 Quick API Setup (2 Minutes)

## Step 1: Get FREE FMP API Key
1. Go to https://financialmodelingprep.com/
2. Click "Get Free API Key"
3. Sign up with email
4. Copy your API key from dashboard

## Step 2: Add to Environment
```bash
# Edit backend/.env file
cd /Users/marvin/redpill-project/backend
nano .env

# Replace this line:
FMP_API_KEY=your_fmp_api_key_here

# With your real key:
FMP_API_KEY=abc123def456789...
```

## Step 3: Restart Backend
```bash
# Stop backend (Ctrl+C) then restart:
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Step 4: Test Real Market Data
```bash
python test_api_keys.py
```

**You should see**: `✅ BTC: $67,234.50 (Vol: 28,000,000,000)`

## 🎉 That's it!
- **Real crypto prices** in company enrichment
- **Live market data** for investment analysis
- **250 free requests/day** (plenty for testing)

---
**Pro tip**: Add Alpha Vantage key too for backup data sources! 📈