"""
Unified ChromaDB Service for RedPill AI Terminal
Comprehensive AI memory system for all user data, conversations, portfolio, research, and reports
"""

import logging
import os
import json
import uuid
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

import chromadb
from chromadb.config import Settings
import asyncio

logger = logging.getLogger(__name__)


class SourceType(Enum):
    """Data source types for semantic organization"""
    CONVERSATION = "conversation"
    PORTFOLIO = "portfolio" 
    COMPANY = "company"
    RESEARCH = "research"
    REPORT = "report"
    MEETING = "meeting"
    MEMO = "memo"
    PDF = "pdf"
    NEWS = "news"
    OPENBB = "openbb"
    EXA_RESEARCH = "exa_research"
    IMPORT_FILE = "import_file"
    FUND_PERFORMANCE = "fund_performance"
    CHART_ANALYSIS = "chart_analysis"


class Visibility(Enum):
    """Data visibility levels"""
    PUBLIC = "public"
    TEAM = "team" 
    PRIVATE = "private"


@dataclass
class ChromaDocument:
    """Structured document for Chroma storage"""
    content: str
    metadata: Dict[str, Any]
    doc_id: Optional[str] = None
    
    def __post_init__(self):
        if not self.doc_id:
            self.doc_id = str(uuid.uuid4())


