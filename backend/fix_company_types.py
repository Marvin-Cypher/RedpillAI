#!/usr/bin/env python3
"""
Fix company_type data migration to move "AI" from company_type to sector field.

This script:
1. Finds companies with company_type="AI" 
2. Changes their company_type to "PRIVATE" (most AI companies are private)
3. Sets their sector to "ai"
4. Preserves all other data
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlmodel import Session, text


async def fix_company_types():
    """Fix AI company types in the database."""
    print("🔧 Starting company type data fix...")
    
    with Session(engine) as session:
        # Check current state
        ai_companies = session.exec(text("SELECT id, name, company_type, sector FROM companies WHERE company_type = 'AI'")).all()
        
        if not ai_companies:
            print("✅ No companies with company_type='AI' found. Nothing to fix.")
            return
        
        print(f"📊 Found {len(ai_companies)} companies with company_type='AI':")
        for company in ai_companies:
            print(f"   • {company[1]} (current sector: {company[3] or 'None'})")
        
        # Update companies: set company_type='PRIVATE' and sector='ai' 
        print(f"\n🔄 Updating company_type from 'AI' to 'PRIVATE' and setting sector to 'ai'...")
        
        # Use direct execute instead of exec for updates
        result = session.execute(text("""
            UPDATE companies 
            SET 
                company_type = 'PRIVATE',
                sector = 'ai',
                updated_at = :updated_at
            WHERE company_type = 'AI'
        """), {"updated_at": datetime.utcnow()})
        
        session.commit()
        
        # Verify the changes
        print(f"\n✅ Successfully updated {result.rowcount} companies")
        
        # Show updated state
        updated_companies = session.exec(text("""
            SELECT id, name, company_type, sector 
            FROM companies 
            WHERE sector = 'ai' AND company_type = 'PRIVATE'
        """)).all()
        
        print(f"\n📋 Updated companies:")
        for company in updated_companies:
            print(f"   • {company[1]} - Type: {company[2]}, Sector: {company[3]}")
        
        # Verify no AI company_type remains
        remaining_ai = session.exec(text("SELECT COUNT(*) FROM companies WHERE company_type = 'AI'")).first()
        if remaining_ai[0] == 0:
            print(f"\n🎉 Data migration completed successfully!")
        else:
            print(f"\n⚠️ Warning: {remaining_ai[0]} companies still have company_type='AI'")


if __name__ == "__main__":
    asyncio.run(fix_company_types())