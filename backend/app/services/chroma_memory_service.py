"""
Chroma-based AI Memory Service for RedPill Terminal
Provides persistent, intelligent conversation memory using vector embeddings
"""

import logging
import os
import json
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta
import asyncio
from dataclasses import dataclass

import chromadb
from chromadb.config import Settings
import openai

logger = logging.getLogger(__name__)


@dataclass
class ConversationMemory:
    """Structured conversation memory entry"""
    id: str
    user_input: str
    assistant_response: str
    entities: Dict[str, Any]  # symbols, companies, prices, etc.
    metadata: Dict[str, Any]  # tools_used, success, etc.
    timestamp: datetime
    session_id: str
    embedding: Optional[List[float]] = None


class ChromaMemoryService:
    """
    AI Memory Service using ChromaDB for persistent, semantic conversation memory
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.openai_client = None
        self.chroma_client = None
        self.collection = None
        self.memory_path = os.path.join(os.path.expanduser("~"), ".redpill", "memory")
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize ChromaDB and OpenAI clients"""
        try:
            # Initialize OpenAI for embeddings - disable for now to use Chroma's default
            openai_key = None  # Disable OpenAI embeddings for now, use Chroma's default
            if openai_key:
                self.openai_client = openai.OpenAI(api_key=openai_key)
                self.logger.info("OpenAI client initialized for embeddings")
            else:
                self.logger.warning("No OpenAI API key found - using Chroma's default embeddings")
            
            # Initialize ChromaDB with persistent storage
            os.makedirs(self.memory_path, exist_ok=True)
            
            self.chroma_client = chromadb.PersistentClient(
                path=self.memory_path,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Get or create conversation collection
            self.collection = self.chroma_client.get_or_create_collection(
                name="conversation_memory",
                metadata={"description": "RedPill AI conversation memory with semantic search"}
            )
            
            self.logger.info(f"ChromaDB initialized with {self.collection.count()} existing memories")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize memory service: {e}")
            raise
    
    async def store_conversation(
        self, 
        user_input: str, 
        assistant_response: str,
        entities: Dict[str, Any],
        metadata: Dict[str, Any],
        session_id: str = "default"
    ) -> str:
        """Store a conversation exchange in memory with embeddings"""
        try:
            # Generate unique ID
            memory_id = f"{session_id}_{int(datetime.now().timestamp())}_{hash(user_input) % 10000}"
            
            # Create embedding text (combine input, response, and key entities)
            embedding_text = self._create_embedding_text(user_input, assistant_response, entities)
            
            # Generate embedding
            embedding = await self._generate_embedding(embedding_text)
            
            # Prepare metadata for Chroma
            chroma_metadata = {
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                "user_input": user_input[:500],  # Truncate for metadata
                "tools_used": json.dumps(metadata.get("tools_used", [])),
                "success": metadata.get("success", True),
                "entities_count": len(entities.get("symbols", [])) + len(entities.get("companies", []))
            }
            
            # Store in ChromaDB
            self.collection.add(
                documents=[embedding_text],
                embeddings=[embedding] if embedding else None,
                metadatas=[chroma_metadata],
                ids=[memory_id]
            )
            
            self.logger.info(f"Stored conversation memory: {memory_id}")
            return memory_id
            
        except Exception as e:
            self.logger.error(f"Failed to store conversation: {e}")
            return ""
    
    async def retrieve_relevant_context(
        self, 
        query: str, 
        session_id: str = "default",
        max_results: int = 5,
        time_window_hours: int = 24
    ) -> List[ConversationMemory]:
        """Retrieve relevant conversation context based on semantic similarity"""
        try:
            if not self.collection:
                return []
            
            # Generate query embedding
            query_embedding = await self._generate_embedding(query)
            
            # Search ChromaDB for relevant memories (remove time filter for now due to Chroma issues)
            results = self.collection.query(
                query_embeddings=[query_embedding] if query_embedding else None,
                query_texts=[query] if not query_embedding else None,
                n_results=max_results,
                where={"session_id": {"$eq": session_id}}
            )
            
            # Convert results to ConversationMemory objects
            memories = []
            if results["documents"]:
                for i in range(len(results["documents"][0])):
                    try:
                        metadata = results["metadatas"][0][i]
                        memory = ConversationMemory(
                            id=results["ids"][0][i],
                            user_input=metadata.get("user_input", ""),
                            assistant_response=results["documents"][0][i],
                            entities={"tools_used": json.loads(metadata.get("tools_used", "[]"))},
                            metadata={"success": metadata.get("success", True)},
                            timestamp=datetime.fromisoformat(metadata.get("timestamp", datetime.now().isoformat())),
                            session_id=metadata.get("session_id", session_id),
                            embedding=results["embeddings"][0][i] if results["embeddings"] else None
                        )
                        memories.append(memory)
                    except Exception as e:
                        self.logger.warning(f"Failed to parse memory {i}: {e}")
                        continue
            
            self.logger.info(f"Retrieved {len(memories)} relevant memories for query: {query[:50]}...")
            return memories
            
        except Exception as e:
            self.logger.error(f"Failed to retrieve context: {e}")
            return []
    
    async def get_recent_entities(
        self, 
        session_id: str = "default", 
        hours_back: int = 2
    ) -> Dict[str, List[str]]:
        """Get recently mentioned entities (symbols, companies) from conversation history"""
        try:
            results = self.collection.query(
                query_texts=["stocks symbols companies trading"],
                n_results=10,
                where={
                    "$and": [
                        {"session_id": {"$eq": session_id}},
                        {"entities_count": {"$gt": 0}}
                    ]
                }
            )
            
            # Extract entities from metadata
            recent_entities = {
                "symbols": [],
                "companies": [],
                "prices": {}
            }
            
            if results["metadatas"]:
                for metadata in results["metadatas"][0]:
                    # Parse tools_used to extract entities
                    tools_used = json.loads(metadata.get("tools_used", "[]"))
                    user_input = metadata.get("user_input", "")
                    
                    # Extract stock symbols from user input
                    import re
                    symbol_matches = re.findall(r'\b([A-Z]{2,5})\b', user_input)
                    recent_entities["symbols"].extend(symbol_matches)
            
            # Deduplicate
            recent_entities["symbols"] = list(set(recent_entities["symbols"]))[:10]
            recent_entities["companies"] = list(set(recent_entities["companies"]))[:10]
            
            self.logger.info(f"Found recent entities: {len(recent_entities['symbols'])} symbols")
            return recent_entities
            
        except Exception as e:
            self.logger.error(f"Failed to get recent entities: {e}")
            return {"symbols": [], "companies": [], "prices": {}}
    
    def _create_embedding_text(self, user_input: str, response: str, entities: Dict[str, Any]) -> str:
        """Create optimized text for embedding generation"""
        parts = [
            f"User: {user_input}",
            f"Response: {response[:300]}",  # Truncate response
        ]
        
        # Add entity information
        if entities.get("symbols"):
            parts.append(f"Symbols: {' '.join(entities['symbols'])}")
        if entities.get("companies"):
            company_names = [c.get("name", str(c)) for c in entities["companies"] if isinstance(c, dict)]
            if company_names:
                parts.append(f"Companies: {' '.join(company_names)}")
        
        return " | ".join(parts)
    
    async def _generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding using OpenAI or fallback to Chroma's default"""
        try:
            if self.openai_client:
                response = self.openai_client.embeddings.create(
                    model="text-embedding-3-small",
                    input=text[:8000]  # Token limit
                )
                return response.data[0].embedding
            else:
                # Let Chroma handle embeddings with default model
                return None
        except Exception as e:
            self.logger.warning(f"Embedding generation failed: {e}")
            return None
    
    async def cleanup_old_memories(self, days_to_keep: int = 30):
        """Clean up old conversation memories"""
        try:
            cutoff_time = datetime.now() - timedelta(days=days_to_keep)
            cutoff_iso = cutoff_time.isoformat()
            
            # Query old memories
            old_results = self.collection.query(
                query_texts=["cleanup"],
                n_results=1000,
                where={"timestamp": {"$lt": cutoff_iso}}
            )
            
            if old_results["ids"] and old_results["ids"][0]:
                old_ids = old_results["ids"][0]
                self.collection.delete(ids=old_ids)
                self.logger.info(f"Cleaned up {len(old_ids)} old memories")
                
        except Exception as e:
            self.logger.warning(f"Memory cleanup failed: {e}")
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """Get memory statistics"""
        try:
            total_memories = self.collection.count()
            return {
                "total_memories": total_memories,
                "storage_path": self.memory_path,
                "status": "active"
            }
        except Exception as e:
            self.logger.error(f"Failed to get memory stats: {e}")
            return {"total_memories": 0, "status": "error", "error": str(e)}


# Global memory service instance
chroma_memory_service = ChromaMemoryService()