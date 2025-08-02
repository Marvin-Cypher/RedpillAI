#!/usr/bin/env python3
"""Test the archive service functionality."""

import asyncio
from datetime import datetime
from app.services.archive_service import archive_service

async def test_archive_service():
    """Test archive service methods."""
    
    print("🗂️ Testing Archive Service...")
    
    # 1. Test getting archival candidates
    print("\n1. Getting archival candidates:")
    try:
        candidates = await archive_service.get_archival_candidates()
        
        print(f"   📊 Operation: {candidates['operation']}")
        print(f"   📅 Generated at: {candidates['generated_at']}")
        
        for data_type, info in candidates['candidates'].items():
            print(f"   📋 {data_type}: {info['count']} candidates (retention: {info['retention_days']} days)")
            
    except Exception as e:
        print(f"   ❌ Error getting candidates: {e}")
    
    # 2. Test archive policies
    print(f"\n2. Archive retention policies:")
    for data_type, days in archive_service.retention_policies.items():
        print(f"   📋 {data_type}: {days} days")
    
    # 3. Test archival operations (dry run style)
    print(f"\n3. Testing archival operations:")
    
    try:
        # Test message archival
        message_stats = await archive_service.archive_old_messages(cutoff_days=365)  # Very old cutoff for testing
        print(f"   📨 Messages archived: {message_stats['messages_archived']}")
        
        # Test cache cleanup
        cache_stats = await archive_service.cleanup_expired_cache(grace_period_days=60)  # Longer grace period  
        print(f"   🗄️ Cache entries deleted: {cache_stats['entries_deleted']}")
        
        # Test API log rotation
        api_stats = await archive_service.rotate_api_usage_logs(retention_days=365)  # Very long retention for testing
        print(f"   📊 API logs deleted: {api_stats['logs_deleted']}")
        
    except Exception as e:
        print(f"   ❌ Error during archival operations: {e}")
    
    print(f"\n🎉 Archive service test complete!")

if __name__ == "__main__":
    asyncio.run(test_archive_service())