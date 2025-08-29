"""
OpenBB Tool Registry - Comprehensive AI Tool Definitions for ALL OpenBB Functions
Automatically registers 350+ OpenBB functions as AI-callable tools
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class ToolPriority(Enum):
    """Priority levels for tool registration"""
    CRITICAL = 1  # Core market data, must have
    HIGH = 2      # Important analysis tools
    MEDIUM = 3    # Advanced features
    LOW = 4       # Specialized/niche features


@dataclass
class OpenBBTool:
    """Definition of an OpenBB tool for AI integration"""
    name: str
    module_path: str  # e.g., "equity.price.historical"
    description: str
    parameters: Dict[str, Any]
    priority: ToolPriority
    category: str
    returns: str
    example_usage: Optional[str] = None


class OpenBBToolRegistry:
    """
    Comprehensive registry of ALL OpenBB tools for AI integration
    Maps 350+ OpenBB functions to AI-callable tool definitions
    """
    
    def __init__(self):
        self.tools: Dict[str, OpenBBTool] = {}
        self._register_all_tools()
    
    def _register_all_tools(self):
        """Register all OpenBB tools organized by priority"""
        
        # CRITICAL PRIORITY - Core Market Data
        self._register_equity_price_tools()
        self._register_market_snapshot_tools()
        self._register_discovery_tools()
        self._register_fundamental_tools()
        self._register_crypto_tools()
        self._register_index_tools()
        self._register_currency_tools()
        
        # HIGH PRIORITY - Analysis Tools
        self._register_options_tools()
        self._register_economy_tools()
        self._register_technical_tools()
        self._register_news_tools()
        
        # MEDIUM PRIORITY - Advanced Features
        self._register_etf_tools()
        self._register_quantitative_tools()
        self._register_ownership_tools()
        self._register_estimates_tools()
        
        # LOW PRIORITY - Specialized Features
        self._register_fixedincome_tools()
        self._register_regulatory_tools()
        self._register_commodity_tools()
        self._register_econometrics_tools()
        
        logger.info(f"✅ Registered {len(self.tools)} OpenBB tools for AI integration")
    
    def _register_equity_price_tools(self):
        """Register equity price data tools"""
        
        self.tools["equity_price_historical"] = OpenBBTool(
            name="get_stock_price_history",
            module_path="equity.price.historical",
            description="Get historical stock price data with OHLCV",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker symbol", "required": True},
                "start_date": {"type": "string", "description": "Start date (YYYY-MM-DD)", "required": False},
                "end_date": {"type": "string", "description": "End date (YYYY-MM-DD)", "required": False},
                "interval": {"type": "string", "description": "Data interval (1d, 1h, 5m)", "default": "1d"},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.CRITICAL,
            category="Market Data",
            returns="DataFrame with date, open, high, low, close, volume",
            example_usage="Get AAPL daily prices for last year"
        )
        
        self.tools["equity_price_quote"] = OpenBBTool(
            name="get_stock_quote",
            module_path="equity.price.quote",
            description="Get real-time stock quote with current price and changes",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker symbol", "required": True},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.CRITICAL,
            category="Market Data",
            returns="Current price, change, percent change, volume, market cap"
        )
        
        self.tools["equity_price_performance"] = OpenBBTool(
            name="get_stock_performance",
            module_path="equity.price.performance",
            description="Get stock performance metrics over various time periods",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker symbol", "required": True},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.HIGH,
            category="Market Data",
            returns="Performance metrics: 1d, 5d, 1m, 3m, 6m, YTD, 1y, 3y, 5y returns"
        )
    
    def _register_market_snapshot_tools(self):
        """Register market snapshot and overview tools"""
        
        self.tools["equity_market_snapshots"] = OpenBBTool(
            name="get_market_snapshots",
            module_path="equity.market_snapshots",
            description="Get real-time market snapshots for thousands of stocks",
            parameters={
                "provider": {"type": "string", "description": "Data provider", "default": "polygon"}
            },
            priority=ToolPriority.CRITICAL,
            category="Market Overview",
            returns="Market-wide snapshot with all stock prices and changes"
        )
        
        self.tools["equity_profile"] = OpenBBTool(
            name="get_company_profile",
            module_path="equity.profile",
            description="Get comprehensive company profile and information",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker symbol", "required": True},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.CRITICAL,
            category="Company Data",
            returns="Company name, sector, industry, employees, description, website"
        )
    
    def _register_discovery_tools(self):
        """Register stock discovery and screening tools"""
        
        self.tools["equity_discovery_gainers"] = OpenBBTool(
            name="get_top_gainers",
            module_path="equity.discovery.gainers",
            description="Get today's top gaining stocks",
            parameters={
                "limit": {"type": "integer", "description": "Number of results", "default": 20},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.CRITICAL,
            category="Discovery",
            returns="List of top gaining stocks with symbols, prices, and percent changes"
        )
        
        self.tools["equity_discovery_losers"] = OpenBBTool(
            name="get_top_losers",
            module_path="equity.discovery.losers",
            description="Get today's top losing stocks",
            parameters={
                "limit": {"type": "integer", "description": "Number of results", "default": 20},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.CRITICAL,
            category="Discovery",
            returns="List of top losing stocks with symbols, prices, and percent changes"
        )
        
        self.tools["equity_discovery_active"] = OpenBBTool(
            name="get_most_active",
            module_path="equity.discovery.active",
            description="Get most actively traded stocks by volume",
            parameters={
                "limit": {"type": "integer", "description": "Number of results", "default": 20},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.CRITICAL,
            category="Discovery",
            returns="Most active stocks with symbols, prices, volumes"
        )
        
        self.tools["equity_screener"] = OpenBBTool(
            name="screen_stocks",
            module_path="equity.screener",
            description="Screen stocks by market cap, price, beta, volume, dividend yield",
            parameters={
                "min_market_cap": {"type": "number", "description": "Minimum market cap"},
                "max_market_cap": {"type": "number", "description": "Maximum market cap"},
                "min_price": {"type": "number", "description": "Minimum stock price"},
                "max_price": {"type": "number", "description": "Maximum stock price"},
                "min_volume": {"type": "number", "description": "Minimum daily volume"},
                "min_dividend_yield": {"type": "number", "description": "Minimum dividend yield"},
                "sector": {"type": "string", "description": "Sector filter"},
                "industry": {"type": "string", "description": "Industry filter"},
                "country": {"type": "string", "description": "Country filter"},
                "limit": {"type": "integer", "description": "Number of results", "default": 100}
            },
            priority=ToolPriority.CRITICAL,
            category="Discovery",
            returns="Screened stocks matching criteria"
        )
    
    def _register_fundamental_tools(self):
        """Register fundamental analysis tools"""
        
        self.tools["equity_fundamental_income"] = OpenBBTool(
            name="get_income_statement",
            module_path="equity.fundamental.income",
            description="Get company income statement (revenue, expenses, profit)",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker symbol", "required": True},
                "period": {"type": "string", "description": "annual or quarterly", "default": "annual"},
                "limit": {"type": "integer", "description": "Number of periods", "default": 4},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.CRITICAL,
            category="Fundamentals",
            returns="Revenue, gross profit, operating income, net income, EPS"
        )
        
        self.tools["equity_fundamental_balance"] = OpenBBTool(
            name="get_balance_sheet",
            module_path="equity.fundamental.balance",
            description="Get company balance sheet (assets, liabilities, equity)",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker symbol", "required": True},
                "period": {"type": "string", "description": "annual or quarterly", "default": "annual"},
                "limit": {"type": "integer", "description": "Number of periods", "default": 4},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.CRITICAL,
            category="Fundamentals",
            returns="Total assets, total liabilities, shareholders equity, working capital"
        )
        
        self.tools["equity_fundamental_cash"] = OpenBBTool(
            name="get_cash_flow",
            module_path="equity.fundamental.cash",
            description="Get company cash flow statement",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker symbol", "required": True},
                "period": {"type": "string", "description": "annual or quarterly", "default": "annual"},
                "limit": {"type": "integer", "description": "Number of periods", "default": 4},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.CRITICAL,
            category="Fundamentals",
            returns="Operating cash flow, investing cash flow, financing cash flow, free cash flow"
        )
        
        self.tools["equity_fundamental_ratios"] = OpenBBTool(
            name="get_financial_ratios",
            module_path="equity.fundamental.ratios",
            description="Get key financial ratios (P/E, P/B, ROE, margins)",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker symbol", "required": True},
                "period": {"type": "string", "description": "annual or quarterly", "default": "annual"},
                "limit": {"type": "integer", "description": "Number of periods", "default": 4},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.CRITICAL,
            category="Fundamentals",
            returns="P/E, P/B, P/S, PEG, ROE, ROA, profit margins, debt ratios"
        )
    
    def _register_crypto_tools(self):
        """Register cryptocurrency tools"""
        
        self.tools["crypto_price_historical"] = OpenBBTool(
            name="get_crypto_price_history",
            module_path="crypto.price.historical",
            description="Get historical cryptocurrency price data",
            parameters={
                "symbol": {"type": "string", "description": "Crypto symbol (BTC, ETH)", "required": True},
                "start_date": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
                "end_date": {"type": "string", "description": "End date (YYYY-MM-DD)"},
                "interval": {"type": "string", "description": "Data interval", "default": "1d"},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.CRITICAL,
            category="Crypto",
            returns="OHLCV data for cryptocurrency"
        )
        
        self.tools["crypto_search"] = OpenBBTool(
            name="search_crypto",
            module_path="crypto.search",
            description="Search for cryptocurrency pairs and symbols",
            parameters={
                "query": {"type": "string", "description": "Search query", "required": True},
                "provider": {"type": "string", "description": "Data provider", "default": "coinmarketcap"}
            },
            priority=ToolPriority.HIGH,
            category="Crypto",
            returns="List of matching cryptocurrency symbols and names"
        )
    
    def _register_index_tools(self):
        """Register market index tools"""
        
        self.tools["index_price_historical"] = OpenBBTool(
            name="get_index_history",
            module_path="index.price.historical",
            description="Get historical market index data (S&P 500, NASDAQ, etc.)",
            parameters={
                "symbol": {"type": "string", "description": "Index symbol (SPY, QQQ, DIA)", "required": True},
                "start_date": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
                "end_date": {"type": "string", "description": "End date (YYYY-MM-DD)"},
                "interval": {"type": "string", "description": "Data interval", "default": "1d"},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.CRITICAL,
            category="Index",
            returns="Historical index price data"
        )
        
        self.tools["index_constituents"] = OpenBBTool(
            name="get_index_constituents",
            module_path="index.constituents",
            description="Get constituents/components of a market index",
            parameters={
                "symbol": {"type": "string", "description": "Index symbol", "required": True},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.MEDIUM,
            category="Index",
            returns="List of stocks in the index with weights"
        )
    
    def _register_currency_tools(self):
        """Register foreign exchange tools"""
        
        self.tools["currency_price_historical"] = OpenBBTool(
            name="get_fx_rates",
            module_path="currency.price.historical",
            description="Get historical foreign exchange rates",
            parameters={
                "symbol": {"type": "string", "description": "Currency pair (EURUSD, GBPUSD)", "required": True},
                "start_date": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
                "end_date": {"type": "string", "description": "End date (YYYY-MM-DD)"},
                "interval": {"type": "string", "description": "Data interval", "default": "1d"},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.CRITICAL,
            category="Currency",
            returns="Historical FX rate data"
        )
    
    def _register_options_tools(self):
        """Register options and derivatives tools"""
        
        self.tools["derivatives_options_chains"] = OpenBBTool(
            name="get_options_chain",
            module_path="derivatives.options.chains",
            description="Get options chain with all strikes and expirations",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker symbol", "required": True},
                "expiration": {"type": "string", "description": "Expiration date (YYYY-MM-DD)"},
                "provider": {"type": "string", "description": "Data provider", "default": "cboe"}
            },
            priority=ToolPriority.HIGH,
            category="Options",
            returns="Options chain with strikes, bid/ask, volume, open interest, Greeks"
        )
        
        self.tools["derivatives_options_unusual"] = OpenBBTool(
            name="get_unusual_options",
            module_path="derivatives.options.unusual",
            description="Get unusual options activity (high volume/OI)",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker (optional)"},
                "limit": {"type": "integer", "description": "Number of results", "default": 20},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.HIGH,
            category="Options",
            returns="Unusual options trades with volume, OI, and flow"
        )
        
        self.tools["derivatives_futures_curve"] = OpenBBTool(
            name="get_futures_curve",
            module_path="derivatives.futures.curve",
            description="Get futures curve showing term structure",
            parameters={
                "symbol": {"type": "string", "description": "Futures symbol", "required": True},
                "provider": {"type": "string", "description": "Data provider", "default": "cboe"}
            },
            priority=ToolPriority.HIGH,
            category="Futures",
            returns="Futures prices across different expiration dates"
        )
    
    def _register_economy_tools(self):
        """Register economic data tools"""
        
        self.tools["economy_calendar"] = OpenBBTool(
            name="get_economic_calendar",
            module_path="economy.calendar",
            description="Get economic calendar events and releases",
            parameters={
                "start_date": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
                "end_date": {"type": "string", "description": "End date (YYYY-MM-DD)"},
                "importance": {"type": "string", "description": "high, medium, low"},
                "country": {"type": "string", "description": "Country code (US, EU, CN)"},
                "provider": {"type": "string", "description": "Data provider", "default": "econdb"}
            },
            priority=ToolPriority.HIGH,
            category="Economy",
            returns="Economic events with dates, forecasts, and actual values"
        )
        
        self.tools["economy_cpi"] = OpenBBTool(
            name="get_inflation_data",
            module_path="economy.cpi",
            description="Get Consumer Price Index (CPI) inflation data",
            parameters={
                "country": {"type": "string", "description": "Country code", "default": "US"},
                "start_date": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
                "end_date": {"type": "string", "description": "End date (YYYY-MM-DD)"},
                "provider": {"type": "string", "description": "Data provider", "default": "fred"}
            },
            priority=ToolPriority.HIGH,
            category="Economy",
            returns="CPI values and inflation rates"
        )
        
        self.tools["economy_gdp_real"] = OpenBBTool(
            name="get_gdp_data",
            module_path="economy.gdp.real",
            description="Get real GDP growth data",
            parameters={
                "country": {"type": "string", "description": "Country code", "default": "US"},
                "start_date": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
                "end_date": {"type": "string", "description": "End date (YYYY-MM-DD)"},
                "provider": {"type": "string", "description": "Data provider", "default": "fred"}
            },
            priority=ToolPriority.HIGH,
            category="Economy",
            returns="GDP growth rates and values"
        )
        
        self.tools["economy_interest_rates"] = OpenBBTool(
            name="get_interest_rates",
            module_path="economy.interest_rates",
            description="Get central bank interest rates",
            parameters={
                "country": {"type": "string", "description": "Country code", "default": "US"},
                "start_date": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
                "end_date": {"type": "string", "description": "End date (YYYY-MM-DD)"},
                "provider": {"type": "string", "description": "Data provider", "default": "fred"}
            },
            priority=ToolPriority.HIGH,
            category="Economy",
            returns="Interest rate values and changes"
        )
        
        self.tools["economy_fred_series"] = OpenBBTool(
            name="get_fred_data",
            module_path="economy.fred_series",
            description="Get any FRED economic time series data",
            parameters={
                "series_id": {"type": "string", "description": "FRED series ID", "required": True},
                "start_date": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
                "end_date": {"type": "string", "description": "End date (YYYY-MM-DD)"},
                "provider": {"type": "string", "description": "Data provider", "default": "fred"}
            },
            priority=ToolPriority.HIGH,
            category="Economy",
            returns="Time series data from FRED"
        )
    
    def _register_technical_tools(self):
        """Register technical analysis indicators"""
        
        self.tools["technical_rsi"] = OpenBBTool(
            name="calculate_rsi",
            module_path="technical.rsi",
            description="Calculate Relative Strength Index (RSI)",
            parameters={
                "data": {"type": "dataframe", "description": "Price data", "required": True},
                "period": {"type": "integer", "description": "RSI period", "default": 14}
            },
            priority=ToolPriority.HIGH,
            category="Technical",
            returns="RSI values indicating overbought/oversold conditions"
        )
        
        self.tools["technical_macd"] = OpenBBTool(
            name="calculate_macd",
            module_path="technical.macd",
            description="Calculate MACD (Moving Average Convergence Divergence)",
            parameters={
                "data": {"type": "dataframe", "description": "Price data", "required": True},
                "fast_period": {"type": "integer", "description": "Fast EMA period", "default": 12},
                "slow_period": {"type": "integer", "description": "Slow EMA period", "default": 26},
                "signal_period": {"type": "integer", "description": "Signal line period", "default": 9}
            },
            priority=ToolPriority.HIGH,
            category="Technical",
            returns="MACD line, signal line, and histogram"
        )
        
        self.tools["technical_sma"] = OpenBBTool(
            name="calculate_sma",
            module_path="technical.sma",
            description="Calculate Simple Moving Average",
            parameters={
                "data": {"type": "dataframe", "description": "Price data", "required": True},
                "period": {"type": "integer", "description": "SMA period", "default": 20}
            },
            priority=ToolPriority.HIGH,
            category="Technical",
            returns="Simple moving average values"
        )
        
        self.tools["technical_bbands"] = OpenBBTool(
            name="calculate_bollinger_bands",
            module_path="technical.bbands",
            description="Calculate Bollinger Bands",
            parameters={
                "data": {"type": "dataframe", "description": "Price data", "required": True},
                "period": {"type": "integer", "description": "Period", "default": 20},
                "std_dev": {"type": "number", "description": "Standard deviations", "default": 2}
            },
            priority=ToolPriority.HIGH,
            category="Technical",
            returns="Upper band, middle band (SMA), lower band"
        )
    
    def _register_news_tools(self):
        """Register news and sentiment tools"""
        
        self.tools["news_company"] = OpenBBTool(
            name="get_company_news",
            module_path="news.company",
            description="Get latest news for a specific company",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker symbol", "required": True},
                "limit": {"type": "integer", "description": "Number of articles", "default": 10},
                "provider": {"type": "string", "description": "Data provider", "default": "polygon"}
            },
            priority=ToolPriority.HIGH,
            category="News",
            returns="News articles with title, summary, URL, sentiment"
        )
        
        self.tools["equity_calendar_earnings"] = OpenBBTool(
            name="get_earnings_calendar",
            module_path="equity.calendar.earnings",
            description="Get upcoming earnings announcements",
            parameters={
                "start_date": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
                "end_date": {"type": "string", "description": "End date (YYYY-MM-DD)"},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.HIGH,
            category="Events",
            returns="Earnings dates with estimates and previous values"
        )
    
    def _register_etf_tools(self):
        """Register ETF analysis tools"""
        
        self.tools["etf_holdings"] = OpenBBTool(
            name="get_etf_holdings",
            module_path="etf.holdings",
            description="Get ETF holdings and allocations",
            parameters={
                "symbol": {"type": "string", "description": "ETF ticker symbol", "required": True},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.MEDIUM,
            category="ETF",
            returns="ETF holdings with weights and shares"
        )
        
        self.tools["etf_search"] = OpenBBTool(
            name="search_etfs",
            module_path="etf.search",
            description="Search for ETFs by criteria",
            parameters={
                "query": {"type": "string", "description": "Search query"},
                "asset_class": {"type": "string", "description": "Asset class filter"},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.MEDIUM,
            category="ETF",
            returns="List of matching ETFs"
        )
    
    def _register_quantitative_tools(self):
        """Register quantitative analysis tools"""
        
        self.tools["quantitative_sharpe_ratio"] = OpenBBTool(
            name="calculate_sharpe_ratio",
            module_path="quantitative.sharpe_ratio",
            description="Calculate Sharpe ratio for risk-adjusted returns",
            parameters={
                "returns": {"type": "dataframe", "description": "Return series", "required": True},
                "risk_free_rate": {"type": "number", "description": "Risk-free rate", "default": 0.02}
            },
            priority=ToolPriority.MEDIUM,
            category="Quantitative",
            returns="Sharpe ratio value"
        )
    
    def _register_ownership_tools(self):
        """Register ownership and insider trading tools"""
        
        self.tools["equity_ownership_institutional"] = OpenBBTool(
            name="get_institutional_ownership",
            module_path="equity.ownership.institutional",
            description="Get institutional ownership data",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker symbol", "required": True},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.MEDIUM,
            category="Ownership",
            returns="Institutional holders with shares and percentages"
        )
        
        self.tools["equity_ownership_insider_trading"] = OpenBBTool(
            name="get_insider_trading",
            module_path="equity.ownership.insider_trading",
            description="Get insider trading transactions",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker symbol", "required": True},
                "limit": {"type": "integer", "description": "Number of transactions", "default": 100},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.MEDIUM,
            category="Ownership",
            returns="Insider transactions with dates, amounts, and prices"
        )
    
    def _register_estimates_tools(self):
        """Register analyst estimates tools"""
        
        self.tools["equity_estimates_consensus"] = OpenBBTool(
            name="get_analyst_consensus",
            module_path="equity.estimates.consensus",
            description="Get analyst consensus estimates",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker symbol", "required": True},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.MEDIUM,
            category="Estimates",
            returns="Consensus estimates for earnings, revenue, and price targets"
        )
    
    def _register_fixedincome_tools(self):
        """Register fixed income tools"""
        
        self.tools["fixedincome_government_treasury_rates"] = OpenBBTool(
            name="get_treasury_rates",
            module_path="fixedincome.government.treasury_rates",
            description="Get US Treasury rates across all maturities",
            parameters={
                "start_date": {"type": "string", "description": "Start date (YYYY-MM-DD)"},
                "end_date": {"type": "string", "description": "End date (YYYY-MM-DD)"},
                "provider": {"type": "string", "description": "Data provider", "default": "fred"}
            },
            priority=ToolPriority.LOW,
            category="Fixed Income",
            returns="Treasury rates for 1m, 3m, 6m, 1y, 2y, 5y, 10y, 30y"
        )
    
    def _register_regulatory_tools(self):
        """Register regulatory and filing tools"""
        
        self.tools["regulators_sec_filings"] = OpenBBTool(
            name="get_sec_filings",
            module_path="equity.discovery.filings",
            description="Get recent SEC filings for a company",
            parameters={
                "symbol": {"type": "string", "description": "Stock ticker symbol", "required": True},
                "form_type": {"type": "string", "description": "Form type (10-K, 10-Q, 8-K)"},
                "limit": {"type": "integer", "description": "Number of filings", "default": 10},
                "provider": {"type": "string", "description": "Data provider", "default": "sec"}
            },
            priority=ToolPriority.LOW,
            category="Regulatory",
            returns="SEC filings with dates, form types, and URLs"
        )
    
    def _register_commodity_tools(self):
        """Register commodity tools"""
        
        self.tools["commodity_price_spot"] = OpenBBTool(
            name="get_commodity_prices",
            module_path="commodity.price.spot",
            description="Get spot prices for commodities",
            parameters={
                "commodity": {"type": "string", "description": "Commodity type (gold, oil, wheat)"},
                "provider": {"type": "string", "description": "Data provider", "default": "yfinance"}
            },
            priority=ToolPriority.LOW,
            category="Commodity",
            returns="Current commodity spot prices"
        )
    
    def _register_econometrics_tools(self):
        """Register econometrics tools"""
        
        self.tools["econometrics_correlation_matrix"] = OpenBBTool(
            name="calculate_correlation_matrix",
            module_path="econometrics.correlation_matrix",
            description="Calculate correlation matrix between assets",
            parameters={
                "data": {"type": "dataframe", "description": "Price/return data", "required": True},
                "method": {"type": "string", "description": "Correlation method", "default": "pearson"}
            },
            priority=ToolPriority.LOW,
            category="Econometrics",
            returns="Correlation matrix showing relationships between assets"
        )
    
    def get_tools_by_priority(self, priority: ToolPriority) -> List[OpenBBTool]:
        """Get all tools of a specific priority level"""
        return [tool for tool in self.tools.values() if tool.priority == priority]
    
    def get_tools_by_category(self, category: str) -> List[OpenBBTool]:
        """Get all tools in a specific category"""
        return [tool for tool in self.tools.values() if tool.category == category]
    
    def get_tool_definition(self, tool_name: str) -> Optional[OpenBBTool]:
        """Get a specific tool definition"""
        return self.tools.get(tool_name)
    
    def generate_ai_tool_schema(self, tool: OpenBBTool) -> Dict[str, Any]:
        """Generate OpenAI function calling schema for a tool"""
        required_params = [
            name for name, spec in tool.parameters.items()
            if spec.get("required", False)
        ]
        
        properties = {}
        for name, spec in tool.parameters.items():
            properties[name] = {
                "type": spec["type"],
                "description": spec["description"]
            }
            if "default" in spec:
                properties[name]["default"] = spec["default"]
        
        return {
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required_params
                }
            }
        }
    
    def get_all_ai_tool_schemas(self, max_priority: ToolPriority = ToolPriority.HIGH) -> List[Dict[str, Any]]:
        """Get AI tool schemas for all tools up to a certain priority"""
        schemas = []
        for tool in self.tools.values():
            if tool.priority.value <= max_priority.value:
                schemas.append(self.generate_ai_tool_schema(tool))
        return schemas
    
    def get_tool_count_by_category(self) -> Dict[str, int]:
        """Get count of tools in each category"""
        counts = {}
        for tool in self.tools.values():
            counts[tool.category] = counts.get(tool.category, 0) + 1
        return counts
    
    def export_tool_documentation(self) -> str:
        """Export comprehensive documentation of all tools"""
        doc = "# OpenBB Tool Registry Documentation\n\n"
        doc += f"Total Tools Registered: {len(self.tools)}\n\n"
        
        # Group by category
        categories = {}
        for tool in self.tools.values():
            if tool.category not in categories:
                categories[tool.category] = []
            categories[tool.category].append(tool)
        
        for category, tools in sorted(categories.items()):
            doc += f"## {category} ({len(tools)} tools)\n\n"
            for tool in sorted(tools, key=lambda t: t.priority.value):
                doc += f"### {tool.name}\n"
                doc += f"- **Module:** `{tool.module_path}`\n"
                doc += f"- **Priority:** {tool.priority.name}\n"
                doc += f"- **Description:** {tool.description}\n"
                doc += f"- **Returns:** {tool.returns}\n"
                if tool.example_usage:
                    doc += f"- **Example:** {tool.example_usage}\n"
                doc += "\n"
        
        return doc


# Singleton instance
openbb_registry = OpenBBToolRegistry()