#!/usr/bin/env python3
"""
Seed backend database with missing companies that should be in the portfolio.
Run this script to populate the database with key companies like Phala, Nvidia, Chainlink, etc.
"""

import asyncio
import sys
import os
from datetime import datetime
from typing import Dict, List, Any

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models.companies import Company, CompanyType, CompanyCreate
from app.models.cache import CompanyDataCache
from sqlmodel import Session, select
import sqlmodel


# Define key companies that should be in our portfolio
PORTFOLIO_COMPANIES = [
    {
        "name": "Phala Network",
        "description": "Phala Network is a decentralized cloud computing protocol that provides secure and scalable computation for smart contracts through confidential computing.",
        "website": "https://phala.network",
        "company_type": CompanyType.CRYPTO,
        "sector": "infrastructure",
        "token_symbol": "PHA",
        "founded_year": 2018,
        "headquarters": "Singapore",
        "employee_count": "50-100",
        "github_repo": "https://github.com/Phala-Network",
        "whitepaper_url": "https://phala.network/whitepaper"
    },
    {
        "name": "NVIDIA Corporation",
        "description": "NVIDIA is the world leader in GPU computing, AI acceleration, and data center technologies. The company pioneered GPU computing and is at the forefront of AI infrastructure.",
        "website": "https://nvidia.com",
        "company_type": CompanyType.PRIVATE,
        "sector": "semiconductors",
        "token_symbol": "NVDA",  # Stock ticker
        "founded_year": 1993,
        "headquarters": "Santa Clara, USA",
        "employee_count": "26,000+",
        "logo_url": "https://logos.nvidia.com/logo.png"
    },
    {
        "name": "Chainlink",
        "description": "Chainlink is a decentralized oracle network that enables smart contracts to securely access off-chain data feeds, web APIs, and traditional bank payments.",
        "website": "https://chain.link",
        "company_type": CompanyType.CRYPTO,
        "sector": "oracles",
        "token_symbol": "LINK",
        "founded_year": 2017,
        "headquarters": "Cayman Islands",
        "employee_count": "100-200",
        "github_repo": "https://github.com/smartcontractkit",
        "whitepaper_url": "https://link.smartcontract.com/whitepaper"
    },
    {
        "name": "Amazon",
        "description": "Amazon is a multinational technology company focusing on e-commerce, cloud computing, digital streaming, and artificial intelligence.",
        "website": "https://amazon.com",
        "company_type": CompanyType.PUBLIC,
        "sector": "e-commerce",
        "token_symbol": "AMZN",
        "founded_year": 1994,
        "headquarters": "Seattle, USA",
        "employee_count": "1,500,000+",
        "logo_url": "https://amazon.com/favicon.ico"
    },
    {
        "name": "Polygon",
        "description": "Polygon is a decentralized Ethereum scaling platform that enables developers to build scalable user-friendly dApps with low transaction fees.",
        "website": "https://polygon.technology",
        "company_type": CompanyType.CRYPTO,
        "sector": "layer2",
        "token_symbol": "MATIC",
        "founded_year": 2017,
        "headquarters": "Mumbai, India",
        "employee_count": "100-500",
        "github_repo": "https://github.com/maticnetwork",
        "whitepaper_url": "https://polygon.technology/lightpaper-polygon.pdf"
    },
    {
        "name": "Solana Labs",
        "description": "Solana is a high-performance blockchain supporting builders around the world creating crypto apps that scale today.",
        "website": "https://solana.com",
        "company_type": CompanyType.CRYPTO,
        "sector": "layer1",
        "token_symbol": "SOL",
        "founded_year": 2017,
        "headquarters": "San Francisco, USA",
        "employee_count": "100-200",
        "github_repo": "https://github.com/solana-labs",
        "whitepaper_url": "https://solana.com/solana-whitepaper.pdf"
    },
    {
        "name": "Uniswap Labs",
        "description": "Uniswap is a decentralized trading protocol, eliminating trusted intermediaries and unnecessary forms of rent extraction.",
        "website": "https://uniswap.org",
        "company_type": CompanyType.CRYPTO,
        "sector": "trading",
        "token_symbol": "UNI",
        "founded_year": 2018,
        "headquarters": "New York, USA",
        "employee_count": "50-100",
        "github_repo": "https://github.com/Uniswap",
        "whitepaper_url": "https://uniswap.org/whitepaper.pdf"
    },
    {
        "name": "Aave",
        "description": "Aave is an open source and non-custodial liquidity protocol that enables users to earn interest on deposits and borrow assets.",
        "website": "https://aave.com",
        "company_type": CompanyType.CRYPTO,
        "sector": "lending",
        "token_symbol": "AAVE",
        "founded_year": 2017,
        "headquarters": "London, UK",
        "employee_count": "50-100",
        "github_repo": "https://github.com/aave",
        "whitepaper_url": "https://github.com/aave/protocol-v2/blob/master/aave-v2-whitepaper.pdf"
    },
    {
        "name": "The Graph",
        "description": "The Graph is an indexing protocol for querying networks like Ethereum and IPFS, making it possible to query data that is difficult to query directly.",
        "website": "https://thegraph.com",
        "company_type": CompanyType.CRYPTO,
        "sector": "infrastructure",
        "token_symbol": "GRT",
        "founded_year": 2018,
        "headquarters": "San Francisco, USA",
        "employee_count": "25-50",
        "github_repo": "https://github.com/graphprotocol",
        "whitepaper_url": "https://thegraph.com/docs/introduction"
    },
    {
        "name": "Polkadot",
        "description": "Polkadot is a heterogeneous multi-chain technology that enables diverse blockchains to transfer messages, including value, in a trust-free fashion; sharing their unique features while pooling their security.",
        "website": "https://polkadot.network",
        "company_type": CompanyType.CRYPTO,
        "sector": "layer0",
        "token_symbol": "DOT",
        "founded_year": 2016,
        "headquarters": "Zug, Switzerland",
        "employee_count": "100-200",
        "github_repo": "https://github.com/paritytech/polkadot",
        "whitepaper_url": "https://polkadot.network/PolkaDotPaper.pdf"
    },
    {
        "name": "OpenAI",
        "description": "OpenAI is an AI research and deployment company that created ChatGPT, GPT-4, and DALL-E. Their mission is to ensure that artificial general intelligence benefits all of humanity.",
        "website": "https://openai.com",
        "company_type": CompanyType.PRIVATE,
        "sector": "ai",
        "founded_year": 2015,
        "headquarters": "San Francisco, USA",
        "employee_count": "500+",
        "logo_url": "https://openai.com/favicon.ico"
    },
    {
        "name": "GreenTech Solutions",
        "description": "GreenTech Solutions develops innovative solar panel technology for residential and commercial applications.",
        "website": "https://greentech-solutions.com",
        "company_type": CompanyType.PUBLIC,
        "sector": "cleantech",
        "founded_year": 2023,
        "headquarters": "Berlin, Germany",
        "employee_count": "8"
    },
    # Top 10 Cyber Security Companies
    {
        "name": "Palo Alto Networks",
        "description": "Global cybersecurity leader providing next-generation security solutions including firewalls, cloud security, and endpoint protection.",
        "website": "https://paloaltonetworks.com",
        "company_type": CompanyType.PUBLIC,
        "sector": "cybersecurity",
        "token_symbol": "PANW",
        "founded_year": 2005,
        "headquarters": "Santa Clara, USA",
        "employee_count": "14,000+"
    },
    {
        "name": "CrowdStrike",
        "description": "Cloud-delivered endpoint protection platform that provides next-generation antivirus, endpoint detection and response, and threat intelligence.",
        "website": "https://crowdstrike.com",
        "company_type": CompanyType.PUBLIC,
        "sector": "cybersecurity",
        "token_symbol": "CRWD",
        "founded_year": 2011,
        "headquarters": "Austin, USA",
        "employee_count": "8,000+"
    },
    {
        "name": "Fortinet",
        "description": "Develops and sells cybersecurity solutions including firewalls, anti-virus, intrusion prevention and endpoint security.",
        "website": "https://fortinet.com",
        "company_type": CompanyType.PUBLIC,
        "sector": "cybersecurity",
        "token_symbol": "FTNT",
        "founded_year": 2000,
        "headquarters": "Sunnyvale, USA",
        "employee_count": "13,000+"
    },
    {
        "name": "Zscaler",
        "description": "Cloud-based information security company providing Internet security, web security, next generation firewalls, sandboxing, SSL inspection, and more.",
        "website": "https://zscaler.com",
        "company_type": CompanyType.PUBLIC,
        "sector": "cybersecurity",
        "token_symbol": "ZS",
        "founded_year": 2008,
        "headquarters": "San Jose, USA",
        "employee_count": "7,000+"
    },
    {
        "name": "SentinelOne",
        "description": "Autonomous cybersecurity platform that delivers AI-powered prevention, detection, and response across endpoints, cloud, and IoT.",
        "website": "https://sentinelone.com",
        "company_type": CompanyType.PUBLIC,
        "sector": "cybersecurity",
        "token_symbol": "S",
        "founded_year": 2013,
        "headquarters": "Mountain View, USA",
        "employee_count": "2,500+"
    },
    {
        "name": "Cloudflare",
        "description": "Web infrastructure and security company providing CDN, DDoS mitigation, Internet security, and distributed DNS services.",
        "website": "https://cloudflare.com",
        "company_type": CompanyType.PUBLIC,
        "sector": "cybersecurity",
        "token_symbol": "NET",
        "founded_year": 2009,
        "headquarters": "San Francisco, USA",
        "employee_count": "3,500+"
    },
    {
        "name": "Okta",
        "description": "Identity and access management company providing cloud software that helps companies manage and secure user authentication and authorization.",
        "website": "https://okta.com",
        "company_type": CompanyType.PUBLIC,
        "sector": "cybersecurity",
        "token_symbol": "OKTA",
        "founded_year": 2009,
        "headquarters": "San Francisco, USA",
        "employee_count": "6,000+"
    },
    {
        "name": "Check Point Software",
        "description": "Multinational provider of software and hardware products for IT security including network security, endpoint security, cloud security, and mobile security.",
        "website": "https://checkpoint.com",
        "company_type": CompanyType.PUBLIC,
        "sector": "cybersecurity",
        "token_symbol": "CHKP",
        "founded_year": 1993,
        "headquarters": "Tel Aviv, Israel",
        "employee_count": "7,000+"
    },
    {
        "name": "Datadog",
        "description": "Monitoring and security platform for cloud applications, providing observability across infrastructure, applications, and security.",
        "website": "https://datadoghq.com",
        "company_type": CompanyType.PUBLIC,
        "sector": "cybersecurity",
        "token_symbol": "DDOG",
        "founded_year": 2010,
        "headquarters": "New York, USA",
        "employee_count": "5,000+"
    },
    {
        "name": "Elastic",
        "description": "Search company that builds self-managed and SaaS offerings for search, logging, security, observability, and analytics use cases.",
        "website": "https://elastic.co",
        "company_type": CompanyType.PUBLIC,
        "sector": "cybersecurity",
        "token_symbol": "ESTC",
        "founded_year": 2012,
        "headquarters": "Mountain View, USA",
        "employee_count": "3,000+"
    }
]


