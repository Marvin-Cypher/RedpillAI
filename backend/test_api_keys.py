#!/usr/bin/env python3
"""
RedpillAI API Keys Test Script
Run this to verify your OpenBB API keys are working properly
"""

import sys
import os
from datetime import datetime

# Add the backend path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.openbb_service import openbb_service
from app.config import settings

def test_api_configuration():
    """Test API key configuration"""
    print("🔑 API Keys Configuration Test")
    print("=" * 50)
    
    # Check which keys are configured
    keys_status = {
        "FMP API Key": "✅ Configured" if settings.fmp_api_key else "❌ Missing",
        "Polygon API Key": "✅ Configured" if settings.polygon_api_key else "❌ Missing", 
        "Alpha Vantage API Key": "✅ Configured" if settings.alpha_vantage_api_key else "❌ Missing",
        "Quandl API Key": "✅ Configured" if settings.quandl_api_key else "❌ Missing",
        "Benzinga API Key": "✅ Configured" if settings.benzinga_api_key else "❌ Missing"
    }
    
    for key, status in keys_status.items():
        print(f"{key:.<30} {status}")
    
    configured_keys = sum(1 for status in keys_status.values() if "✅" in status)
    print(f"\n📊 Total Configured: {configured_keys}/5 API keys")
    
    return configured_keys > 0

def test_openbb_connection():
    """Test OpenBB service connection"""
    print("\n🔌 OpenBB Connection Test") 
    print("=" * 50)
    
    try:
        connection_test = openbb_service.test_connection()
        
        print(f"OpenBB Available: {'✅' if connection_test['openbb_available'] else '❌'}")
        print(f"Crypto Data Access: {'✅' if connection_test['test_crypto_access'] else '❌'}")
        print(f"News Access: {'✅' if connection_test['test_news_access'] else '❌'}")
        
        if connection_test['test_crypto_access']:
            print(f"🎉 Sample BTC Price: ${connection_test.get('sample_btc_price', 'N/A'):,.2f}")
        
        if connection_test.get('notes'):
            print("\n📝 Notes:")
            for note in connection_test['notes']:
                print(f"   • {note}")
                
        return connection_test['test_crypto_access']
        
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False

def test_market_data():
    """Test real market data retrieval"""
    print("\n📈 Market Data Test")
    print("=" * 50)
    
    test_symbols = ['BTC', 'ETH', 'SOL']
    successful_requests = 0
    
    for symbol in test_symbols:
        try:
            price_data = openbb_service.get_crypto_price(symbol)
            if price_data:
                print(f"✅ {symbol}: ${price_data.close:,.2f} (Vol: {price_data.volume:,.0f})")
                successful_requests += 1
            else:
                print(f"❌ {symbol}: No data available")
        except Exception as e:
            print(f"❌ {symbol}: Error - {e}")
    
    print(f"\n📊 Successful Requests: {successful_requests}/{len(test_symbols)}")
    return successful_requests > 0

def test_company_enrichment():
    """Test company enrichment with real data"""
    print("\n🏢 Company Enrichment Test")
    print("=" * 50)
    
    import requests
    
    test_companies = [
        {"name": "Chainlink Labs", "domain": "chainlinklabs.com"},
        {"name": "Solana Foundation", "domain": "solana.com"}
    ]
    
    for company in test_companies:
        try:
            print(f"\nTesting: {company['name']}")
            
            response = requests.post(
                'http://localhost:8000/api/v1/companies/enrich',
                json=company,
                headers={'Authorization': 'Bearer demo_token'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                enriched = data['enriched_data']
                
                print(f"  ✅ Sector: {enriched['sector']}")
                print(f"  📊 Data Sources: {', '.join(enriched['data_sources'])}")
                
                if 'crypto_data' in enriched and enriched['crypto_data']:
                    crypto = enriched['crypto_data']
                    print(f"  🪙 Found Token: {crypto['symbol']} @ ${crypto['current_price']:,.2f}")
                
                if 'market_context' in enriched:
                    market = enriched['market_context']
                    if market.get('btc_price'):
                        print(f"  🌍 Market Context: BTC ${market['btc_price']:,.2f}")
                        
            else:
                print(f"  ❌ API Error: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"  ❌ Backend not running. Start with: uvicorn app.main:app --reload")
            break
        except Exception as e:
            print(f"  ❌ Error: {e}")

def print_recommendations():
    """Print setup recommendations"""
    print("\n💡 Recommendations")
    print("=" * 50)
    
    if not settings.fmp_api_key:
        print("1. 🚀 Get FMP API key (FREE): https://financialmodelingprep.com/")
        print("   - 250 requests/day free tier")
        print("   - Add to backend/.env: FMP_API_KEY=your_key")
    
    if not settings.alpha_vantage_api_key:
        print("2. 📈 Get Alpha Vantage key (FREE): https://www.alphavantage.co/")
        print("   - 25 requests/day free tier")
        print("   - Add to backend/.env: ALPHA_VANTAGE_API_KEY=your_key")
    
    print("3. 🔄 Restart backend after adding keys")
    print("4. ✅ Re-run this test script to verify")

def main():
    """Main test function"""
    print("🧪 RedpillAI API Keys Test Suite")
    print("Testing OpenBB integration and market data access...")
    print("=" * 60)
    print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run all tests
    keys_configured = test_api_configuration()
    connection_working = test_openbb_connection()
    market_data_working = test_market_data()
    
    # Test company enrichment (requires backend running)
    test_company_enrichment()
    
    # Final summary
    print("\n🎯 Test Summary")
    print("=" * 50)
    
    if keys_configured and connection_working and market_data_working:
        print("🎉 SUCCESS: All systems operational!")
        print("✅ API keys configured and working")
        print("✅ Real market data access enabled")
        print("✅ Company enrichment with live data")
    elif keys_configured:
        print("⚠️  PARTIAL: API keys configured but some issues detected")
        print("💡 Check internet connection and API key validity")
    else:
        print("❌ SETUP NEEDED: No API keys configured")
        print_recommendations()
    
    print(f"\n⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()