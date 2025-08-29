#!/usr/bin/env python3
"""
Test the new Claude Code level terminal with the biotech query
"""

import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.core.claude_terminal import ClaudeTerminal


async def test_biotech_query():
    """Test the biotech query that was failing before"""
    
    print("🧪 Testing Claude Code Level AI Terminal")
    print("=" * 50)
    
    # Initialize terminal
    terminal = ClaudeTerminal()
    
    # Test query
    test_query = "list top bio tech companies in us (not health care or pill maker), rank by market"
    
    print(f"Query: {test_query}")
    print("-" * 30)
    
    # Process query
    result = await terminal.process_query(test_query)
    
    # Display results
    print(f"Success: {result.success}")
    print(f"Tools Used: {result.tools_used}")
    print(f"Message: {result.message}")
    
    if result.data:
        print(f"Data Keys: {list(result.data.keys())}")
        
        # Show company results if available
        if 'companies' in result.data:
            companies = result.data['companies']
            print(f"\nFound {len(companies)} companies:")
            for i, company in enumerate(companies[:5], 1):
                print(f"{i}. {company.get('name', 'Unknown')} ({company.get('symbol', 'N/A')})")
                print(f"   Sector: {company.get('sector', 'Unknown')}")
                if company.get('market_cap'):
                    print(f"   Market Cap: {company.get('market_cap')}")
                print()
    
    print("=" * 50)
    
    # Test another complex query
    print("🧪 Testing Complex Multi-Step Query")
    complex_query = "find trending AI stocks today and create comparison chart with NVDA"
    
    print(f"Query: {complex_query}")
    print("-" * 30)
    
    result2 = await terminal.process_query(complex_query)
    
    print(f"Success: {result2.success}")
    print(f"Tools Used: {result2.tools_used}")
    print(f"Message: {result2.message[:200]}...")
    
    print("\n✅ Claude Code Level Terminal Test Complete")


if __name__ == "__main__":
    asyncio.run(test_biotech_query())