def create_company_data_cache(session: Session, company: Company, profile_data: Dict[str, Any]):
    """Create cached company data for the seeded company."""
    cache_entry = CompanyDataCache(
        company_identifier=company.name.lower().replace(" ", ""),
        data_type="profile",
        cached_data=profile_data,
        source="seed",
        confidence_score=0.95,
        expires_at=datetime(2025, 12, 31)  # Long-lived seed data
    )
    session.add(cache_entry)
    return cache_entry


def generate_company_metrics(company_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate realistic company metrics based on company type and sector."""
    
    company_type = company_data.get("company_type", CompanyType.PRIVATE)
    sector = company_data.get("sector", "technology")
    employee_count_str = company_data.get("employee_count", "50")
    
    # Extract numeric employee count
    employee_count = 50
    if employee_count_str:
        import re
        numbers = re.findall(r'[\d,]+', str(employee_count_str))
        if numbers:
            employee_count = int(numbers[0].replace(',', ''))
    
    # Base metrics by company type and size
    if company_type == CompanyType.CRYPTO:
        if "phala" in company_data["name"].lower():
            return {
                "revenue": 2400000,  # $2.4M annual
                "revenue_growth": 180.0,
                "burn_rate": 350000,  # $350k monthly
                "runway": 18,
                "customers": 75,
                "arr": 2880000,
                "gross_margin": 82.0,
                "valuation": 150000000  # $150M
            }
        elif "chainlink" in company_data["name"].lower():
            return {
                "revenue": 45000000,  # $45M annual
                "revenue_growth": 85.0,
                "burn_rate": 2500000,  # $2.5M monthly
                "runway": 24,
                "customers": 1500,
                "arr": 54000000,
                "gross_margin": 88.0,
                "valuation": 8000000000  # $8B
            }
        elif "polygon" in company_data["name"].lower():
            return {
                "revenue": 25000000,  # $25M annual
                "revenue_growth": 120.0,
                "burn_rate": 1800000,  # $1.8M monthly
                "runway": 30,
                "customers": 3000,
                "arr": 30000000,
                "gross_margin": 85.0,
                "valuation": 5000000000  # $5B
            }
        elif "polkadot" in company_data["name"].lower():
            return {
                "revenue": 15000000,  # $15M annual
                "revenue_growth": 95.0,
                "burn_rate": 1200000,  # $1.2M monthly
                "runway": 36,
                "customers": 2000,
                "arr": 18000000,
                "gross_margin": 90.0,
                "valuation": 3500000000  # $3.5B (based on market cap)
            }
        elif "greentech" in company_data["name"].lower():
            return {
                "revenue": 45000,  # $45k annual
                "revenue_growth": 15.2,
                "burn_rate": 85000,  # $85k monthly
                "runway": 18,
                "customers": 25,
                "arr": 540000,
                "gross_margin": 65.0,
                "valuation": 5000000  # $5M
            }
        else:
            # Generic crypto company
            multiplier = min(employee_count / 50, 10.0)
            return {
                "revenue": int(1200000 * multiplier),
                "revenue_growth": 150.0,
                "burn_rate": int(200000 * multiplier),
                "runway": 20,
                "customers": int(100 * multiplier),
                "arr": int(1440000 * multiplier),
                "gross_margin": 80.0,
                "valuation": int(50000000 * multiplier)
            }
    
    elif company_type == CompanyType.PRIVATE and sector in ["ai", "artificial intelligence"]:
        if "nvidia" in company_data["name"].lower():
            return {
                "revenue": 60900000000,  # $60.9B annual (Q3 2024)
                "revenue_growth": 122.0,  # GPU boom
                "burn_rate": 0,  # Profitable
                "runway": 999,
                "customers": 40000,
                "arr": 60900000000,
                "gross_margin": 73.0,
                "valuation": 1800000000000  # $1.8T market cap
            }
        elif "openai" in company_data["name"].lower():
            return {
                "revenue": 3400000000,  # $3.4B annual run rate
                "revenue_growth": 1700.0,  # Explosive growth
                "burn_rate": 500000000,  # $500M monthly
                "runway": 12,
                "customers": 100000000,  # 100M users
                "arr": 3400000000,
                "gross_margin": 70.0,
                "valuation": 157000000000  # $157B valuation
            }
        else:
            # Generic AI company
            multiplier = min(employee_count / 100, 5.0)
            return {
                "revenue": int(5000000 * multiplier),
                "revenue_growth": 200.0,
                "burn_rate": int(800000 * multiplier),
                "runway": 15,
                "customers": int(1000 * multiplier),
                "arr": int(6000000 * multiplier),
                "gross_margin": 75.0,
                "valuation": int(100000000 * multiplier)
            }
    
    elif company_type == CompanyType.PUBLIC:
        if "amazon" in company_data["name"].lower():
            return {
                "revenue": 574780000000,  # $574.78B annual
                "revenue_growth": 9.4,
                "burn_rate": 0,  # Profitable
                "runway": 999,
                "customers": 300000000,
                "arr": 574780000000,
                "gross_margin": 47.1,
                "valuation": 1500000000000  # $1.5T market cap
            }
        else:
            # Generic traditional company
            multiplier = min(employee_count / 1000, 100.0)
            return {
                "revenue": int(10000000 * multiplier),
                "revenue_growth": 15.0,
                "burn_rate": int(1000000 * multiplier),
                "runway": 24,
                "customers": int(5000 * multiplier),
                "arr": int(12000000 * multiplier),
                "gross_margin": 60.0,
                "valuation": int(200000000 * multiplier)
            }
    
    # Default fallback
    return {
        "revenue": 1000000,
        "revenue_growth": 20.0,
        "burn_rate": 150000,
        "runway": 18,
        "customers": 500,
        "arr": 1200000,
        "gross_margin": 70.0,
        "valuation": 50000000
    }


async def seed_companies():
    """Seed the database with key portfolio companies."""
    
    print("🌱 Starting company database seeding...")
    
    # Create tables
    print("📋 Creating database tables...")
    sqlmodel.SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        seeded_count = 0
        updated_count = 0
        
        for company_data in PORTFOLIO_COMPANIES:
            print(f"\n📊 Processing: {company_data['name']}")
            
            # Check if company already exists
            existing_query = select(Company).where(Company.name == company_data["name"])
            existing_company = session.exec(existing_query).first()
            
            if existing_company:
                print(f"   ✅ Company already exists, updating...")
                # Update existing company
                for key, value in company_data.items():
                    if hasattr(existing_company, key):
                        setattr(existing_company, key, value)
                existing_company.updated_at = datetime.utcnow()
                session.add(existing_company)
                updated_count += 1
                company = existing_company
            else:
                print(f"   🆕 Creating new company...")
                # Create new company
                company = Company(**company_data)
                session.add(company)
                session.flush()  # Get the ID
                seeded_count += 1
            
            # Generate comprehensive profile data for cache
            metrics = generate_company_metrics(company_data)
            
            profile_data = {
                "name": company_data["name"],
                "description": company_data["description"],
                "founded_year": company_data.get("founded_year"),
                "headquarters": company_data.get("headquarters"),
                "employee_count": company_data.get("employee_count"),
                "total_funding": metrics.get("valuation", 0) // 10,  # Estimate funding as 10% of valuation
                "industry": company_data.get("sector", "Technology").title(),
                "key_metrics": metrics,
                "website": company_data.get("website"),
                "token_symbol": company_data.get("token_symbol"),
                "company_type": company_data.get("company_type", CompanyType.PRIVATE).value,
                "logo_url": company_data.get("logo_url"),
                "github_repo": company_data.get("github_repo"),
                "whitepaper_url": company_data.get("whitepaper_url"),
                "last_updated": datetime.utcnow().isoformat(),
                "data_quality": "high",
                "source": "manual_seed"
            }
            
            # Create or update cache entry for this company
            cache_query = select(CompanyDataCache).where(
                CompanyDataCache.company_identifier == company_data["name"].lower().replace(" ", ""),
                CompanyDataCache.data_type == "profile"
            )
            existing_cache = session.exec(cache_query).first()
            
            if existing_cache:
                print(f"   🔄 Updating cache entry...")
                existing_cache.cached_data = profile_data
                existing_cache.updated_at = datetime.utcnow()
                existing_cache.confidence_score = 0.95
                session.add(existing_cache)
            else:
                print(f"   💾 Creating cache entry...")
                cache_entry = create_company_data_cache(session, company, profile_data)
            
            print(f"   💰 Estimated valuation: ${metrics.get('valuation', 0):,.0f}")
            print(f"   📈 Annual revenue: ${metrics.get('revenue', 0):,.0f}")
        
        # Commit all changes
        print(f"\n💾 Committing changes to database...")
        session.commit()
        
        print(f"\n✅ Seeding completed!")
        print(f"   🆕 New companies created: {seeded_count}")
        print(f"   🔄 Existing companies updated: {updated_count}")
        print(f"   📊 Total companies processed: {len(PORTFOLIO_COMPANIES)}")
        
        # Verify seeding
        print(f"\n🔍 Verifying database state...")
        all_companies = session.exec(select(Company)).all()
        print(f"   📈 Total companies in database: {len(all_companies)}")
        
        cached_entries = session.exec(select(CompanyDataCache)).all()
        print(f"   💾 Total cache entries: {len(cached_entries)}")
        
        print(f"\n🎉 Database seeding successful! Your portfolio now includes:")
        for company in PORTFOLIO_COMPANIES:
            symbol = company.get('token_symbol', 'N/A')
            company_type = company.get('company_type', CompanyType.PRIVATE).value
            print(f"   • {company['name']} ({symbol}) - {company_type}")


if __name__ == "__main__":
    asyncio.run(seed_companies())