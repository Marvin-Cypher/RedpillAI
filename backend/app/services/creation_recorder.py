"""
Universal OpenBB Creation Recording System
Captures ALL user-OpenBB interactions as creations for Investment CRM organization

This system treats every OpenBB output as a "creation" that should be:
1. Stored persistently for future access
2. Organized with intelligent metadata 
3. Made searchable and retrievable
4. Integrated into investment workflows
"""

import json
import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib
from pathlib import Path

from .unified_chroma_service import UnifiedChromaService


class CreationType(Enum):
    """Types of OpenBB creations we capture"""
    CHART = "chart"
    TABLE = "table"
    REPORT = "report"
    SCREEN = "screen"
    ANALYSIS = "analysis"
    ALERT = "alert"
    CALENDAR = "calendar"
    NEWS = "news"
    FUNDAMENTALS = "fundamentals"
    TECHNICAL = "technical"
    OPTIONS = "options"
    ECONOMIC = "economic"
    RESEARCH = "research"


class CreationCategory(Enum):
    """High-level categories for investment CRM organization"""
    MARKET_DATA = "market_data"
    COMPANY_RESEARCH = "company_research"
    PORTFOLIO_ANALYSIS = "portfolio_analysis"
    MARKET_INTELLIGENCE = "market_intelligence"
    RISK_MANAGEMENT = "risk_management"
    TRADING_SIGNALS = "trading_signals"
    ECONOMIC_ANALYSIS = "economic_analysis"
    TECHNICAL_ANALYSIS = "technical_analysis"


@dataclass
class CreationMetadata:
    """Metadata structure for all OpenBB creations"""
    creation_id: str
    user_id: str
    creation_type: CreationType
    category: CreationCategory
    title: str
    description: str
    
    # OpenBB-specific metadata
    openbb_module: str  # e.g., "equity.price.historical"
    openbb_tool: str    # e.g., "get_stock_price_history"
    parameters: Dict[str, Any]
    
    # Asset/symbol context
    symbols: List[str]  # Companies/assets involved
    sectors: List[str]  # Relevant sectors
    
    # File/URL references
    file_path: Optional[str] = None
    chart_url: Optional[str] = None
    web_url: Optional[str] = None
    
    # Temporal context
    created_at: str = None
    data_period: Optional[str] = None  # Time period covered by data
    expires_at: Optional[str] = None   # When data becomes stale
    
    # Investment context
    investment_thesis: Optional[str] = None
    tags: List[str] = None
    priority: str = "normal"  # low, normal, high, urgent
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()
        if self.tags is None:
            self.tags = []


@dataclass 
class Creation:
    """Complete creation record with data and metadata"""
    metadata: CreationMetadata
    data: Dict[str, Any]
    summary: Optional[str] = None  # AI-generated summary
    key_insights: List[str] = None  # AI-extracted insights
    
    def __post_init__(self):
        if self.key_insights is None:
            self.key_insights = []


