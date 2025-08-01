"""
PortfolioService - Async-safe portfolio management operations.

Wraps OpenProject service with httpx.AsyncClient to replace blocking requests calls.
"""

import os
import httpx
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from .openproject_service import (
    ProjectStatus, DealStage, PortfolioProject, ProjectDocument, 
    OpenProjectService
)

logger = logging.getLogger(__name__)


class AsyncOpenProjectClient:
    """Async HTTP client wrapper for OpenProject API."""
    
    def __init__(self):
        self.base_url = os.getenv('OPENPROJECT_URL', 'http://localhost:8080/api/v3')
        self.api_key = os.getenv('OPENPROJECT_API_KEY', '')
        self.headers = {
            'Authorization': f'Basic {self.api_key}',
            'Content-Type': 'application/json'
        }
        self.http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),  # Longer timeout for API operations
            headers=self.headers
        )
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.http_client.aclose()
    
    async def get(self, endpoint: str, **kwargs) -> httpx.Response:
        """Async GET request to OpenProject API."""
        url = f"{self.base_url}{endpoint}"
        logger.debug(f"GET {url}")
        return await self.http_client.get(url, **kwargs)
    
    async def post(self, endpoint: str, **kwargs) -> httpx.Response:
        """Async POST request to OpenProject API."""
        url = f"{self.base_url}{endpoint}"
        logger.debug(f"POST {url}")
        return await self.http_client.post(url, **kwargs)
    
    async def patch(self, endpoint: str, **kwargs) -> httpx.Response:
        """Async PATCH request to OpenProject API."""
        url = f"{self.base_url}{endpoint}"
        logger.debug(f"PATCH {url}")
        return await self.http_client.patch(url, **kwargs)
    
    async def delete(self, endpoint: str, **kwargs) -> httpx.Response:
        """Async DELETE request to OpenProject API."""
        url = f"{self.base_url}{endpoint}"
        logger.debug(f"DELETE {url}")
        return await self.http_client.delete(url, **kwargs)


