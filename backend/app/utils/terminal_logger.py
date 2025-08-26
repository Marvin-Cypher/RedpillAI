"""
Terminal Logger - Comprehensive logging for CLI interactions
Tracks all user inputs, outputs, routing decisions, and performance metrics
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import uuid

class TerminalLogger:
    def __init__(self, log_dir: str = "logs/terminal"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Create separate log files
        self.interaction_log = self.log_dir / "interactions.jsonl"
        self.routing_log = self.log_dir / "routing.jsonl" 
        self.performance_log = self.log_dir / "performance.jsonl"
        self.error_log = self.log_dir / "errors.jsonl"
        self.session_log = self.log_dir / "sessions.jsonl"
        
    def log_interaction(self, 
                       interaction_id: str,
                       user_input: str,
                       system_output: str,
                       session_id: Optional[str] = None,
                       response_time_ms: Optional[float] = None,
                       success: bool = True,
                       metadata: Dict[str, Any] = None):
        """Log user interaction with complete context"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "interaction_id": interaction_id,
            "session_id": session_id,
            "user_input": user_input,
            "system_output": system_output,
            "success": success,
            "response_time_ms": response_time_ms,
            "metadata": metadata or {}
        }
        
        self._write_log_entry(self.interaction_log, entry)
    
    def log_routing_decision(self,
                           interaction_id: str,
                           user_input: str,
                           routing_path: str,
                           handler_used: str,
                           intent_detected: Dict[str, Any] = None,
                           confidence_score: Optional[float] = None):
        """Log how the system routed the user's request"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "interaction_id": interaction_id,
            "user_input": user_input,
            "routing_path": routing_path,  # e.g., "smart_routing -> market_handler"
            "handler_used": handler_used,  # e.g., "_handle_market_query"
            "intent_detected": intent_detected or {},
            "confidence_score": confidence_score
        }
        
        self._write_log_entry(self.routing_log, entry)
    
    def log_performance_metrics(self,
                              interaction_id: str,
                              metrics: Dict[str, Any]):
        """Log performance metrics for analysis"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "interaction_id": interaction_id,
            "metrics": metrics
        }
        
        self._write_log_entry(self.performance_log, entry)
    
    def log_error(self,
                  interaction_id: str,
                  error_type: str,
                  error_message: str,
                  user_input: str,
                  stack_trace: Optional[str] = None):
        """Log errors for debugging"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "interaction_id": interaction_id,
            "error_type": error_type,
            "error_message": error_message,
            "user_input": user_input,
            "stack_trace": stack_trace
        }
        
        self._write_log_entry(self.error_log, entry)
    
    def log_session_event(self,
                         session_id: str,
                         event_type: str,  # created, resumed, ended
                         metadata: Dict[str, Any] = None):
        """Log session lifecycle events"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "session_id": session_id,
            "event_type": event_type,
            "metadata": metadata or {}
        }
        
        self._write_log_entry(self.session_log, entry)
    
    def _write_log_entry(self, log_file: Path, entry: Dict[str, Any]):
        """Write a JSON line entry to the specified log file"""
        try:
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(entry) + '\n')
        except Exception as e:
            # Fallback logging to stdout if file logging fails
            print(f"LOG ERROR: {e}")
            print(f"LOG ENTRY: {json.dumps(entry)}")
    
    def get_interaction_stats(self, hours: int = 24) -> Dict[str, Any]:
        """Get interaction statistics for the last N hours"""
        try:
            cutoff_time = datetime.now().timestamp() - (hours * 3600)
            
            interactions = []
            if self.interaction_log.exists():
                with open(self.interaction_log, 'r') as f:
                    for line in f:
                        try:
                            entry = json.loads(line)
                            entry_time = datetime.fromisoformat(entry['timestamp']).timestamp()
                            if entry_time >= cutoff_time:
                                interactions.append(entry)
                        except:
                            continue
            
            if not interactions:
                return {"total_interactions": 0, "success_rate": 0}
            
            total = len(interactions)
            successful = sum(1 for i in interactions if i.get('success', True))
            avg_response_time = sum(i.get('response_time_ms', 0) for i in interactions) / total
            
            # Analyze common inputs
            inputs = [i['user_input'].lower() for i in interactions]
            input_patterns = {}
            for inp in inputs:
                words = inp.split()
                for word in words:
                    if len(word) > 2:  # Skip short words
                        input_patterns[word] = input_patterns.get(word, 0) + 1
            
            top_patterns = sorted(input_patterns.items(), key=lambda x: x[1], reverse=True)[:10]
            
            return {
                "total_interactions": total,
                "success_rate": successful / total,
                "average_response_time_ms": avg_response_time,
                "top_input_patterns": top_patterns,
                "period_hours": hours
            }
        except Exception as e:
            return {"error": str(e)}
    
    def get_routing_analysis(self) -> Dict[str, Any]:
        """Analyze routing patterns to identify improvements"""
        try:
            routing_data = []
            if self.routing_log.exists():
                with open(self.routing_log, 'r') as f:
                    for line in f:
                        try:
                            routing_data.append(json.loads(line))
                        except:
                            continue
            
            if not routing_data:
                return {"total_routes": 0}
            
            # Analyze handler usage
            handlers = {}
            routing_paths = {}
            
            for entry in routing_data:
                handler = entry.get('handler_used', 'unknown')
                handlers[handler] = handlers.get(handler, 0) + 1
                
                path = entry.get('routing_path', 'unknown')
                routing_paths[path] = routing_paths.get(path, 0) + 1
            
            return {
                "total_routes": len(routing_data),
                "handler_usage": sorted(handlers.items(), key=lambda x: x[1], reverse=True),
                "routing_paths": sorted(routing_paths.items(), key=lambda x: x[1], reverse=True)
            }
        except Exception as e:
            return {"error": str(e)}

# Global logger instance
terminal_logger = TerminalLogger()