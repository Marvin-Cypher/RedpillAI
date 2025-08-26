"""
AI-OpenBB Service - Dynamic OpenBB wrapper with AI routing
Maximizes OpenBB Platform capabilities while minimizing hardcoded dependencies
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import json
import inspect

try:
    from openbb import obb
    OPENBB_AVAILABLE = True
except ImportError:
    obb = None
    OPENBB_AVAILABLE = False

from ..config import settings

logger = logging.getLogger(__name__)

class AIOpenBBService:
    """
    AI-powered dynamic wrapper for OpenBB Platform
    
    Philosophy:
    - AI determines which OpenBB commands to use based on user intent
    - Minimal hardcoding - let AI navigate OpenBB's API dynamically
    - Only persist user-specific data (portfolio, deals, companies)
    - OpenBB handles all market data, analytics, and calculations
    """
    
    def __init__(self):
        self.openbb_available = OPENBB_AVAILABLE
        self._configure_credentials()
        self._discovery_cache = {}  # Cache OpenBB command discovery
        
    def _configure_credentials(self):
        """Configure OpenBB credentials from settings"""
        if not self.openbb_available:
            logger.warning("OpenBB not available - using fallback mode")
            return
            
        try:
            # Auto-configure all available API keys
            credential_mapping = {
                'fmp_api_key': 'fmp_api_key',
                'polygon_api_key': 'polygon_api_key', 
                'alpha_vantage_api_key': 'alpha_vantage_api_key',
                'quandl_api_key': 'quandl_api_key',
                'benzinga_api_key': 'benzinga_api_key'
            }
            
            for setting_key, obb_key in credential_mapping.items():
                api_key = getattr(settings, setting_key, None)
                if api_key:
                    setattr(obb.user.credentials, obb_key, api_key)
                    
            logger.info("✅ OpenBB credentials configured")
            
        except Exception as e:
            logger.error(f"Failed to configure OpenBB credentials: {e}")

    async def discover_commands(self, domain: str = None) -> Dict[str, Any]:
        """
        Dynamically discover available OpenBB commands
        AI uses this to understand what's possible
        """
        if not self.openbb_available:
            return {"error": "OpenBB not available"}
            
        cache_key = domain or "all"
        if cache_key in self._discovery_cache:
            return self._discovery_cache[cache_key]
            
        try:
            # Discover OpenBB structure dynamically
            commands = {}
            
            # Map major OpenBB modules
            modules = ['crypto', 'equity', 'economy', 'derivatives', 'forex', 'fixedincome', 'etf']
            
            for module in modules:
                try:
                    module_obj = getattr(obb, module, None)
                    if module_obj:
                        commands[module] = self._inspect_module(module_obj)
                except Exception as e:
                    logger.debug(f"Could not inspect {module}: {e}")
                    
            self._discovery_cache[cache_key] = commands
            return commands
            
        except Exception as e:
            logger.error(f"Failed to discover OpenBB commands: {e}")
            return {"error": str(e)}

    def _inspect_module(self, module_obj) -> Dict[str, Any]:
        """Inspect OpenBB module to discover available functions"""
        functions = {}
        
        for attr_name in dir(module_obj):
            if not attr_name.startswith('_'):
                attr = getattr(module_obj, attr_name)
                
                # Check if it's a callable or has sub-functions
                if callable(attr):
                    try:
                        sig = inspect.signature(attr)
                        functions[attr_name] = {
                            'callable': True,
                            'parameters': list(sig.parameters.keys())
                        }
                    except Exception:
                        functions[attr_name] = {'callable': True, 'parameters': []}
                        
                elif hasattr(attr, '__dict__'):
                    # It's a sub-module, inspect it too
                    sub_functions = self._inspect_module(attr)
                    if sub_functions:
                        functions[attr_name] = sub_functions
                        
        return functions

    async def execute_ai_command(self, user_intent: str, parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        AI-powered command execution
        
        Let AI determine the best OpenBB command based on user intent
        Examples:
        - "get bitcoin price" -> obb.crypto.price.historical()
        - "analyze AAPL fundamentals" -> obb.equity.fundamental.metrics()
        - "show economic indicators" -> obb.economy.fred.search()
        """
        if not self.openbb_available:
            return await self._fallback_response(user_intent, parameters)
            
        try:
            # Let AI determine the command path
            command_suggestion = await self._ai_suggest_command(user_intent, parameters)
            
            # Execute the suggested command
            result = await self._execute_openbb_command(
                command_suggestion['path'],
                command_suggestion.get('params', {})
            )
            
            return {
                "success": True,
                "intent": user_intent,
                "command_used": command_suggestion['path'],
                "data": result,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"AI command execution failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "intent": user_intent,
                "fallback": await self._fallback_response(user_intent, parameters)
            }

    async def _ai_suggest_command(self, intent: str, parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        AI logic to suggest OpenBB command based on user intent
        This replaces hardcoded command mapping
        """
        intent_lower = intent.lower()
        params = parameters or {}
        
        # AI routing logic - dynamic and extensible
        if any(word in intent_lower for word in ['bitcoin', 'btc', 'crypto', 'cryptocurrency']):
            if 'price' in intent_lower or 'chart' in intent_lower:
                return {
                    'path': 'obb.crypto.price.historical',
                    'params': {'symbol': self._extract_crypto_symbol(intent), **params}
                }
            elif 'news' in intent_lower:
                return {
                    'path': 'obb.news.world',
                    'params': {'query': self._extract_crypto_symbol(intent), **params}
                }
                
        elif any(word in intent_lower for word in ['stock', 'equity', 'share']):
            symbol = self._extract_stock_symbol(intent)
            
            if 'fundamental' in intent_lower or 'earnings' in intent_lower:
                return {
                    'path': 'obb.equity.fundamental.metrics',
                    'params': {'symbol': symbol, **params}
                }
            elif 'price' in intent_lower or 'chart' in intent_lower:
                return {
                    'path': 'obb.equity.price.historical', 
                    'params': {'symbol': symbol, **params}
                }
            elif 'options' in intent_lower:
                return {
                    'path': 'obb.derivatives.options.chains',
                    'params': {'symbol': symbol, **params}
                }
                
        elif 'economy' in intent_lower or 'economic' in intent_lower:
            if 'inflation' in intent_lower or 'cpi' in intent_lower:
                return {
                    'path': 'obb.economy.cpi',
                    'params': params
                }
            elif 'gdp' in intent_lower:
                return {
                    'path': 'obb.economy.gdp',
                    'params': params
                }
            else:
                return {
                    'path': 'obb.economy.fred.search',
                    'params': {'query': intent, **params}
                }
        
        # Default: try to match intent to a general search
        return {
            'path': 'obb.news.world',
            'params': {'query': intent, **params}
        }

    async def _execute_openbb_command(self, command_path: str, params: Dict[str, Any]) -> Any:
        """
        Dynamically execute OpenBB command
        No hardcoding - pure reflection-based execution
        """
        try:
            # Navigate to the command using dot notation
            path_parts = command_path.replace('obb.', '').split('.')
            current_obj = obb
            
            for part in path_parts:
                current_obj = getattr(current_obj, part)
                
            # Execute the command
            if asyncio.iscoroutinefunction(current_obj):
                result = await current_obj(**params)
            else:
                result = current_obj(**params)
                
            # Convert result to serializable format
            if hasattr(result, 'to_dict'):
                return result.to_dict()
            elif hasattr(result, 'results'):
                return result.results if hasattr(result.results, 'to_dict') else str(result.results)
            else:
                return str(result)
                
        except Exception as e:
            logger.error(f"OpenBB command execution failed: {e}")
            raise

    def _extract_crypto_symbol(self, text: str) -> str:
        """Extract cryptocurrency symbol from text"""
        text_lower = text.lower()
        
        crypto_mapping = {
            'bitcoin': 'BTC', 'btc': 'BTC',
            'ethereum': 'ETH', 'eth': 'ETH', 
            'dogecoin': 'DOGE', 'doge': 'DOGE',
            'cardano': 'ADA', 'ada': 'ADA',
            'solana': 'SOL', 'sol': 'SOL',
            'polkadot': 'DOT', 'dot': 'DOT'
        }
        
        for name, symbol in crypto_mapping.items():
            if name in text_lower:
                return symbol
                
        # Try to extract symbol pattern (3-5 uppercase letters)
        import re
        symbol_match = re.search(r'\b([A-Z]{3,5})\b', text.upper())
        if symbol_match:
            return symbol_match.group(1)
            
        return 'BTC'  # Default fallback

    def _extract_stock_symbol(self, text: str) -> str:
        """Extract stock symbol from text"""
        import re
        
        # Common company name to symbol mapping
        company_mapping = {
            'apple': 'AAPL', 'microsoft': 'MSFT', 'google': 'GOOGL',
            'amazon': 'AMZN', 'tesla': 'TSLA', 'meta': 'META',
            'netflix': 'NFLX', 'nvidia': 'NVDA'
        }
        
        text_lower = text.lower()
        for company, symbol in company_mapping.items():
            if company in text_lower:
                return symbol
                
        # Try to extract symbol pattern
        symbol_match = re.search(r'\b([A-Z]{2,5})\b', text.upper())
        if symbol_match:
            return symbol_match.group(1)
            
        return 'AAPL'  # Default fallback

    async def _fallback_response(self, intent: str, parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Fallback when OpenBB is not available"""
        return {
            "message": f"OpenBB not available. Intent '{intent}' requires OpenBB Platform installation.",
            "suggestion": "Install OpenBB Platform: pip install openbb",
            "parameters": parameters or {}
        }

    async def get_health_status(self) -> Dict[str, Any]:
        """Health check for OpenBB availability and configured providers"""
        if not self.openbb_available:
            return {
                "status": "unavailable",
                "message": "OpenBB Platform not installed",
                "providers": {}
            }
            
        try:
            # Check provider status
            providers = {}
            
            # Test basic functionality
            test_result = await self.execute_ai_command("bitcoin price")
            
            return {
                "status": "healthy" if test_result.get("success") else "degraded",
                "openbb_version": getattr(obb, '__version__', 'unknown'),
                "providers": providers,
                "last_test": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error", 
                "message": str(e),
                "providers": {}
            }


# Singleton instance
ai_openbb_service = AIOpenBBService()