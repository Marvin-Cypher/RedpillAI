"""
Declarative Intent Parser - Claude Code Style

Replaces unreliable AI parsing with rule-based, declarative intent detection.
Follows Claude Code principles of predictable, observable routing.
"""

import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging
from datetime import datetime

from .tool_contracts import CanonicalIntent, tool_registry


class IntentCategory(str, Enum):
    """Categories of intents for organization"""
    PORTFOLIO = "portfolio"
    MARKET_DATA = "market_data"
    SYSTEM = "system"
    ANALYSIS = "analysis" 
    FILE_OPERATIONS = "file_operations"


@dataclass
class IntentPattern:
    """
    Declarative pattern for intent recognition
    
    Defines exact rules for when an intent should be recognized
    """
    intent_name: str
    category: IntentCategory
    keywords: List[str]  # Required keywords
    optional_keywords: List[str]  # Optional keywords that boost confidence
    entity_patterns: Dict[str, str]  # Regex patterns for entity extraction
    exclusion_keywords: List[str]  # Keywords that disqualify this intent
    confidence_base: float  # Base confidence score
    requires_entities: List[str]  # Entities that must be present
    examples: List[str]  # Example commands this pattern should match


class DeclarativeIntentParser:
    """
    Rule-based intent parser following Claude Code principles
    
    Provides predictable, observable intent detection without AI dependency
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.patterns = self._initialize_patterns()
        
    def _initialize_patterns(self) -> Dict[str, IntentPattern]:
        """Initialize all intent patterns following declarative principles"""
        
        patterns = {
            "portfolio_import": IntentPattern(
                intent_name="portfolio_import",
                category=IntentCategory.PORTFOLIO,
                keywords=["import", "portfolio", "from"],
                optional_keywords=["my", "load", "upload", "add"],
                entity_patterns={
                    "file_path": r'(/[^\s]+\.(?:csv|json|xlsx?))',
                    "portfolio_type": r'\b(crypto|stock|equity|bond|mixed|general)\b'
                },
                exclusion_keywords=["export", "download"],
                confidence_base=0.9,
                requires_entities=["file_path"],
                examples=[
                    "import my portfolio from /path/to/file.csv",
                    "load portfolio from crypto_holdings.json",
                    "import crypto portfolio from /Users/data/trades.csv"
                ]
            ),
            
            "api_status": IntentPattern(
                intent_name="api_status",
                category=IntentCategory.SYSTEM,
                keywords=["api", "key"],
                optional_keywords=["what", "which", "show", "check", "status", "configure"],
                entity_patterns={
                    "action": r'\b(check|show|status|configure|setup|fill|need)\b'
                },
                exclusion_keywords=[],
                confidence_base=0.95,
                requires_entities=[],
                examples=[
                    "what api keys should i fill in",
                    "check api key status", 
                    "which api keys do i need",
                    "show api configuration"
                ]
            ),
            
            "portfolio_overview": IntentPattern(
                intent_name="portfolio_overview", 
                category=IntentCategory.PORTFOLIO,
                keywords=["portfolio"],
                optional_keywords=["show", "view", "display", "overview", "summary"],
                entity_patterns={
                    "detail_level": r'\b(brief|detailed|summary|full)\b',
                    "timeframe": r'\b(today|week|month|year|ytd)\b'
                },
                exclusion_keywords=["import", "export", "from", "to"],
                confidence_base=0.85,
                requires_entities=[],
                examples=[
                    "portfolio",
                    "show portfolio", 
                    "portfolio overview",
                    "view my portfolio summary"
                ]
            ),
            
            "stock_price": IntentPattern(
                intent_name="stock_price",
                category=IntentCategory.MARKET_DATA,
                keywords=["price"],
                optional_keywords=["stock", "quote", "current", "latest", "get"],
                entity_patterns={
                    "tickers": r'\b([A-Z]{1,5})\b',  # Stock tickers
                    "crypto_symbols": r'\b(BTC|ETH|ADA|SOL|DOGE|[A-Z]{2,10})\b'
                },
                exclusion_keywords=["historical", "chart"],
                confidence_base=0.8,
                requires_entities=["tickers", "crypto_symbols"],  # At least one required
                examples=[
                    "AAPL stock price",
                    "get price for BTC",
                    "current TSLA quote",
                    "Bitcoin price"
                ]
            ),
            
            "market_analysis": IntentPattern(
                intent_name="market_analysis",
                category=IntentCategory.ANALYSIS,
                keywords=["analyze", "analysis"],
                optional_keywords=["market", "stock", "crypto", "fundamental", "technical"],
                entity_patterns={
                    "tickers": r'\b([A-Z]{1,5})\b',
                    "analysis_type": r'\b(fundamental|technical|sentiment|trend)\b'
                },
                exclusion_keywords=[],
                confidence_base=0.75,
                requires_entities=["tickers"],
                examples=[
                    "analyze Tesla fundamentals",
                    "technical analysis of AAPL",
                    "analyze BTC trends"
                ]
            ),
            
            "help": IntentPattern(
                intent_name="help",
                category=IntentCategory.SYSTEM,
                keywords=["help"],
                optional_keywords=["commands", "usage", "how", "what"],
                entity_patterns={},
                exclusion_keywords=[],
                confidence_base=0.95,
                requires_entities=[],
                examples=[
                    "help",
                    "show help",
                    "what commands are available",
                    "how do I use this"
                ]
            )
        }
        
        return patterns
    
    def parse_intent(self, command: str, user_id: Optional[str] = None) -> CanonicalIntent:
        """
        Parse user command into canonical intent following Claude Code principles
        
        Args:
            command: Raw user command
            user_id: Optional user identifier
            
        Returns:
            CanonicalIntent with all extracted information and trace
        """
        
        # Create canonical intent with trace
        intent = CanonicalIntent(
            intent="unknown",
            original_command=command,
            user_id=user_id
        )
        
        intent.add_trace_step("declarative_parsing_start", {"command": command})
        
        # Normalize command
        normalized = self._normalize_command(command)
        intent.add_trace_step("command_normalized", {"normalized": normalized})
        
        # Find matching patterns
        matches = self._find_matching_patterns(normalized)
        intent.add_trace_step("pattern_matching", {"matches_found": len(matches)})
        
        if not matches:
            intent.intent = "unknown"
            intent.confidence = 0.0
            intent.add_retry_hint("Try rephrasing your command")
            intent.add_retry_hint("Use 'help' to see available commands")
            intent.add_trace_step("no_matches_found", {"normalized_command": normalized})
            return intent
        
        # Select best match
        best_match = self._select_best_match(matches, normalized)
        intent.add_trace_step("best_match_selected", {
            "intent": best_match["pattern"].intent_name,
            "confidence": best_match["confidence"]
        })
        
        # Extract entities
        entities = self._extract_entities(best_match["pattern"], normalized)
        intent.add_trace_step("entity_extraction", {"entities": entities})
        
        # Validate required entities
        validation_result = self._validate_entities(best_match["pattern"], entities)
        intent.add_trace_step("entity_validation", validation_result)
        
        # Build final intent
        intent.intent = best_match["pattern"].intent_name
        intent.entities = entities
        intent.confidence = best_match["confidence"]
        
        # Add assumptions and hints
        self._add_processing_assumptions(intent, best_match["pattern"], entities)
        
        # Validate against tool contract if available
        self._validate_against_tool_contract(intent)
        
        intent.add_trace_step("parsing_complete", {
            "final_intent": intent.intent,
            "final_confidence": intent.confidence,
            "entities_count": len(intent.entities)
        })
        
        return intent
    
    def _normalize_command(self, command: str) -> str:
        """Normalize command for consistent processing"""
        # Convert to lowercase, strip whitespace
        normalized = command.lower().strip()
        
        # Remove extra whitespace
        normalized = re.sub(r'\s+', ' ', normalized)
        
        # Handle common contractions
        normalized = normalized.replace("i'm", "i am")
        normalized = normalized.replace("what's", "what is")
        normalized = normalized.replace("can't", "cannot")
        
        return normalized
    
    def _find_matching_patterns(self, command: str) -> List[Dict[str, Any]]:
        """Find all patterns that match the command"""
        matches = []
        
        for pattern_name, pattern in self.patterns.items():
            match_score = self._calculate_pattern_match(pattern, command)
            if match_score > 0:
                matches.append({
                    "pattern": pattern,
                    "score": match_score,
                    "confidence": min(match_score * pattern.confidence_base, 0.99)
                })
        
        return sorted(matches, key=lambda x: x["confidence"], reverse=True)
    
    def _calculate_pattern_match(self, pattern: IntentPattern, command: str) -> float:
        """Calculate how well a pattern matches the command"""
        
        # Check for exclusion keywords first
        for exclusion in pattern.exclusion_keywords:
            if exclusion.lower() in command:
                return 0.0
        
        # Count required keywords
        required_matches = 0
        for keyword in pattern.keywords:
            if keyword.lower() in command:
                required_matches += 1
        
        # Must have all required keywords
        if required_matches < len(pattern.keywords):
            return 0.0
        
        # Count optional keywords
        optional_matches = 0
        for keyword in pattern.optional_keywords:
            if keyword.lower() in command:
                optional_matches += 1
        
        # Calculate base score
        required_ratio = required_matches / len(pattern.keywords) if pattern.keywords else 1.0
        optional_bonus = (optional_matches / len(pattern.optional_keywords)) * 0.2 if pattern.optional_keywords else 0
        
        return min(required_ratio + optional_bonus, 1.0)
    
    def _select_best_match(self, matches: List[Dict[str, Any]], command: str) -> Dict[str, Any]:
        """Select the best matching pattern"""
        # For now, just return the highest confidence match
        # Future enhancement: Could add tie-breaking logic
        return matches[0]
    
    def _extract_entities(self, pattern: IntentPattern, command: str) -> Dict[str, Any]:
        """Extract entities using pattern's regex definitions"""
        entities = {}
        
        for entity_name, regex_pattern in pattern.entity_patterns.items():
            matches = re.findall(regex_pattern, command, re.IGNORECASE)
            if matches:
                # Handle tuple matches from groups
                if isinstance(matches[0], tuple):
                    # Take first non-empty group
                    filtered_matches = []
                    for match_tuple in matches:
                        for group in match_tuple:
                            if group:
                                filtered_matches.append(group)
                                break
                    entities[entity_name] = filtered_matches if len(filtered_matches) > 1 else filtered_matches[0] if filtered_matches else None
                else:
                    entities[entity_name] = matches if len(matches) > 1 else matches[0]
        
        return entities
    
    def _validate_entities(self, pattern: IntentPattern, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Validate extracted entities against pattern requirements"""
        
        validation = {
            "valid": True,
            "missing_required": [],
            "warnings": []
        }
        
        # Check required entities (OR logic - at least one from the list)
        if pattern.requires_entities:
            has_required = any(entity in entities for entity in pattern.requires_entities)
            if not has_required:
                validation["valid"] = False
                validation["missing_required"] = pattern.requires_entities
        
        return validation
    
    def _add_processing_assumptions(self, intent: CanonicalIntent, pattern: IntentPattern, entities: Dict[str, Any]) -> None:
        """Add assumptions based on pattern and entities"""
        
        # File path assumptions
        if "file_path" in entities:
            intent.add_assumption("File exists and is readable")
            intent.add_assumption("File format is supported")
            intent.add_retry_hint("Check file path spelling")
            intent.add_retry_hint("Verify file permissions")
        
        # Ticker assumptions
        if "tickers" in entities:
            intent.add_assumption("Tickers are valid and tradeable")
            intent.add_retry_hint("Use standard ticker symbols")
        
        # General assumptions
        intent.add_assumption(f"Intent classification confidence: {intent.confidence:.2f}")
    
    def _validate_against_tool_contract(self, intent: CanonicalIntent) -> None:
        """Validate intent against registered tool contract if available"""
        
        tool_contract = tool_registry.get_tool(intent.intent)
        if tool_contract:
            is_valid, errors = tool_contract.validate_input(intent.entities)
            intent.add_trace_step("tool_contract_validation", {
                "tool_found": True,
                "validation_passed": is_valid,
                "errors": errors
            })
            
            if not is_valid:
                intent.confidence *= 0.8  # Reduce confidence for validation errors
                for error in errors:
                    intent.add_retry_hint(f"Contract validation: {error}")
        else:
            intent.add_trace_step("tool_contract_validation", {
                "tool_found": False,
                "message": f"No contract found for intent: {intent.intent}"
            })
    
    def get_supported_intents(self) -> List[Dict[str, Any]]:
        """Get list of supported intents with examples"""
        
        intents = []
        for pattern_name, pattern in self.patterns.items():
            intents.append({
                "name": pattern.intent_name,
                "category": pattern.category.value,
                "description": f"Pattern for {pattern.intent_name}",
                "examples": pattern.examples,
                "confidence_base": pattern.confidence_base
            })
        
        return intents
    
    def debug_parse(self, command: str) -> Dict[str, Any]:
        """Debug version of parse that returns detailed matching information"""
        
        normalized = self._normalize_command(command)
        matches = self._find_matching_patterns(normalized)
        
        debug_info = {
            "original_command": command,
            "normalized_command": normalized,
            "total_patterns": len(self.patterns),
            "matching_patterns": len(matches),
            "matches": []
        }
        
        for match in matches:
            entities = self._extract_entities(match["pattern"], normalized)
            validation = self._validate_entities(match["pattern"], entities)
            
            debug_info["matches"].append({
                "pattern_name": match["pattern"].intent_name,
                "confidence": match["confidence"],
                "entities": entities,
                "validation": validation,
                "keywords_matched": [kw for kw in match["pattern"].keywords if kw in normalized],
                "optional_matched": [kw for kw in match["pattern"].optional_keywords if kw in normalized]
            })
        
        return debug_info


# Global parser instance
intent_parser = DeclarativeIntentParser()