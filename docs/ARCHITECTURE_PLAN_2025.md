# REDPILL AI TERMINAL - TRUE AI-FIRST ARCHITECTURE
*December 2025 - Complete Redesign Based on Gemini CLI & Claude Code Principles*

## CURRENT STATUS: FAKE ARCHITECTURE IDENTIFIED ❌

**Problem**: Current "Claude Code" implementation is actually **MORE HARDCODED** than original system!

**Anti-Patterns Built**:
```python
# WRONG: Hardcoded pattern matching  
if "import" in keywords and "portfolio" in keywords:
    return CanonicalIntent(intent="portfolio_import")
```

**What Commands Fail**:
- "got 2 aave in my holding, delete them" 
- "today stock market review"
- Any natural language not matching rigid patterns

---

## TRUE AI-FIRST ARCHITECTURE (Gemini CLI Model)

### **Core Principle**: AI Reasons → Chooses Tools → Executes

```python
def process_command(user_input: str):
    system_prompt = """
    You are a financial CLI agent with access to these tools:
    - get_crypto_price(symbol): Get current crypto price
    - delete_holding(symbol, amount): Remove from portfolio  
    - market_review(): Get today's market overview
    - analyze_stock(ticker): Perform stock analysis
    
    User: {user_input}
    
    Reason about what the user wants and use appropriate tools.
    """
    
    return llm.generate_with_tools(system_prompt, available_tools)
```

### **1. CLI Layer (packages/cli)**
- **Purpose**: User interface, input/output, display
- **NO LOGIC**: Just passes commands to core

### **2. Core Layer (packages/core)**  
- **AI Agent**: Processes natural language with LLM
- **Tool Registry**: Self-describing financial tools
- **Conversation Management**: Maintains context

### **3. Financial Tools (packages/core/src/tools)**
- `portfolio_tools.py`: Holdings management
- `market_data_tools.py`: OpenBB integration  
- `analysis_tools.py`: Financial analysis
- `news_tools.py`: Market news & sentiment

---

## IMPLEMENTATION PLAN

### **Phase 1: Clean Slate**
- **DELETE**: `intent_parser.py` (hardcoded patterns)
- **DELETE**: `tool_contracts.py` (over-engineered) 
- **ARCHIVE**: All fake "Claude Code" files
- **CREATE**: True AI-first agent system

### **Phase 2: AI Agent Core**
```python
class FinancialAgent:
    def __init__(self):
        self.llm = get_llm_client()  # Multi-provider support
        self.tools = ToolRegistry()
        self.conversation = ConversationManager()
    
    def process_command(self, user_input: str) -> Response:
        # Let AI reason and choose tools
        system_prompt = self._build_system_prompt()
        return self.llm.generate_with_tools(
            system_prompt + f"\nUser: {user_input}",
            self.tools.get_available_tools()
        )
```

### **Phase 3: Financial Tool Integration**
```python
@tool(description="Remove holdings from portfolio")
def delete_holding(symbol: str, amount: float) -> str:
    # Real portfolio management
    return portfolio_service.remove(symbol, amount)

@tool(description="Get today's market review")  
def market_review() -> str:
    # OpenBB + news integration
    market_data = openbb.market_overview()
    news = exa_ai.get_market_news()
    return ai_summarize(market_data, news)
```

---

## SUCCESS CRITERIA

**These commands MUST work naturally**:
✅ "got 2 aave in my holding, delete them"  
✅ "today stock market review"  
✅ "what's bitcoin doing?"  
✅ "analyze Tesla fundamentals"  
✅ "import my portfolio from /path/file.csv"

**Architecture Principles**:
✅ AI decides tool usage (no hardcoded patterns)  
✅ Self-describing tools with schemas  
✅ Conversation context maintained  
✅ Multi-LLM provider support  
✅ Graceful degradation when tools fail

---

## FILES TO ARCHIVE

**Fake "Claude Code" Implementation**:
- `backend/app/core/intent_parser.py`
- `backend/app/core/tool_contracts.py` 
- `backend/app/core/tool_definitions.py`
- `backend/app/core/tool_executor.py`

**Reason**: These implement hardcoded pattern matching, not true AI reasoning.

**Keep**:
- `backend/app/api/claude_code_terminal.py` (will be refactored)
- Multi-LLM provider system (already good)
- OpenBB service integration (already good)