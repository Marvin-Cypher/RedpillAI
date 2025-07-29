"""
Workflow Service
Handles workflow execution, data persistence, and analysis tracking
"""

import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from ..database import engine
from ..models.workflows import (
    WorkflowExecution, MarketDataSnapshot, ResearchAnalysis, 
    InvestmentMemo, AnalyticsEvent, WorkflowSummary
)


class WorkflowService:
    """Service for managing workflow executions and data persistence"""
    
    def __init__(self):
        pass
    
    def create_workflow(
        self,
        workflow_type: str,
        company_name: str,
        selected_tokens: List[str] = None,
        investment_amount: float = None,
        valuation: float = None
    ) -> WorkflowExecution:
        """Create a new workflow execution"""
        
        workflow = WorkflowExecution(
            workflow_id=str(uuid.uuid4()),
            workflow_type=workflow_type,
            company_name=company_name,
            selected_tokens=selected_tokens or [],
            investment_amount=investment_amount,
            valuation=valuation,
            status="pending",
            started_at=datetime.utcnow()
        )
        
        with Session(engine) as session:
            session.add(workflow)
            session.commit()
            session.refresh(workflow)
            
        # Log analytics event
        self._log_event("workflow_created", "workflow", workflow.workflow_id, {
            "workflow_type": workflow_type,
            "company_name": company_name
        })
        
        return workflow
    
    def update_workflow_progress(
        self,
        workflow_id: str,
        current_step: str,
        progress_percentage: int,
        status: str = "running"
    ) -> bool:
        """Update workflow progress"""
        
        with Session(engine) as session:
            statement = select(WorkflowExecution).where(WorkflowExecution.workflow_id == workflow_id)
            workflow = session.exec(statement).first()
            if not workflow:
                return False
                
            workflow.current_step = current_step
            workflow.progress_percentage = progress_percentage
            workflow.status = status
            
            # Add step to completed list if at 100%
            if progress_percentage == 100 and current_step not in workflow.steps_completed:
                workflow.steps_completed.append(current_step)
                
            session.commit()
            
        return True
    
    def complete_workflow(self, workflow_id: str, success: bool = True) -> bool:
        """Mark workflow as completed"""
        
        with Session(engine) as session:
            statement = select(WorkflowExecution).where(WorkflowExecution.workflow_id == workflow_id)
            workflow = session.exec(statement).first()
            if not workflow:
                return False
                
            workflow.status = "completed" if success else "failed"
            workflow.completed_at = datetime.utcnow()
            workflow.progress_percentage = 100 if success else workflow.progress_percentage
            
            session.commit()
            
        # Log completion event
        self._log_event("workflow_completed", "workflow", workflow_id, {
            "success": success,
            "duration_minutes": (datetime.utcnow() - workflow.started_at).total_seconds() / 60
        })
        
        return True
    
    def save_market_data(
        self,
        workflow_id: str,
        market_data: Dict[str, Dict[str, Any]]
    ) -> List[MarketDataSnapshot]:
        """Save market data snapshots"""
        
        snapshots = []
        
        with Session(engine) as session:
            for symbol, data in market_data.items():
                snapshot = MarketDataSnapshot(
                    workflow_id=workflow_id,
                    symbol=symbol,
                    current_price=data.get('price', 0),
                    open_price=data.get('open_price'),
                    high_24h=data.get('high_24h'),
                    low_24h=data.get('low_24h'),
                    volume_24h=data.get('volume_24h'),
                    change_percent=data.get('change_24h'),
                    market_cap=data.get('market_cap'),
                    provider=data.get('provider', 'unknown'),
                    source=data.get('source', 'OpenBB'),
                    raw_data=data
                )
                
                session.add(snapshot)
                snapshots.append(snapshot)
                
            session.commit()
            
        self._log_event("market_data_saved", "data", workflow_id, {
            "symbols_count": len(market_data),
            "symbols": list(market_data.keys())
        })
        
        return snapshots
    
    def save_research_analysis(
        self,
        workflow_id: str,
        company_name: str,
        research_data: Dict[str, str],
        processing_time: float = None
    ) -> ResearchAnalysis:
        """Save AI research analysis"""
        
        analysis = ResearchAnalysis(
            workflow_id=workflow_id,
            company_name=company_name,
            summary=research_data.get('summary', ''),
            technical_analysis=research_data.get('technical_analysis', ''),
            team_assessment=research_data.get('team_assessment', ''),
            competitive_position=research_data.get('competitive_position', ''),
            processing_time_seconds=processing_time,
            raw_research_data=research_data
        )
        
        with Session(engine) as session:
            session.add(analysis)
            session.commit()
            session.refresh(analysis)
            
        self._log_event("research_analysis_saved", "ai", workflow_id, {
            "company_name": company_name,
            "processing_time": processing_time
        })
        
        return analysis
    
    def save_investment_memo(
        self,
        workflow_id: str,
        company_name: str,
        memo_content: str,
        investment_amount: float = None,
        valuation: float = None,
        recommendation: str = "TBD",
        status: str = "draft"
    ) -> InvestmentMemo:
        """Save generated investment memo"""
        
        # Extract executive summary (first paragraph after title)
        lines = memo_content.split('\n')
        exec_summary = ""
        for line in lines:
            if line.strip().startswith('##') and 'Executive Summary' in line:
                # Find next paragraph
                idx = lines.index(line)
                for i in range(idx + 1, len(lines)):
                    if lines[i].strip() and not lines[i].startswith('**'):
                        exec_summary = lines[i].strip()
                        break
                break
        
        memo = InvestmentMemo(
            workflow_id=workflow_id,
            company_name=company_name,
            memo_title=f"Investment Analysis: {company_name}",
            investment_amount=investment_amount,
            valuation=valuation,
            ownership_percentage=(investment_amount / valuation * 100) if investment_amount and valuation else None,
            recommendation=recommendation,
            executive_summary=exec_summary or f"Investment analysis for {company_name}",
            full_content=memo_content,
            status=status
        )
        
        with Session(engine) as session:
            session.add(memo)
            session.commit()
            session.refresh(memo)
            
        self._log_event("investment_memo_saved", "analysis", workflow_id, {
            "company_name": company_name,
            "memo_length": len(memo_content),
            "recommendation": recommendation
        })
        
        return memo
    
    def get_workflow(self, workflow_id: str) -> Optional[WorkflowExecution]:
        """Get workflow by ID with all related data"""
        
        with Session(engine) as session:
            statement = (
                select(WorkflowExecution)
                .options(
                    selectinload(WorkflowExecution.market_data),
                    selectinload(WorkflowExecution.research_analysis),
                    selectinload(WorkflowExecution.investment_memos)
                )
                .where(WorkflowExecution.workflow_id == workflow_id)
            )
            workflow = session.exec(statement).first()
            
        return workflow
    
    def get_workflows(
        self,
        company_name: str = None,
        workflow_type: str = None,
        status: str = None,
        limit: int = 50
    ) -> List[WorkflowExecution]:
        """Get workflows with optional filtering"""
        
        with Session(engine) as session:
            statement = select(WorkflowExecution)
            
            if company_name:
                statement = statement.where(WorkflowExecution.company_name.ilike(f"%{company_name}%"))
            if workflow_type:
                statement = statement.where(WorkflowExecution.workflow_type == workflow_type)
            if status:
                statement = statement.where(WorkflowExecution.status == status)
                
            statement = statement.order_by(WorkflowExecution.created_at.desc()).limit(limit)
            workflows = session.exec(statement).all()
            
        return workflows
    
    def get_investment_memos(
        self,
        company_name: str = None,
        status: str = None,
        limit: int = 20
    ) -> List[InvestmentMemo]:
        """Get investment memos with optional filtering"""
        
        with Session(engine) as session:
            statement = select(InvestmentMemo)
            
            if company_name:
                statement = statement.where(InvestmentMemo.company_name.ilike(f"%{company_name}%"))
            if status:
                statement = statement.where(InvestmentMemo.status == status)
                
            statement = statement.order_by(InvestmentMemo.generated_at.desc()).limit(limit)
            memos = session.exec(statement).all()
            
        return memos
    
    def get_workflow_summary(self) -> WorkflowSummary:
        """Get summary statistics for dashboard"""
        
        with Session(engine) as session:
            # Total workflows
            total_workflows = len(session.exec(select(WorkflowExecution)).all())
            
            # Completed workflows
            completed_workflows = len(session.exec(
                select(WorkflowExecution).where(WorkflowExecution.status == "completed")
            ).all())
            
            # Success rate
            success_rate = (completed_workflows / total_workflows * 100) if total_workflows > 0 else 0
            
            # Average duration (for completed workflows)
            completed = session.exec(
                select(WorkflowExecution).where(WorkflowExecution.status == "completed")
            ).all()
            
            avg_duration = 0
            if completed:
                durations = []
                for workflow in completed:
                    if workflow.started_at and workflow.completed_at:
                        duration = (workflow.completed_at - workflow.started_at).total_seconds() / 60
                        durations.append(duration)
                avg_duration = sum(durations) / len(durations) if durations else 0
            
            # Unique companies
            companies = session.exec(select(WorkflowExecution.company_name.distinct())).all()
            companies_analyzed = len(companies)
            
            # Total investment amount
            memos = session.exec(select(InvestmentMemo)).all()
            total_investment = sum(memo.investment_amount or 0 for memo in memos)
            
            # Memos generated
            memos_generated = len(memos)
            
        return WorkflowSummary(
            total_workflows=total_workflows,
            completed_workflows=completed_workflows,
            success_rate=success_rate,
            average_duration_minutes=avg_duration,
            companies_analyzed=companies_analyzed,
            total_investment_amount=total_investment,
            memos_generated=memos_generated
        )
    
    def search_workflows(self, query: str, limit: int = 20) -> List[WorkflowExecution]:
        """Search workflows by company name or workflow type"""
        
        with Session(engine) as session:
            statement = (
                select(WorkflowExecution)
                .where(
                    WorkflowExecution.company_name.ilike(f"%{query}%") |
                    WorkflowExecution.workflow_type.ilike(f"%{query}%")
                )
                .order_by(WorkflowExecution.created_at.desc())
                .limit(limit)
            )
            workflows = session.exec(statement).all()
            
        return workflows
    
    def delete_workflow(self, workflow_id: str) -> bool:
        """Delete workflow and all related data"""
        
        with Session(engine) as session:
            # Delete related data first
            session.exec(select(MarketDataSnapshot).where(MarketDataSnapshot.workflow_id == workflow_id))
            session.exec(select(ResearchAnalysis).where(ResearchAnalysis.workflow_id == workflow_id))
            session.exec(select(InvestmentMemo).where(InvestmentMemo.workflow_id == workflow_id))
            
            # Delete workflow
            workflow = session.get(WorkflowExecution, workflow_id)
            if workflow:
                session.delete(workflow)
                session.commit()
                return True
                
        return False
    
    def _log_event(
        self,
        event_type: str,
        category: str,
        workflow_id: str = None,
        event_data: Dict[str, Any] = None
    ):
        """Log analytics event"""
        
        event = AnalyticsEvent(
            event_type=event_type,
            event_category=category,
            workflow_id=workflow_id,
            event_data=event_data or {}
        )
        
        with Session(engine) as session:
            session.add(event)
            session.commit()


# Global service instance
workflow_service = WorkflowService()