class UniversalCreationRecorder:
    """
    Universal system to record ALL OpenBB interactions as creations
    Acts as the memory layer for the Investment Intelligence Platform
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.chroma_service = UnifiedChromaService()
        self.collection_name = "openbb_creations"
        
        # Ensure the creations collection exists
        self._initialize_collection()
        
        self.logger.info("✅ Universal Creation Recorder initialized")
    
    def _initialize_collection(self):
        """Initialize ChromaDB collection for creations"""
        try:
            # The unified chroma service will create collection if needed
            # We use the existing "research_reports" collection or create "openbb_creations"
            pass
        except Exception as e:
            self.logger.error(f"Failed to initialize creations collection: {e}")
    
    async def record_chart_creation(
        self,
        user_id: str,
        symbol: str,
        asset_type: str,
        chart_result: Dict[str, Any],
        openbb_tool: str,
        parameters: Dict[str, Any]
    ) -> str:
        """Record a chart creation from OpenBB"""
        
        creation_id = self._generate_creation_id("chart", symbol, openbb_tool)
        
        # Determine category based on asset type and analysis
        category = self._categorize_chart(asset_type, symbol, parameters)
        
        metadata = CreationMetadata(
            creation_id=creation_id,
            user_id=user_id,
            creation_type=CreationType.CHART,
            category=category,
            title=f"{symbol} {asset_type.title()} Chart - {parameters.get('period', '1y')}",
            description=f"Interactive price chart for {symbol} generated via {openbb_tool}",
            openbb_module=self._extract_module_from_tool(openbb_tool),
            openbb_tool=openbb_tool,
            parameters=parameters,
            symbols=[symbol],
            sectors=await self._get_symbol_sectors([symbol]),
            file_path=str(chart_result.get("chart_path", "")),  # Convert Path to string
            chart_url=chart_result.get("chart_url"),
            web_url=chart_result.get("web_viewer_url"),
            data_period=parameters.get("period", "1y"),
            tags=self._generate_chart_tags(symbol, asset_type, parameters)
        )
        
        creation = Creation(
            metadata=metadata,
            data={
                "chart_info": chart_result,
                "data_points": chart_result.get("data_points", 0),
                "interactive": chart_result.get("interactive", True),
                "source": chart_result.get("source", "OpenBB")
            }
        )
        
        await self._store_creation(creation)
        
        self.logger.info(f"📊 Recorded chart creation: {creation_id} for {symbol}")
        return creation_id
    
    async def record_data_creation(
        self,
        user_id: str,
        openbb_tool: str,
        parameters: Dict[str, Any],
        result_data: Dict[str, Any],
        creation_type: CreationType = CreationType.TABLE
    ) -> str:
        """Record a data/table creation from OpenBB tools"""
        
        symbols = self._extract_symbols_from_params(parameters)
        main_symbol = symbols[0] if symbols else "Market"
        
        creation_id = self._generate_creation_id(creation_type.value, main_symbol, openbb_tool)
        
        # Categorize based on tool type
        category = self._categorize_by_tool(openbb_tool, parameters)
        
        metadata = CreationMetadata(
            creation_id=creation_id,
            user_id=user_id,
            creation_type=creation_type,
            category=category,
            title=self._generate_title_for_tool(openbb_tool, parameters, symbols),
            description=f"Data analysis via {openbb_tool}",
            openbb_module=self._extract_module_from_tool(openbb_tool),
            openbb_tool=openbb_tool,
            parameters=parameters,
            symbols=symbols,
            sectors=await self._get_symbol_sectors(symbols),
            tags=self._generate_data_tags(openbb_tool, parameters, symbols)
        )
        
        # Generate AI summary of the data
        summary = await self._generate_ai_summary(result_data, metadata)
        key_insights = await self._extract_key_insights(result_data, metadata)
        
        creation = Creation(
            metadata=metadata,
            data=result_data,
            summary=summary,
            key_insights=key_insights
        )
        
        await self._store_creation(creation)
        
        self.logger.info(f"📋 Recorded data creation: {creation_id} for {openbb_tool}")
        return creation_id
    
    async def record_analysis_creation(
        self,
        user_id: str,
        analysis_type: str,
        symbols: List[str],
        analysis_data: Dict[str, Any],
        investment_thesis: Optional[str] = None
    ) -> str:
        """Record a comprehensive analysis creation"""
        
        creation_id = self._generate_creation_id("analysis", "_".join(symbols), analysis_type)
        
        metadata = CreationMetadata(
            creation_id=creation_id,
            user_id=user_id,
            creation_type=CreationType.ANALYSIS,
            category=CreationCategory.COMPANY_RESEARCH,
            title=f"{', '.join(symbols)} - {analysis_type.title()} Analysis",
            description=f"Comprehensive {analysis_type} analysis covering multiple data points",
            openbb_module="multi_tool_analysis",
            openbb_tool="comprehensive_analysis",
            parameters={"analysis_type": analysis_type, "symbols": symbols},
            symbols=symbols,
            sectors=await self._get_symbol_sectors(symbols),
            investment_thesis=investment_thesis,
            priority="high",
            tags=["analysis", analysis_type] + symbols
        )
        
        # AI-powered analysis summarization
        summary = await self._generate_analysis_summary(analysis_data, metadata)
        key_insights = await self._extract_analysis_insights(analysis_data, metadata)
        
        creation = Creation(
            metadata=metadata,
            data=analysis_data,
            summary=summary,
            key_insights=key_insights
        )
        
        await self._store_creation(creation)
        
        self.logger.info(f"🔬 Recorded analysis creation: {creation_id}")
        return creation_id
    
    async def get_user_creations(
        self,
        user_id: str,
        creation_type: Optional[CreationType] = None,
        category: Optional[CreationCategory] = None,
        symbols: Optional[List[str]] = None,
        limit: int = 50
    ) -> List[Creation]:
        """Retrieve user's creations with filters"""
        
        try:
            # Get all documents from research_reports collection for this user
            collection = self.chroma_service.collections.get("research_reports")
            if not collection:
                return []
            
            # Use ChromaDB's get method to retrieve all documents for user
            results = collection.get(
                where={"tenant_id": user_id},
                limit=limit
            )
            
            # Convert results back to Creation objects
            creations = []
            for i, doc_id in enumerate(results["ids"]):
                try:
                    doc_content = results["documents"][i]
                    metadata_dict = results["metadatas"][i]
                    
                    # Skip if not our creation format
                    if "creation_type" not in metadata_dict:
                        continue
                    
                    # Apply filters
                    if creation_type and metadata_dict.get("creation_type") != creation_type.value:
                        continue
                    if category and metadata_dict.get("category") != category.value:
                        continue
                    if symbols:
                        creation_symbols = metadata_dict.get("symbols", [])
                        if not any(s in creation_symbols for s in symbols):
                            continue
                    
                    # Parse document content
                    creation_data = json.loads(doc_content)
                    
                    # Convert metadata dict to CreationMetadata object
                    # Handle dataclass conversion
                    metadata_copy = metadata_dict.copy()
                    # Remove non-CreationMetadata fields
                    for key in ["tenant_id", "workspace_id", "ingestion_date", "doc_id"]:
                        metadata_copy.pop(key, None)
                    
                    # Convert flattened fields back to lists/objects
                    if "symbols" in metadata_copy and isinstance(metadata_copy["symbols"], str):
                        metadata_copy["symbols"] = metadata_copy["symbols"].split(",") if metadata_copy["symbols"] else []
                    if "sectors" in metadata_copy and isinstance(metadata_copy["sectors"], str):
                        metadata_copy["sectors"] = metadata_copy["sectors"].split(",") if metadata_copy["sectors"] else []
                    if "tags" in metadata_copy and isinstance(metadata_copy["tags"], str):
                        metadata_copy["tags"] = metadata_copy["tags"].split(",") if metadata_copy["tags"] else []
                    if "parameters" in metadata_copy and isinstance(metadata_copy["parameters"], str):
                        metadata_copy["parameters"] = json.loads(metadata_copy["parameters"]) if metadata_copy["parameters"] else {}
                    
                    # Convert enum strings back to enums
                    if "creation_type" in metadata_copy:
                        metadata_copy["creation_type"] = CreationType(metadata_copy["creation_type"])
                    if "category" in metadata_copy:
                        metadata_copy["category"] = CreationCategory(metadata_copy["category"])
                    
                    metadata = CreationMetadata(**metadata_copy)
                    
                    creation = Creation(
                        metadata=metadata,
                        data=creation_data.get("data", {}),
                        summary=creation_data.get("summary"),
                        key_insights=creation_data.get("key_insights", [])
                    )
                    
                    creations.append(creation)
                    
                except Exception as e:
                    self.logger.warning(f"Failed to parse creation {doc_id}: {e}")
                    continue
            
            self.logger.info(f"📚 Retrieved {len(creations)} creations for user {user_id}")
            return creations
            
        except Exception as e:
            self.logger.error(f"Failed to retrieve creations: {e}")
            return []
    
    async def search_creations(
        self,
        user_id: str,
        query: str,
        n_results: int = 20
    ) -> List[Creation]:
        """Search creations using semantic search"""
        
        try:
            # Use existing unified search for now
            # TODO: Implement dedicated creation search
            results = {"documents": [[]], "metadatas": [[]]}
            
            creations = []
            for i, doc in enumerate(results["documents"][0]):
                metadata_dict = results["metadatas"][0][i]
                creation_data = json.loads(doc)
                
                metadata = CreationMetadata(**metadata_dict)
                creation = Creation(
                    metadata=metadata,
                    data=creation_data.get("data", {}),
                    summary=creation_data.get("summary"),
                    key_insights=creation_data.get("key_insights", [])
                )
                
                creations.append(creation)
            
            self.logger.info(f"🔍 Found {len(creations)} creations matching '{query}'")
            return creations
            
        except Exception as e:
            self.logger.error(f"Failed to search creations: {e}")
            return []
    
    # Helper methods
    
    def _generate_creation_id(self, creation_type: str, identifier: str, tool: str) -> str:
        """Generate unique creation ID"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        content = f"{creation_type}_{identifier}_{tool}_{timestamp}"
        hash_suffix = hashlib.md5(content.encode()).hexdigest()[:8]
        return f"{creation_type}_{identifier}_{hash_suffix}"
    
    def _categorize_chart(self, asset_type: str, symbol: str, params: Dict) -> CreationCategory:
        """Categorize chart based on context"""
        if asset_type == "crypto":
            return CreationCategory.MARKET_DATA
        elif "portfolio" in params.get("context", "").lower():
            return CreationCategory.PORTFOLIO_ANALYSIS
        else:
            return CreationCategory.COMPANY_RESEARCH
    
    def _categorize_by_tool(self, tool: str, params: Dict) -> CreationCategory:
        """Categorize creation by OpenBB tool"""
        tool_lower = tool.lower()
        
        if any(word in tool_lower for word in ["fundamental", "income", "balance", "cash", "ratios"]):
            return CreationCategory.COMPANY_RESEARCH
        elif any(word in tool_lower for word in ["option", "chain", "unusual"]):
            return CreationCategory.TRADING_SIGNALS
        elif any(word in tool_lower for word in ["economy", "gdp", "inflation", "rates"]):
            return CreationCategory.ECONOMIC_ANALYSIS
        elif any(word in tool_lower for word in ["technical", "rsi", "macd", "sma"]):
            return CreationCategory.TECHNICAL_ANALYSIS
        elif any(word in tool_lower for word in ["gainer", "loser", "active", "screen"]):
            return CreationCategory.MARKET_INTELLIGENCE
        else:
            return CreationCategory.MARKET_DATA
    
    def _extract_module_from_tool(self, tool: str) -> str:
        """Extract OpenBB module path from tool name"""
        # Map tool names back to module paths
        tool_module_map = {
            "get_stock_price_history": "equity.price.historical",
            "get_stock_quote": "equity.price.quote",
            "get_top_gainers": "equity.discovery.gainers",
            "get_company_profile": "equity.profile",
            "get_income_statement": "equity.fundamental.income",
            # Add more mappings as needed
        }
        return tool_module_map.get(tool, "unknown")
    
    def _extract_symbols_from_params(self, params: Dict) -> List[str]:
        """Extract stock symbols from parameters"""
        symbols = []
        if "symbol" in params:
            symbols.append(params["symbol"])
        if "symbols" in params:
            symbols.extend(params["symbols"])
        return symbols
    
    async def _get_symbol_sectors(self, symbols: List[str]) -> List[str]:
        """Get sectors for symbols (simplified implementation)"""
        # This would integrate with your company service to get actual sectors
        sectors = []
        for symbol in symbols:
            if symbol in ["AAPL", "MSFT", "GOOGL", "NVDA"]:
                sectors.append("Technology")
            elif symbol in ["BTC", "ETH"]:
                sectors.append("Cryptocurrency")
            # Add more sector mappings
        return list(set(sectors))
    
    def _generate_chart_tags(self, symbol: str, asset_type: str, params: Dict) -> List[str]:
        """Generate relevant tags for chart"""
        tags = ["chart", asset_type, symbol.lower()]
        if params.get("period"):
            tags.append(f"period_{params['period']}")
        return tags
    
    def _generate_data_tags(self, tool: str, params: Dict, symbols: List[str]) -> List[str]:
        """Generate tags for data creation"""
        tags = [tool.lower().replace("get_", "").replace("_", "-")]
        tags.extend([s.lower() for s in symbols])
        return tags
    
    def _generate_title_for_tool(self, tool: str, params: Dict, symbols: List[str]) -> str:
        """Generate human-readable title for tool execution"""
        symbol_str = ", ".join(symbols) if symbols else "Market"
        
        title_map = {
            "get_top_gainers": "Top Stock Gainers",
            "get_top_losers": "Top Stock Losers", 
            "get_stock_quote": f"{symbol_str} Stock Quote",
            "get_income_statement": f"{symbol_str} Income Statement",
            "get_balance_sheet": f"{symbol_str} Balance Sheet",
            "get_financial_ratios": f"{symbol_str} Financial Ratios",
        }
        
        return title_map.get(tool, f"{tool.replace('_', ' ').title()}")
    
    async def _store_creation(self, creation: Creation):
        """Store creation in ChromaDB"""
        try:
            from .unified_chroma_service import ChromaDocument
            
            # Prepare document for storage
            document_content = json.dumps({
                "data": creation.data,
                "summary": creation.summary,
                "key_insights": creation.key_insights
            })
            
            # Create ChromaDocument with serialized metadata
            metadata_dict = asdict(creation.metadata)
            # Convert enums to strings for ChromaDB compatibility
            metadata_dict["creation_type"] = creation.metadata.creation_type.value
            metadata_dict["category"] = creation.metadata.category.value
            
            # Flatten complex fields to strings for ChromaDB compatibility and handle None values
            if "symbols" in metadata_dict and metadata_dict["symbols"]:
                metadata_dict["symbols"] = ",".join(metadata_dict["symbols"])
            else:
                metadata_dict["symbols"] = ""
                
            if "sectors" in metadata_dict and metadata_dict["sectors"]:
                metadata_dict["sectors"] = ",".join(metadata_dict["sectors"]) 
            else:
                metadata_dict["sectors"] = ""
                
            if "tags" in metadata_dict and metadata_dict["tags"]:
                metadata_dict["tags"] = ",".join(metadata_dict["tags"])
            else:
                metadata_dict["tags"] = ""
                
            if "parameters" in metadata_dict and metadata_dict["parameters"]:
                metadata_dict["parameters"] = json.dumps(metadata_dict["parameters"])
            else:
                metadata_dict["parameters"] = "{}"
                
            # Ensure all other fields are not None
            for key, value in metadata_dict.items():
                if value is None:
                    metadata_dict[key] = ""
            
            chroma_doc = ChromaDocument(
                content=document_content,
                metadata=metadata_dict,
                doc_id=creation.metadata.creation_id
            )
            
            # Store in ChromaDB using research_reports collection
            await self.chroma_service.store_document(
                collection_name="research_reports",
                document=chroma_doc,
                tenant_id=creation.metadata.user_id
            )
            
        except Exception as e:
            self.logger.error(f"Failed to store creation {creation.metadata.creation_id}: {e}")
    
    async def _generate_ai_summary(self, data: Dict, metadata: CreationMetadata) -> Optional[str]:
        """Generate AI summary of creation (placeholder)"""
        # This would integrate with your AI service to generate summaries
        return f"Analysis of {', '.join(metadata.symbols)} using {metadata.openbb_tool}"
    
    async def _extract_key_insights(self, data: Dict, metadata: CreationMetadata) -> List[str]:
        """Extract key insights using AI (placeholder)"""
        # This would use AI to extract key insights from the data
        return ["Key insight 1", "Key insight 2"]
    
    async def _generate_analysis_summary(self, data: Dict, metadata: CreationMetadata) -> Optional[str]:
        """Generate comprehensive analysis summary"""
        return f"Comprehensive analysis of {', '.join(metadata.symbols)}"
    
    async def _extract_analysis_insights(self, data: Dict, metadata: CreationMetadata) -> List[str]:
        """Extract insights from comprehensive analysis"""
        return ["Analysis insight 1", "Analysis insight 2"]


# Singleton instance
creation_recorder = UniversalCreationRecorder()