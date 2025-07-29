# 🤖 AI Features Setup Guide

## Missing API Keys Analysis

Your AI features aren't working because these **required API keys** are missing from your `.env.local` file:

### 🚨 **CRITICAL MISSING KEYS**

#### 1. **REDPILL AI API KEY** ⚠️ 
```bash
NEXT_PUBLIC_REDPILL_API_KEY=your_redpill_api_key_here
```
- **What it does**: Powers all AI chat, research, and analysis
- **Without it**: AI returns fallback error messages
- **Status**: ❌ NOT SET (using 'demo-key' fallback)

#### 2. **GOOGLE SEARCH API** ⚠️
```bash
GOOGLE_SEARCH_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_CX_ID=your_custom_search_engine_id_here
```
- **What it does**: Enables live web search for research
- **Without it**: Research shows mock/outdated data
- **Status**: ❌ NOT SET (search will fail)

#### 3. **COINGECKO API** (Optional)
```bash
NEXT_PUBLIC_COINGECKO_API_KEY=your_coingecko_key_here
```
- **What it does**: Provides crypto market data
- **Without it**: Uses fallback market analysis
- **Status**: ❌ NOT SET

## 🛠️ **IMMEDIATE FIX**

### Step 1: Add Missing Keys to `.env.local`

Edit `/Users/marvin/redpill-project/frontend/.env.local` and add:

```bash
# AI Features - ADD THESE LINES
NEXT_PUBLIC_REDPILL_API_KEY=your_redpill_api_key_here
GOOGLE_SEARCH_API_KEY=your_google_api_key_here  
GOOGLE_SEARCH_CX_ID=your_custom_search_engine_id_here
NEXT_PUBLIC_COINGECKO_API_KEY=your_coingecko_key_here
```

### Step 2: Get the API Keys

#### **Redpill AI API Key**
- **Where to get**: Contact Redpill AI support or check your account dashboard
- **Cost**: Depends on Redpill AI pricing
- **Critical**: This is the main AI engine

#### **Google Search API (Free Option)**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "Custom Search API"
4. Create credentials → API Key
5. Create Custom Search Engine at [Google CSE](https://cse.google.com/)
6. **Free tier**: 100 searches/day

#### **CoinGecko API (Free Option)**
1. Go to [CoinGecko API](https://www.coingecko.com/en/api)
2. Sign up for free account
3. Get API key from dashboard
4. **Free tier**: 30 calls/minute

### Step 3: Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

## 🧪 **Testing Your Setup**

### Test 1: Check API Key Detection
Open browser console and type in AI chat:
```
"market research of Anthropic"
```

**Look for these logs:**
```
✅ Initializing VC Assistant: { hasApiKey: true }
🔍 Chat input analysis: { isLikelyResearch: true }
🤖 VCAssistant.chat called
🔬 Conducting deep research for: "market research of Anthropic Dashboard"
```

### Test 2: Search API Test
Check console for search errors:
```
❌ Search request failed for query: [query] Error: Google Search API not configured
```

## 🎯 **Expected Behavior After Setup**

### ✅ **With API Keys (Should Work)**
1. **AI Chat**: Real responses from Redpill AI
2. **Research Progress**: Blue progress box with live steps
3. **Live Search**: Recent data from Google Search
4. **Market Data**: Real crypto prices from CoinGecko

### ❌ **Without API Keys (Current State)**
1. **AI Chat**: "Technical difficulties" error message  
2. **Research**: No progress display
3. **Search**: Mock data with 2024 timestamps
4. **Market Data**: Fallback analysis only

## 🚀 **Quick Free Setup**

If you want to test immediately:

### **Free Option 1: Mock Mode (No APIs)**
The system should still show research progress with mock data, but it's not working due to other issues.

### **Free Option 2: Minimal Setup**
1. **Skip Redpill AI** for now (will use fallback)
2. **Get Google Search API** (free tier)  
3. **Get CoinGecko API** (free tier)
4. Should enable live research with real data

## 🔧 **Troubleshooting**

### If still not working after adding keys:
1. **Check console logs** for specific error messages
2. **Verify API key format** (no extra spaces/quotes)
3. **Restart development server** completely
4. **Check API key permissions** and quotas

### Debug Commands:
```bash
# Check environment variables are loaded
console.log(process.env.NEXT_PUBLIC_REDPILL_API_KEY)

# Test if research triggers
# Should see "isLikelyResearch: true" in console
```

---

**The bottom line**: Your AI features need API keys to work. Without `NEXT_PUBLIC_REDPILL_API_KEY`, the AI chat will fail. Without `GOOGLE_SEARCH_API_KEY`, research will show old data instead of live results.