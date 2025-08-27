"""
Tool Contract Definitions - Claude Code Style

Defines self-describing contracts for all available tools.
Each tool contract specifies exactly what it does, what it needs, and what it returns.
"""

from .tool_contracts import (
    ToolContract, ToolExample, SideEffect, ErrorType, tool_registry
)


def register_all_tools():
    """Register all tool contracts in the global registry"""
    
    # Portfolio Import Tool
    portfolio_import_contract = ToolContract(
        name="portfolio_import",
        description="Import portfolio data from CSV or JSON files with validation and preview",
        category="portfolio",
        input_schema={
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Absolute path to the portfolio file",
                    "pattern": r"^/.+\.(csv|json|xlsx?)$"
                },
                "portfolio_type": {
                    "type": "string",
                    "enum": ["crypto", "stocks", "bonds", "mixed", "general"],
                    "default": "general",
                    "description": "Type of portfolio being imported"
                },
                "preview_only": {
                    "type": "boolean",
                    "default": False,
                    "description": "Whether to only preview without importing"
                }
            },
            "required": ["file_path"]
        },
        output_schema={
            "type": "object",
            "properties": {
                "import_status": {"type": "string", "enum": ["success", "preview", "failed"]},
                "records_processed": {"type": "integer", "minimum": 0},
                "preview_data": {"type": "array", "items": {"type": "object"}},
                "validation_errors": {"type": "array", "items": {"type": "string"}},
                "file_info": {
                    "type": "object",
                    "properties": {
                        "size_bytes": {"type": "integer"},
                        "format": {"type": "string"},
                        "columns": {"type": "array", "items": {"type": "string"}}
                    }
                }
            }
        },
        side_effects=[SideEffect.FILE_READ, SideEffect.DATABASE_WRITE],
        error_surface=[
            ErrorType.FILE_NOT_FOUND, 
            ErrorType.PERMISSION_DENIED,
            ErrorType.INVALID_FORMAT,
            ErrorType.VALIDATION_ERROR
        ],
        examples=[
            ToolExample(
                description="Successful CSV import",
                input={
                    "file_path": "/Users/user/portfolio.csv",
                    "portfolio_type": "crypto"
                },
                expected_output={
                    "import_status": "success",
                    "records_processed": 10,
                    "validation_errors": []
                }
            ),
            ToolExample(
                description="File not found error",
                input={
                    "file_path": "/nonexistent/file.csv"
                },
                expected_output={
                    "import_status": "failed",
                    "records_processed": 0,
                    "validation_errors": ["File not found"]
                },
                error_type=ErrorType.FILE_NOT_FOUND
            ),
            ToolExample(
                description="Preview mode",
                input={
                    "file_path": "/Users/user/data.csv",
                    "preview_only": True
                },
                expected_output={
                    "import_status": "preview",
                    "preview_data": [{"symbol": "BTC", "amount": "0.5"}],
                    "records_processed": 0
                }
            )
        ],
        timeout_seconds=60,
        requires_confirmation=False,
        confidence_threshold=0.8,
        executor_function="execute_portfolio_import"
    )
    
    # API Status Tool
    api_status_contract = ToolContract(
        name="api_status", 
        description="Check and display API key configuration status with setup guidance",
        category="system",
        input_schema={
            "type": "object",
            "properties": {
                "detailed": {
                    "type": "boolean",
                    "default": False,
                    "description": "Whether to show detailed configuration info"
                },
                "check_connectivity": {
                    "type": "boolean", 
                    "default": False,
                    "description": "Whether to test API connectivity"
                }
            }
        },
        output_schema={
            "type": "object",
            "properties": {
                "configured_count": {"type": "integer", "minimum": 0},
                "total_keys": {"type": "integer", "minimum": 0},
                "status_details": {"type": "array", "items": {"type": "string"}},
                "setup_guidance": {"type": "string"},
                "connectivity_results": {"type": "object"}
            }
        },
        side_effects=[],  # Read-only operation
        error_surface=[ErrorType.AUTHENTICATION_FAILED, ErrorType.NETWORK_ERROR],
        examples=[
            ToolExample(
                description="All APIs configured",
                input={},
                expected_output={
                    "configured_count": 3,
                    "total_keys": 3,
                    "status_details": [
                        "OPENAI_API_KEY: ✅ Configured",
                        "REDPILL_API_KEY: ✅ Configured", 
                        "COINGECKO_API_KEY: ✅ Configured"
                    ],
                    "setup_guidance": "✅ All API Keys Configured! Your system is ready to use."
                }
            ),
            ToolExample(
                description="Missing API keys",
                input={},
                expected_output={
                    "configured_count": 1,
                    "total_keys": 3,
                    "status_details": [
                        "OPENAI_API_KEY: ✅ Configured",
                        "REDPILL_API_KEY: ❌ Missing",
                        "COINGECKO_API_KEY: ❌ Missing"
                    ],
                    "setup_guidance": "🔑 **Partial Setup** (1/3 keys configured)\n\n**Still needed:**\n• REDPILL_API_KEY - Contact your admin\n• COINGECKO_API_KEY - Get from https://coingecko.com"
                }
            )
        ],
        timeout_seconds=10,
        requires_confirmation=False,
        confidence_threshold=0.9,
        executor_function="execute_api_status"
    )
    
    # Portfolio Overview Tool
    portfolio_overview_contract = ToolContract(
        name="portfolio_overview",
        description="Display portfolio summary with holdings, performance, and key metrics",
        category="portfolio", 
        input_schema={
            "type": "object",
            "properties": {
                "detail_level": {
                    "type": "string",
                    "enum": ["brief", "detailed", "summary"], 
                    "default": "summary",
                    "description": "Level of detail to include"
                },
                "include_performance": {
                    "type": "boolean",
                    "default": True,
                    "description": "Whether to include performance metrics"
                },
                "timeframe": {
                    "type": "string",
                    "enum": ["1d", "1w", "1m", "3m", "1y", "all"],
                    "default": "all",
                    "description": "Timeframe for performance calculation"
                }
            }
        },
        output_schema={
            "type": "object",
            "properties": {
                "total_invested": {"type": "number"},
                "current_value": {"type": "number"},
                "active_deals": {"type": "integer"},
                "holdings_count": {"type": "integer"},
                "top_holdings": {"type": "array", "items": {"type": "object"}},
                "performance": {"type": "object"}
            }
        },
        side_effects=[SideEffect.DATABASE_READ],
        error_surface=[ErrorType.NETWORK_ERROR],
        examples=[
            ToolExample(
                description="Standard portfolio overview",
                input={"detail_level": "summary"},
                expected_output={
                    "total_invested": 2300000,
                    "active_deals": 5,
                    "holdings_count": 5,
                    "top_holdings": [
                        {"name": "Polkadot", "amount": 10000},
                        {"name": "OpenAI", "amount": 1000}
                    ]
                }
            )
        ],
        timeout_seconds=30,
        requires_confirmation=False,
        confidence_threshold=0.8,
        executor_function="execute_portfolio_overview"
    )
    
    # Stock Price Tool
    stock_price_contract = ToolContract(
        name="stock_price",
        description="Fetch real-time stock or crypto prices with market data",
        category="market_data",
        input_schema={
            "type": "object", 
            "properties": {
                "tickers": {
                    "type": "array",
                    "items": {"type": "string", "pattern": "^[A-Z]{1,5}$"},
                    "description": "Stock ticker symbols"
                },
                "crypto_symbols": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Cryptocurrency symbols"
                },
                "include_extended_data": {
                    "type": "boolean",
                    "default": False,
                    "description": "Include volume, market cap, etc."
                }
            },
            "anyOf": [
                {"required": ["tickers"]},
                {"required": ["crypto_symbols"]}
            ]
        },
        output_schema={
            "type": "object",
            "properties": {
                "quotes": {"type": "array", "items": {"type": "object"}},
                "timestamp": {"type": "string", "format": "date-time"},
                "data_source": {"type": "string"}
            }
        },
        side_effects=[SideEffect.NETWORK_REQUEST],
        error_surface=[
            ErrorType.NETWORK_ERROR,
            ErrorType.API_LIMIT_EXCEEDED, 
            ErrorType.VALIDATION_ERROR
        ],
        examples=[
            ToolExample(
                description="Single stock quote",
                input={"tickers": ["AAPL"]},
                expected_output={
                    "quotes": [{
                        "symbol": "AAPL",
                        "price": 150.25,
                        "change": 2.5,
                        "change_percent": 1.69
                    }]
                }
            ),
            ToolExample(
                description="Multiple crypto quotes", 
                input={"crypto_symbols": ["BTC", "ETH"]},
                expected_output={
                    "quotes": [
                        {"symbol": "BTC", "price": 45000},
                        {"symbol": "ETH", "price": 3000}
                    ]
                }
            )
        ],
        timeout_seconds=20,
        requires_confirmation=False,
        confidence_threshold=0.8,
        executor_function="execute_stock_price"
    )
    
    # Help Tool
    help_contract = ToolContract(
        name="help",
        description="Display available commands, usage examples, and system information",
        category="system",
        input_schema={
            "type": "object",
            "properties": {
                "topic": {
                    "type": "string",
                    "enum": ["commands", "examples", "setup", "all"],
                    "default": "all",
                    "description": "Help topic to display"
                }
            }
        },
        output_schema={
            "type": "object",
            "properties": {
                "help_content": {"type": "string"},
                "available_commands": {"type": "array"},
                "examples": {"type": "array"}
            }
        },
        side_effects=[],
        error_surface=[],
        examples=[
            ToolExample(
                description="General help",
                input={},
                expected_output={
                    "help_content": "🚀 **Redpill AI Terminal Commands**...",
                    "available_commands": ["portfolio", "import", "price"],
                    "examples": ["portfolio overview", "import file.csv"]
                }
            )
        ],
        timeout_seconds=5,
        requires_confirmation=False,
        confidence_threshold=0.95,
        executor_function="execute_help"
    )
    
    # Register all contracts
    tool_registry.register_tool(portfolio_import_contract)
    tool_registry.register_tool(api_status_contract) 
    tool_registry.register_tool(portfolio_overview_contract)
    tool_registry.register_tool(stock_price_contract)
    tool_registry.register_tool(help_contract)


def get_tool_contract_summary() -> dict:
    """Get summary of all registered tool contracts"""
    return tool_registry.get_registry_summary()


def validate_all_contracts() -> dict:
    """Validate all registered contracts for completeness"""
    validation_results = {
        "total_contracts": len(tool_registry.tools),
        "valid_contracts": [],
        "invalid_contracts": [],
        "warnings": []
    }
    
    for name, contract in tool_registry.tools.items():
        issues = []
        
        # Check required fields
        if not contract.description:
            issues.append("Missing description")
        
        if not contract.examples:
            issues.append("No examples provided")
        
        if not contract.input_schema:
            issues.append("No input schema defined")
            
        if not contract.output_schema:
            issues.append("No output schema defined")
            
        if not contract.executor_function:
            issues.append("No executor function specified")
        
        # Check examples coverage
        error_examples = [ex for ex in contract.examples if ex.error_type]
        if contract.error_surface and not error_examples:
            validation_results["warnings"].append(f"{name}: Has error surface but no error examples")
        
        if issues:
            validation_results["invalid_contracts"].append({
                "name": name,
                "issues": issues
            })
        else:
            validation_results["valid_contracts"].append(name)
    
    return validation_results


# Register all tools when module is imported
register_all_tools()