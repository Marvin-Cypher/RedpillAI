# RedPill AI Terminal - Unified Intelligence Services

## Overview
This directory contains the core intelligence services that power RedPill AI Terminal's unified memory and context-aware capabilities.

## Key Services

### 🧠 `unified_chroma_service.py`
**Unified ChromaDB Intelligence System**
- **Purpose**: Complete AI memory system with semantic search capabilities
- **Collections**: 11 specialized collections for different data types
- **Features**: 
  - Tenant/workspace isolation for multi-user support
  - Entity extraction and storage from conversations
  - Portfolio-aware context retrieval
  - Semantic search across all user data
  - Conversation memory persistence

**Key Methods**:
- `store_document()` - Store documents in specialized collections
- `semantic_search()` - Context-aware retrieval with filters
- `get_portfolio_context()` - Portfolio intelligence for AI responses
- `store_conversation_with_context()` - Enhanced conversation storage

### 💬 `chroma_memory_service.py` 
**Legacy Conversation Memory Service**
- **Purpose**: Original conversation memory implementation
- **Status**: Maintained for compatibility, enhanced by unified service
- **Features**: Basic conversation storage and retrieval

### 🤖 `ai_service.py`
**AI Processing Service**
- **Purpose**: Multi-provider AI integration (OpenAI, Redpill AI)
- **Features**: Function calling, conversation management, response processing

### 📊 `market_data_service.py`
**Market Data Integration**
- **Purpose**: Multi-source market data aggregation
- **Sources**: OpenBB Platform, CoinGecko, Yahoo Finance
- **Features**: Real-time quotes, indices, crypto prices

### 🔍 `exa_service.py`
**Internet Research Service**
- **Purpose**: AI-powered web research and news aggregation
- **Features**: Semantic news search, research synthesis

## ChromaDB Collections Architecture

### Core Collections
1. **`user_conversations`** - All chat history with entity extraction
2. **`portfolio_memory`** - Holdings, watchlists, tracked symbols
3. **`company_profiles`** - Company data, fundamentals, analysis
4. **`research_reports`** - Research memos, analysis, insights
5. **`market_intelligence`** - OpenBB data, trends, sentiment

### Extended Collections
6. **`founder_profiles`** - Founder profiles, bios, connections
7. **`meeting_memory`** - Meeting notes, action items, decisions
8. **`dealroom_data`** - Deal-specific documents, DD materials
9. **`fund_performance`** - Fund metrics, benchmarks, analysis
10. **`imported_data`** - CSV imports, Excel files, data uploads
11. **`action_items`** - Generated tasks, reminders, follow-ups

## Integration Architecture

```python
# Core Integration Pattern
unified_memory = unified_chroma_service

# Store conversation with entities
await unified_memory.store_conversation_with_context(
    user_input="track NVDA and TSLA for my AI portfolio",
    assistant_response=response,
    entities={"symbols": ["NVDA", "TSLA"], "sectors": ["AI", "Technology"]},
    metadata={"tools_used": ["portfolio_add"], "success": True}
)

# Retrieve portfolio-aware context
context = await unified_memory.get_portfolio_context(
    tenant_id="user123",
    query="my tracking companies"
)

# Semantic search across conversations
memories = await unified_memory.semantic_search(
    "user_conversations",
    "crypto investments Bitcoin Ethereum",
    tenant_id="user123"
)
```

## Key Features

### 🎯 Portfolio Intelligence
- Remembers tracked companies across CLI sessions
- Intelligent pronoun resolution ("them" = previously mentioned symbols)
- Context-aware responses prioritizing user's holdings

### 🔍 Semantic Memory
- Vector embeddings for intelligent context retrieval  
- Cross-collection entity linking
- Conversation history with full context

### 🏗️ Multi-Tenant Architecture
- Workspace isolation for multiple users
- Secure tenant-based data separation
- Scalable for team/organization use

### 🚀 AI-First Integration
- Automatic entity extraction from conversations
- Context-aware function calling
- Multi-step workflow execution

## Storage Location
ChromaDB persistence: `~/.redpill/unified_memory/`

## Testing
Comprehensive test suite: `backend/tests/test_unified_chroma_intelligence.py`
- 15-point test plan covering all intelligence features
- Tenant isolation validation
- Portfolio awareness testing
- Memory persistence verification

## Performance
- **Fast retrieval**: Vector-based semantic search
- **Scalable**: Handles thousands of documents per collection
- **Efficient**: Optimized for real-time AI responses
- **Persistent**: Full conversation memory across sessions

This unified intelligence system achieves **Claude Code level intelligence** with persistent memory, context awareness, and autonomous multi-step execution capabilities.