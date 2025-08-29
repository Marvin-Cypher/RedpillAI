"""
RedPill AI — Unified Chroma Intelligence Test Plan
Comprehensive test suite for AI-first financial intelligence system
"""

import pytest
import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List

from app.services.unified_chroma_service import (
    UnifiedChromaService,
    ChromaDocument,
    SourceType,
    Visibility
)


class TestUnifiedChromaIntelligence:
    """Comprehensive test suite for Chroma-based AI intelligence"""
    
    @pytest.fixture
    def service(self):
        """Initialize service for testing"""
        return UnifiedChromaService()
    
    @pytest.fixture
    def sample_tenant(self):
        return "test_tenant_001"
    
    @pytest.fixture  
    def sample_workspace(self):
        return "workspace_main"
    
    # ========================================
    # 1) TENANT ISOLATION TESTS
    # ========================================
    
    @pytest.mark.asyncio
    async def test_tenant_isolation(self, service, sample_tenant):
        """Test 1: Tenant isolation - no data leaks between tenants"""
        
        # Store data for tenant A
        doc_a = ChromaDocument(
            content="Tenant A owns AAPL, MSFT in AI agents portfolio",
            metadata={
                "source_type": SourceType.PORTFOLIO.value,
                "symbols": json.dumps(["AAPL", "MSFT"]),
                "date": datetime.now().isoformat()
            }
        )
        await service.store_document("portfolio_memory", doc_a, "tenant_a")
        
        # Store data for tenant B  
        doc_b = ChromaDocument(
            content="Tenant B owns TSLA, NVDA in tech portfolio",
            metadata={
                "source_type": SourceType.PORTFOLIO.value,
                "symbols": json.dumps(["TSLA", "NVDA"]), 
                "date": datetime.now().isoformat()
            }
        )
        await service.store_document("portfolio_memory", doc_b, "tenant_b")
        
        # Query from tenant A perspective
        results_a = await service.semantic_search(
            "portfolio_memory",
            "what AI stocks do we own",
            tenant_id="tenant_a",
            n_results=10
        )
        
        # Query from tenant B perspective
        results_b = await service.semantic_search(
            "portfolio_memory", 
            "what AI stocks do we own",
            tenant_id="tenant_b",
            n_results=10
        )
        
        # Assertions
        assert len(results_a) > 0, "Tenant A should have results"
        assert len(results_b) > 0, "Tenant B should have results"
        
        # Check isolation - A shouldn't see B's data
        a_content = " ".join([r["content"] for r in results_a])
        assert "TSLA" not in a_content and "NVDA" not in a_content
        assert "AAPL" in a_content or "MSFT" in a_content
        
        # Check isolation - B shouldn't see A's data
        b_content = " ".join([r["content"] for r in results_b])
        assert "AAPL" not in b_content and "MSFT" not in b_content
        assert "TSLA" in b_content or "NVDA" in b_content
        
        print("✅ PASS: Tenant isolation working correctly")
    
    # ========================================
    # 2) PORTFOLIO-AWARE Q&A TESTS
    # ========================================
    
    @pytest.mark.asyncio
    async def test_portfolio_aware_qa(self, service, sample_tenant):
        """Test 2: Portfolio-aware Q&A - answers factor in user holdings"""
        
        # Store portfolio data
        holdings = [
            ("NVDA", "AI/Semiconductors", "buy"),
            ("TSLA", "EV/Autonomy", "buy"), 
            ("CRWD", "Cybersecurity", "watch"),
            ("PANW", "Cybersecurity", "watch")
        ]
        
        for symbol, sector, action in holdings:
            doc = ChromaDocument(
                content=f"User {action} {symbol} in {sector} sector for AI exposure",
                metadata={
                    "source_type": SourceType.PORTFOLIO.value,
                    "ticker": symbol,
                    "sector": sector,
                    "action_type": action,
                    "date": datetime.now().isoformat()
                }
            )
            await service.store_document("portfolio_memory", doc, sample_tenant)
        
        # Get portfolio context
        portfolio_context = await service.get_portfolio_context(sample_tenant)
        
        # Assertions
        assert "NVDA" in portfolio_context["symbols"]
        assert "TSLA" in portfolio_context["symbols"] 
        assert "CRWD" in portfolio_context["symbols"]
        assert "PANW" in portfolio_context["symbols"]
        
        assert len(portfolio_context["holdings"]) == 2  # NVDA, TSLA
        assert len(portfolio_context["watchlist"]) == 2  # CRWD, PANW
        assert "AI/Semiconductors" in portfolio_context["sectors"]
        assert "Cybersecurity" in portfolio_context["sectors"]
        
        print("✅ PASS: Portfolio-aware context extraction working")
    
    # ========================================
    # 3) FOUNDER DOSSIER TESTS
    # ========================================
    
    @pytest.mark.asyncio 
    async def test_founder_dossier(self, service, sample_tenant):
        """Test 3: Founder dossier - multi-source profiles with filters"""
        
        # Store founder data from multiple sources
        founders_data = [
            {
                "name": "Vitalik Buterin",
                "role": "Founder", 
                "company": "Ethereum",
                "content": "Vitalik Buterin announced Ethereum 2.0 scaling improvements",
                "source": "news",
                "date": datetime.now().isoformat()
            },
            {
                "name": "Vitalik Buterin",
                "role": "Founder",
                "company": "Ethereum", 
                "content": "Biography: Vitalik founded Ethereum in 2015, pioneering smart contracts",
                "source": "bio",
                "date": (datetime.now() - timedelta(days=30)).isoformat()
            },
            {
                "name": "Alice Zhang", 
                "role": "CEO",
                "company": "Phala Network",
                "content": "Alice Zhang discusses Phala's privacy-preserving compute network",
                "source": "interview",
                "date": (datetime.now() - timedelta(days=10)).isoformat()
            }
        ]
        
        for founder in founders_data:
            doc = ChromaDocument(
                content=founder["content"],
                metadata={
                    "source_type": SourceType.RESEARCH.value,
                    "founder_name": founder["name"],
                    "role": founder["role"],
                    "company": founder["company"],
                    "date": founder["date"],
                    "chain": "Ethereum" if "Ethereum" in founder["company"] else "Other"
                }
            )
            await service.store_document("founder_profiles", doc, sample_tenant)
        
        # Query for specific founder with time filter
        vitalik_results = await service.semantic_search(
            "founder_profiles",
            "Vitalik Buterin Ethereum developments",
            filters={"founder_name": {"$eq": "Vitalik Buterin"}},
            tenant_id=sample_tenant,
            n_results=5
        )
        
        alice_results = await service.semantic_search(
            "founder_profiles", 
            "Alice Zhang Phala privacy",
            filters={
                "founder_name": {"$eq": "Alice Zhang"},
                "company": {"$eq": "Phala Network"}
            },
            tenant_id=sample_tenant,
            n_results=5
        )
        
        # Assertions
        assert len(vitalik_results) == 2, "Should find 2 Vitalik entries"
        assert len(alice_results) == 1, "Should find 1 Alice entry"
        
        # Check content relevance
        vitalik_content = " ".join([r["content"] for r in vitalik_results])
        assert "Ethereum" in vitalik_content
        assert "Vitalik" in vitalik_content
        
        print("✅ PASS: Founder dossier search with filters working")
    
    # ========================================
    # 4) REGEX PREFILTER TESTS  
    # ========================================
    
    @pytest.mark.asyncio
    async def test_regex_prefilter_tickers(self, service, sample_tenant):
        """Test 4: Regex prefilter - fast ticker/address matching"""
        
        # Store documents with various tickers
        ticker_docs = [
            "SOL tokenomics analysis shows strong utility and burn mechanisms",
            "INJ protocol revenue sharing model benefits token holders", 
            "BTC dominance remains strong despite altcoin season",
            "ETH staking rewards provide yield for institutional investors",
            "Random document about market trends without specific tickers"
        ]
        
        for i, content in enumerate(ticker_docs):
            doc = ChromaDocument(
                content=content,
                metadata={
                    "source_type": SourceType.RESEARCH.value,
                    "date": datetime.now().isoformat(),
                    "doc_type": "tokenomics_analysis"
                }
            )
            await service.store_document("research_reports", doc, sample_tenant)
        
        # Search with ticker-specific query
        sol_inj_results = await service.semantic_search(
            "research_reports",
            "tokenomics analysis for SOL and INJ",
            tenant_id=sample_tenant,
            n_results=10
        )
        
        # Check results contain relevant tickers
        results_text = " ".join([r["content"] for r in sol_inj_results])
        
        # Should find SOL and INJ related content
        assert "SOL" in results_text or "INJ" in results_text
        
        # Count relevant vs irrelevant results  
        relevant_count = 0
        for result in sol_inj_results:
            if any(ticker in result["content"] for ticker in ["SOL", "INJ"]):
                relevant_count += 1
        
        assert relevant_count >= 2, "Should find at least 2 ticker-relevant results"
        print(f"✅ PASS: Regex prefilter found {relevant_count}/{len(sol_inj_results)} relevant results")
    
    # ========================================
    # 5) REPORT QA WITH CITATIONS TESTS
    # ========================================
    
    @pytest.mark.asyncio
    async def test_report_qa_citations(self, service, sample_tenant):
        """Test 5: Report QA with citations - chunked retrieval with sources"""
        
        # Store chunked report data
        acme_report_chunks = [
            {
                "content": "Risk 1: Acme faces regulatory uncertainty in EU markets due to GDPR compliance gaps",
                "section": "Regulatory Risks",
                "page": 12
            },
            {
                "content": "Risk 2: Acme's customer concentration - top 3 clients represent 65% of revenue", 
                "section": "Business Risks",
                "page": 15
            },
            {
                "content": "Risk 3: Acme's technical debt in legacy systems poses scalability challenges",
                "section": "Technical Risks", 
                "page": 18
            },
            {
                "content": "Market opportunity: Acme addresses $2B TAM in enterprise automation",
                "section": "Market Analysis",
                "page": 5
            }
        ]
        
        for i, chunk in enumerate(acme_report_chunks):
            doc = ChromaDocument(
                content=chunk["content"],
                metadata={
                    "source_type": SourceType.REPORT.value,
                    "report_name": "Acme IC Memo",
                    "section": chunk["section"],
                    "page": chunk["page"],
                    "date": datetime.now().isoformat(),
                    "uri": f"reports/acme_ic_memo.pdf#page={chunk['page']}"
                }
            )
            await service.store_document("research_reports", doc, sample_tenant)
        
        # Query for risks in Acme report
        risk_results = await service.semantic_search(
            "research_reports",
            "biggest risks in Acme IC Memo",
            filters={"report_name": {"$eq": "Acme IC Memo"}},
            tenant_id=sample_tenant,
            n_results=5
        )
        
        # Assertions
        assert len(risk_results) >= 3, "Should find at least 3 risk-related results"
        
        # Check that each risk result has proper citation metadata
        risk_count = 0
        for result in risk_results:
            if "Risk" in result["content"]:
                risk_count += 1
                assert "uri" in result["metadata"], "Risk should have citation URI"
                assert "page" in result["metadata"], "Risk should have page number"
                assert "section" in result["metadata"], "Risk should have section reference"
        
        assert risk_count >= 3, "Should identify at least 3 specific risks"
        print(f"✅ PASS: Report QA found {risk_count} risks with proper citations")
    
    # ========================================
    # 6) TEMPORAL CHANGE DETECTION TESTS
    # ========================================
    
    @pytest.mark.asyncio
    async def test_temporal_change_detection(self, service, sample_tenant):
        """Test 6: 'What changed since X?' - time-bounded retrieval"""
        
        # Store historical data for ACME
        aug_1 = datetime(2025, 8, 1).isoformat()
        aug_15 = datetime(2025, 8, 15).isoformat() 
        aug_25 = datetime(2025, 8, 25).isoformat()
        
        acme_timeline = [
            {
                "content": "ACME hired 50 new engineers in AI division",
                "date": aug_15,
                "change_type": "hiring"
            },
            {
                "content": "ACME announced $25M Series B funding round led by Andreessen Horowitz",
                "date": aug_20 = datetime(2025, 8, 20).isoformat(), 
                "change_type": "funding"
            },
            {
                "content": "ACME launched new enterprise AI automation platform", 
                "date": aug_25,
                "change_type": "product"
            },
            {
                "content": "ACME pre-funding status - 20 employees, MVP product",
                "date": datetime(2025, 7, 15).isoformat(),  # Before Aug 1
                "change_type": "baseline"
            }
        ]
        
        for event in acme_timeline:
            doc = ChromaDocument(
                content=event["content"],
                metadata={
                    "source_type": SourceType.COMPANY.value,
                    "ticker": "ACME",
                    "date": event["date"],
                    "change_type": event["change_type"]
                }
            )
            await service.store_document("company_profiles", doc, sample_tenant)
        
        # Query for changes since Aug 1, 2025
        cutoff_date = datetime(2025, 8, 1).isoformat()
        recent_changes = await service.semantic_search(
            "company_profiles",
            "ACME changes developments news",
            filters={
                "ticker": {"$eq": "ACME"},
                "date": {"$gt": cutoff_date}
            },
            tenant_id=sample_tenant,
            n_results=10
        )
        
        # Assertions
        assert len(recent_changes) == 3, "Should find 3 changes since Aug 1"
        
        # Verify all results are after cutoff date
        for result in recent_changes:
            result_date = datetime.fromisoformat(result["metadata"]["date"])
            cutoff = datetime.fromisoformat(cutoff_date)
            assert result_date > cutoff, f"Result date {result_date} should be after {cutoff}"
        
        # Check content includes key changes
        changes_text = " ".join([r["content"] for r in recent_changes])
        assert "50 new engineers" in changes_text
        assert "$25M Series B" in changes_text
        assert "enterprise AI automation" in changes_text
        
        print("✅ PASS: Temporal change detection filtering correctly")
    
    # ========================================
    # 7) MEETING MEMORY → ACTIONABLES TESTS
    # ========================================
    
    @pytest.mark.asyncio
    async def test_meeting_action_extraction(self, service, sample_tenant):
        """Test 7: Extract action items from meeting notes"""
        
        # Store meeting notes
        meeting_content = """
        Diligence call with Acme team - key discussion points:
        
        1. Technical deep dive on AI model architecture
        2. Customer growth metrics - 300% QoQ growth  
        3. Action: John to send customer reference list by Friday
        4. Action: Sarah to provide technical architecture docs
        5. Follow up: Schedule CEO interview next week
        6. Risk: Dependency on single cloud provider (AWS)
        7. Next steps: Draft term sheet for $10M Series A
        """
        
        thread_id = "meeting_thread_001"
        
        meeting_doc = ChromaDocument(
            content=meeting_content,
            metadata={
                "source_type": SourceType.MEETING.value,
                "meeting_type": "diligence_call", 
                "thread_id": thread_id,
                "date": datetime.now().isoformat(),
                "participants": json.dumps(["John", "Sarah", "VC Team"])
            }
        )
        
        await service.store_document("meeting_memory", meeting_doc, sample_tenant)
        
        # Extract and store action items (simulated)
        action_items = [
            "John to send customer reference list by Friday",
            "Sarah to provide technical architecture docs", 
            "Schedule CEO interview next week",
            "Draft term sheet for $10M Series A"
        ]
        
        for action in action_items:
            action_doc = ChromaDocument(
                content=action,
                metadata={
                    "source_type": "action_item",
                    "thread_id": thread_id,
                    "priority": "medium",
                    "status": "open",
                    "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
                    "assignee": action.split()[0] if action.split()[0] in ["John", "Sarah"] else "Team"
                }
            )
            await service.store_document("action_items", action_doc, sample_tenant)
        
        # Query for open action items
        open_actions = await service.semantic_search(
            "action_items",
            "open action items tasks",
            filters={"status": {"$eq": "open"}},
            tenant_id=sample_tenant,
            n_results=10
        )
        
        # Assertions
        assert len(open_actions) == 4, "Should find 4 action items"
        
        # Verify action items have proper structure
        for action in open_actions:
            assert "assignee" in action["metadata"]
            assert "due_date" in action["metadata"]
            assert "status" in action["metadata"]
            assert action["metadata"]["status"] == "open"
        
        print("✅ PASS: Meeting action extraction and storage working")
    
    # ========================================
    # 8) DEAL ROOM BRIEF TESTS
    # ========================================
    
    @pytest.mark.asyncio
    async def test_deal_room_isolation(self, service, sample_tenant):
        """Test 8: Deal room brief - isolated document retrieval"""
        
        # Store documents for multiple deals
        deals_data = [
            {
                "deal_id": "D-204",
                "content": "D-204 Company: TechFlow - AI workflow automation, $5M ARR, 40% growth",
                "doc_type": "summary"
            },
            {
                "deal_id": "D-204", 
                "content": "D-204 KPIs: CAC $200, LTV $2400, Net retention 115%",
                "doc_type": "metrics"
            },
            {
                "deal_id": "D-205",
                "content": "D-205 Company: DataVault - Security platform, $2M ARR, 60% growth", 
                "doc_type": "summary"
            },
            {
                "deal_id": "D-205",
                "content": "D-205 Risk: Heavy competition from established players",
                "doc_type": "risks"
            }
        ]
        
        for deal in deals_data:
            doc = ChromaDocument(
                content=deal["content"],
                metadata={
                    "source_type": SourceType.REPORT.value,
                    "deal_id": deal["deal_id"],
                    "doc_type": deal["doc_type"],
                    "date": datetime.now().isoformat(),
                    "visibility": Visibility.TEAM.value
                }
            )
            await service.store_document("dealroom_data", doc, sample_tenant)
        
        # Query for Deal D-204 only
        d204_results = await service.semantic_search(
            "dealroom_data",
            "company metrics KPIs performance",
            filters={"deal_id": {"$eq": "D-204"}},
            tenant_id=sample_tenant,
            n_results=10
        )
        
        # Assertions
        assert len(d204_results) == 2, "Should find exactly 2 D-204 documents"
        
        # Verify no cross-deal contamination
        d204_content = " ".join([r["content"] for r in d204_results])
        assert "TechFlow" in d204_content, "Should contain D-204 company info"
        assert "DataVault" not in d204_content, "Should not contain D-205 company info"
        assert "$5M ARR" in d204_content, "Should contain D-204 metrics"
        
        print("✅ PASS: Deal room isolation preventing cross-contamination")
    
    # ========================================
    # PERFORMANCE & STATS TESTS
    # ========================================
    
    @pytest.mark.asyncio
    async def test_memory_stats_comprehensive(self, service):
        """Test comprehensive memory statistics"""
        
        stats = service.get_memory_stats()
        
        # Assertions
        assert "collections" in stats
        assert "total_documents" in stats  
        assert "status" in stats
        assert stats["status"] == "active"
        
        # Verify all expected collections exist
        expected_collections = [
            "user_conversations",
            "portfolio_memory", 
            "company_profiles",
            "research_reports",
            "founder_profiles",
            "meeting_memory",
            "dealroom_data", 
            "market_intelligence",
            "fund_performance",
            "imported_data",
            "action_items"
        ]
        
        for collection in expected_collections:
            assert collection in stats["collections"], f"Missing collection: {collection}"
        
        print(f"✅ PASS: Memory stats comprehensive - {stats['total_documents']} total docs across {len(stats['collections'])} collections")
    
    # ========================================
    # INTEGRATION FLOW TESTS
    # ========================================
    
    @pytest.mark.asyncio
    async def test_full_conversation_to_portfolio_flow(self, service, sample_tenant):
        """Test complete flow: conversation → entity extraction → portfolio memory"""
        
        # Simulate conversation with portfolio entities
        user_input = "I want to buy NVDA and track TSLA for my AI portfolio"
        assistant_response = "I've noted your interest in NVDA (buy) and TSLA (track). Both are strong AI plays."
        
        entities = {
            "symbols": ["NVDA", "TSLA"],
            "companies": [
                {"name": "NVIDIA Corporation", "symbol": "NVDA"},
                {"name": "Tesla Inc", "symbol": "TSLA"}
            ]
        }
        
        metadata = {
            "tools_used": ["portfolio_analysis", "stock_lookup"],
            "success": True
        }
        
        # Store conversation with context
        conv_id = await service.store_conversation_with_context(
            user_input=user_input,
            assistant_response=assistant_response,
            entities=entities,
            metadata=metadata,
            tenant_id=sample_tenant,
            thread_id="integration_test_thread"
        )
        
        assert conv_id, "Conversation should be stored successfully"
        
        # Wait a moment for processing
        await asyncio.sleep(0.1)
        
        # Check that portfolio entities were extracted
        portfolio_context = await service.get_portfolio_context(sample_tenant)
        
        assert "NVDA" in portfolio_context["symbols"], "NVDA should be in tracked symbols"
        assert "TSLA" in portfolio_context["symbols"], "TSLA should be in tracked symbols"
        
        # Verify conversation is retrievable
        conv_results = await service.semantic_search(
            "user_conversations",
            "NVDA TSLA AI portfolio buy track",
            tenant_id=sample_tenant,
            n_results=5
        )
        
        assert len(conv_results) > 0, "Should retrieve conversation"
        assert "NVDA" in conv_results[0]["content"], "Conversation should contain NVDA"
        assert "TSLA" in conv_results[0]["content"], "Conversation should contain TSLA"
        
        print("✅ PASS: Full conversation-to-portfolio flow working end-to-end")


# Run specific test categories
if __name__ == "__main__":
    # Example of running specific test categories
    pytest.main([
        __file__ + "::TestUnifiedChromaIntelligence::test_tenant_isolation",
        "-v", "--tb=short"
    ])