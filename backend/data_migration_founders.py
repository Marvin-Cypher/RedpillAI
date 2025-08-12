#!/usr/bin/env python3
"""
Data migration script to extract existing founder information from Company.enriched_data 
and CompanyDataCache into structured Person records.

This script:
1. Scans all companies for founder data in various JSON fields
2. Creates Person records for each founder found
3. Establishes proper Company-Person relationships
4. Creates Ownership records if equity information is available
5. Preserves data lineage and confidence scores

Usage: python data_migration_founders.py [--dry-run] [--verbose]
"""

import asyncio
import sys
import os
import re
import argparse
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
import json

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models.companies import Company
from app.models.persons import Person, PersonCreate, PERSON_ROLES
from app.models.ownership import Ownership
from app.models.cache import CompanyDataCache
from sqlmodel import Session, select
import sqlmodel


class FounderDataExtractor:
    """Extract founder data from various sources and formats."""
    
    FOUNDER_KEYS = [
        'founders', 'founding_team', 'founders_list', 'team', 'leadership',
        'key_people', 'executives', 'management_team', 'original_tavily_founders',
        'cofounders', 'founding_members', 'creator', 'creators'
    ]
    
    FOUNDER_ROLES = [
        'founder', 'co-founder', 'cofounder', 'ceo', 'chief executive', 
        'president', 'creator', 'established by', 'founded by'
    ]
    
    def __init__(self, session: Session):
        self.session = session
        self.extraction_stats = {
            'companies_processed': 0,
            'founders_found': 0,
            'founders_created': 0,
            'founders_matched': 0,
            'ownership_records_created': 0,
            'extraction_sources': {},
            'errors': []
        }
    
    def extract_founders_from_company(self, company: Company) -> List[Dict[str, Any]]:
        """Extract founder information from a company's various data sources."""
        founders = []
        
        # 1. Extract from enriched_data JSON field
        if company.enriched_data:
            founders.extend(self._extract_from_enriched_data(company.enriched_data, company.id))
        
        # 2. Extract from cached data
        founders.extend(self._extract_from_cached_data(company))
        
        # 3. Extract from key_metrics field (if it contains team info)
        if company.key_metrics:
            founders.extend(self._extract_from_key_metrics(company.key_metrics, company.id))
        
        # 4. Deduplicate founders based on name similarity
        founders = self._deduplicate_founders(founders)
        
        # 5. Enrich with company context
        for founder in founders:
            founder['company_id'] = company.id
            founder['company_name'] = company.name
            if not founder.get('source'):
                founder['source'] = 'migration_extraction'
        
        return founders
    
    def _extract_from_enriched_data(self, enriched_data: Dict[str, Any], company_id: str) -> List[Dict[str, Any]]:
        """Extract founders from the enriched_data JSON field."""
        founders = []
        source = f"enriched_data_{company_id}"
        
        try:
            # Check all possible founder keys
            for key in self.FOUNDER_KEYS:
                if key in enriched_data:
                    data = enriched_data[key]
                    founders.extend(self._parse_founder_data(data, source, key))
            
            # Check nested structures (like tavily response)
            if 'response' in enriched_data and isinstance(enriched_data['response'], dict):
                for key in self.FOUNDER_KEYS:
                    if key in enriched_data['response']:
                        data = enriched_data['response'][key]
                        founders.extend(self._parse_founder_data(data, f"{source}_response", key))
            
            # Check for team data in answer fields
            if 'answer' in enriched_data:
                text_founders = self._extract_founders_from_text(enriched_data['answer'], source)
                founders.extend(text_founders)
        
        except Exception as e:
            self.extraction_stats['errors'].append(f"Error extracting from enriched_data {company_id}: {str(e)}")
        
        return founders
    
    def _extract_from_cached_data(self, company: Company) -> List[Dict[str, Any]]:
        """Extract founders from CompanyDataCache entries."""
        founders = []
        
        try:
            # Query cache entries for this company
            cache_entries = self.session.exec(
                select(CompanyDataCache).where(
                    CompanyDataCache.company_identifier == company.name.lower().replace(" ", "")
                )
            ).all()
            
            for cache_entry in cache_entries:
                if cache_entry.cached_data:
                    source = f"cache_{cache_entry.data_type}_{cache_entry.source}"
                    
                    # Check all possible founder keys in cached data
                    for key in self.FOUNDER_KEYS:
                        if key in cache_entry.cached_data:
                            data = cache_entry.cached_data[key]
                            founders.extend(self._parse_founder_data(data, source, key))
                    
                    # Check for text descriptions that might contain founder names
                    if 'description' in cache_entry.cached_data:
                        text_founders = self._extract_founders_from_text(
                            cache_entry.cached_data['description'], 
                            source
                        )
                        founders.extend(text_founders)
        
        except Exception as e:
            self.extraction_stats['errors'].append(f"Error extracting from cache for {company.name}: {str(e)}")
        
        return founders
    
    def _extract_from_key_metrics(self, key_metrics: Dict[str, Any], company_id: str) -> List[Dict[str, Any]]:
        """Extract founders from key_metrics field."""
        founders = []
        source = f"key_metrics_{company_id}"
        
        try:
            # Check if key_metrics contains team information
            for key in self.FOUNDER_KEYS:
                if key in key_metrics:
                    data = key_metrics[key]
                    founders.extend(self._parse_founder_data(data, source, key))
        
        except Exception as e:
            self.extraction_stats['errors'].append(f"Error extracting from key_metrics {company_id}: {str(e)}")
        
        return founders
    
    def _parse_founder_data(self, data: Any, source: str, data_key: str) -> List[Dict[str, Any]]:
        """Parse founder data from various formats."""
        founders = []
        
        try:
            if isinstance(data, list):
                # List of founder objects or strings
                for item in data:
                    if isinstance(item, dict):
                        founder = self._parse_founder_object(item, source, data_key)
                        if founder:
                            founders.append(founder)
                    elif isinstance(item, str):
                        founder = self._parse_founder_string(item, source)
                        if founder:
                            founders.append(founder)
            
            elif isinstance(data, dict):
                # Single founder object
                founder = self._parse_founder_object(data, source, data_key)
                if founder:
                    founders.append(founder)
            
            elif isinstance(data, str):
                # Comma-separated founder names or description text
                if ',' in data or 'founded by' in data.lower():
                    text_founders = self._extract_founders_from_text(data, source)
                    founders.extend(text_founders)
                else:
                    founder = self._parse_founder_string(data, source)
                    if founder:
                        founders.append(founder)
        
        except Exception as e:
            self.extraction_stats['errors'].append(f"Error parsing founder data from {source}: {str(e)}")
        
        return founders
    
    def _parse_founder_object(self, obj: Dict[str, Any], source: str, data_key: str) -> Optional[Dict[str, Any]]:
        """Parse a founder object with potentially multiple fields."""
        if not isinstance(obj, dict):
            return None
        
        # Try to extract name from various fields
        name = None
        for name_field in ['name', 'full_name', 'person_name', 'founder_name', 'title']:
            if name_field in obj and obj[name_field]:
                name = obj[name_field].strip()
                break
        
        if not name or len(name.split()) < 2:
            return None
        
        # Extract other fields
        founder = {
            'name': name,
            'source': source,
            'extraction_method': f'object_parsing_{data_key}',
            'confidence_score': 85,  # Object parsing is fairly reliable
        }
        
        # Map common fields
        field_mappings = {
            'title': ['title', 'role', 'position', 'primary_role'],
            'email': ['email', 'contact_email'],
            'linkedin_url': ['linkedin', 'linkedin_url', 'linkedin_profile'],
            'twitter_handle': ['twitter', 'twitter_handle', 'twitter_url'],
            'bio': ['bio', 'description', 'background'],
            'location': ['location', 'city', 'residence']
        }
        
        for target_field, source_fields in field_mappings.items():
            for source_field in source_fields:
                if source_field in obj and obj[source_field]:
                    founder[target_field] = str(obj[source_field]).strip()
                    break
        
        # Extract ownership information if available
        ownership_fields = ['ownership', 'equity', 'percentage', 'stake', 'shares']
        for field in ownership_fields:
            if field in obj and obj[field]:
                founder['ownership_percentage'] = self._parse_percentage(obj[field])
                break
        
        # Try to determine role
        if not founder.get('title'):
            founder['title'] = self._infer_role_from_context(name, data_key, str(obj))
        
        return founder
    
    def _parse_founder_string(self, founder_str: str, source: str) -> Optional[Dict[str, Any]]:
        """Parse a founder string (just a name or name with role)."""
        founder_str = founder_str.strip()
        
        if not founder_str or len(founder_str.split()) < 2:
            return None
        
        # Try to extract name and role from patterns like "John Doe (CEO)" or "John Doe, CEO"
        name_role_patterns = [
            r'^(.+?)\s*\((.+?)\)$',  # "John Doe (CEO)"
            r'^(.+?),\s*(.+?)$',     # "John Doe, CEO"
            r'^(.+?)\s*-\s*(.+?)$',  # "John Doe - CEO"
        ]
        
        name = founder_str
        role = None
        
        for pattern in name_role_patterns:
            match = re.match(pattern, founder_str)
            if match:
                name = match.group(1).strip()
                role = match.group(2).strip()
                break
        
        # Clean up the name
        name = re.sub(r'\s+', ' ', name).strip()
        
        if not name or len(name.split()) < 2:
            return None
        
        founder = {
            'name': name,
            'source': source,
            'extraction_method': 'string_parsing',
            'confidence_score': 70,  # String parsing is less reliable
        }
        
        if role:
            founder['title'] = role
        else:
            founder['title'] = self._infer_role_from_context(name, 'string', founder_str)
        
        return founder
    
    def _extract_founders_from_text(self, text: str, source: str) -> List[Dict[str, Any]]:
        """Extract founder names from free text using NLP patterns."""
        founders = []
        
        if not text or not isinstance(text, str):
            return founders
        
        try:
            # Patterns to find founder mentions
            patterns = [
                r'founded by (.+?)(?:\.|,|;|$)',
                r'co-founded by (.+?)(?:\.|,|;|$)',
                r'established by (.+?)(?:\.|,|;|$)',
                r'created by (.+?)(?:\.|,|;|$)',
                r'CEO and founder (.+?)(?:\.|,|;|$)',
                r'founder and CEO (.+?)(?:\.|,|;|$)',
                r'founded in \d+ by (.+?)(?:\.|,|;|$)',
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                for match in matches:
                    # Split by 'and', '&', ',' to handle multiple founders
                    names = re.split(r'\s+and\s+|\s*&\s*|\s*,\s*', match)
                    
                    for name in names:
                        name = name.strip()
                        # Clean up common suffixes and titles
                        name = re.sub(r'\s*\([^)]*\)$', '', name)  # Remove (title) at end
                        name = re.sub(r'^(Mr\.|Ms\.|Dr\.|Prof\.)\s*', '', name, flags=re.IGNORECASE)
                        
                        if name and len(name.split()) >= 2:
                            founders.append({
                                'name': name,
                                'title': 'Founder',
                                'source': source,
                                'extraction_method': 'text_pattern_matching',
                                'confidence_score': 60,  # Text extraction is less reliable
                            })
        
        except Exception as e:
            self.extraction_stats['errors'].append(f"Error extracting from text: {str(e)}")
        
        return founders
    
    def _infer_role_from_context(self, name: str, data_key: str, context: str) -> str:
        """Infer founder role from context."""
        context_lower = (data_key + " " + context).lower()
        
        # Check for specific role indicators
        if any(word in context_lower for word in ['ceo', 'chief executive']):
            return 'CEO & Founder'
        elif any(word in context_lower for word in ['cto', 'chief technology']):
            return 'CTO & Founder'
        elif any(word in context_lower for word in ['cfo', 'chief financial']):
            return 'CFO & Founder'
        elif 'co-founder' in context_lower or 'cofounder' in context_lower:
            return 'Co-Founder'
        else:
            return 'Founder'
    
    def _parse_percentage(self, value: Any) -> Optional[float]:
        """Parse percentage value from various formats."""
        if not value:
            return None
        
        try:
            if isinstance(value, (int, float)):
                return float(value)
            
            if isinstance(value, str):
                # Remove % sign and convert
                percentage_str = value.replace('%', '').strip()
                return float(percentage_str)
        
        except (ValueError, TypeError):
            pass
        
        return None
    
    def _deduplicate_founders(self, founders: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicate founders based on name similarity."""
        if not founders:
            return founders
        
        # Simple deduplication based on name similarity
        unique_founders = []
        seen_names = set()
        
        for founder in founders:
            name_key = founder['name'].lower().replace(' ', '').replace('.', '')
            if name_key not in seen_names:
                seen_names.add(name_key)
                unique_founders.append(founder)
            else:
                # Merge additional information into existing founder
                for existing in unique_founders:
                    if existing['name'].lower().replace(' ', '') == founder['name'].lower().replace(' ', ''):
                        # Merge fields if the new one has more info
                        for key, value in founder.items():
                            if key not in existing or not existing[key]:
                                existing[key] = value
                        # Take highest confidence score
                        existing['confidence_score'] = max(
                            existing.get('confidence_score', 0),
                            founder.get('confidence_score', 0)
                        )
                        break
        
        return unique_founders
    
    def create_person_record(self, founder_data: Dict[str, Any]) -> Optional[Person]:
        """Create a Person record from extracted founder data."""
        try:
            # Check if person already exists
            existing_person = self.session.exec(
                select(Person).where(
                    Person.name == founder_data['name'],
                    Person.company_id == founder_data['company_id']
                )
            ).first()
            
            if existing_person:
                self.extraction_stats['founders_matched'] += 1
                return existing_person
            
            # Create new person
            person_data = PersonCreate(
                name=founder_data['name'],
                title=founder_data.get('title'),
                email=founder_data.get('email'),
                linkedin_url=founder_data.get('linkedin_url'),
                twitter_handle=founder_data.get('twitter_handle'),
                bio=founder_data.get('bio'),
                location=founder_data.get('location'),
                company_id=founder_data['company_id'],
                primary_role=self._map_to_primary_role(founder_data.get('title', 'Founder'))
            )
            
            person = Person(**person_data.model_dump())
            person.source = founder_data.get('extraction_method', 'migration')
            person.confidence_score = founder_data.get('confidence_score', 70)
            person.created_at = datetime.utcnow()
            person.updated_at = datetime.utcnow()
            
            self.session.add(person)
            self.session.flush()  # Get the ID
            
            self.extraction_stats['founders_created'] += 1
            
            # Create ownership record if percentage is available
            if founder_data.get('ownership_percentage'):
                self._create_ownership_record(person, founder_data)
            
            return person
        
        except Exception as e:
            self.extraction_stats['errors'].append(f"Error creating person {founder_data.get('name', 'Unknown')}: {str(e)}")
            return None
    
    def _map_to_primary_role(self, title: Optional[str]) -> str:
        """Map title to a standardized primary role."""
        if not title:
            return "FOUNDER"
        
        title_lower = title.lower()
        
        # Map to standard roles
        if 'ceo' in title_lower or 'chief executive' in title_lower:
            return "CEO"
        elif 'cto' in title_lower or 'chief technology' in title_lower:
            return "CTO"
        elif 'cfo' in title_lower or 'chief financial' in title_lower:
            return "CFO"
        elif 'co-founder' in title_lower or 'cofounder' in title_lower:
            return "CO_FOUNDER"
        else:
            return "FOUNDER"
    
    def _create_ownership_record(self, person: Person, founder_data: Dict[str, Any]):
        """Create an ownership record for the founder."""
        try:
            ownership = Ownership(
                person_id=person.id,
                company_id=founder_data['company_id'],
                ownership_type="FOUNDER_EQUITY",
                percentage=founder_data['ownership_percentage'],
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            self.session.add(ownership)
            self.extraction_stats['ownership_records_created'] += 1
        
        except Exception as e:
            self.extraction_stats['errors'].append(f"Error creating ownership for {person.name}: {str(e)}")


async def migrate_founder_data(dry_run: bool = False, verbose: bool = False):
    """Main migration function."""
    print("🔄 Starting founder data migration...")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE MIGRATION'}")
    
    # Create tables if needed
    if not dry_run:
        print("📋 Creating database tables...")
        sqlmodel.SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # Initialize extractor
        extractor = FounderDataExtractor(session)
        
        # Get all companies
        companies = session.exec(select(Company)).all()
        print(f"📊 Found {len(companies)} companies to process")
        
        migration_results = []
        
        for company in companies:
            print(f"\n🏢 Processing: {company.name}")
            extractor.extraction_stats['companies_processed'] += 1
            
            try:
                # Extract founder data
                founders = extractor.extract_founders_from_company(company)
                
                if not founders:
                    print(f"   ⚠️  No founder data found")
                    continue
                
                print(f"   👥 Found {len(founders)} founder(s):")
                
                company_results = {
                    'company_id': company.id,
                    'company_name': company.name,
                    'founders': []
                }
                
                for founder in founders:
                    extractor.extraction_stats['founders_found'] += 1
                    
                    if verbose:
                        print(f"   • {founder['name']} ({founder.get('title', 'Unknown role')})")
                        print(f"     Source: {founder.get('source', 'Unknown')}")
                        print(f"     Confidence: {founder.get('confidence_score', 'N/A')}")
                    else:
                        print(f"   • {founder['name']} ({founder.get('title', 'Unknown role')})")
                    
                    if not dry_run:
                        person = extractor.create_person_record(founder)
                        if person:
                            company_results['founders'].append({
                                'person_id': person.id,
                                'name': person.name,
                                'title': person.title,
                                'primary_role': person.primary_role,
                                'confidence_score': person.confidence_score,
                                'source': person.source
                            })
                
                migration_results.append(company_results)
            
            except Exception as e:
                error_msg = f"Error processing company {company.name}: {str(e)}"
                print(f"   ❌ {error_msg}")
                extractor.extraction_stats['errors'].append(error_msg)
        
        # Commit changes
        if not dry_run and extractor.extraction_stats['founders_created'] > 0:
            try:
                print(f"\n💾 Committing {extractor.extraction_stats['founders_created']} new person records...")
                session.commit()
                print("✅ Migration completed successfully!")
            except Exception as e:
                print(f"❌ Error committing changes: {str(e)}")
                session.rollback()
                return
        
        # Print summary
        print("\n" + "="*60)
        print("📊 MIGRATION SUMMARY")
        print("="*60)
        stats = extractor.extraction_stats
        print(f"Companies processed:      {stats['companies_processed']}")
        print(f"Founders found:           {stats['founders_found']}")
        print(f"Person records created:   {stats['founders_created']}")
        print(f"Existing persons matched: {stats['founders_matched']}")
        print(f"Ownership records:        {stats['ownership_records_created']}")
        print(f"Errors encountered:       {len(stats['errors'])}")
        
        if stats['errors'] and verbose:
            print("\n⚠️ ERRORS:")
            for error in stats['errors'][:10]:  # Show first 10 errors
                print(f"  • {error}")
            if len(stats['errors']) > 10:
                print(f"  ... and {len(stats['errors']) - 10} more errors")
        
        # Save migration results to file
        if migration_results:
            results_file = f"migration_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(results_file, 'w') as f:
                json.dump(migration_results, f, indent=2, default=str)
            print(f"\n📄 Detailed results saved to: {results_file}")
        
        print(f"\n{'🎯 DRY RUN COMPLETE' if dry_run else '🎉 MIGRATION COMPLETE'}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate founder data to Person records")
    parser.add_argument('--dry-run', action='store_true', help='Run without making changes')
    parser.add_argument('--verbose', action='store_true', help='Show detailed output')
    
    args = parser.parse_args()
    
    asyncio.run(migrate_founder_data(dry_run=args.dry_run, verbose=args.verbose))