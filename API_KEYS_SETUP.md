# 🔑 API Keys Setup Guide

## Overview
This guide helps you set up API keys for **full OpenBB market data access** and other premium features in RedpillAI.

## 🚀 Quick Start (Free Options)

### 1. **Financial Modeling Prep (FMP)** - Recommended First
- **Website**: https://financialmodelingprep.com/
- **Free Tier**: 250 requests/day
- **What it provides**: Real-time stock prices, crypto data, financial statements
- **Setup**:
  1. Sign up for free account
  2. Get API key from dashboard
  3. Add to `backend/.env`: `FMP_API_KEY=your_key_here`

### 2. **Alpha Vantage** - Great for Crypto
- **Website**: https://www.alphavantage.co/
- **Free Tier**: 25 requests/day
- **What it provides**: Crypto prices, forex, technical indicators
- **Setup**:
  1. Sign up for free account
  2. Get API key
  3. Add to `backend/.env`: `ALPHA_VANTAGE_API_KEY=your_key_here`

## 💎 Premium Options (Higher Limits)

### 3. **Polygon.io** - Professional Grade
- **Website**: https://polygon.io/
- **Free Tier**: 5 API calls/minute
- **Paid Plans**: Start at $29/month for unlimited calls
- **What it provides**: Real-time market data, options, forex
- **Setup**: `POLYGON_API_KEY=your_key_here`

### 4. **Quandl/Nasdaq Data** - Economic Data
- **Website**: https://data.nasdaq.com/
- **What it provides**: Economic indicators, market trends, macro data
- **Setup**: `QUANDL_API_KEY=your_key_here`

### 5. **Benzinga News API** - News & Sentiment
- **Website**: https://www.benzinga.com/apis/
- **What it provides**: Financial news, earnings, sentiment analysis
- **Setup**: `BENZINGA_API_KEY=your_key_here`

## 🔧 Setting Up API Keys

### Backend (.env file)
```bash
# Add to /Users/marvin/redpill-project/backend/.env

# Start with these two for immediate results:
FMP_API_KEY=your_fmp_api_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here

# Add these for enhanced data:
POLYGON_API_KEY=your_polygon_api_key_here
QUANDL_API_KEY=your_quandl_api_key_here
BENZINGA_API_KEY=your_benzinga_key_here
```

### Restart Backend
After adding keys:
```bash
cd /Users/marvin/redpill-project/backend
# Stop current backend (Ctrl+C)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🧪 Testing Your Setup

### Test 1: Quick API Key Validation
```bash
cd /Users/marvin/redpill-project/backend
python -c "
from app.services.openbb_service import openbb_service
result = openbb_service.test_connection()
print('✅ Crypto Access:', result['test_crypto_access'])
if result['test_crypto_access']:
    print('🎉 API keys working!')
else:
    print('⚠️  Add API keys to .env file')
"
```

### Test 2: Company Enrichment with Market Data
```bash
python -c "
import requests
response = requests.post('http://localhost:8000/api/v1/companies/enrich', 
    json={'name': 'Bitcoin', 'domain': 'bitcoin.org'},
    headers={'Authorization': 'Bearer demo_token'})
data = response.json()
print('Data Sources:', data['enriched_data']['data_sources'])
"
```

## 📈 What You Get With API Keys

### ✅ Without API Keys (Current State)
- ✅ Company classification and enrichment
- ✅ Website scraping
- ✅ Sector analysis
- ✅ Estimated financial metrics
- ❌ No real market prices
- ❌ No live crypto data

### 🚀 With API Keys (Enhanced)
- ✅ **Real-time crypto prices** (BTC, ETH, all major tokens)
- ✅ **Live market data** for enrichment
- ✅ **Historical price analysis**
- ✅ **Technical indicators** (RSI, MACD, SMA)
- ✅ **News sentiment** analysis
- ✅ **Economic context** for investment decisions

## 🎯 Recommended Priority

### Phase 1: Free Tier (Start Here)
1. **FMP Free Account** - Get 250 requests/day
2. **Alpha Vantage Free** - Get 25 requests/day
3. **Test company enrichment** with real market data

### Phase 2: Production Ready
1. **Upgrade FMP** to paid plan ($15/month for unlimited)
2. **Add Polygon.io** for real-time data ($29/month)
3. **Full VC-grade market intelligence**

## 🛠️ Troubleshooting

### Common Issues:
1. **"Missing credential" errors**: Add API key to `.env` file
2. **"Rate limit exceeded"**: Upgrade to paid plan or add more providers
3. **"Provider failed"**: Check API key validity and account status

### Check Logs:
```bash
# Backend will show credential status on startup:
# ✅ OpenBB credentials configured successfully
# ⚠️  OpenBB credential configuration warning: [details]
```

---
**Ready to unlock real market data?** Start with FMP free account at https://financialmodelingprep.com/ 🚀