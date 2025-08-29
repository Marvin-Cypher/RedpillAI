"""
OpenBB CLI Wrapper Service - True AI integration with OpenBB Terminal
Provides comprehensive access to ALL OpenBB CLI commands through AI
"""

import subprocess
import json
import asyncio
import logging
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import tempfile
import re
import os

class OpenBBCLIWrapper:
    """
    Complete AI wrapper for OpenBB CLI/Terminal
    Makes RedPill understand and execute ALL OpenBB commands intelligently
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.openbb_cli = "openbb"  # OpenBB CLI command
        
        # Complete OpenBB command mapping based on documentation
        self.command_structure = {
            "/equity": {
                "description": "Equity market commands",
                "subcommands": {
                    "price": {
                        "historical": {
                            "description": "Get historical price data with interactive charts",
                            "params": ["--symbol", "--start_date", "--end_date", "--interval", "--chart"],
                            "example": "/equity/price/historical --symbol AAPL --chart"
                        },
                        "quote": {
                            "description": "Get real-time quote",
                            "params": ["--symbol"],
                            "example": "/equity/price/quote --symbol AAPL"
                        },
                        "performance": {
                            "description": "Get price performance",
                            "params": ["--symbol"],
                            "example": "/equity/price/performance --symbol AAPL,MSFT,GOOGL"
                        }
                    },
                    "fundamental": {
                        "overview": {"description": "Company overview", "params": ["--symbol"]},
                        "income": {"description": "Income statement", "params": ["--symbol", "--period", "--limit"]},
                        "balance": {"description": "Balance sheet", "params": ["--symbol", "--period", "--limit"]},
                        "cash": {"description": "Cash flow statement", "params": ["--symbol", "--period", "--limit"]},
                        "ratios": {"description": "Financial ratios", "params": ["--symbol", "--period"]}
                    },
                    "discovery": {
                        "gainers": {"description": "Top gainers", "params": ["--sort", "--limit"]},
                        "losers": {"description": "Top losers", "params": ["--sort", "--limit"]},
                        "active": {"description": "Most active stocks", "params": ["--sort", "--limit"]}
                    },
                    "calendar": {
                        "earnings": {"description": "Earnings calendar", "params": ["--start_date", "--end_date"]},
                        "dividends": {"description": "Dividend calendar", "params": ["--start_date", "--end_date"]},
                        "splits": {"description": "Stock splits calendar", "params": ["--start_date", "--end_date"]}
                    },
                    "ownership": {
                        "institutional": {"description": "Institutional ownership", "params": ["--symbol"]},
                        "insider": {"description": "Insider trading", "params": ["--symbol", "--limit"]}
                    },
                    "shorts": {
                        "interest": {"description": "Short interest", "params": ["--symbol"]},
                        "volume": {"description": "Short volume", "params": ["--symbol"]}
                    }
                }
            },
            "/crypto": {
                "description": "Cryptocurrency commands",
                "subcommands": {
                    "price": {
                        "historical": {
                            "description": "Get crypto historical prices with charts",
                            "params": ["--symbol", "--start_date", "--end_date", "--interval", "--chart"],
                            "example": "/crypto/price/historical --symbol BTC --chart"
                        },
                        "quote": {
                            "description": "Get current crypto price",
                            "params": ["--symbol"],
                            "example": "/crypto/price/quote --symbol BTC,ETH"
                        }
                    },
                    "search": {
                        "description": "Search cryptocurrencies",
                        "params": ["--query", "--limit"],
                        "example": "/crypto/search --query bitcoin"
                    }
                }
            },
            "/economy": {
                "description": "Economic data commands",
                "subcommands": {
                    "gdp": {
                        "nominal": {"description": "Nominal GDP", "params": ["--country", "--start_date", "--end_date"]},
                        "real": {"description": "Real GDP", "params": ["--country", "--start_date", "--end_date"]}
                    },
                    "cpi": {"description": "Consumer Price Index", "params": ["--country", "--frequency"]},
                    "calendar": {"description": "Economic events calendar", "params": ["--start_date", "--end_date", "--importance"]},
                    "fred": {"description": "FRED economic data", "params": ["--series_id", "--start_date", "--end_date", "--chart"]}
                }
            },
            "/etf": {
                "description": "ETF commands",
                "subcommands": {
                    "search": {"description": "Search ETFs", "params": ["--query"]},
                    "holdings": {"description": "ETF holdings", "params": ["--symbol"]},
                    "info": {"description": "ETF information", "params": ["--symbol"]},
                    "price": {
                        "historical": {"description": "ETF historical prices", "params": ["--symbol", "--start_date", "--end_date", "--chart"]}
                    }
                }
            },
            "/index": {
                "description": "Index commands",
                "subcommands": {
                    "price": {
                        "historical": {
                            "description": "Index historical data with charts",
                            "params": ["--symbol", "--start_date", "--end_date", "--chart"],
                            "example": "/index/price/historical --symbol SPY --chart"
                        }
                    },
                    "constituents": {"description": "Index constituents", "params": ["--symbol"]}
                }
            },
            "/derivatives": {
                "description": "Derivatives commands",
                "subcommands": {
                    "options": {
                        "chains": {"description": "Options chains", "params": ["--symbol", "--expiration"]},
                        "unusual": {"description": "Unusual options activity", "params": ["--symbol"]}
                    },
                    "futures": {
                        "curve": {"description": "Futures curve", "params": ["--symbol"]},
                        "historical": {"description": "Futures historical data", "params": ["--symbol", "--start_date", "--end_date"]}
                    }
                }
            },
            "/fixedincome": {
                "description": "Fixed income commands",
                "subcommands": {
                    "rate": {
                        "treasury": {"description": "Treasury rates", "params": ["--maturity", "--start_date", "--end_date", "--chart"]},
                        "sofr": {"description": "SOFR rates", "params": ["--start_date", "--end_date"]}
                    },
                    "spreads": {"description": "Bond spreads", "params": ["--type", "--start_date", "--end_date"]}
                }
            },
            "/currency": {
                "description": "Foreign exchange commands",
                "subcommands": {
                    "price": {
                        "historical": {
                            "description": "Forex historical rates with charts",
                            "params": ["--symbol", "--start_date", "--end_date", "--chart"],
                            "example": "/currency/price/historical --symbol EURUSD --chart"
                        }
                    },
                    "search": {"description": "Search currency pairs", "params": ["--query"]}
                }
            },
            "/news": {
                "description": "News commands",
                "subcommands": {
                    "company": {"description": "Company news", "params": ["--symbol", "--limit"]},
                    "world": {"description": "World news", "params": ["--limit", "--filter"]}
                }
            },
            "/account": {
                "description": "OpenBB account management",
                "subcommands": {
                    "login": {"description": "Login to OpenBB Hub"},
                    "logout": {"description": "Logout from OpenBB Hub"},
                    "sync": {"description": "Sync settings with OpenBB Hub"}
                }
            }
        }
    
    async def execute_openbb_command(
        self,
        command_path: str,
        parameters: Optional[Dict[str, Any]] = None,
        chart: bool = False
    ) -> Dict[str, Any]:
        """
        Execute any OpenBB CLI command with parameters
        
        Args:
            command_path: Full command path (e.g., "/equity/price/historical")
            parameters: Command parameters as dict
            chart: Whether to generate interactive chart
        
        Returns:
            Command output with data and chart info
        """
        try:
            # Build the routine script
            routine_lines = []
            
            # Add command with parameters
            cmd_line = command_path
            if parameters:
                for key, value in parameters.items():
                    if key.startswith("--"):
                        cmd_line += f" {key} {value}"
                    else:
                        cmd_line += f" --{key} {value}"
            
            if chart and "--chart" not in cmd_line:
                cmd_line += " --chart"
            
            routine_lines.append(cmd_line)
            
            # Create routine file
            routine_content = "\n".join(routine_lines)
            
            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.openbb',
                delete=False
            ) as f:
                f.write(routine_content)
                routine_file = f.name
            
            try:
                # Execute OpenBB CLI
                process = await asyncio.create_subprocess_exec(
                    self.openbb_cli,
                    '--file', routine_file,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=30.0
                )
                
                output = stdout.decode('utf-8') if stdout else ""
                error = stderr.decode('utf-8') if stderr else ""
                
                # Parse output
                data = self._parse_output(output)
                
                return {
                    "success": process.returncode == 0,
                    "command": command_path,
                    "parameters": parameters,
                    "output": output,
                    "data": data,
                    "error": error if error else None,
                    "chart_generated": chart
                }
                
            finally:
                # Clean up
                Path(routine_file).unlink(missing_ok=True)
                
        except asyncio.TimeoutError:
            return {
                "success": False,
                "command": command_path,
                "error": "Command timed out after 30 seconds"
            }
        except Exception as e:
            self.logger.error(f"Error executing OpenBB command {command_path}: {e}")
            return {
                "success": False,
                "command": command_path,
                "error": str(e)
            }
    
    def _parse_output(self, output: str) -> Optional[Dict[str, Any]]:
        """Parse OpenBB output to extract structured data"""
        try:
            # Look for JSON in output
            json_pattern = r'\{[^}]*\}'
            json_matches = re.findall(json_pattern, output, re.DOTALL)
            if json_matches:
                try:
                    return json.loads(json_matches[-1])
                except:
                    pass
            
            # Look for table data
            if '│' in output:
                return self._parse_table_output(output)
            
            # Look for key-value pairs
            data = {}
            lines = output.split('\n')
            for line in lines:
                if ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        key = parts[0].strip().lower().replace(' ', '_')
                        value = parts[1].strip()
                        if key and value:
                            data[key] = value
            
            return data if data else None
            
        except Exception as e:
            self.logger.debug(f"Could not parse output: {e}")
            return None
    
    def _parse_table_output(self, output: str) -> Dict[str, List[Dict]]:
        """Parse table format from OpenBB output"""
        try:
            lines = output.split('\n')
            table_lines = [l for l in lines if '│' in l and '─' not in l]
            
            if len(table_lines) < 2:
                return None
            
            # Extract headers
            header_line = table_lines[0]
            headers = [h.strip() for h in header_line.split('│')[1:-1]]
            
            # Extract data rows
            rows = []
            for line in table_lines[1:]:
                values = [v.strip() for v in line.split('│')[1:-1]]
                if len(values) == len(headers):
                    row = dict(zip(headers, values))
                    rows.append(row)
            
            return {"table_data": rows} if rows else None
            
        except Exception as e:
            self.logger.debug(f"Could not parse table: {e}")
            return None
    
    def get_command_help(self, command_path: str) -> Dict[str, Any]:
        """Get help information for a specific command"""
        parts = command_path.split('/')
        current = self.command_structure
        
        for part in parts:
            if part and part in current:
                if "subcommands" in current[part]:
                    current = current[part]["subcommands"]
                else:
                    return current[part]
        
        return {"error": f"Command {command_path} not found"}
    
    def list_all_commands(self) -> List[str]:
        """List all available OpenBB commands"""
        commands = []
        
        def traverse(path: str, structure: Dict):
            if "subcommands" in structure:
                for key, value in structure["subcommands"].items():
                    new_path = f"{path}/{key}"
                    if "subcommands" in value:
                        traverse(new_path, value)
                    else:
                        commands.append(new_path)
        
        for root_cmd, structure in self.command_structure.items():
            traverse(root_cmd, structure)
        
        return commands
    
    async def get_market_snapshot(self) -> Dict[str, Any]:
        """Get comprehensive market snapshot using multiple OpenBB commands"""
        results = {}
        
        # Get major indices
        indices = await self.execute_openbb_command(
            "/index/price/historical",
            {"symbol": "SPY,QQQ,DIA", "interval": "1d", "limit": 1}
        )
        results["indices"] = indices.get("data")
        
        # Get top movers
        gainers = await self.execute_openbb_command("/equity/discovery/gainers", {"limit": 5})
        losers = await self.execute_openbb_command("/equity/discovery/losers", {"limit": 5})
        active = await self.execute_openbb_command("/equity/discovery/active", {"limit": 5})
        
        results["movers"] = {
            "gainers": gainers.get("data"),
            "losers": losers.get("data"),
            "active": active.get("data")
        }
        
        # Get crypto prices
        crypto = await self.execute_openbb_command(
            "/crypto/price/quote",
            {"symbol": "BTC,ETH,SOL"}
        )
        results["crypto"] = crypto.get("data")
        
        return {
            "success": True,
            "timestamp": str(Path.ctime(Path.cwd())),
            "data": results
        }
    
    async def create_interactive_chart(
        self,
        asset_type: str,
        symbol: str,
        period: str = "1y",
        indicators: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Create interactive chart with technical indicators
        
        Args:
            asset_type: Type of asset (equity, crypto, index, currency)
            symbol: Ticker symbol
            period: Time period
            indicators: List of technical indicators to add
        
        Returns:
            Chart generation result
        """
        command_map = {
            "equity": "/equity/price/historical",
            "crypto": "/crypto/price/historical",
            "index": "/index/price/historical",
            "currency": "/currency/price/historical"
        }
        
        command = command_map.get(asset_type, "/equity/price/historical")
        
        # Build parameters
        params = {
            "symbol": symbol,
            "interval": "1d" if period in ["1y", "2y", "5y"] else "1h"
        }
        
        # Add date range based on period
        if period == "1d":
            params["limit"] = 390  # Trading day minutes
        elif period == "1w":
            params["limit"] = 5  # Trading days
        elif period == "1m":
            params["limit"] = 22  # Trading days
        elif period == "1y":
            params["limit"] = 252  # Trading days
        
        result = await self.execute_openbb_command(command, params, chart=True)
        
        return {
            "success": result.get("success"),
            "symbol": symbol,
            "asset_type": asset_type,
            "period": period,
            "chart_generated": True,
            "data": result.get("data"),
            "output": result.get("output")
        }


# Singleton instance
openbb_cli = OpenBBCLIWrapper()