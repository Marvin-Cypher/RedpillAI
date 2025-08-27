# ARCHIVED: Fake "Claude Code" Implementation

**Date**: December 2025  
**Reason**: These files implemented hardcoded pattern matching disguised as "Claude Code" architecture.

## Files Archived

- `intent_parser.py` - Regex-based pattern matching (anti-pattern)
- `tool_contracts.py` - Over-engineered contract system  
- `tool_definitions.py` - Hardcoded tool patterns
- `tool_executor.py` - Complex executor that missed the point

## What Was Wrong

These files created a **MORE HARDCODED** system than what we started with:

```python
# WRONG: Hardcoded patterns pretending to be "Claude Code"
keywords=[\"import\", \"portfolio\", \"from\"],
entity_patterns={\"file_path\": r'(/[^\\s]+\\.(?:csv|json|xlsx?))'}
```

**Failed Commands**:
- "got 2 aave in my holding, delete them" 
- "today stock market review"
- Any natural language not matching rigid patterns

## True Claude Code Principle

AI should **reason first**, then choose tools:

```python
# CORRECT: AI-first reasoning
system_prompt = f\"\"\"
User: {user_input}
Available tools: {tools}
Reason about what the user wants and use appropriate tools.
\"\"\"
ai_response = llm.generate_with_tools(system_prompt, tools)
```

**Lesson**: Don't fake architectural patterns. Build the real thing.