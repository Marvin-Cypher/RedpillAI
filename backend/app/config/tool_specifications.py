"""
Tool Specifications for AI-First Terminal
Declarative tool definitions with JSON schemas and routing logic
"""

from typing import Dict, Any, List
from pydantic import BaseModel
from enum import Enum
import json

class ToolOutputFormat(str, Enum):
    TEXT = "text"
    CHART = "chart"
    FILE = "file"
    GUI = "gui"

class ToolSpec(BaseModel):
    """Tool specification with schema and metadata"""
    name: str
    purpose: str
    input_schema: Dict[str, Any]
    output_format: ToolOutputFormat
    errors: List[str]
    notes: str

class ToolRegistry:
    """Central registry of all available tools"""
    
    def __init__(self):
        self.tools = self._define_tools()
    
    def _define_tools(self) -> Dict[str, ToolSpec]:
        """Define all tool specifications"""
        
        return {
            "tool.openbb_research": ToolSpec(
                name="tool.openbb_research",
                purpose="Execute OpenBB research queries with AI routing",
                input_schema={
                    "query": {"type": "string", "required": True, "description": "Natural language research request"},
                    "universe": {"type": "string", "enum": ["equity", "crypto", "economy", "derivatives"], "description": "Data universe"},
                    "depth": {"type": "string", "enum": ["basic", "detailed", "comprehensive"], "default": "basic"}
                },
                output_format=ToolOutputFormat.TEXT,
                errors=["OPENBB_API_ERROR", "INVALID_QUERY", "DATA_UNAVAILABLE"],
                notes="Use for tokens & equities; auto-route data vendor"
            ),
            
            "tool.deals_crud": ToolSpec(
                name="tool.deals_crud",
                purpose="Create, read, update deal records",
                input_schema={
                    "action": {"type": "string", "required": True, "enum": ["create", "read", "update", "delete"]},
                    "deal_data": {"type": "object", "description": "Deal data for create/update operations"},
                    "filters": {"type": "object", "description": "Filter criteria for read operations"}
                },
                output_format=ToolOutputFormat.TEXT,
                errors=["VALIDATION_ERROR", "DB_CONNECTION_ERROR"],
                notes="Full CRUD operations for deal management"
            ),
            
            "tool.investment_create": ToolSpec(
                name="tool.investment_create",
                purpose="Parse and create investment records",
                input_schema={
                    "company": {"type": "string", "required": True, "description": "Company name or ticker"},
                    "amount": {"type": "string", "required": True, "description": "Investment amount (supports k/m suffixes)"},
                    "date": {"type": "string", "description": "Investment date (ISO format)"},
                    "price_per_token": {"type": "number", "description": "For crypto investments"}
                },
                output_format=ToolOutputFormat.TEXT,
                errors=["COMPANY_NOT_FOUND", "INVALID_AMOUNT", "PARSING_ERROR"],
                notes="Smart parsing of investment commands with natural language amounts"
            ),
            
            "tool.backend_control": ToolSpec(
                name="tool.backend_control",
                purpose="Control backend services and system operations",
                input_schema={
                    "action": {"type": "string", "required": True, "enum": ["start", "stop", "status", "restart"]},
                    "service": {"type": "string", "enum": ["backend", "database", "all"], "default": "backend"}
                },
                output_format=ToolOutputFormat.TEXT,
                errors=["SERVICE_ERROR", "PERMISSION_DENIED"],
                notes="System control operations with safety checks"
            ),
            
            "tool.portfolio_aggregate": ToolSpec(
                name="tool.portfolio_aggregate",
                purpose="Aggregate and calculate portfolio metrics",
                input_schema={
                    "timeframe": {"type": "object", "description": "Time range for analysis"},
                    "include_unrealized": {"type": "boolean", "default": True},
                    "grouping": {"type": "string", "enum": ["sector", "stage", "geography"], "description": "Grouping criteria"}
                },
                output_format=ToolOutputFormat.TEXT,
                errors=["NO_DATA_AVAILABLE", "CALCULATION_ERROR"],
                notes="Real-time portfolio analysis with multiple metrics"
            ),
            
            "tool.companies_fetch": ToolSpec(
                name="tool.companies_fetch",
                purpose="Fetch and filter company data",
                input_schema={
                    "filters": {"type": "object", "description": "Company filter criteria"},
                    "sort_by": {"type": "string", "enum": ["name", "sector", "stage", "valuation"], "default": "name"},
                    "limit": {"type": "integer", "default": 50}
                },
                output_format=ToolOutputFormat.TEXT,
                errors=["DATABASE_ERROR", "INVALID_FILTER"],
                notes="Comprehensive company database access with intelligent filtering"
            ),
            
            "tool.api_status": ToolSpec(
                name="tool.api_status",
                purpose="Check API key configuration and connectivity",
                input_schema={
                    "service": {"type": "string", "description": "Specific service to check"},
                    "test_connection": {"type": "boolean", "default": False}
                },
                output_format=ToolOutputFormat.TEXT,
                errors=["API_KEY_MISSING", "CONNECTION_FAILED"],
                notes="Secure API key validation with masked output"
            ),
            
            "tool.chart_spec": ToolSpec(
                name="tool.chart_spec",
                purpose="Generate chart specifications for visualization",
                input_schema={
                    "chart_type": {"type": "string", "enum": ["line", "bar", "scatter", "candlestick"], "required": True},
                    "data_series": {"type": "array", "required": True, "description": "Data series for plotting"},
                    "title": {"type": "string", "description": "Chart title"},
                    "x_axis": {"type": "string", "description": "X-axis label"},
                    "y_axis": {"type": "string", "description": "Y-axis label"}
                },
                output_format=ToolOutputFormat.CHART,
                errors=["INVALID_DATA", "CHART_GENERATION_FAILED"],
                notes="Creates standardized chart specifications for frontend rendering"
            ),
            
            "tool.news_summarize": ToolSpec(
                name="tool.news_summarize",
                purpose="Summarize and analyze news content",
                input_schema={
                    "sources": {"type": "array", "description": "News sources or URLs"},
                    "topics": {"type": "array", "description": "Topics to focus on"},
                    "sentiment": {"type": "boolean", "default": True, "description": "Include sentiment analysis"}
                },
                output_format=ToolOutputFormat.TEXT,
                errors=["SOURCE_UNAVAILABLE", "ANALYSIS_FAILED"],
                notes="AI-powered news analysis with sentiment scoring"
            ),
            
            "tool.csv_ingest": ToolSpec(
                name="tool.csv_ingest",
                purpose="Ingest and parse CSV files for portfolio import",
                input_schema={
                    "file_path": {"type": "string", "required": True, "description": "Path to CSV file"},
                    "mapping": {"type": "object", "description": "Column mapping configuration"},
                    "validate": {"type": "boolean", "default": True}
                },
                output_format=ToolOutputFormat.FILE,
                errors=["FILE_NOT_FOUND", "PARSING_ERROR", "VALIDATION_FAILED"],
                notes="Smart CSV parsing with auto-detection of portfolio formats"
            ),
            
            "tool.notion_import": ToolSpec(
                name="tool.notion_import",
                purpose="Import data from Notion databases",
                input_schema={
                    "database_id": {"type": "string", "required": True, "description": "Notion database UUID"},
                    "api_key": {"type": "string", "required": True, "description": "Notion API key"},
                    "mapping": {"type": "object", "description": "Field mapping configuration"}
                },
                output_format=ToolOutputFormat.FILE,
                errors=["NOTION_API_ERROR", "DATABASE_NOT_FOUND", "PERMISSION_DENIED"],
                notes="Direct Notion API integration with field mapping"
            )
        }
    
    def get_tool(self, tool_name: str) -> ToolSpec:
        """Get tool specification by name"""
        return self.tools.get(tool_name)
    
    def get_tools_by_output_format(self, output_format: ToolOutputFormat) -> List[ToolSpec]:
        """Get all tools that produce a specific output format"""
        return [tool for tool in self.tools.values() if tool.output_format == output_format]
    
    def validate_tool_input(self, tool_name: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate input data against tool schema"""
        tool = self.get_tool(tool_name)
        if not tool:
            return {"valid": False, "error": f"Tool {tool_name} not found"}
        
        schema = tool.input_schema
        validation_errors = []
        
        # Check required fields
        for field, spec in schema.items():
            if spec.get("required", False) and field not in input_data:
                validation_errors.append(f"Missing required field: {field}")
        
        # Check enum values
        for field, value in input_data.items():
            if field in schema and "enum" in schema[field]:
                if value not in schema[field]["enum"]:
                    validation_errors.append(f"Invalid value for {field}: {value}")
        
        if validation_errors:
            return {"valid": False, "errors": validation_errors}
        else:
            return {"valid": True}
    
    def get_tool_suggestions(self, intent: str) -> List[str]:
        """Get tool suggestions based on intent"""
        intent_lower = intent.lower()
        
        suggestions = []
        for tool_name, tool_spec in self.tools.items():
            # Simple keyword matching
            if any(keyword in intent_lower for keyword in tool_spec.purpose.lower().split()):
                suggestions.append(tool_name)
        
        return suggestions[:3]  # Return top 3 suggestions

# Global tool registry instance
tool_registry = ToolRegistry()

# Intent to Tool Router Configuration
INTENT_ROUTER_TABLE = {
    "import_portfolio": {
        "primary": "tool.notion_import",
        "secondary": ["tool.csv_ingest"],
        "confidence_threshold": 0.8
    },
    "generate_research": {
        "primary": "tool.openbb_research",
        "secondary": ["tool.news_summarize"],
        "confidence_threshold": 0.7
    },
    "chart_company": {
        "primary": "tool.openbb_research",
        "secondary": ["tool.chart_spec"],
        "confidence_threshold": 0.8
    },
    "chart_token_compare": {
        "primary": "tool.openbb_research",
        "secondary": ["tool.chart_spec"],
        "confidence_threshold": 0.8
    },
    "daily_digest": {
        "primary": "tool.news_summarize",
        "secondary": ["tool.openbb_research"],
        "confidence_threshold": 0.7
    },
    "monitor_dashboard": {
        "primary": "tool.chart_spec",
        "secondary": ["tool.api_status"],
        "confidence_threshold": 0.8
    },
    "deal_management": {
        "primary": "tool.deals_crud",
        "secondary": [],
        "confidence_threshold": 0.8
    },
    "company_analysis": {
        "primary": "tool.companies_fetch",
        "secondary": ["tool.openbb_research"],
        "confidence_threshold": 0.7
    },
    "portfolio_overview": {
        "primary": "tool.portfolio_aggregate",
        "secondary": [],
        "confidence_threshold": 0.8
    },
    "investment_execution": {
        "primary": "tool.investment_create",
        "secondary": ["tool.deals_crud"],
        "confidence_threshold": 0.8
    },
    "system_control": {
        "primary": "tool.backend_control",
        "secondary": ["tool.api_status"],
        "confidence_threshold": 0.9
    }
}

# Few-shot examples for intent classification
INTENT_EXAMPLES = [
    {
        "user_input": "i invested polkadot 100k in 2022, with $6 per token",
        "intent": "investment_execution",
        "entities": {
            "companies": ["polkadot"],
            "amount": "100k",
            "price_per_token": 6.0
        },
        "confidence": 0.92,
        "expected_output": "✅ Created investment: $100,000 in Polkadot (2022) at $6/token"
    },
    {
        "user_input": "start backend",
        "intent": "system_control",
        "entities": {
            "action": "start",
            "service": "backend"
        },
        "confidence": 0.98,
        "expected_output": "🚀 Backend started on port 8000"
    },
    {
        "user_input": "portfolio",
        "intent": "portfolio_overview",
        "entities": {},
        "confidence": 0.95,
        "expected_output": "Portfolio summary with total value, top holdings, P&L"
    },
    {
        "user_input": "analyze Tesla fundamentals",
        "intent": "company_analysis",
        "entities": {
            "companies": ["Tesla"],
            "metrics": ["fundamentals"]
        },
        "confidence": 0.89,
        "expected_output": "Financial metrics, ratios, recent performance analysis"
    },
    {
        "user_input": "what's happening with Solana L2s",
        "intent": "generate_research",
        "entities": {
            "topic": "Solana L2s",
            "universe": "crypto"
        },
        "confidence": 0.86,
        "expected_output": "Research report on Solana L2 ecosystem developments"
    },
    {
        "user_input": "show all series A deals",
        "intent": "deal_management",
        "entities": {
            "deals": ["series_a"],
            "action": "read"
        },
        "confidence": 0.91,
        "expected_output": "List of Series A investments with valuations and dates"
    }
]

def get_intent_examples_prompt() -> str:
    """Generate few-shot examples prompt for AI intent classification"""
    examples_text = ""
    
    for example in INTENT_EXAMPLES:
        examples_text += f"""
User: "{example['user_input']}"
Intent: {{
  "intent": "{example['intent']}",
  "entities": {json.dumps(example['entities'])},
  "confidence": {example['confidence']}
}}
Expected: {example['expected_output']}

"""
    
    return examples_text