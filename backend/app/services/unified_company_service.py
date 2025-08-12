"""
Unified Company Creation Service

This service handles both single company creation and bulk import from AI discovery,
ensuring consistent data structure, validation, enrichment, and founder extraction.
"""

from typing import Dict, List, Any, Optional
from sqlmodel import Session, select
from datetime import datetime
import logging

from ..models.companies import Company
from ..models.persons import Person
from ..services.company_enrichment_exa import company_enrichment_service_exa
from ..services.exa_service import ExaService

logger = logging.getLogger(__name__)


class UnifiedCompanyService:
    """Unified service for creating companies with consistent data enrichment and founder extraction."""
    
    def __init__(self, db: Session):
        self.db = db
        self.exa_service = ExaService(use_mock=False)  # Use real API for founder search
    
    async def create_company_unified(
        self,
        company_data: Dict[str, Any],
        current_user_id: str,
        source: str = "manual"
    ) -> Dict[str, Any]:
        """
        Create a company with unified enrichment process including founder extraction.
        
        Args:
            company_data: Basic company data (name, domain, etc.)
            current_user_id: ID of user creating the company
            source: Source of the company data (manual, exa_search, etc.)
        
        Returns:
            Dict containing created company and extracted founders
        """
        try:
            company_name = company_data.get('name', '').strip()
            if not company_name:
                raise ValueError("Company name is required")
            
            # Check if company already exists
            existing = self.db.exec(
                select(Company).where(Company.name == company_name)
            ).first()
            
            if existing:
                logger.info(f"Company {company_name} already exists, returning existing record")
                return {
                    'company': existing,
                    'founders': await self._get_existing_founders(existing.id),
                    'status': 'exists'
                }
            
            # Step 1: Create basic company record
            company = self._create_base_company(company_data, current_user_id, source)
            
            # Step 2: Enrich company data with AI
            enriched_company = await self._enrich_company_data(company)
            
            # Step 3: Extract and create founder records
            founders = await self._extract_and_create_founders(enriched_company)
            
            # Step 4: Save everything to database
            self.db.add(enriched_company)
            for founder in founders:
                self.db.add(founder)
            
            self.db.commit()
            self.db.refresh(enriched_company)
            
            logger.info(f"✅ Company {company_name} created with {len(founders)} founders")
            
            return {
                'company': enriched_company,
                'founders': founders,
                'status': 'created'
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create company {company_data.get('name')}: {str(e)}")
            raise
    
    def _create_base_company(
        self,
        company_data: Dict[str, Any],
        current_user_id: str,
        source: str
    ) -> Company:
        """Create basic company record with provided data."""
        
        # Map sector to company type
        sector = company_data.get('sector', 'other')
        company_type = self._map_sector_to_type(sector)
        
        return Company(
            name=company_data.get('name'),
            website=company_data.get('website') or company_data.get('url'),
            description=company_data.get('description'),
            company_type=company_type,
            sector=sector,
            founded_year=company_data.get('founded_year'),
            headquarters=company_data.get('headquarters'),
            employee_count=str(company_data.get('employee_count', '')),
            token_symbol=company_data.get('token_symbol'),
            created_by=current_user_id,
            data_source=source,
            enriched_data=company_data.get('enriched_data', {}),
            key_metrics=company_data.get('key_metrics', {})
        )
    
    async def _enrich_company_data(self, company: Company) -> Company:
        """Enrich company data using AI services."""
        try:
            # Use the existing company enrichment service
            enriched_company = await company_enrichment_service_exa.enrich_company_data(
                company, 
                force_refresh=True
            )
            return enriched_company
        except Exception as e:
            logger.warning(f"Company enrichment failed for {company.name}: {e}")
            # Return original company if enrichment fails
            return company
    
    async def _extract_and_create_founders(self, company: Company) -> List[Person]:
        """Extract founder information and create Person records."""
        founders = []
        
        try:
            # First, check if founders are in enriched data
            enriched_data = company.enriched_data or {}
            
            # Look for founder information in various places
            founder_sources = [
                enriched_data.get('founders', []),
                enriched_data.get('team', []),
                enriched_data.get('leadership', []),
                enriched_data.get('key_people', [])
            ]
            
            founder_data = []
            for source in founder_sources:
                if isinstance(source, list):
                    founder_data.extend(source)
                elif isinstance(source, dict):
                    # Convert dict to list if needed
                    founder_data.append(source)
            
            # If no founders found in enriched data, try to search for them
            if not founder_data:
                founder_data = await self._search_company_founders(company)
            
            # Create Person records for founders
            for founder_info in founder_data[:5]:  # Limit to 5 founders max
                if isinstance(founder_info, dict) and founder_info.get('name'):
                    person = self._create_person_from_founder_data(
                        founder_info, 
                        company
                    )
                    if person:
                        founders.append(person)
                        
        except Exception as e:
            logger.warning(f"Founder extraction failed for {company.name}: {e}")
        
        return founders
    
    async def _search_company_founders(self, company: Company) -> List[Dict[str, Any]]:
        """Search for company founders using AI search."""
        try:
            if not company.name:
                return []
                
            # Search for founders of this company
            search_query = f"founders and executives of {company.name}"
            
            # Use Exa service to search for founders
            search_results = await self.exa_service.search_founders(
                search_query=search_query,
                filters={'company': company.name}
            )
            
            return search_results.get('results', [])[:3]  # Limit to top 3 results
            
        except Exception as e:
            logger.warning(f"Founder search failed for {company.name}: {e}")
            return []
    
    def _create_person_from_founder_data(
        self, 
        founder_info: Dict[str, Any], 
        company: Company
    ) -> Optional[Person]:
        """Create a Person record from founder information."""
        try:
            name = founder_info.get('name', '').strip()
            if not name:
                return None
            
            # Check if person already exists
            existing = self.db.exec(
                select(Person).where(Person.name == name)
            ).first()
            
            if existing:
                return existing
            
            # Extract person data
            role = founder_info.get('role') or founder_info.get('position') or 'Founder'
            
            # Create social links from founder info
            social_links = []
            for platform in ['linkedin', 'twitter', 'github']:
                url = founder_info.get(f'{platform}_url') or founder_info.get(platform)
                if url:
                    social_links.append({
                        'platform': platform,
                        'url': url
                    })
            
            person = Person(
                name=name,
                role=role,
                company_name=company.name,
                company_id=company.id,
                bio=founder_info.get('bio') or founder_info.get('description'),
                expertise_areas=founder_info.get('expertise', []),
                social_links=social_links,
                achievements=founder_info.get('achievements', []),
                is_tracked=False,  # Default to not tracked
                track_reason=None,
                data_source='company_creation',
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            return person
            
        except Exception as e:
            logger.warning(f"Failed to create person from founder data: {e}")
            return None
    
    async def _get_existing_founders(self, company_id: str) -> List[Person]:
        """Get existing founders for a company."""
        try:
            founders = self.db.exec(
                select(Person).where(Person.company_id == company_id)
            ).all()
            return list(founders)
        except Exception as e:
            logger.warning(f"Failed to get existing founders: {e}")
            return []
    
    def _map_sector_to_type(self, sector: str) -> str:
        """Map sector to company type enum."""
        if not sector:
            return "PRIVATE"
            
        sector_lower = sector.lower()
        
        if any(term in sector_lower for term in ['crypto', 'defi', 'blockchain', 'token']):
            return "CRYPTO"
        elif any(term in sector_lower for term in ['ai', 'ml', 'artificial']):
            return "AI"
        elif any(term in sector_lower for term in ['public', 'listed', 'nasdaq', 'nyse']):
            return "PUBLIC"
        else:
            return "PRIVATE"
    
    async def bulk_import_companies(
        self,
        companies_data: List[Dict[str, Any]],
        current_user_id: str,
        source: str = "exa_search"
    ) -> Dict[str, Any]:
        """
        Bulk import companies using the unified creation process.
        
        Returns:
            Dict with import results including companies and founders created
        """
        imported_companies = []
        skipped_companies = []
        all_founders = []
        
        for company_data in companies_data:
            try:
                result = await self.create_company_unified(
                    company_data=company_data,
                    current_user_id=current_user_id,
                    source=source
                )
                
                if result['status'] == 'created':
                    imported_companies.append(result['company'])
                    all_founders.extend(result['founders'])
                elif result['status'] == 'exists':
                    skipped_companies.append({
                        'name': company_data.get('name'),
                        'reason': 'Company already exists'
                    })
                    
            except Exception as e:
                logger.error(f"Failed to import company {company_data.get('name')}: {str(e)}")
                skipped_companies.append({
                    'name': company_data.get('name'),
                    'reason': f'Import error: {str(e)}'
                })
        
        return {
            'imported_count': len(imported_companies),
            'skipped_count': len(skipped_companies),
            'founders_created': len(all_founders),
            'imported_companies': [c.name for c in imported_companies],
            'skipped_companies': skipped_companies,
            'source': source
        }


# Global instance for use across the application
def get_unified_company_service(db: Session) -> UnifiedCompanyService:
    """Get unified company service instance."""
    return UnifiedCompanyService(db)