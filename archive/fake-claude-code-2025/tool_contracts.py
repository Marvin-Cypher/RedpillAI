"""
Tool Contract System - Claude Code Style Architecture

This module implements self-describing tool contracts with schemas,
following declarative design principles from Claude Code architecture.
"""

from typing import Dict, List, Any, Optional, Union, Callable
from pydantic import BaseModel, Field
from enum import Enum
import json
import uuid
from datetime import datetime


class SideEffect(str, Enum):
    """Enumeration of possible tool side effects"""
    DATABASE_READ = "database_read"
    DATABASE_WRITE = "database_write" 
    FILE_READ = "file_read"
    FILE_WRITE = "file_write"
    NETWORK_REQUEST = "network_request"
    SYSTEM_COMMAND = "system_command"
    STATE_MUTATION = "state_mutation"


class ErrorType(str, Enum):
    """Enumeration of possible error types"""
    FILE_NOT_FOUND = "file_not_found"
    PERMISSION_DENIED = "permission_denied"
    INVALID_FORMAT = "invalid_format"
    NETWORK_ERROR = "network_error"
    VALIDATION_ERROR = "validation_error"
    TIMEOUT = "timeout"
    API_LIMIT_EXCEEDED = "api_limit_exceeded"
    AUTHENTICATION_FAILED = "authentication_failed"


class ToolExample(BaseModel):
    """Example input/output for a tool"""
    description: str = Field(..., description="Human-readable description of this example")
    input: Dict[str, Any] = Field(..., description="Example input parameters")
    expected_output: Dict[str, Any] = Field(..., description="Expected output structure")
    error_type: Optional[ErrorType] = Field(None, description="Error type if this is an error example")
    context: Optional[str] = Field(None, description="Additional context for this example")


class ToolContract(BaseModel):
    """
    Self-describing tool contract following Claude Code principles
    
    Each tool must define:
    - What it does (description)
    - What input it expects (input_schema)
    - What side effects it has (side_effects)
    - What errors it can produce (error_surface)
    - Examples covering normal and edge cases
    """
    
    name: str = Field(..., description="Unique tool identifier")
    description: str = Field(..., description="Human-readable description of tool purpose")
    category: str = Field(..., description="Tool category (e.g., 'portfolio', 'market_data', 'system')")
    
    # Schema definitions
    input_schema: Dict[str, Any] = Field(..., description="JSON schema for input validation")
    output_schema: Dict[str, Any] = Field(..., description="JSON schema for output structure")
    
    # Behavioral contracts
    side_effects: List[SideEffect] = Field(default=[], description="List of side effects this tool produces")
    error_surface: List[ErrorType] = Field(default=[], description="List of possible error types")
    
    # Documentation and examples
    examples: List[ToolExample] = Field(default=[], description="Examples covering normal and edge cases")
    
    # Execution metadata
    timeout_seconds: Optional[int] = Field(30, description="Maximum execution time")
    requires_confirmation: bool = Field(False, description="Whether tool requires user confirmation")
    confidence_threshold: float = Field(0.8, description="Minimum confidence required to execute")
    
    # Implementation reference
    executor_function: Optional[str] = Field(None, description="Reference to actual implementation")
    
    def validate_input(self, input_data: Dict[str, Any]) -> tuple[bool, List[str]]:
        """
        Validate input against the tool's schema
        
        Returns:
            tuple: (is_valid, list_of_errors)
        """
        # This would use jsonschema validation in practice
        errors = []
        
        # Basic required field validation
        if "properties" in self.input_schema and "required" in self.input_schema:
            required_fields = self.input_schema["required"]
            for field in required_fields:
                if field not in input_data:
                    errors.append(f"Missing required field: {field}")
        
        return len(errors) == 0, errors
    
    def get_example_by_scenario(self, scenario: str) -> Optional[ToolExample]:
        """Get example by scenario description"""
        for example in self.examples:
            if scenario.lower() in example.description.lower():
                return example
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return self.dict()
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ToolContract':
        """Create from dictionary"""
        return cls(**data)


class ToolRegistry(BaseModel):
    """
    Registry of all available tools with their contracts
    
    Follows Claude Code principle of declarative tool description
    """
    
    tools: Dict[str, ToolContract] = Field(default={}, description="Registry of tool name -> contract")
    version: str = Field("1.0.0", description="Registry version")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update timestamp")
    
    def register_tool(self, contract: ToolContract) -> None:
        """Register a new tool contract"""
        self.tools[contract.name] = contract
        self.updated_at = datetime.now()
    
    def get_tool(self, name: str) -> Optional[ToolContract]:
        """Get tool contract by name"""
        return self.tools.get(name)
    
    def get_tools_by_category(self, category: str) -> List[ToolContract]:
        """Get all tools in a specific category"""
        return [tool for tool in self.tools.values() if tool.category == category]
    
    def get_tools_with_side_effect(self, side_effect: SideEffect) -> List[ToolContract]:
        """Get all tools that have a specific side effect"""
        return [tool for tool in self.tools.values() if side_effect in tool.side_effects]
    
    def list_tool_names(self) -> List[str]:
        """Get list of all registered tool names"""
        return list(self.tools.keys())
    
    def validate_tool_exists(self, name: str) -> bool:
        """Check if tool exists in registry"""
        return name in self.tools
    
    def get_registry_summary(self) -> Dict[str, Any]:
        """Get summary of registry contents"""
        categories = {}
        for tool in self.tools.values():
            if tool.category not in categories:
                categories[tool.category] = []
            categories[tool.category].append(tool.name)
        
        return {
            "total_tools": len(self.tools),
            "categories": categories,
            "version": self.version,
            "updated_at": self.updated_at.isoformat()
        }
    
    def to_json(self) -> str:
        """Serialize registry to JSON"""
        return self.json(indent=2, default=str)
    
    @classmethod
    def from_json(cls, json_str: str) -> 'ToolRegistry':
        """Load registry from JSON"""
        return cls.parse_raw(json_str)