class UnifiedChromaService:
    """
    Unified AI Memory Service for RedPill Terminal
    Stores and retrieves ALL user data with semantic search
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.chroma_client = None
        self.collections = {}
        self.memory_path = os.path.join(os.path.expanduser("~"), ".redpill", "unified_memory")
        self._initialize_chroma()
    
    def _initialize_chroma(self):
        """Initialize ChromaDB with all collections"""
        try:
            os.makedirs(self.memory_path, exist_ok=True)
            
            self.chroma_client = chromadb.PersistentClient(
                path=self.memory_path,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Initialize all collections with proper schemas
            self._create_collections()
            
            self.logger.info(f"Unified Chroma initialized with {len(self.collections)} collections")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize unified Chroma service: {e}")
            raise
    
    def _create_collections(self):
        """Create all semantic collections for different data types"""
        
        collection_configs = {
            # Core user memory
            "user_conversations": {
                "metadata": {"description": "All user chat history with context"},
                "schema": ["tenant_id", "workspace_id", "thread_id", "date", "source_type"]
            },
            
            # Portfolio & financial data
            "portfolio_memory": {
                "metadata": {"description": "User portfolio, watchlist, holdings, trades"},
                "schema": ["tenant_id", "ticker", "sector", "stage", "action_type", "date", "value"]
            },
            
            # Company intelligence
            "company_profiles": {
                "metadata": {"description": "Company data, fundamentals, news, analysis"},
                "schema": ["ticker", "sector", "stage", "market_cap", "date", "source_type"]
            },
            
            # Research & analysis
            "research_reports": {
                "metadata": {"description": "Research reports, memos, analysis, insights"},
                "schema": ["tenant_id", "deal_id", "author", "date", "source_type", "visibility"]
            },
            
            # Founder & people intelligence  
            "founder_profiles": {
                "metadata": {"description": "Founder profiles, bios, news, connections"},
                "schema": ["founder_name", "role", "company", "chain", "region", "date"]
            },
            
            # Meeting & workflow data
            "meeting_memory": {
                "metadata": {"description": "Meeting notes, action items, decisions"},
                "schema": ["tenant_id", "thread_id", "meeting_type", "date", "participants"]
            },
            
            # Deal room intelligence
            "dealroom_data": {
                "metadata": {"description": "Deal-specific documents, DD, IC materials"},
                "schema": ["tenant_id", "deal_id", "stage", "date", "visibility", "doc_type"]
            },
            
            # Market intelligence
            "market_intelligence": {
                "metadata": {"description": "Market data, trends, sentiment, OpenBB insights"},
                "schema": ["ticker", "sector", "date", "data_type", "source_type", "timeframe"]
            },
            
            # Fund performance
            "fund_performance": {
                "metadata": {"description": "Fund metrics, performance, benchmarks, analysis"},
                "schema": ["fund_id", "strategy", "date", "metric_type", "benchmark", "period"]
            },
            
            # File imports & data ingestion
            "imported_data": {
                "metadata": {"description": "CSV imports, Excel files, data uploads"},
                "schema": ["tenant_id", "file_name", "file_type", "import_date", "status"]
            },
            
            # Action items & tasks
            "action_items": {
                "metadata": {"description": "Generated tasks, reminders, follow-ups"},
                "schema": ["tenant_id", "thread_id", "priority", "due_date", "status", "assignee"]
            }
        }
        
        for name, config in collection_configs.items():
            try:
                collection = self.chroma_client.get_or_create_collection(
                    name=name,
                    metadata=config["metadata"]
                )
                self.collections[name] = collection
                self.logger.info(f"Initialized collection: {name} ({collection.count()} documents)")
            except Exception as e:
                self.logger.error(f"Failed to create collection {name}: {e}")
    
    async def store_document(
        self,
        collection_name: str,
        document: ChromaDocument,
        tenant_id: str = "default",
        workspace_id: str = "default"
    ) -> str:
        """Store a document in the specified collection"""
        try:
            if collection_name not in self.collections:
                raise ValueError(f"Collection {collection_name} does not exist")
            
            collection = self.collections[collection_name]
            
            # Ensure tenant isolation
            document.metadata.update({
                "tenant_id": tenant_id,
                "workspace_id": workspace_id,
                "ingestion_date": datetime.now().isoformat(),
                "doc_id": document.doc_id
            })
            
            # Store in ChromaDB
            collection.add(
                documents=[document.content],
                metadatas=[document.metadata],
                ids=[document.doc_id]
            )
            
            self.logger.info(f"Stored document {document.doc_id} in {collection_name}")
            return document.doc_id
            
        except Exception as e:
            self.logger.error(f"Failed to store document in {collection_name}: {e}")
            return ""
    
    async def semantic_search(
        self,
        collection_name: str,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        tenant_id: str = "default",
        workspace_id: str = "default",
        n_results: int = 10
    ) -> List[Dict[str, Any]]:
        """Perform semantic search with tenant isolation and filters"""
        try:
            if collection_name not in self.collections:
                return []
            
            collection = self.collections[collection_name]
            
            # Build where clause with tenant isolation - use $and for multiple conditions
            where_clause = {"tenant_id": tenant_id}  # Simplified for now
            
            # Add additional filters one at a time (Chroma limitation)
            if filters and len(filters) == 1:
                # Only add simple single filters for now
                key, value = next(iter(filters.items()))
                if isinstance(value, dict) and "$eq" in value:
                    where_clause[key] = value["$eq"]
                elif isinstance(value, dict) and "$in" in value and len(value["$in"]) == 1:
                    where_clause[key] = value["$in"][0]
            
            # Execute search
            results = collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where_clause
            )
            
            # Format results
            formatted_results = []
            if results["documents"] and results["documents"][0]:
                for i in range(len(results["documents"][0])):
                    formatted_results.append({
                        "content": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "distance": results["distances"][0][i] if results.get("distances") else 0,
                        "id": results["ids"][0][i]
                    })
            
            self.logger.info(f"Semantic search in {collection_name}: {len(formatted_results)} results")
            return formatted_results
            
        except Exception as e:
            self.logger.error(f"Semantic search failed in {collection_name}: {e}")
            return []
    
    async def get_portfolio_context(
        self,
        tenant_id: str = "default",
        query: str = "current holdings and watchlist"
    ) -> Dict[str, Any]:
        """Get portfolio-aware context for AI responses"""
        try:
            # Search portfolio memory (simplified query due to Chroma limitations)
            portfolio_results = await self.semantic_search(
                "portfolio_memory", 
                query,
                tenant_id=tenant_id,
                n_results=20
            )
            
            # Extract symbols and companies
            tracked_symbols = set()
            portfolio_context = {
                "symbols": [],
                "sectors": [],
                "holdings": [],
                "watchlist": [],
                "last_updated": None
            }
            
            for result in portfolio_results:
                metadata = result["metadata"]
                if metadata.get("ticker"):
                    tracked_symbols.add(metadata["ticker"])
                if metadata.get("action_type") == "buy":
                    portfolio_context["holdings"].append({
                        "symbol": metadata.get("ticker"),
                        "sector": metadata.get("sector"),
                        "date": metadata.get("date")
                    })
                elif metadata.get("action_type") in ["track", "watch"]:
                    portfolio_context["watchlist"].append({
                        "symbol": metadata.get("ticker"),
                        "sector": metadata.get("sector")
                    })
            
            portfolio_context["symbols"] = list(tracked_symbols)
            portfolio_context["sectors"] = list(set(h.get("sector") for h in 
                                                portfolio_context["holdings"] + portfolio_context["watchlist"]
                                                if h.get("sector")))
            
            return portfolio_context
            
        except Exception as e:
            self.logger.error(f"Failed to get portfolio context: {e}")
            return {"symbols": [], "sectors": [], "holdings": [], "watchlist": []}
    
    async def store_conversation_with_context(
        self,
        user_input: str,
        assistant_response: str,
        entities: Dict[str, Any],
        metadata: Dict[str, Any],
        tenant_id: str = "default",
        thread_id: Optional[str] = None
    ) -> str:
        """Store conversation with enhanced context and entity extraction"""
        try:
            # Create rich conversation document
            conversation_content = f"""
            User: {user_input}
            Assistant: {assistant_response}
            
            Entities: {json.dumps(entities, indent=2)}
            Tools Used: {', '.join(metadata.get('tools_used', []))}
            """
            
            conv_metadata = {
                "source_type": SourceType.CONVERSATION.value,
                "thread_id": thread_id or str(uuid.uuid4()),
                "date": datetime.now().isoformat(),
                "user_input": user_input[:500],  # Truncated for metadata
                "success": metadata.get("success", True),
                "tools_used": json.dumps(metadata.get("tools_used", [])),
                "entities_count": len(entities.get("symbols", [])) + len(entities.get("companies", []))
            }
            
            # Add entity metadata
            if entities.get("symbols"):
                conv_metadata["symbols"] = json.dumps(entities["symbols"])
            if entities.get("companies"):
                conv_metadata["companies"] = json.dumps([c.get("name", str(c)) for c in entities["companies"]])
            
            doc = ChromaDocument(
                content=conversation_content,
                metadata=conv_metadata
            )
            
            # Store conversation
            doc_id = await self.store_document("user_conversations", doc, tenant_id)
            
            # Also store portfolio-related entities separately
            if entities.get("symbols"):
                await self._store_portfolio_entities(entities, tenant_id, user_input)
            
            return doc_id
            
        except Exception as e:
            self.logger.error(f"Failed to store conversation with context: {e}")
            return ""
    
    async def _store_portfolio_entities(
        self,
        entities: Dict[str, Any],
        tenant_id: str,
        context: str
    ):
        """Store extracted entities in portfolio memory"""
        try:
            for symbol in entities.get("symbols", []):
                # Infer action type from context
                action_type = "track"  # default
                if any(word in context.lower() for word in ["buy", "bought", "purchase", "add"]):
                    action_type = "buy"
                elif any(word in context.lower() for word in ["watch", "monitor", "track"]):
                    action_type = "watch"
                
                portfolio_doc = ChromaDocument(
                    content=f"User mentioned {symbol} in context: {context[:200]}",
                    metadata={
                        "source_type": SourceType.PORTFOLIO.value,
                        "ticker": symbol,
                        "action_type": action_type,
                        "date": datetime.now().isoformat(),
                        "context": context[:300]
                    }
                )
                
                await self.store_document("portfolio_memory", portfolio_doc, tenant_id)
                
        except Exception as e:
            self.logger.error(f"Failed to store portfolio entities: {e}")
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """Get comprehensive memory statistics"""
        try:
            stats = {
                "collections": {},
                "total_documents": 0,
                "storage_path": self.memory_path,
                "status": "active"
            }
            
            for name, collection in self.collections.items():
                count = collection.count()
                stats["collections"][name] = count
                stats["total_documents"] += count
            
            return stats
            
        except Exception as e:
            self.logger.error(f"Failed to get memory stats: {e}")
            return {"status": "error", "error": str(e)}


# Global unified service instance
unified_chroma_service = UnifiedChromaService()