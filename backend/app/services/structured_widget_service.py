"""
Structured Widget Data Service
Integrates structured relational data (Person, Tag, Ownership) with widget data consumption.
Replaces reliance on JSON fields with proper database relationships.
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlmodel import Session, select

from app.models.companies import Company, CompanyType
from app.models.persons import Person
from app.models.tags import Tag, CompanyTag
from app.models.ownership import Ownership
from app.models.activities import Activity
from app.models.cache import CompanyDataCache
from app.services.enhanced_company_service import EnhancedCompanyService
from app.database import engine

logger = logging.getLogger(__name__)


class StructuredWidgetService:
    """Service for providing widget data using structured relational tables."""
    
    def __init__(self):
        self.enhanced_service = None
    
    async def get_widget_data(
        self,
        company_id: str,
        widget_types: List[str] = None,
        include_level: str = "detailed"
    ) -> Dict[str, Any]:
        """
        Get comprehensive widget data using structured database relationships.
        
        Args:
            company_id: Company UUID or name
            widget_types: List of widget types to fetch data for
            include_level: Level of data to include (basic, detailed, intelligence)
            
        Returns:
            Widget-ready data structured for frontend consumption
        """
        if widget_types is None:
            widget_types = ["profile", "team", "financial", "tags", "activity"]
        
        logger.info(f"🎨 Fetching structured widget data for company: {company_id}")
        
        with Session(engine) as session:
            # Initialize enhanced service with session
            if not self.enhanced_service:
                self.enhanced_service = EnhancedCompanyService(session)
            
            # Get detailed company data with relationships
            company_data = await self.enhanced_service.get_company_detailed(
                company_id=company_id,
                include_level=include_level
            )
            
            if not company_data:
                raise ValueError(f"Company '{company_id}' not found")
            
            # Transform relational data into widget-friendly format
            widget_data = await self._transform_to_widget_format(
                company_data=company_data,
                widget_types=widget_types,
                session=session
            )
            
            logger.info(f"✅ Structured widget data prepared for {company_data.get('name', company_id)}")
            return widget_data
    
    async def _transform_to_widget_format(
        self,
        company_data: Dict[str, Any],
        widget_types: List[str],
        session: Session
    ) -> Dict[str, Any]:
        """Transform structured company data into widget-specific format."""
        
        widget_data = {
            "company_info": {
                "id": company_data.get("id"),
                "name": company_data.get("name"),
                "description": company_data.get("description"),
                "website": company_data.get("website"),
                "company_type": company_data.get("company_type"),
                "sector": company_data.get("sector"),
                "founded_year": company_data.get("founded_year"),
                "headquarters": company_data.get("headquarters"),
                "employee_count": company_data.get("employee_count"),
            },
            "widgets": {},
            "metadata": {
                "data_source": "structured_relationships",
                "generated_at": datetime.utcnow().isoformat(),
                "include_level": "detailed",
                "widgets_requested": widget_types
            }
        }
        
        # Generate widget-specific data sections
        for widget_type in widget_types:
            widget_data["widgets"][widget_type] = await self._generate_widget_section(
                widget_type=widget_type,
                company_data=company_data,
                session=session
            )
        
        return widget_data
    
    async def _generate_widget_section(
        self,
        widget_type: str,
        company_data: Dict[str, Any],
        session: Session
    ) -> Dict[str, Any]:
        """Generate data for a specific widget type using structured data."""
        
        if widget_type == "team":
            return await self._generate_team_widget_data(company_data, session)
        elif widget_type == "financial":
            return await self._generate_financial_widget_data(company_data, session)
        elif widget_type == "tags":
            return await self._generate_tags_widget_data(company_data, session)
        elif widget_type == "activity":
            return await self._generate_activity_widget_data(company_data, session)
        elif widget_type == "ownership":
            return await self._generate_ownership_widget_data(company_data, session)
        elif widget_type == "profile":
            return await self._generate_profile_widget_data(company_data, session)
        else:
            logger.warning(f"Unknown widget type: {widget_type}")
            return {}
    
    async def _generate_team_widget_data(
        self,
        company_data: Dict[str, Any],
        session: Session
    ) -> Dict[str, Any]:
        """Generate team widget data from Person relationships."""
        
        # Get structured founders/team data
        founders = company_data.get("founders", [])
        key_people = company_data.get("key_people", [])
        
        # Calculate team metrics
        total_people = len(founders) + len(key_people)
        founder_count = len(founders)
        
        # Categorize people by role
        roles_summary = {}
        all_people = founders + key_people
        
        for person in all_people:
            role = person.get("primary_role", "OTHER")
            roles_summary[role] = roles_summary.get(role, 0) + 1
        
        # Talent metrics from structured data
        talent_count = sum(1 for person in all_people if person.get("is_talent", False))
        avg_talent_score = 0
        if talent_count > 0:
            total_score = sum(person.get("talent_score", 0) for person in all_people if person.get("is_talent", False))
            avg_talent_score = total_score / talent_count
        
        return {
            "widget_type": "team",
            "data": {
                "founders": founders,
                "key_people": key_people,
                "metrics": {
                    "total_people": total_people,
                    "founder_count": founder_count,
                    "talent_count": talent_count,
                    "average_talent_score": round(avg_talent_score, 1),
                    "roles_distribution": roles_summary
                },
                "highlights": [
                    f"{founder_count} founder(s)" if founder_count > 0 else "No founders recorded",
                    f"{talent_count} high-talent individuals" if talent_count > 0 else "No talent scoring available",
                    f"Average talent score: {avg_talent_score:.1f}/100" if avg_talent_score > 0 else "No talent metrics"
                ]
            },
            "display_config": {
                "show_avatars": True,
                "show_talent_scores": True,
                "show_contact_info": False,
                "max_people_shown": 8
            },
            "data_freshness": {
                "source": "structured_database",
                "last_updated": company_data.get("updated_at"),
                "confidence": "high"
            }
        }
    
    async def _generate_financial_widget_data(
        self,
        company_data: Dict[str, Any],
        session: Session
    ) -> Dict[str, Any]:
        """Generate financial widget data from structured sources and legacy key_metrics."""
        
        # Start with legacy key_metrics from JSON field for backward compatibility
        financial_data = company_data.get("key_metrics", {})
        
        # Enhance with structured ownership data
        ownership_structure = company_data.get("ownership_structure", [])
        
        # Calculate ownership insights
        total_founder_equity = sum(
            ownership.get("percentage", 0) 
            for ownership in ownership_structure 
            if ownership.get("ownership_type") == "FOUNDER_EQUITY"
        )
        
        investor_count = sum(
            1 for ownership in ownership_structure 
            if ownership.get("ownership_type") in ["INVESTOR", "VC_EQUITY"]
        )
        
        # Add structured metrics
        structured_metrics = {
            "ownership_metrics": {
                "founder_equity_percentage": round(total_founder_equity, 2),
                "investor_count": investor_count,
                "ownership_diversity": len(ownership_structure)
            }
        }
        
        # Merge legacy and structured data
        combined_financial = {**financial_data, **structured_metrics}
        
        # Generate financial highlights
        highlights = []
        if financial_data.get("revenue"):
            highlights.append(f"${financial_data['revenue']:,.0f} annual revenue")
        if financial_data.get("valuation"):
            highlights.append(f"${financial_data['valuation']:,.0f} valuation")
        if total_founder_equity > 0:
            highlights.append(f"{total_founder_equity:.1f}% founder equity")
        if investor_count > 0:
            highlights.append(f"{investor_count} investor(s)")
        
        return {
            "widget_type": "financial",
            "data": {
                "key_metrics": combined_financial,
                "highlights": highlights[:4],  # Show top 4 highlights
                "growth_indicators": {
                    "revenue_growth": financial_data.get("revenue_growth", 0),
                    "burn_rate": financial_data.get("burn_rate", 0),
                    "runway_months": financial_data.get("runway", 0)
                }
            },
            "display_config": {
                "currency": "USD",
                "show_growth_charts": True,
                "precision": 2
            },
            "data_freshness": {
                "source": "mixed_structured_legacy",
                "financial_data_source": "legacy_key_metrics" if financial_data else "none",
                "ownership_data_source": "structured_relationships",
                "last_updated": company_data.get("updated_at")
            }
        }
    
    async def _generate_tags_widget_data(
        self,
        company_data: Dict[str, Any], 
        session: Session
    ) -> Dict[str, Any]:
        """Generate tags widget data from structured Tag relationships."""
        
        # Get structured tags data
        tags = company_data.get("tags", [])
        
        # Categorize tags by type/category
        tag_categories = {}
        for tag in tags:
            category = tag.get("category", "OTHER")
            if category not in tag_categories:
                tag_categories[category] = []
            tag_categories[category].append(tag)
        
        # Generate tag insights
        total_tags = len(tags)
        categories_count = len(tag_categories)
        
        # Popular categories
        popular_categories = sorted(
            tag_categories.items(),
            key=lambda x: len(x[1]),
            reverse=True
        )[:3]
        
        return {
            "widget_type": "tags",
            "data": {
                "tags": tags,
                "categories": tag_categories,
                "metrics": {
                    "total_tags": total_tags,
                    "categories_count": categories_count,
                    "popular_categories": [cat[0] for cat in popular_categories]
                },
                "highlights": [
                    f"{total_tags} tags applied",
                    f"{categories_count} categories",
                    f"Most tagged: {popular_categories[0][0]}" if popular_categories else "No tags"
                ]
            },
            "display_config": {
                "show_colors": True,
                "group_by_category": True,
                "max_tags_shown": 20
            },
            "data_freshness": {
                "source": "structured_relationships",
                "last_updated": company_data.get("updated_at"),
                "confidence": "high"
            }
        }
    
    async def _generate_activity_widget_data(
        self,
        company_data: Dict[str, Any],
        session: Session
    ) -> Dict[str, Any]:
        """Generate activity timeline widget data from structured Activity records."""
        
        # Get structured activities
        activities = company_data.get("recent_activities", [])
        
        # Sort activities by timestamp
        sorted_activities = sorted(
            activities,
            key=lambda x: x.get("occurred_at", ""),
            reverse=True
        )
        
        # Categorize by activity type
        activity_types = {}
        for activity in activities:
            activity_type = activity.get("activity_type", "OTHER")
            activity_types[activity_type] = activity_types.get(activity_type, 0) + 1
        
        # Calculate activity metrics
        total_activities = len(activities)
        recent_activity_count = sum(
            1 for activity in activities
            if self._is_recent_activity(activity.get("occurred_at"))
        )
        
        return {
            "widget_type": "activity",
            "data": {
                "recent_activities": sorted_activities[:10],  # Show last 10 activities
                "activity_types": activity_types,
                "metrics": {
                    "total_activities": total_activities,
                    "recent_activities_7d": recent_activity_count,
                    "most_common_type": max(activity_types.keys(), key=activity_types.get) if activity_types else None
                },
                "timeline_summary": [
                    f"{total_activities} total activities",
                    f"{recent_activity_count} in last 7 days",
                    f"Most common: {max(activity_types.keys(), key=activity_types.get)}" if activity_types else "No activities"
                ]
            },
            "display_config": {
                "show_timeline": True,
                "group_by_type": False,
                "show_user_avatars": True
            },
            "data_freshness": {
                "source": "structured_relationships",
                "last_updated": company_data.get("updated_at"),
                "confidence": "high"
            }
        }
    
    async def _generate_ownership_widget_data(
        self,
        company_data: Dict[str, Any],
        session: Session
    ) -> Dict[str, Any]:
        """Generate ownership/cap table widget data from structured Ownership records."""
        
        # Get structured ownership data
        ownership_structure = company_data.get("ownership_structure", [])
        
        # Categorize by ownership type
        ownership_by_type = {}
        for ownership in ownership_structure:
            ownership_type = ownership.get("ownership_type", "OTHER")
            if ownership_type not in ownership_by_type:
                ownership_by_type[ownership_type] = {
                    "count": 0,
                    "total_percentage": 0,
                    "entries": []
                }
            
            ownership_by_type[ownership_type]["count"] += 1
            ownership_by_type[ownership_type]["total_percentage"] += ownership.get("percentage", 0)
            ownership_by_type[ownership_type]["entries"].append(ownership)
        
        # Calculate ownership metrics
        total_tracked_percentage = sum(
            ownership.get("percentage", 0) for ownership in ownership_structure
        )
        
        # Top stakeholders
        top_stakeholders = sorted(
            ownership_structure,
            key=lambda x: x.get("percentage", 0),
            reverse=True
        )[:5]
        
        return {
            "widget_type": "ownership",
            "data": {
                "ownership_structure": ownership_structure,
                "ownership_by_type": ownership_by_type,
                "top_stakeholders": top_stakeholders,
                "metrics": {
                    "total_stakeholders": len(ownership_structure),
                    "tracked_percentage": round(total_tracked_percentage, 2),
                    "untracked_percentage": max(0, round(100 - total_tracked_percentage, 2)),
                    "founder_percentage": ownership_by_type.get("FOUNDER_EQUITY", {}).get("total_percentage", 0)
                },
                "cap_table_summary": [
                    f"{len(ownership_structure)} stakeholders",
                    f"{total_tracked_percentage:.1f}% tracked",
                    f"{ownership_by_type.get('FOUNDER_EQUITY', {}).get('total_percentage', 0):.1f}% founder equity"
                ]
            },
            "display_config": {
                "show_percentages": True,
                "show_pie_chart": True,
                "hide_small_stakes": True,
                "threshold_percentage": 1.0
            },
            "data_freshness": {
                "source": "structured_relationships",
                "last_updated": company_data.get("updated_at"),
                "confidence": "high"
            }
        }
    
    async def _generate_profile_widget_data(
        self,
        company_data: Dict[str, Any],
        session: Session
    ) -> Dict[str, Any]:
        """Generate company profile widget data combining structured and cached data."""
        
        # Use structured data as primary source
        profile_data = {
            "basic_info": {
                "name": company_data.get("name"),
                "description": company_data.get("description"),
                "website": company_data.get("website"),
                "founded_year": company_data.get("founded_year"),
                "headquarters": company_data.get("headquarters"),
                "employee_count": company_data.get("employee_count"),
                "company_type": company_data.get("company_type"),
                "sector": company_data.get("sector")
            },
            "key_stats": {
                "total_people": len(company_data.get("founders", []) + company_data.get("key_people", [])),
                "total_tags": len(company_data.get("tags", [])),
                "recent_activities": len(company_data.get("recent_activities", [])),
                "ownership_entries": len(company_data.get("ownership_structure", []))
            },
            "social_proof": {
                "confidence_indicators": [],
                "data_completeness_score": 0
            }
        }
        
        # Calculate data completeness score
        completeness_factors = [
            bool(profile_data["basic_info"]["description"]),
            bool(profile_data["basic_info"]["website"]),
            bool(profile_data["basic_info"]["founded_year"]),
            bool(profile_data["basic_info"]["headquarters"]),
            profile_data["key_stats"]["total_people"] > 0,
            profile_data["key_stats"]["total_tags"] > 0,
        ]
        
        completeness_score = round((sum(completeness_factors) / len(completeness_factors)) * 100)
        profile_data["social_proof"]["data_completeness_score"] = completeness_score
        
        # Generate confidence indicators
        confidence_indicators = []
        if profile_data["key_stats"]["total_people"] > 0:
            confidence_indicators.append(f"{profile_data['key_stats']['total_people']} team members tracked")
        if profile_data["key_stats"]["total_tags"] > 0:
            confidence_indicators.append(f"{profile_data['key_stats']['total_tags']} tags applied")
        if completeness_score > 80:
            confidence_indicators.append("High data completeness")
        
        profile_data["social_proof"]["confidence_indicators"] = confidence_indicators
        
        return {
            "widget_type": "profile",
            "data": profile_data,
            "display_config": {
                "show_logo": True,
                "show_completeness_score": True,
                "highlight_missing_data": False
            },
            "data_freshness": {
                "source": "structured_primary",
                "last_updated": company_data.get("updated_at"),
                "completeness_score": completeness_score
            }
        }
    
    def _is_recent_activity(self, occurred_at: str) -> bool:
        """Check if activity occurred in the last 7 days."""
        if not occurred_at:
            return False
        
        try:
            activity_date = datetime.fromisoformat(occurred_at.replace('Z', '+00:00'))
            return (datetime.utcnow().replace(tzinfo=activity_date.tzinfo) - activity_date).days <= 7
        except (ValueError, TypeError):
            return False
    
    async def get_legacy_compatibility_data(
        self,
        company_id: str,
        force_fallback: bool = False
    ) -> Dict[str, Any]:
        """
        Get data in legacy JSON format for backward compatibility.
        This ensures existing widgets continue working during migration.
        """
        logger.info(f"📋 Generating legacy-compatible data for company: {company_id}")
        
        try:
            # Get structured data
            structured_data = await self.get_widget_data(
                company_id=company_id,
                widget_types=["profile", "team", "financial", "tags"],
                include_level="detailed"
            )
            
            # Transform to legacy JSON format
            legacy_data = {
                "name": structured_data["company_info"]["name"],
                "description": structured_data["company_info"]["description"],
                "founded_year": structured_data["company_info"]["founded_year"],
                "headquarters": structured_data["company_info"]["headquarters"],
                "employee_count": structured_data["company_info"]["employee_count"],
                "website": structured_data["company_info"]["website"],
                "industry": structured_data["company_info"]["sector"],
                "company_type": structured_data["company_info"]["company_type"],
                
                # Team data in legacy format
                "founders": [
                    founder["name"] for founder in 
                    structured_data.get("widgets", {}).get("team", {}).get("data", {}).get("founders", [])
                ],
                
                # Financial data in legacy format
                "key_metrics": structured_data.get("widgets", {}).get("financial", {}).get("data", {}).get("key_metrics", {}),
                
                # Tags in legacy format (simplified)
                "tags": [
                    tag["name"] for tag in 
                    structured_data.get("widgets", {}).get("tags", {}).get("data", {}).get("tags", [])
                ],
                
                # Meta information
                "_meta": {
                    "source": "structured_legacy_compatibility",
                    "generated_at": datetime.utcnow().isoformat(),
                    "original_source": "structured_relationships"
                }
            }
            
            logger.info(f"✅ Legacy-compatible data generated for {structured_data['company_info']['name']}")
            return legacy_data
            
        except Exception as e:
            if force_fallback:
                logger.warning(f"Structured data failed, falling back to cache: {str(e)}")
                return await self._get_cache_fallback_data(company_id)
            else:
                raise e
    
    async def _get_cache_fallback_data(self, company_id: str) -> Dict[str, Any]:
        """Fallback to cached JSON data if structured data is unavailable."""
        
        with Session(engine) as session:
            # Try to find cached data
            cache_entry = session.exec(
                select(CompanyDataCache).where(
                    CompanyDataCache.company_identifier == company_id.lower().replace(" ", ""),
                    CompanyDataCache.data_type == "profile"
                )
            ).first()
            
            if cache_entry and cache_entry.cached_data:
                logger.info(f"📦 Using cached fallback data for {company_id}")
                return cache_entry.cached_data
            
            # Last resort - minimal data structure
            return {
                "name": company_id,
                "description": "Company data unavailable",
                "error": "No structured or cached data available",
                "_meta": {
                    "source": "fallback_minimal",
                    "generated_at": datetime.utcnow().isoformat()
                }
            }


# Global service instance
structured_widget_service = StructuredWidgetService()