class CanonicalIntent(BaseModel):
    """
    Canonical intent schema following Claude Code principles
    
    Every command becomes this standardized format for consistent processing
    """
    
    # Core intent identification
    intent: str = Field(..., description="Primary intent identifier")
    entities: Dict[str, Any] = Field(default={}, description="Extracted entities and parameters")
    
    # Contextual information
    timeframe: Optional[Dict[str, Any]] = Field(None, description="Time-related constraints")
    output_format: str = Field("text", description="Requested output format")
    confidence: float = Field(0.0, description="Confidence in intent classification")
    
    # Original context
    original_command: str = Field(..., description="Original user command")
    user_id: Optional[str] = Field(None, description="User identifier if available")
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Session identifier")
    
    # Processing metadata
    trace: Dict[str, Any] = Field(default={}, description="Processing trace information")
    assumptions: List[str] = Field(default=[], description="Assumptions made during processing")
    retry_hints: List[str] = Field(default=[], description="Hints for retry if execution fails")
    
    # Execution context
    requires_confirmation: bool = Field(False, description="Whether execution requires user confirmation")
    estimated_duration: Optional[int] = Field(None, description="Estimated execution time in seconds")
    
    def add_trace_step(self, step: str, details: Optional[Dict[str, Any]] = None) -> None:
        """Add a step to the processing trace"""
        if "steps" not in self.trace:
            self.trace["steps"] = []
        
        trace_entry = {
            "step": step,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.trace["steps"].append(trace_entry)
    
    def add_assumption(self, assumption: str) -> None:
        """Add an assumption made during processing"""
        if assumption not in self.assumptions:
            self.assumptions.append(assumption)
    
    def add_retry_hint(self, hint: str) -> None:
        """Add a hint for potential retry"""
        if hint not in self.retry_hints:
            self.retry_hints.append(hint)
    
    def get_processing_summary(self) -> Dict[str, Any]:
        """Get summary of processing information"""
        return {
            "intent": self.intent,
            "confidence": self.confidence,
            "trace_steps": len(self.trace.get("steps", [])),
            "assumptions_count": len(self.assumptions),
            "retry_hints_count": len(self.retry_hints),
            "requires_confirmation": self.requires_confirmation
        }


class ToolExecutionResult(BaseModel):
    """
    Standardized result from tool execution
    
    Always provides trace and next actions following Claude Code principles
    """
    
    # Execution outcome
    success: bool = Field(..., description="Whether execution succeeded")
    tool_name: str = Field(..., description="Name of executed tool")
    
    # Result data
    result: Optional[Dict[str, Any]] = Field(None, description="Tool execution result data")
    message: str = Field(..., description="Human-readable result message")
    
    # Error information (if applicable)
    error_type: Optional[ErrorType] = Field(None, description="Type of error if execution failed")
    error_details: Optional[Dict[str, Any]] = Field(None, description="Detailed error information")
    
    # Observability
    execution_time_ms: Optional[float] = Field(None, description="Execution time in milliseconds")
    trace: Dict[str, Any] = Field(default={}, description="Detailed execution trace")
    
    # Next steps (never fail silently)
    suggested_actions: List[str] = Field(default=[], description="Suggested actions for user")
    retry_with: Optional[Dict[str, Any]] = Field(None, description="Alternative parameters for retry")
    related_tools: List[str] = Field(default=[], description="Related tools that might help")
    
    # Metadata
    execution_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique execution identifier")
    timestamp: datetime = Field(default_factory=datetime.now, description="Execution timestamp")
    
    def add_suggested_action(self, action: str) -> None:
        """Add a suggested action for the user"""
        if action not in self.suggested_actions:
            self.suggested_actions.append(action)
    
    def add_related_tool(self, tool_name: str) -> None:
        """Add a related tool suggestion"""
        if tool_name not in self.related_tools:
            self.related_tools.append(tool_name)
    
    def is_retryable(self) -> bool:
        """Check if this execution can be retried with different parameters"""
        return self.retry_with is not None
    
    def to_user_message(self) -> str:
        """Convert to user-friendly message"""
        if self.success:
            return self.message
        else:
            msg = f"❌ {self.message}"
            if self.suggested_actions:
                msg += "\n\n💡 **Suggestions:**"
                for action in self.suggested_actions:
                    msg += f"\n• {action}"
            return msg


# Global tool registry instance
tool_registry = ToolRegistry()