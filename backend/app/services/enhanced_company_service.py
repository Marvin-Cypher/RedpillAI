"""
Enhanced Company Service with structured relationship data
"""

from typing import Dict, Any, List, Optional
from sqlmodel import Session, select
from datetime import datetime

from ..models.companies import Company
from ..models.persons import Person
from ..models.tags import Tag, CompanyTag, PersonTag
from ..models.ownership import Ownership
from ..models.activities import Activity
from ..models.deals import Deal
from ..models.talent import TalentProfile, Achievement, PlatformProfile, DataSource
from ..models.data_sources import CompanyDataSources


class EnhancedCompanyService:
    """Service for fetching companies with structured relationship data."""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def get_company_detailed(
        self, 
        company_id: str, 
        include_level: str = "basic"
    ) -> Optional[Dict[str, Any]]:
        """Get company with structured relationship data."""
        
        # Get base company
        company = self.session.get(Company, company_id)
        if not company:
            return None
        
        # Build response based on inclusion level
        response = self._build_base_company_response(company)
        
        if include_level in ["full", "team", "relationships"]:
            response.update(await self._add_relationship_data(company))
        
        if include_level in ["full", "intelligence"]:
            response.update(await self._add_intelligence_data(company))
        
        if include_level in ["full", "activities"]:
            response.update(await self._add_activity_data(company))
        
        return response
    
    def _build_base_company_response(self, company: Company) -> Dict[str, Any]:
        """Build base company response structure."""
        return {
            # Core Company Data
            "id": company.id,
            "name": company.name,
            "description": company.description,
            "website": company.website,
            "logo_url": company.logo_url,
            "company_type": company.company_type,
            "sector": company.sector,
            "founded_year": company.founded_year,
            "employee_count": company.employee_count,
            "headquarters": company.headquarters,
            "token_symbol": company.token_symbol,
            "twitter_handle": company.twitter_handle,
            "github_repo": company.github_repo,
            "whitepaper_url": company.whitepaper_url,
            
            # Status & Metadata
            "created_at": company.created_at.isoformat() if company.created_at else None,
            "updated_at": company.updated_at.isoformat() if company.updated_at else None,
            "created_by": company.created_by,
            "owner_user_id": company.owner_user_id,
            
            # Data freshness
            "data_last_refreshed": company.data_last_refreshed.isoformat() if company.data_last_refreshed else None,
            "tavily_last_updated": company.tavily_last_updated.isoformat() if company.tavily_last_updated else None,
            "market_data_last_updated": company.market_data_last_updated.isoformat() if company.market_data_last_updated else None,
            
            # Legacy data (maintained for compatibility)
            "enriched_data": company.enriched_data,
            "market_data": company.market_data,
            "key_metrics": company.key_metrics,
        }
    
    async def _add_relationship_data(self, company: Company) -> Dict[str, Any]:
        """Add structured relationship data."""
        
        # Get people associated with company
        people_query = select(Person).where(Person.company_id == company.id)
        people = self.session.exec(people_query).all()
        
        founders = []
        key_people = []
        
        for person in people:
            person_summary = {
                "id": person.id,
                "name": person.name,
                "email": person.email,
                "primary_role": person.primary_role,
                "linkedin_url": None,  # Will be populated from platform profiles
                "talent_score": None,
                "is_talent": False
            }
            
            # Get talent profile if exists
            talent_profile = self.session.get(TalentProfile, person.id)
            if talent_profile:
                person_summary["talent_score"] = talent_profile.talent_score
                person_summary["is_talent"] = talent_profile.is_talent
            
            # Get LinkedIn URL from platform profiles
            linkedin_query = select(PlatformProfile).where(
                PlatformProfile.person_id == person.id,
                PlatformProfile.platform == "LINKEDIN"
            )
            linkedin_profile = self.session.exec(linkedin_query).first()
            if linkedin_profile:
                person_summary["linkedin_url"] = linkedin_profile.profile_url
            
            # Categorize by role
            if person.primary_role and any(role in person.primary_role.lower() for role in ["founder", "co-founder"]):
                founders.append(person_summary)
            else:
                key_people.append(person_summary)
        
        # Get tags
        tags_query = select(Tag, CompanyTag).join(CompanyTag).where(CompanyTag.company_id == company.id)
        tag_results = self.session.exec(tags_query).all()
        
        tags = []
        for tag, _ in tag_results:
            tags.append({
                "id": tag.id,
                "name": tag.name,
                "category": tag.category,
                "color": tag.color
            })
        
        # Get ownership structure
        ownership_query = select(Ownership, Person).join(Person, Ownership.person_id == Person.id).where(Ownership.company_id == company.id)
        ownership_results = self.session.exec(ownership_query).all()
        
        ownership_structure = []
        for ownership, person in ownership_results:
            ownership_structure.append({
                "person": {
                    "id": person.id,
                    "name": person.name,
                    "primary_role": person.primary_role
                },
                "ownership_type": ownership.ownership_type,
                "percentage": ownership.percentage,
                "share_count": ownership.share_count,
                "share_class": ownership.share_class,
                "is_active": ownership.is_active,
                "notes": ownership.notes
            })
        
        # Get deals
        deals_query = select(Deal).where(Deal.company_id == company.id)
        deals = self.session.exec(deals_query).all()
        
        deals_summary = []
        for deal in deals:
            deal_summary = {
                "id": deal.id,
                "deal_status": deal.status,
                "investment_stage": deal.stage,
                "amount": deal.our_investment,
                "created_at": deal.created_at.isoformat() if deal.created_at else None,
                "contact_person": None
            }
            
            # Get contact person if set
            if deal.contact_person_id:
                contact_person = self.session.get(Person, deal.contact_person_id)
                if contact_person:
                    deal_summary["contact_person"] = {
                        "id": contact_person.id,
                        "name": contact_person.name,
                        "primary_role": contact_person.primary_role
                    }
            
            deals_summary.append(deal_summary)
        
        return {
            "founders": founders,
            "key_people": key_people,
            "tags": tags,
            "deals": deals_summary,
            "ownership_structure": ownership_structure,
        }
    
    async def _add_intelligence_data(self, company: Company) -> Dict[str, Any]:
        """Add talent intelligence and data source attribution."""
        
        # Calculate talent metrics
        talent_metrics = await self._calculate_talent_metrics(company.id)
        
        # Get data source attribution
        data_sources = await self._get_data_sources(company.id)
        
        return {
            "talent_metrics": talent_metrics,
            "data_sources": data_sources,
            "data_freshness": {
                "profile_data": company.tavily_last_updated.isoformat() if company.tavily_last_updated else None,
                "team_data": company.data_last_refreshed.isoformat() if company.data_last_refreshed else None,
                "financial_data": company.market_data_last_updated.isoformat() if company.market_data_last_updated else None,
                "news_data": company.data_last_refreshed.isoformat() if company.data_last_refreshed else None,
            }
        }
    
    async def _add_activity_data(self, company: Company) -> Dict[str, Any]:
        """Add recent activities and timeline."""
        
        # Get recent activities
        activities_query = select(Activity).where(
            Activity.company_id == company.id
        ).order_by(Activity.occurred_at.desc()).limit(10)
        activities = self.session.exec(activities_query).all()
        
        recent_activities = []
        for activity in activities:
            activity_summary = {
                "id": activity.id,
                "activity_type": activity.activity_type,
                "occurred_at": activity.occurred_at.isoformat() if activity.occurred_at else None,
                "summary": activity.summary,
                "performed_by": None
            }
            
            # Get user info if available
            if activity.user_id:
                # Would need to import User model and get user details
                activity_summary["performed_by"] = {
                    "id": activity.user_id,
                    "name": "User"  # Placeholder - could fetch actual user
                }
            
            recent_activities.append(activity_summary)
        
        return {
            "recent_activities": recent_activities
        }
    
    async def _calculate_talent_metrics(self, company_id: str) -> Dict[str, Any]:
        """Calculate talent intelligence metrics for the company."""
        
        # Get all people in company with talent profiles
        people_query = select(Person, TalentProfile).join(
            TalentProfile, Person.id == TalentProfile.person_id, isouter=True
        ).where(Person.company_id == company_id)
        people_results = self.session.exec(people_query).all()
        
        total_employees = len(people_results)
        total_talent = 0
        ex_faang_count = 0
        technical_scores = []
        
        for person, talent_profile in people_results:
            if talent_profile and talent_profile.is_talent:
                total_talent += 1
                if talent_profile.talent_score:
                    technical_scores.append(talent_profile.talent_score)
                
                # Check for ex-FAANG experience (simplified - would need more sophisticated detection)
                if talent_profile.talent_categories:
                    if "EX_FAANG" in talent_profile.talent_categories:
                        ex_faang_count += 1
        
        # Calculate technical leadership strength
        technical_leadership_strength = 0
        if technical_scores:
            technical_leadership_strength = int(sum(technical_scores) / len(technical_scores))
        
        return {
            "total_employees": total_employees,
            "total_talent_employees": total_talent,
            "ex_faang_count": ex_faang_count,
            "technical_leadership_strength": technical_leadership_strength,
            "talent_density": round((total_talent / total_employees * 100), 1) if total_employees > 0 else 0
        }
    
    async def _get_data_sources(self, company_id: str) -> List[Dict[str, Any]]:
        """Get data source attribution information."""
        
        # Get data sources for company
        sources_query = select(DataSource, CompanyDataSources).join(
            CompanyDataSources
        ).where(CompanyDataSources.company_id == company_id)
        sources_results = self.session.exec(sources_query).all()
        
        data_sources = []
        for source, link in sources_results:
            data_sources.append({
                "source_name": source.source_name,
                "source_type": source.source_type,
                "confidence_score": link.confidence_score,
                "last_updated": link.last_updated.isoformat() if link.last_updated else None,
                "data_fields": link.data_fields or []
            })
        
        return data_sources
    
    async def get_companies_list(
        self,
        sector: Optional[str] = None,
        search: Optional[str] = None,
        has_deals: Optional[bool] = None,
        is_talent_dense: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get companies list with enhanced filtering and summary data."""
        
        query = select(Company)
        
        # Apply filters
        if sector:
            query = query.where(Company.sector == sector)
        
        if search:
            query = query.where(Company.name.ilike(f"%{search}%"))
        
        if has_deals is not None:
            if has_deals:
                # Only companies with deals
                query = query.join(Deal).group_by(Company.id)
            # For has_deals=False, we'd need a more complex query
        
        # Add pagination
        query = query.offset(skip).limit(limit)
        companies = self.session.exec(query).all()
        
        # Build response with summary data
        response = []
        for company in companies:
            company_data = self._build_base_company_response(company)
            
            # Add quick summary counts
            people_count = self.session.exec(
                select(Person).where(Person.company_id == company.id)
            ).count() if hasattr(self.session, 'count') else len(
                self.session.exec(select(Person).where(Person.company_id == company.id)).all()
            )
            
            deals_count = len(self.session.exec(select(Deal).where(Deal.company_id == company.id)).all())
            
            company_data.update({
                "people_count": people_count,
                "deals_count": deals_count,
                "has_structured_data": people_count > 0 or deals_count > 0
            })
            
            response.append(company_data)
        
        return response
    
    async def add_founder_to_company(
        self, 
        company_id: str, 
        founder_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Add a founder to a company."""
        
        # Verify company exists
        company = self.session.get(Company, company_id)
        if not company:
            return None
        
        # Create person record
        person = Person(
            name=founder_data["name"],
            email=founder_data.get("email"),
            phone=founder_data.get("phone"),
            primary_role=founder_data.get("role", "Founder"),
            company_id=company_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self.session.add(person)
        self.session.commit()
        self.session.refresh(person)
        
        # Create talent profile if talent data provided
        if founder_data.get("is_talent"):
            talent_profile = TalentProfile(
                person_id=person.id,
                is_talent=founder_data["is_talent"],
                talent_score=founder_data.get("talent_score"),
                talent_categories=founder_data.get("talent_categories", []),
                manual_classification=founder_data.get("manual_classification"),
                suggested_by_ai=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            self.session.add(talent_profile)
            self.session.commit()
        
        # Add platform profiles if provided
        if founder_data.get("linkedin_url"):
            linkedin_profile = PlatformProfile(
                person_id=person.id,
                platform="LINKEDIN",
                profile_url=founder_data["linkedin_url"],
                verified_account=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            self.session.add(linkedin_profile)
        
        if founder_data.get("github_url"):
            github_profile = PlatformProfile(
                person_id=person.id,
                platform="GITHUB",
                profile_url=founder_data["github_url"],
                verified_account=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            self.session.add(github_profile)
        
        self.session.commit()
        
        return {
            "id": person.id,
            "name": person.name,
            "email": person.email,
            "primary_role": person.primary_role,
            "company_id": company_id,
            "created_at": person.created_at.isoformat()
        }