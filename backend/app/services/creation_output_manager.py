"""
Creation Output Manager - Routes CLI outputs to Web UI
Handles tables, charts, reports, and research properly
"""

import webbrowser
import json
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
from datetime import datetime
from .creation_recorder import creation_recorder, CreationType, CreationCategory
from .table_formatter import FinancialTableFormatter


class CreationOutputManager:
    """
    Manages all CLI outputs - routes complex content to web UI, stores everything
    
    This solves the core UX issues:
    1. Large tables → OpenBB interactive tables in browser + web UI storage
    2. Long reports → Save to web UI with summary in CLI  
    3. All outputs → Permanent storage organized by company/portfolio
    """
    
    def __init__(self):
        self.table_formatter = FinancialTableFormatter()
        self.web_ui_base = "http://localhost:3002"  # Frontend URL
        
    async def handle_table_output(
        self,
        data: List[Dict[str, Any]], 
        title: str,
        user_id: str = "default",
        symbols: List[str] = None,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Smart table handling - CLI summary + web storage + OpenBB when needed
        """
        if not data:
            return {"cli_output": "No data available", "web_url": None}
            
        symbols = symbols or []
        
        # Always save to creation system first
        creation_id = await creation_recorder.record_data_creation(
            user_id=user_id,
            openbb_tool="table_search",
            parameters={"symbols": symbols, "title": title, **(context or {})},
            result_data={"data": data, "title": title},
            creation_type=CreationType.TABLE
        )
        
        # Determine output method based on complexity
        if self.table_formatter.should_use_openbb_table(data):
            # Complex data → OpenBB interactive table + web UI
            return self._handle_complex_table(data, title, creation_id, symbols)
        else:
            # Simple data → CLI box table + web storage
            return self._handle_simple_table(data, title, creation_id)
    
    async def handle_report_output(
        self,
        content: str,
        title: str,
        report_type: str = "research",
        user_id: str = "default", 
        symbols: List[str] = None,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Handle long reports - save to web UI, show summary in CLI
        """
        symbols = symbols or []
        
        # Save full report to creation system
        creation_id = await creation_recorder.record_analysis_creation(
            user_id=user_id,
            analysis_type=report_type,
            symbols=symbols,
            analysis_data={"content": content, "title": title, "context": context or {}},
            investment_thesis=context.get("investment_thesis") if context else None
        )
        
        # Generate summary for CLI (first 2-3 sentences)
        summary = self._extract_summary(content)
        web_url = f"{self.web_ui_base}/creations/{creation_id}"
        
        # Auto-open web UI for reports
        try:
            webbrowser.open(web_url)
            browser_status = "✅ Opened in web UI"
        except:
            browser_status = "🔗 Open manually"
            
        cli_output = f"""📋 **{title}** 

{summary}

🌐 **Full Report:** {web_url} ({browser_status})
💾 **Saved to:** AI Workspace → {report_type.title()} Reports
📊 **View All:** http://localhost:3002/workspace
🏷️ **Companies:** {', '.join(symbols) if symbols else 'General'}"""

        return {
            "cli_output": cli_output,
            "web_url": web_url,
            "creation_id": creation_id,
            "type": "report"
        }
    
    async def handle_chart_output(
        self,
        chart_data: Dict[str, Any],
        title: str,
        symbols: List[str],
        user_id: str = "default",
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Handle chart creation - always show in web UI + OpenBB integration
        """
        # Save chart to creation system  
        creation_id = await creation_recorder.record_chart_creation(
            user_id=user_id,
            symbol=symbols[0] if symbols else "MARKET",
            asset_type="equity",  # or "crypto" based on context
            chart_result=chart_data,
            openbb_tool="chart_generation",
            parameters=context or {}
        )
        
        # Generate web URL and auto-open
        web_url = f"{self.web_ui_base}/creations/{creation_id}"
        
        try:
            webbrowser.open(web_url)
            browser_status = "✅ Opened automatically"
        except:
            browser_status = "🔗 Open manually"
            
        cli_output = f"""📈 **{title}** 

🌐 **Interactive Chart:** {web_url} ({browser_status})
📊 **Symbols:** {', '.join(symbols)}
💾 **Saved to:** AI Workspace → Charts & Analysis
📊 **View All:** http://localhost:3002/workspace"""

        return {
            "cli_output": cli_output,
            "web_url": web_url,
            "creation_id": creation_id,
            "type": "chart"
        }
    
    def _handle_complex_table(
        self, 
        data: List[Dict[str, Any]], 
        title: str, 
        creation_id: str,
        symbols: List[str]
    ) -> Dict[str, Any]:
        """Handle large/complex tables with OpenBB + web UI"""
        
        # Generate OpenBB interactive table
        openbb_output = self.table_formatter.create_openbb_interactive_table(data)
        
        # Also save to web UI
        web_url = f"{self.web_ui_base}/creations/{creation_id}"
        
        # CLI shows both OpenBB popup and web UI info
        cli_output = f"""{openbb_output}

🌐 **Also available in:** {web_url}
💾 **Permanently stored** in AI Workspace
📊 **View All:** http://localhost:3002/workspace
🏷️ **Companies:** {', '.join(symbols) if symbols else 'Market data'}"""
        
        return {
            "cli_output": cli_output,
            "web_url": web_url, 
            "creation_id": creation_id,
            "type": "complex_table"
        }
    
    def _handle_simple_table(
        self, 
        data: List[Dict[str, Any]], 
        title: str, 
        creation_id: str
    ) -> Dict[str, Any]:
        """Handle simple tables with CLI box table + web backup"""
        
        # Generate clean CLI table
        cli_table = self.table_formatter.create_clean_box_table(data)
        web_url = f"{self.web_ui_base}/creations/{creation_id}"
        
        cli_output = f"""{cli_table}

💾 **Saved to AI Workspace:** {web_url}
📊 **View All:** http://localhost:3002/workspace"""
        
        return {
            "cli_output": cli_output,
            "web_url": web_url,
            "creation_id": creation_id, 
            "type": "simple_table"
        }
    
    def _extract_summary(self, content: str, max_sentences: int = 3) -> str:
        """Extract first few sentences as summary"""
        import re
        
        # Split into sentences (basic approach)
        sentences = re.split(r'[.!?]+', content)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        # Take first few sentences
        summary_sentences = sentences[:max_sentences]
        summary = '. '.join(summary_sentences)
        
        if len(sentences) > max_sentences:
            summary += "..."
            
        return summary
    
    def get_user_creations(
        self,
        user_id: str = "default",
        creation_type: Optional[str] = None,
        symbols: Optional[List[str]] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get user's recent creations for workspace view"""
        
        # This would integrate with the creation_recorder to fetch stored items
        # organized by company/portfolio as requested
        return creation_recorder.get_user_creations(
            user_id=user_id,
            creation_type=creation_type,
            symbols=symbols,
            limit=limit
        )


# Singleton instance
output_manager = CreationOutputManager()