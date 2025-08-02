#!/usr/bin/env python3
"""Quick test to verify performance indexes are working."""

import asyncio
from sqlmodel import Session, select, text
from app.database import engine
from app.models.companies import Company
from app.models.deals import Deal
from app.models.cache import CompanyDataCache

async def test_indexes():
    """Test that performance indexes are working."""
    
    with Session(engine) as session:
        print("🔍 Testing performance indexes...")
        
        # 1. Test company name trigram search
        print("\n1. Testing company name trigram search:")
        try:
            # Explain plan for fuzzy search
            result = session.exec(text(
                "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM companies WHERE name % 'nvidia'"
            )).fetchall()
            
            has_gin_scan = any('Gin' in str(row) for row in result)
            print(f"   GIN trigram index used: {'✅' if has_gin_scan else '❌'}")
            
            # Show execution plan
            for row in result:
                if 'Gin' in str(row) or 'cost=' in str(row):
                    print(f"   {row}")
                    
        except Exception as e:
            print(f"   Error testing trigram search: {e}")
        
        # 2. Test deal pipeline composite index
        print("\n2. Testing deal pipeline composite index:")
        try:
            result = session.exec(text(
                "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM deals WHERE company_id = 'test' AND status = 'PLANNED'"
            )).fetchall()
            
            has_btree_scan = any('Index Scan' in str(row) or 'idx_deals_company_status' in str(row) for row in result)
            print(f"   B-tree composite index used: {'✅' if has_btree_scan else '❌'}")
            
            for row in result:
                if 'Index' in str(row) or 'cost=' in str(row):
                    print(f"   {row}")
                    
        except Exception as e:
            print(f"   Error testing deal index: {e}")
        
        # 3. Test cache TTL index
        print("\n3. Testing cache TTL-aware index:")
        try:
            result = session.exec(text(
                "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM company_data_cache WHERE company_identifier = 'test' AND data_type = 'profile' ORDER BY last_fetched DESC"
            )).fetchall()
            
            has_optimized_scan = any('idx_company_cache' in str(row) for row in result)
            print(f"   TTL-optimized index used: {'✅' if has_optimized_scan else '❌'}")
            
            for row in result:
                if 'Index' in str(row) or 'cost=' in str(row):
                    print(f"   {row}")
                    
        except Exception as e:
            print(f"   Error testing cache index: {e}")
        
        # 4. List all new indexes
        print("\n4. Checking all new performance indexes:")
        try:
            result = session.exec(text(
                """
                SELECT schemaname, tablename, indexname, indexdef 
                FROM pg_indexes 
                WHERE indexname LIKE 'idx_%' 
                AND tablename IN ('companies', 'deals', 'conversations', 'company_data_cache', 'users')
                ORDER BY tablename, indexname
                """
            )).fetchall()
            
            for row in result:
                schema, table, index_name, index_def = row
                index_type = "GIN" if "gin" in index_def.lower() else "B-tree"
                print(f"   ✅ {table}.{index_name} ({index_type})")
                
        except Exception as e:
            print(f"   Error listing indexes: {e}")
        
        print(f"\n🎉 Performance indexes verification complete!")

if __name__ == "__main__":
    asyncio.run(test_indexes())