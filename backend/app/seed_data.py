"""Seed the database with sample VC data."""

from sqlmodel import Session, select, SQLModel
from datetime import datetime, timedelta
from app.database import engine
from app.models.companies import Company
from app.models.deals import Deal, DealStatus, InvestmentStage
from app.models.users import User
from app.models.conversations import Conversation, Message, AIInsight
import uuid

def seed_database():
    """Seed the database with sample data."""
    # Create database tables
    print("🗄️  Creating database tables...")
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # Check if data already exists
        existing_companies = session.exec(select(Company)).first()
        if existing_companies:
            print("Database already seeded")
            return
        
        # Create sample companies
        companies = [
            Company(
                id=str(uuid.uuid4()),
                name="LayerZero",
                description="LayerZero is an omnichain interoperability protocol designed to facilitate lightweight message passing across chains. The protocol connects different blockchains through a system of endpoints, relayers, and oracles.",
                website="https://layerzero.network",
                sector="Infrastructure",
                founded_year=2021,
                employee_count="50-100",
                headquarters="Vancouver, Canada",
                logo_url="https://layerzero.network/logo.png"
            ),
            Company(
                id=str(uuid.uuid4()),
                name="Celestia",
                description="Celestia is a modular blockchain network that makes it easy for anyone to securely launch their own blockchain with minimal overhead. It provides data availability and consensus as a service.",
                website="https://celestia.org",
                sector="Infrastructure", 
                founded_year=2019,
                employee_count="25-50",
                headquarters="Berlin, Germany",
                logo_url="https://celestia.org/logo.png"
            ),
            Company(
                id=str(uuid.uuid4()),
                name="Berachain",
                description="Berachain is a high-performance EVM-compatible blockchain built on Proof-of-Liquidity consensus. It features native DeFi primitives and novel tokenomics designed to align protocol and validator incentives.",
                website="https://berachain.com",
                sector="DeFi",
                founded_year=2022,
                employee_count="20-30", 
                headquarters="Miami, FL",
                logo_url="https://berachain.com/logo.png"
            ),
            Company(
                id=str(uuid.uuid4()),
                name="Polygon",
                description="Polygon is a platform for Ethereum scaling and infrastructure development. It offers a suite of scaling solutions including Polygon PoS, zkEVM, and Polygon CDK for building custom blockchains.",
                website="https://polygon.technology",
                sector="Infrastructure",
                founded_year=2017,
                employee_count="200+",
                headquarters="Dubai, UAE",
                logo_url="https://polygon.technology/logo.png"
            ),
            Company(
                id=str(uuid.uuid4()),
                name="Uniswap",
                description="Uniswap is a decentralized exchange protocol that allows users to swap cryptocurrencies and provide liquidity to earn fees. It pioneered the automated market maker (AMM) model in DeFi.",
                website="https://uniswap.org",
                sector="DeFi",
                founded_year=2018,
                employee_count="100-150",
                headquarters="New York, NY",
                logo_url="https://uniswap.org/logo.png"
            )
        ]
        
        # Add companies to session
        for company in companies:
            session.add(company)
        session.commit()
        
        # Create sample user
        demo_user = User(
            id=str(uuid.uuid4()),
            email="demo@redpill.vc",
            full_name="Demo Partner",
            role="partner",
            is_active=True,
            hashed_password="mock-password"
        )
        session.add(demo_user)
        session.commit()
        
        # Create sample deals
        deals_data = [
            {
                "company_name": "LayerZero",
                "status": DealStatus.PLANNED,
                "stage": InvestmentStage.SERIES_B,
                "valuation": 3000000000,  # $3B
                "round_size": 120000000,  # $120M
                "our_target": 5000000,    # $5M
                "probability": 85,
                "next_milestone": "Technical deep dive with team",
                "internal_notes": "Strong protocol with impressive traction. Bridge security model needs deeper analysis."
            },
            {
                "company_name": "Celestia", 
                "status": DealStatus.MEETING,
                "stage": InvestmentStage.SERIES_A,
                "valuation": 1000000000,  # $1B
                "round_size": 55000000,   # $55M
                "our_target": 3000000,    # $3M
                "probability": 70,
                "next_milestone": "Founder presentation to partners", 
                "internal_notes": "Modular blockchain thesis is compelling. Need to assess go-to-market strategy."
            },
            {
                "company_name": "Berachain",
                "status": DealStatus.RESEARCH,
                "stage": InvestmentStage.SERIES_A, 
                "valuation": 500000000,   # $500M
                "round_size": 42000000,   # $42M
                "our_target": 2500000,    # $2.5M
                "probability": 90,
                "next_milestone": "Due diligence completion",
                "internal_notes": "Innovative consensus mechanism. Strong team from cosmos ecosystem. High conviction opportunity."
            },
            {
                "company_name": "Polygon",
                "status": DealStatus.TRACK,
                "stage": InvestmentStage.SERIES_C,
                "valuation": 8000000000,  # $8B
                "round_size": 200000000,  # $200M
                "our_target": 10000000,   # $10M
                "probability": 40,
                "next_milestone": "Market conditions assessment",
                "internal_notes": "Established player with strong ecosystem. Valuation may be stretched in current market."
            },
            {
                "company_name": "Uniswap",
                "status": DealStatus.PASSED,
                "stage": InvestmentStage.SERIES_B,
                "valuation": 1600000000,  # $1.6B
                "round_size": 100000000,  # $100M
                "our_target": 0,
                "probability": 0,
                "next_milestone": "N/A",
                "internal_notes": "Passed due to valuation concerns and regulatory uncertainty around DEXs."
            }
        ]
        
        # Create deals
        for deal_data in deals_data:
            # Find company by name
            company = session.exec(
                select(Company).where(Company.name == deal_data["company_name"])
            ).first()
            
            if company:
                deal = Deal(
                    company_id=company.id,
                    status=deal_data["status"],
                    stage=deal_data["stage"],
                    valuation=deal_data["valuation"],
                    round_size=deal_data["round_size"],
                    our_target=deal_data["our_target"],
                    probability=deal_data["probability"],
                    next_milestone=deal_data["next_milestone"],
                    internal_notes=deal_data["internal_notes"],
                    created_by=demo_user.id,
                    next_meeting_date=datetime.utcnow() + timedelta(days=7) if deal_data["status"] in [DealStatus.MEETING, DealStatus.RESEARCH] else None
                )
                session.add(deal)
        
        session.commit()
        print("✅ Database seeded with sample VC data")
        print("📊 Created:")
        print(f"   - {len(companies)} companies")
        print(f"   - {len(deals_data)} deals")
        print(f"   - 1 demo user (demo@redpill.vc)")

if __name__ == "__main__":
    seed_database()