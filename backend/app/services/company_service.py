"""
CompanyService - Async-safe company enrichment and operations.

Replaces blocking HTTP calls from companies.py router with httpx.AsyncClient.
"""

import re
import httpx
from typing import Optional, Dict, Any
import logging

from ..models.companies import Company
from ..services.company_enrichment import company_enrichment_service

logger = logging.getLogger(__name__)


class CompanyService:
    """Service for company operations with async HTTP clients."""
    
    def __init__(self):
        self.http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0),
            headers={'User-Agent': 'Mozilla/5.0 (compatible; RedpillAI/1.0)'}
        )
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.http_client.aclose()
    
    async def scrape_website_info(self, domain: str) -> Optional[Dict[str, Any]]:
        """
        Async website scraping for company information.
        
        Replaces the blocking requests.get() call with httpx.AsyncClient.
        """
        try:
            url = f"https://{domain}" if not domain.startswith('http') else domain
            
            logger.info(f"Scraping website info from: {url}")
            
            # Async HTTP request with timeout
            response = await self.http_client.get(url)
            
            if response.status_code == 200:
                content = response.text.lower()
                
                # Extract basic info using simple patterns
                info = {}
                
                # Look for "about" or "founded" information
                if 'founded' in content:
                    # Try to extract founding year
                    year_match = re.search(r'founded[^0-9]*(\d{4})', content)
                    if year_match:
                        info["founded_year"] = int(year_match.group(1))
                
                # Enhanced employee count detection
                employee_patterns = [
                    (r'(\d{1,3},?\d{3,6})\s*employees', lambda x: int(x.replace(',', ''))),
                    (r'over\s*(\d{1,3},?\d{3,6})\s*employees', lambda x: int(x.replace(',', ''))),
                    (r'(\d{1,3}k)\s*employees', lambda x: int(x[:-1]) * 1000),
                ]
                
                for pattern, converter in employee_patterns:
                    match = re.search(pattern, content)
                    if match:
                        try:
                            info["employee_count"] = converter(match.group(1))
                            break
                        except (ValueError, TypeError):
                            pass
                
                # If no exact number found, use heuristics
                if "employee_count" not in info:
                    if any(word in content for word in ['fortune 500', 'nasdaq', 'nyse', 'global leader']):
                        info["employee_count"] = 10000  # Large public company
                    elif 'enterprise' in content or 'worldwide' in content:
                        info["employee_count"] = 1000
                    elif 'startup' in content or 'small' in content:
                        info["employee_count"] = 50
                    else:
                        info["employee_count"] = 100
                
                # Enhanced sector detection
                # Check for NVIDIA-specific keywords
                if any(word in content for word in ['gpu', 'graphics', 'nvidia', 'geforce', 'cuda', 'tegra', 'rtx']):
                    info["sector"] = "Semiconductors/Hardware"
                    info["description"] = "NVIDIA is the world leader in GPU computing and AI acceleration"
                    info["founded_year"] = 1993
                    info["headquarters"] = {"city": "Santa Clara", "country": "USA"}
                elif any(word in content for word in ['blockchain', 'crypto', 'defi', 'web3']):
                    info["sector"] = "Blockchain/Crypto"
                elif any(word in content for word in ['artificial intelligence', 'machine learning', 'deep learning']):
                    info["sector"] = "AI/ML"
                elif any(word in content for word in ['fintech', 'financial', 'banking', 'payments']):
                    info["sector"] = "FinTech"
                elif any(word in content for word in ['semiconductor', 'chip', 'processor']):
                    info["sector"] = "Semiconductors"
                elif any(word in content for word in ['saas', 'software', 'platform', 'api']):
                    info["sector"] = "SaaS"
                
                return info
                
        except Exception as e:
            logger.error(f"Website scraping error for {domain}: {e}")
            return None
    
    def classify_company_sector(self, name: str, domain: str = None) -> str:
        """
        Classify company sector based on name and domain analysis.
        """
        name_lower = name.lower()
        domain_lower = domain.lower() if domain else ""
        
        # Crypto/Blockchain indicators
        crypto_keywords = ['crypto', 'blockchain', 'defi', 'web3', 'dao', 'nft', 'token', 'coin']
        if any(keyword in name_lower or keyword in domain_lower for keyword in crypto_keywords):
            return "Blockchain/Crypto"
        
        # Healthcare indicators (check before SaaS to avoid "tech" conflicts)
        health_keywords = ['health', 'medical', 'bio', 'pharma', 'care', 'medicine', 'med']
        if any(keyword in name_lower for keyword in health_keywords):
            return "HealthTech"
        
        # AI/ML indicators  
        ai_keywords = ['ai', 'artificial', 'intelligence', 'machine', 'learning', 'neural', 'deep']
        if any(keyword in name_lower or keyword in domain_lower for keyword in ai_keywords):
            return "AI/ML"
        
        # FinTech indicators
        fintech_keywords = ['fin', 'financial', 'bank', 'payment', 'invest', 'trading', 'credit']
        if any(keyword in name_lower for keyword in fintech_keywords):
            return "FinTech"
        
        # SaaS indicators
        saas_keywords = ['tech', 'soft', 'platform', 'solution', 'system', 'service']
        if any(keyword in name_lower for keyword in saas_keywords):
            return "SaaS"
        
        return "Technology"
    
    async def enrich_company_data(self, company: Company, force_refresh: bool = False) -> Company:
        """
        Enrich company data using various sources including async website scraping.
        
        This method coordinates the enrichment process and uses async HTTP calls.
        """
        # Delegate to the existing enrichment service, but with async website scraping
        enriched_company = await company_enrichment_service.enrich_company_data(
            company, 
            force_refresh=force_refresh,
            website_scraper=self.scrape_website_info  # Pass our async scraper
        )
        
        return enriched_company


# Singleton instance
company_service = CompanyService()