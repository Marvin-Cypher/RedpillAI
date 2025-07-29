"""
OpenProject Integration Service for RedpillAI
Manages VC portfolio projects, deals, and documentation
"""

import os
import requests
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class ProjectStatus(Enum):
    PIPELINE = "pipeline"
    DILIGENCE = "due_diligence" 
    NEGOTIATION = "negotiation"
    CLOSED = "closed"
    PORTFOLIO = "portfolio"
    EXITED = "exited"

class DealStage(Enum):
    SOURCING = "sourcing"
    INITIAL_MEETING = "initial_meeting"
    DEEP_DIVE = "deep_dive"
    TERM_SHEET = "term_sheet"
    DUE_DILIGENCE = "due_diligence"
    CLOSING = "closing"
    PORTFOLIO_MONITORING = "portfolio_monitoring"

@dataclass
class PortfolioProject:
    id: str
    name: str
    company_name: str
    status: ProjectStatus
    deal_stage: DealStage
    description: str
    created_at: datetime
    updated_at: datetime
    custom_fields: Dict[str, Any]
    
    # VC-specific fields
    investment_amount: Optional[float] = None
    valuation: Optional[float] = None
    ownership_percentage: Optional[float] = None
    lead_partner: Optional[str] = None
    sector: Optional[str] = None
    stage: Optional[str] = None  # Seed, Series A, etc.
    
@dataclass
class ProjectDocument:
    id: str
    project_id: str
    title: str
    content: str
    document_type: str  # memo, notes, dd_report, term_sheet
    created_by: str
    created_at: datetime
    attachments: List[str]

