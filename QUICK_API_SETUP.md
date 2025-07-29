# 🚀 Quick API Setup (Essential Keys)

## Critical API Keys for Full Functionality

### 1. RedPill AI API Key (Primary AI Provider)
```bash
# Add to backend/.env
REDPILL_API_KEY=your_redpill_api_key_here
```

### 2. OpenAI API Key (Fallback AI Provider)
```bash
# Add to backend/.env
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. CoinGecko API Key (Market Data - Optional)
```bash
# Add to backend/.env
COINGECKO_API_KEY=your_coingecko_api_key_here
```

## Quick Setup Steps

1. **Copy environment template:**
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Edit with your keys:**
   ```bash
   nano backend/.env
   ```

3. **Test API connectivity:**
   ```bash
   cd backend && python test_api_keys.py
   ```

4. **Restart servers:**
   ```bash
   # Backend (port 8000)
   cd backend && uvicorn app.main:app --reload

   # Frontend (port 3000)  
   cd frontend && npm run dev
   ```

For detailed setup instructions, see: [API_KEYS_SETUP.md](./API_KEYS_SETUP.md)