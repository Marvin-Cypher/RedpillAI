"""
OpenBB Tool Executor - Dynamic execution of ALL OpenBB functions via AI
Enables AI to call any of the 350+ OpenBB functions dynamically
"""

import os
import sys
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import pandas as pd
import json

# Add OpenBB to path
sys.path.append('/Users/marvin/redpill-project/openbb-source/openbb_platform')

try:
    from openbb import obb
    OPENBB_AVAILABLE = True
except ImportError:
    logging.warning("OpenBB not available for dynamic execution")
    OPENBB_AVAILABLE = False

from .openbb_tool_registry import OpenBBToolRegistry, OpenBBTool
from .creation_recorder import creation_recorder, CreationType

logger = logging.getLogger(__name__)


class OpenBBToolExecutor:
    """
    Dynamic executor for OpenBB tools
    Translates AI tool calls into actual OpenBB API calls
    """
    
    def __init__(self):
        self.registry = OpenBBToolRegistry()
        self._configure_credentials()
        logger.info(f"✅ OpenBB Tool Executor initialized with {len(self.registry.tools)} tools")
    
    def _configure_credentials(self):
        """Configure OpenBB API credentials"""
        if not OPENBB_AVAILABLE:
            return
        
        try:
            # Set credentials from environment
            if polygon_key := os.getenv("POLYGON_API_KEY"):
                obb.account.credentials.polygon_api_key = polygon_key
            if fmp_key := os.getenv("FMP_API_KEY"):
                obb.account.credentials.fmp_api_key = fmp_key
            if av_key := os.getenv("ALPHA_VANTAGE_API_KEY"):
                obb.account.credentials.alpha_vantage_api_key = av_key
            if fred_key := os.getenv("FRED_API_KEY"):
                obb.account.credentials.fred_api_key = fred_key
            
            logger.info("✅ OpenBB credentials configured")
        except Exception as e:
            logger.warning(f"Credential configuration issue: {e}")
    
    async def execute_tool(self, tool_name: str, parameters: Dict[str, Any], user_id: str = "default") -> Dict[str, Any]:
        """
        Execute an OpenBB tool by name with parameters
        
        Args:
            tool_name: Name of the tool from registry
            parameters: Tool parameters from AI
            user_id: User ID for creation recording
            
        Returns:
            Execution result with data or error
        """
        
        if not OPENBB_AVAILABLE:
            return {
                "success": False,
                "error": "OpenBB not available",
                "message": "OpenBB Platform is not properly installed"
            }
        
        # Get tool definition
        tool = self.registry.get_tool_definition(tool_name)
        if not tool:
            return {
                "success": False,
                "error": f"Tool '{tool_name}' not found",
                "available_tools": list(self.registry.tools.keys())[:10]
            }
        
        try:
            # Execute based on module path
            result = await self._execute_openbb_function(tool, parameters)
            
            # Record this as a creation for Investment CRM
            creation_type = self._determine_creation_type(tool, parameters, result)
            creation_id = await creation_recorder.record_data_creation(
                user_id=user_id,
                openbb_tool=tool_name,
                parameters=parameters,
                result_data=result,
                creation_type=creation_type
            )
            
            return {
                "success": True,
                "tool": tool_name,
                "category": tool.category,
                "data": result,
                "creation_id": creation_id,  # Track creation for CRM
                "metadata": {
                    "module": tool.module_path,
                    "timestamp": datetime.now().isoformat(),
                    "recorded_as_creation": True
                }
            }
            
        except Exception as e:
            logger.error(f"Tool execution error for {tool_name}: {e}")
            return {
                "success": False,
                "error": str(e),
                "tool": tool_name,
                "parameters": parameters
            }
    
    async def _execute_openbb_function(self, tool: OpenBBTool, params: Dict[str, Any]) -> Any:
        """
        Execute the actual OpenBB function based on module path
        
        This dynamically constructs the OpenBB API call from the module path
        e.g., "equity.price.historical" → obb.equity.price.historical()
        """
        
        # Parse module path
        parts = tool.module_path.split('.')
        
        # Navigate to the correct OpenBB module
        current_module = obb
        for part in parts:
            if hasattr(current_module, part):
                current_module = getattr(current_module, part)
            else:
                raise ValueError(f"OpenBB module path not found: {tool.module_path}")
        
        # Clean parameters - remove None values and set defaults
        clean_params = {}
        for key, value in params.items():
            if value is not None:
                clean_params[key] = value
        
        # Add default parameters if not provided
        for param_name, param_spec in tool.parameters.items():
            if param_name not in clean_params and "default" in param_spec:
                clean_params[param_name] = param_spec["default"]
        
        # Special handling for date parameters
        if "start_date" in clean_params and not clean_params.get("start_date"):
            # Default to 1 year ago
            clean_params["start_date"] = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        
        if "end_date" in clean_params and not clean_params.get("end_date"):
            # Default to today
            clean_params["end_date"] = datetime.now().strftime("%Y-%m-%d")
        
        # Execute the OpenBB function
        logger.info(f"Executing OpenBB: {tool.module_path}({clean_params})")
        
        # Call the function
        result = current_module(**clean_params)
        
        # Process the result based on type
        if hasattr(result, 'to_dataframe'):
            # Convert OBBject to DataFrame
            df = result.to_dataframe()
            return self._dataframe_to_dict(df)
        elif hasattr(result, 'results'):
            # Extract results from OBBject
            return self._process_obb_results(result.results)
        elif isinstance(result, pd.DataFrame):
            # Direct DataFrame result
            return self._dataframe_to_dict(result)
        else:
            # Raw result
            return result
    
    def _dataframe_to_dict(self, df: pd.DataFrame, max_rows: int = 100) -> Dict[str, Any]:
        """Convert DataFrame to dictionary for JSON serialization"""
        
        # Limit rows for large datasets
        if len(df) > max_rows:
            df = df.head(max_rows)
            truncated = True
        else:
            truncated = False
        
        # Convert to dictionary
        data = {
            "columns": df.columns.tolist(),
            "data": df.to_dict('records'),
            "shape": list(df.shape),
            "truncated": truncated
        }
        
        # Add summary statistics for numeric columns
        numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns
        if len(numeric_cols) > 0:
            data["summary"] = df[numeric_cols].describe().to_dict()
        
        return data
    
    def _process_obb_results(self, results: Any) -> Any:
        """Process OBBject results into serializable format"""
        
        if isinstance(results, list):
            # Process list of results
            processed = []
            for item in results[:100]:  # Limit to 100 items
                if hasattr(item, '__dict__'):
                    processed.append(item.__dict__)
                else:
                    processed.append(str(item))
            return processed
        elif hasattr(results, '__dict__'):
            # Single result object
            return results.__dict__
        else:
            # Raw result
            return results
    
    async def execute_multiple_tools(self, tool_calls: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Execute multiple tools in sequence
        
        Args:
            tool_calls: List of {"tool": "tool_name", "parameters": {...}}
            
        Returns:
            List of execution results
        """
        
        results = []
        for call in tool_calls:
            result = await self.execute_tool(call["tool"], call.get("parameters", {}))
            results.append(result)
        
        return results
    
    def get_available_tools(self, category: Optional[str] = None) -> List[str]:
        """Get list of available tool names"""
        
        if category:
            tools = self.registry.get_tools_by_category(category)
            return [tool.name for tool in tools]
        else:
            return list(self.registry.tools.keys())
    
    def get_tool_categories(self) -> Dict[str, int]:
        """Get all categories with tool counts"""
        return self.registry.get_tool_count_by_category()
    
    def search_tools(self, query: str) -> List[Dict[str, str]]:
        """Search for tools by keyword"""
        
        query_lower = query.lower()
        matches = []
        
        for tool_name, tool in self.registry.tools.items():
            if (query_lower in tool.name.lower() or
                query_lower in tool.description.lower() or
                query_lower in tool.category.lower()):
                
                matches.append({
                    "name": tool.name,
                    "description": tool.description,
                    "category": tool.category,
                    "module": tool.module_path
                })
        
        return matches
    
    async def get_market_overview(self) -> Dict[str, Any]:
        """
        Composite function that calls multiple tools for market overview
        """
        
        overview = {
            "timestamp": datetime.now().isoformat(),
            "indices": {},
            "movers": {},
            "sectors": {}
        }
        
        # Get major indices
        for symbol in ["SPY", "QQQ", "DIA"]:
            result = await self.execute_tool("get_stock_quote", {"symbol": symbol})
            if result["success"]:
                overview["indices"][symbol] = result["data"]
        
        # Get market movers
        gainers = await self.execute_tool("get_top_gainers", {"limit": 5})
        if gainers["success"]:
            overview["movers"]["gainers"] = gainers["data"]
        
        losers = await self.execute_tool("get_top_losers", {"limit": 5})
        if losers["success"]:
            overview["movers"]["losers"] = losers["data"]
        
        active = await self.execute_tool("get_most_active", {"limit": 5})
        if active["success"]:
            overview["movers"]["active"] = active["data"]
        
        return overview
    
    async def analyze_stock(self, symbol: str) -> Dict[str, Any]:
        """
        Comprehensive stock analysis using multiple tools
        """
        
        analysis = {
            "symbol": symbol,
            "timestamp": datetime.now().isoformat()
        }
        
        # Get price data
        quote = await self.execute_tool("get_stock_quote", {"symbol": symbol})
        if quote["success"]:
            analysis["current_price"] = quote["data"]
        
        # Get company profile
        profile = await self.execute_tool("get_company_profile", {"symbol": symbol})
        if profile["success"]:
            analysis["profile"] = profile["data"]
        
        # Get fundamentals
        income = await self.execute_tool("get_income_statement", {
            "symbol": symbol,
            "period": "annual",
            "limit": 1
        })
        if income["success"]:
            analysis["income_statement"] = income["data"]
        
        ratios = await self.execute_tool("get_financial_ratios", {
            "symbol": symbol,
            "period": "annual",
            "limit": 1
        })
        if ratios["success"]:
            analysis["ratios"] = ratios["data"]
        
        # Get recent news
        news = await self.execute_tool("get_company_news", {
            "symbol": symbol,
            "limit": 5
        })
        if news["success"]:
            analysis["recent_news"] = news["data"]
        
        return analysis
    
    def _determine_creation_type(self, tool: OpenBBTool, parameters: Dict, result: Any) -> CreationType:
        """Determine the type of creation based on tool and result"""
        
        tool_name_lower = tool.name.lower()
        
        # Chart-related tools
        if "chart" in tool_name_lower or "price_history" in tool_name_lower:
            return CreationType.CHART
        
        # Fundamental analysis
        elif any(word in tool_name_lower for word in ["income", "balance", "cash", "ratios", "fundamental"]):
            return CreationType.FUNDAMENTALS
        
        # Technical analysis
        elif any(word in tool_name_lower for word in ["rsi", "macd", "sma", "technical", "indicator"]):
            return CreationType.TECHNICAL
        
        # Options analysis
        elif any(word in tool_name_lower for word in ["option", "chain", "unusual"]):
            return CreationType.OPTIONS
        
        # Economic data
        elif any(word in tool_name_lower for word in ["economy", "gdp", "inflation", "rate", "fred"]):
            return CreationType.ECONOMIC
        
        # News and events
        elif any(word in tool_name_lower for word in ["news", "earnings", "calendar"]):
            return CreationType.NEWS
        
        # Screening and discovery
        elif any(word in tool_name_lower for word in ["screen", "gainer", "loser", "active", "discover"]):
            return CreationType.SCREEN
        
        # Default to table for data tools
        else:
            return CreationType.TABLE


# Singleton instance
openbb_executor = OpenBBToolExecutor()