class PortfolioService:
    """
    Async-safe service for portfolio management operations.
    
    This service coordinates portfolio operations and uses async HTTP clients
    for external API calls.
    """
    
    def __init__(self):
        self.openproject_service = OpenProjectService()  # Keep for business logic
        # Custom field mapping for VC-specific data
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
        """Check if OpenProject is available using async HTTP client."""
        try:
            async with AsyncOpenProjectClient() as client:
                response = await client.get("/projects", timeout=5.0)
                return response.status_code == 200
        except Exception as e:
            logger.error(f"OpenProject health check failed: {e}")
            return False
    
    async def create_portfolio_project(self, project_data: Dict[str, Any]) -> Optional[PortfolioProject]:
        """Create a new portfolio project in OpenProject using async client."""
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
            
            async with AsyncOpenProjectClient() as client:
                response = await client.post("/projects", json=openproject_data)
                
                if response.status_code == 201:
                    project_data_response = await response.json()
                    return self._map_openproject_to_portfolio(project_data_response)
                else:
                    logger.error(f"Failed to create project: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error creating portfolio project: {e}")
            return None
    
    async def get_portfolio_projects(self, filters: Dict[str, Any] = None) -> List[PortfolioProject]:
        """Get portfolio projects with optional filters using async client."""
        try:
            # Build query parameters
            params = {}
            if filters:
                if filters.get('status'):
                    status_value = filters['status']
                    params['filters'] = f'[{{"status":{{"operator":"=","values":["{status_value}"]}}}}]'
                if filters.get('limit'):
                    params['pageSize'] = filters['limit']
            
            async with AsyncOpenProjectClient() as client:
                response = await client.get("/projects", params=params)
                
                if response.status_code == 200:
                    data = await response.json()
                    projects = []
                    
                    for project_data in data.get('_embedded', {}).get('elements', []):
                        portfolio_project = self._map_openproject_to_portfolio(project_data)
                        if portfolio_project:
                            projects.append(portfolio_project)
                    
                    return projects
                else:
                    logger.error(f"Failed to get projects: {response.status_code} - {response.text}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error getting portfolio projects: {e}")
            return []
    
    async def update_project_status(self, project_id: str, status: ProjectStatus, 
                                  deal_stage: DealStage = None) -> bool:
        """Update project status and deal stage using async client."""
        try:
            update_data = {
                "status": {"href": f"/api/v3/statuses/{self._get_status_id(status)}"}
            }
            
            if deal_stage:
                update_data[self.custom_field_mapping['deal_stage']] = deal_stage.value
            
            async with AsyncOpenProjectClient() as client:
                response = await client.patch(f"/projects/{project_id}", json=update_data)
                
                if response.status_code == 200:
                    logger.info(f"Updated project {project_id} status to {status.value}")
                    return True
                else:
                    logger.error(f"Failed to update project: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error updating project status: {e}")
            return False
    
    async def create_project_document(self, project_id: str, doc_data: Dict[str, Any]) -> Optional[ProjectDocument]:
        """Create a project document using async client."""
        try:
            # Create work package for document in OpenProject
            document_data = {
                "subject": doc_data.get('title', 'Document'),
                "description": doc_data.get('content', ''),
                "type": {"href": "/api/v3/types/1"},  # Task type
                "project": {"href": f"/api/v3/projects/{project_id}"},
                "customField9": doc_data.get('document_type', 'memo')  # Document type
            }
            
            async with AsyncOpenProjectClient() as client:
                response = await client.post("/work_packages", json=document_data)
                
                if response.status_code == 201:
                    wp_data = await response.json()
                    
                    return ProjectDocument(
                        id=str(wp_data['id']),
                        project_id=project_id,
                        title=wp_data.get('subject', ''),
                        content=wp_data.get('description', {}).get('raw', ''),
                        document_type=doc_data.get('document_type', 'memo'),
                        created_by=doc_data.get('created_by', 'system'),
                        created_at=datetime.fromisoformat(wp_data['createdAt'].replace('Z', '+00:00')),
                        attachments=[]
                    )
                else:
                    logger.error(f"Failed to create document: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error creating project document: {e}")
            return None
    
    async def get_project_documents(self, project_id: str) -> List[ProjectDocument]:
        """Get all documents for a project using async client."""
        try:
            params = {
                'filters': f'[{{"project":{{"operator":"=","values":["{project_id}"]}}}}]'
            }
            
            async with AsyncOpenProjectClient() as client:
                response = await client.get("/work_packages", params=params)
                
                if response.status_code == 200:
                    data = await response.json()
                    documents = []
                    
                    for wp_data in data.get('_embedded', {}).get('elements', []):
                        # Only include work packages that represent documents
                        if wp_data.get('customField9'):  # Has document type
                            document = ProjectDocument(
                                id=str(wp_data['id']),
                                project_id=project_id,
                                title=wp_data.get('subject', ''),
                                content=wp_data.get('description', {}).get('raw', ''),
                                document_type=wp_data.get('customField9', 'memo'),
                                created_by='system',  # Could be extracted from author
                                created_at=datetime.fromisoformat(wp_data['createdAt'].replace('Z', '+00:00')),
                                attachments=[]
                            )
                            documents.append(document)
                    
                    return documents
                else:
                    logger.error(f"Failed to get documents: {response.status_code} - {response.text}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error getting project documents: {e}")
            return []
    
    async def get_portfolio_analytics(self) -> Dict[str, Any]:
        """Get portfolio analytics by aggregating project data using async client."""
        try:
            projects = await self.get_portfolio_projects()
            
            # Calculate analytics from projects data
            total_projects = len(projects)
            total_investment = sum(p.investment_amount or 0 for p in projects)
            avg_valuation = sum(p.valuation or 0 for p in projects) / max(total_projects, 1)
            
            # Status breakdown
            status_counts = {}
            for project in projects:
                status = project.status.value
                status_counts[status] = status_counts.get(status, 0) + 1
            
            # Sector breakdown
            sector_counts = {}
            for project in projects:
                sector = project.sector or 'Unknown'
                sector_counts[sector] = sector_counts.get(sector, 0) + 1
            
            return {
                'total_projects': total_projects,
                'total_investment': total_investment,
                'average_valuation': avg_valuation,
                'status_breakdown': status_counts,
                'sector_breakdown': sector_counts,
                'pipeline_health': {
                    'active_deals': status_counts.get('pipeline', 0) + status_counts.get('diligence', 0),
                    'portfolio_companies': status_counts.get('portfolio', 0),
                    'conversion_rate': status_counts.get('portfolio', 0) / max(total_projects, 1) * 100
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting portfolio analytics: {e}")
            return {}
    
    def _map_openproject_to_portfolio(self, project_data: Dict[str, Any]) -> Optional[PortfolioProject]:
        """Map OpenProject data to PortfolioProject."""
        try:
            # Map deal stage from customField6, default status to PIPELINE
            deal_stage_value = project_data.get('customField6', DealStage.SOURCING.value)
            try:
                deal_stage = DealStage(deal_stage_value)
            except ValueError:
                deal_stage = DealStage.SOURCING
            
            # For now, map all projects to PIPELINE status (could be enhanced later)
            status = ProjectStatus.PIPELINE
            
            return PortfolioProject(
                id=str(project_data['id']),
                name=project_data.get('name', ''),
                company_name=project_data.get('name', ''),  # Same as name in our case
                status=status,
                deal_stage=deal_stage,
                description=project_data.get('description', {}).get('raw', ''),
                created_at=datetime.fromisoformat(project_data['createdAt'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(project_data['updatedAt'].replace('Z', '+00:00')),
                custom_fields={},
                investment_amount=project_data.get('customField1'),
                valuation=project_data.get('customField2'),
                ownership_percentage=project_data.get('customField3'),
                lead_partner=project_data.get('customField4'),
                sector=project_data.get('customField5')
            )
        except Exception as e:
            logger.error(f"Error mapping OpenProject data: {e}")
            return None
    
    def _get_status_id(self, status: ProjectStatus) -> str:
        """Map ProjectStatus to OpenProject status ID."""
        status_mapping = {
            ProjectStatus.PIPELINE: "1",
            ProjectStatus.DILIGENCE: "2", 
            ProjectStatus.NEGOTIATION: "3",
            ProjectStatus.CLOSED: "4",
            ProjectStatus.PORTFOLIO: "5",
            ProjectStatus.EXITED: "6"
        }
        return status_mapping.get(status, "1")


# Singleton instance
portfolio_service = PortfolioService()