class OpenProjectService:
    """
    Service for managing VC portfolio projects via OpenProject API
    """
    
    def __init__(self):
        self.base_url = os.getenv('OPENPROJECT_URL', 'http://localhost:8080/api/v3')
        self.api_key = os.getenv('OPENPROJECT_API_KEY', '')
        self.headers = {
            'Authorization': f'Basic {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        # VC-specific custom fields mapping
        self.custom_field_mapping = {
            'investment_amount': 'customField1',
            'valuation': 'customField2', 
            'ownership_percentage': 'customField3',
            'lead_partner': 'customField4',
            'sector': 'customField5',
            'deal_stage': 'customField6',
            'next_milestone': 'customField7',
            'key_contacts': 'customField8'
        }
    
    async def health_check(self) -> bool:
        """Check if OpenProject is available"""
        try:
            response = requests.get(f"{self.base_url}/projects", headers=self.headers, timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"OpenProject health check failed: {e}")
            return False
    
    # Project Management
    async def create_portfolio_project(self, project_data: Dict[str, Any]) -> Optional[PortfolioProject]:
        """Create a new portfolio project in OpenProject"""
        try:
            # Map VC data to OpenProject project structure
            openproject_data = {
                "name": project_data.get('company_name'),
                "description": project_data.get('description', ''),
                "status": {"href": "/api/v3/statuses/1"},  # Active status
                "type": {"href": "/api/v3/types/1"},       # Project type
                "customField1": project_data.get('investment_amount'),
                "customField2": project_data.get('valuation'),
                "customField3": project_data.get('ownership_percentage'),
                "customField4": project_data.get('lead_partner'),
                "customField5": project_data.get('sector'),
                "customField6": project_data.get('deal_stage', DealStage.SOURCING.value)
            }
            
            response = requests.post(
                f"{self.base_url}/projects",
                json=openproject_data,
                headers=self.headers
            )
            
            if response.status_code == 201:
                project_data = response.json()
                return self._map_openproject_to_portfolio(project_data)
            else:
                logger.error(f"Failed to create project: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating portfolio project: {e}")
            return None
    
    async def get_portfolio_projects(self, filters: Optional[Dict] = None) -> List[PortfolioProject]:
        """Get all portfolio projects with optional filtering"""
        try:
            params = {}
            if filters:
                if 'status' in filters:
                    params['filters'] = f'[{{"status":{{"operator":"=","values":["{filters["status"]}"]}}}}]'
                if 'sector' in filters:
                    params['filters'] = f'[{{"customField5":{{"operator":"=","values":["{filters["sector"]}"]}}}}]'
            
            response = requests.get(
                f"{self.base_url}/projects",
                params=params,
                headers=self.headers
            )
            
            if response.status_code == 200:
                projects_data = response.json()
                return [
                    self._map_openproject_to_portfolio(project) 
                    for project in projects_data.get('_embedded', {}).get('elements', [])
                ]
            else:
                logger.error(f"Failed to fetch projects: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching portfolio projects: {e}")
            return []
    
    async def update_project_status(self, project_id: str, status: ProjectStatus, deal_stage: Optional[DealStage] = None) -> bool:
        """Update project status and deal stage"""
        try:
            update_data = {
                "status": {"href": f"/api/v3/statuses/{self._status_to_id(status)}"}
            }
            
            if deal_stage:
                update_data["customField6"] = deal_stage.value
            
            response = requests.patch(
                f"{self.base_url}/projects/{project_id}",
                json=update_data,
                headers=self.headers
            )
            
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Error updating project status: {e}")
            return False
    
    # Document Management
    async def create_project_document(self, project_id: str, doc_data: Dict[str, Any]) -> Optional[ProjectDocument]:
        """Create a wiki page or document for a project"""
        try:
            # Create wiki page in OpenProject
            wiki_data = {
                "title": doc_data.get('title'),
                "text": {
                    "format": "markdown",
                    "raw": doc_data.get('content', '')
                }
            }
            
            response = requests.post(
                f"{self.base_url}/projects/{project_id}/wiki_pages",
                json=wiki_data,
                headers=self.headers
            )
            
            if response.status_code == 201:
                wiki_page = response.json()
                return ProjectDocument(
                    id=str(wiki_page['id']),
                    project_id=project_id,
                    title=wiki_page['title'],
                    content=wiki_page['text']['raw'],
                    document_type=doc_data.get('document_type', 'notes'),
                    created_by=doc_data.get('created_by', 'system'),
                    created_at=datetime.now(),
                    attachments=[]
                )
            else:
                logger.error(f"Failed to create document: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error creating project document: {e}")
            return None
    
    async def get_project_documents(self, project_id: str) -> List[ProjectDocument]:
        """Get all documents for a project"""
        try:
            response = requests.get(
                f"{self.base_url}/projects/{project_id}/wiki_pages",
                headers=self.headers
            )
            
            if response.status_code == 200:
                pages_data = response.json()
                documents = []
                
                for page in pages_data.get('_embedded', {}).get('elements', []):
                    documents.append(ProjectDocument(
                        id=str(page['id']),
                        project_id=project_id,
                        title=page['title'],
                        content=page.get('text', {}).get('raw', ''),
                        document_type='wiki',
                        created_by=page.get('author', {}).get('name', 'unknown'),
                        created_at=datetime.fromisoformat(page['createdAt'].replace('Z', '+00:00')),
                        attachments=[]
                    ))
                
                return documents
            else:
                logger.error(f"Failed to fetch documents: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching project documents: {e}")
            return []
    
    async def add_project_memo(self, project_id: str, memo_content: str, memo_type: str = "investment_memo") -> bool:
        """Add an investment memo or note to a project"""
        try:
            doc_data = {
                'title': f"{memo_type.replace('_', ' ').title()} - {datetime.now().strftime('%Y-%m-%d')}",
                'content': memo_content,
                'document_type': memo_type,
                'created_by': 'ai_assistant'
            }
            
            document = await self.create_project_document(project_id, doc_data)
            return document is not None
            
        except Exception as e:
            logger.error(f"Error adding project memo: {e}")
            return False
    
    # Analytics and Reporting
    async def get_portfolio_analytics(self) -> Dict[str, Any]:
        """Get portfolio-wide analytics"""
        try:
            projects = await self.get_portfolio_projects()
            
            analytics = {
                'total_projects': len(projects),
                'by_status': {},
                'by_sector': {},
                'by_stage': {},
                'total_investment': 0,
                'total_valuation': 0
            }
            
            for project in projects:
                # Status breakdown
                status = project.status.value
                analytics['by_status'][status] = analytics['by_status'].get(status, 0) + 1
                
                # Sector breakdown
                sector = project.sector or 'Unknown'
                analytics['by_sector'][sector] = analytics['by_sector'].get(sector, 0) + 1
                
                # Stage breakdown
                stage = project.deal_stage.value
                analytics['by_stage'][stage] = analytics['by_stage'].get(stage, 0) + 1
                
                # Financial totals
                if project.investment_amount:
                    analytics['total_investment'] += project.investment_amount
                if project.valuation:
                    analytics['total_valuation'] += project.valuation
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error generating portfolio analytics: {e}")
            return {}
    
    # Utility Methods
    def _map_openproject_to_portfolio(self, project_data: Dict) -> PortfolioProject:
        """Map OpenProject data to PortfolioProject"""
        custom_fields = {}
        
        # Extract custom fields
        for field_name, field_id in self.custom_field_mapping.items():
            if field_id in project_data:
                custom_fields[field_name] = project_data[field_id]
        
        return PortfolioProject(
            id=str(project_data['id']),
            name=project_data['name'],
            company_name=project_data['name'],
            status=ProjectStatus(custom_fields.get('deal_stage', 'pipeline')),
            deal_stage=DealStage(custom_fields.get('deal_stage', 'sourcing')),
            description=project_data.get('description', ''),
            created_at=datetime.fromisoformat(project_data['createdAt'].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(project_data['updatedAt'].replace('Z', '+00:00')),
            custom_fields=custom_fields,
            investment_amount=custom_fields.get('investment_amount'),
            valuation=custom_fields.get('valuation'),
            ownership_percentage=custom_fields.get('ownership_percentage'),
            lead_partner=custom_fields.get('lead_partner'),
            sector=custom_fields.get('sector'),
            stage=custom_fields.get('deal_stage')
        )
    
    def _status_to_id(self, status: ProjectStatus) -> str:
        """Map status enum to OpenProject status ID"""
        status_mapping = {
            ProjectStatus.PIPELINE: "1",
            ProjectStatus.DILIGENCE: "2", 
            ProjectStatus.NEGOTIATION: "3",
            ProjectStatus.CLOSED: "4",
            ProjectStatus.PORTFOLIO: "5",
            ProjectStatus.EXITED: "6"
        }
        return status_mapping.get(status, "1")

# Global service instance
openproject_service = OpenProjectService()