"""
GP Dashboard API endpoints
Provides data for the 7-module GP dashboard system
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlmodel import Session, select, func
from datetime import datetime, timedelta, date
from decimal import Decimal
import numpy as np
from dataclasses import dataclass

from ..database import get_db
from ..core.auth import get_current_active_user
from ..models.users import User
from ..models.companies import Company
from ..models.deals import Deal, DealStatus, InvestmentStage
from ..services.market_data_service import market_data_service

router = APIRouter()

# Data structures for financial calculations
@dataclass
class CashFlow:
    date: date
    amount: float
    type: str  # 'call' or 'distribution'

def xirr(cashflows: List[CashFlow]) -> float:
    """
    Calculate XIRR (Internal Rate of Return) using Newton-Raphson method
    """
    if not cashflows or len(cashflows) < 2:
        return 0.0
    
    # Sort by date
    cashflows_sorted = sorted(cashflows, key=lambda cf: cf.date)
    
    # Convert to days from first cashflow
    start_date = cashflows_sorted[0].date
    dates = [(cf.date - start_date).days for cf in cashflows_sorted]
    amounts = [cf.amount for cf in cashflows_sorted]
    
    # Newton-Raphson method for XIRR calculation
    guess = 0.1  # 10% initial guess
    
    for _ in range(100):  # Max iterations
        npv = sum(amount / ((1 + guess) ** (day / 365)) for amount, day in zip(amounts, dates))
        derivative = sum(-amount * day / 365 / ((1 + guess) ** (day / 365 + 1)) for amount, day in zip(amounts, dates))
        
        if abs(derivative) < 1e-12:
            break
            
        new_guess = guess - npv / derivative
        
        if abs(new_guess - guess) < 1e-8:
            return new_guess
            
        guess = new_guess
    
    return guess

# ===========================
# MODULE 1: FUND PERFORMANCE
# ===========================

@router.get("/fund/cashflows")
async def get_fund_cashflows(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get fund cashflow data (capital calls and distributions)"""
    try:
        # Get deals with investment data
        deals_query = select(Deal, Company).join(Company, Deal.company_id == Company.id)
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date)
                deals_query = deals_query.where(Deal.created_at >= start_dt)
            except ValueError:
                # If parsing fails, try with date only
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                deals_query = deals_query.where(Deal.created_at >= start_dt)
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date)
                deals_query = deals_query.where(Deal.created_at <= end_dt)
            except ValueError:
                # If parsing fails, try with date only
                end_dt = datetime.strptime(end_date, "%Y-%m-%d")
                deals_query = deals_query.where(Deal.created_at <= end_dt)
        
        deals = db.exec(deals_query).all()
        
        cashflows = []
        
        for deal, company in deals:
            # Skip deals without creation date
            if not deal.created_at:
                continue
                
            # Capital calls (investments)
            if deal.our_target and deal.our_target > 0:
                cashflows.append({
                    "date": deal.created_at.date().isoformat(),
                    "amount": -float(deal.our_target),  # Negative for cash outflow
                    "type": "call",
                    "company": company.name,
                    "deal_id": deal.id
                })
            
            # Mock distributions for closed deals (would come from actual distribution records)
            if deal.status == DealStatus.TRACK and deal.our_target:
                # Simulate some distributions for demo
                distribution_date = deal.created_at + timedelta(days=365)
                distribution_amount = float(deal.our_target) * 1.5  # 1.5x return simulation
                
                cashflows.append({
                    "date": distribution_date.date().isoformat(),
                    "amount": distribution_amount,  # Positive for cash inflow
                    "type": "distribution",
                    "company": company.name,
                    "deal_id": deal.id
                })
        
        return cashflows
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cashflows: {str(e)}")


@router.get("/fund/valuations")
async def get_fund_valuations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get fund valuation data (paid-in capital, residual value)"""
    try:
        # Calculate paid-in capital from all investments
        deals = db.exec(select(Deal).where(Deal.our_target.isnot(None))).all()
        
        paid_in_capital = sum(float(deal.our_target) for deal in deals if deal.our_target)
        
        # Calculate residual value (current portfolio value)
        # For demo, use a multiplier based on deal performance
        residual_value = 0
        for deal in deals:
            if deal.our_target and deal.status in [DealStatus.DEAL, DealStatus.TRACK]:
                # Mock current valuation - would come from regular portfolio updates
                multiplier = {
                    DealStatus.DEAL: 1.2,  # Early stage growth
                    DealStatus.TRACK: 2.1   # Mature portfolio company
                }.get(deal.status, 1.0)
                
                residual_value += float(deal.our_target) * multiplier
        
        return {
            "paid_in_capital": paid_in_capital,
            "residual_value": residual_value,
            "total_value": residual_value,  # Residual + any realized distributions
            "calculated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch valuations: {str(e)}")


@router.get("/fund/metrics")
async def get_fund_metrics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Calculate comprehensive fund performance metrics"""
    try:
        # Get cashflows and valuations
        cashflows_response = await get_fund_cashflows(start_date=None, end_date=None, current_user=current_user, db=db)
        valuations = await get_fund_valuations(current_user=current_user, db=db)
        
        # Convert to CashFlow objects for XIRR calculation
        cashflow_objects = []
        for cf in cashflows_response:
            # cf["date"] is already a string in YYYY-MM-DD format
            try:
                cf_date = datetime.fromisoformat(cf["date"]).date()
            except ValueError:
                # If it's just a date string, parse it directly
                cf_date = datetime.strptime(cf["date"], "%Y-%m-%d").date()
            
            cashflow_objects.append(CashFlow(
                date=cf_date,
                amount=cf["amount"],
                type=cf["type"]
            ))
        
        # Add current NAV as final cashflow for IRR calculation
        if valuations["residual_value"] > 0:
            cashflow_objects.append(CashFlow(
                date=datetime.now().date(),
                amount=valuations["residual_value"],
                type="valuation"
            ))
        
        # Calculate IRR
        irr = xirr(cashflow_objects)
        
        # Calculate other metrics
        paid_in_capital = valuations["paid_in_capital"]
        residual_value = valuations["residual_value"]
        
        # Total distributions
        total_distributions = sum(cf["amount"] for cf in cashflows_response if cf["type"] == "distribution")
        
        # TVPI = (Distributions + Residual Value) / Paid-In Capital
        tvpi = (total_distributions + residual_value) / paid_in_capital if paid_in_capital > 0 else 0
        
        # DPI = Distributions / Paid-In Capital
        dpi = total_distributions / paid_in_capital if paid_in_capital > 0 else 0
        
        # MOIC = Total Value / Invested Capital (same as TVPI in this case)
        moic = tvpi
        
        return {
            "irr": round(irr * 100, 2),  # Convert to percentage
            "tvpi": round(tvpi, 2),
            "dpi": round(dpi, 2),
            "moic": round(moic, 2),
            "paid_in_capital": paid_in_capital,
            "residual_value": residual_value,
            "total_distributions": total_distributions,
            "calculated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate fund metrics: {str(e)}")


# ===========================
# MODULE 2: PORTFOLIO PERFORMANCE
# ===========================

@router.get("/companies/metrics")
async def get_portfolio_company_metrics(
    period: str = Query("monthly", description="Period for metrics"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get portfolio company performance metrics"""
    try:
        companies = db.exec(select(Company)).all()
        
        metrics = []
        for company in companies:
            # Mock financial metrics (would come from company reporting)
            base_metrics = {
                "company_id": company.id,
                "company_name": company.name,
                "sector": company.sector,
            }
            
            # Generate realistic metrics based on company type and sector
            if company.company_type and company.company_type.value == "crypto":
                # Crypto company metrics
                metrics.append({
                    **base_metrics,
                    "mrr": 45000,
                    "arr": 540000,
                    "revenue": 135000,  # Quarterly
                    "gross_margin": 0.75,
                    "ltv": 12000,
                    "cac": 800,
                    "burn": 85000,  # Monthly
                    "cash_balance": 850000,
                    "headcount": 12,
                    "churn_rate": 0.05,
                    "net_rev_retention": 1.15,
                    # Previous period for growth calculations
                    "prev_mrr": 38000,
                    "prev_arr": 456000
                })
            elif "AI" in company.sector or "ai" in company.name.lower():
                # AI company metrics
                metrics.append({
                    **base_metrics,
                    "mrr": 125000,
                    "arr": 1500000,
                    "revenue": 375000,
                    "gross_margin": 0.80,
                    "ltv": 24000,
                    "cac": 1200,
                    "burn": 180000,
                    "cash_balance": 2100000,
                    "headcount": 28,
                    "churn_rate": 0.03,
                    "net_rev_retention": 1.25,
                    "prev_mrr": 98000,
                    "prev_arr": 1176000
                })
            else:
                # Traditional SaaS/tech company
                metrics.append({
                    **base_metrics,
                    "mrr": 85000,
                    "arr": 1020000,
                    "revenue": 255000,
                    "gross_margin": 0.72,
                    "ltv": 18000,
                    "cac": 950,
                    "burn": 125000,
                    "cash_balance": 1500000,
                    "headcount": 22,
                    "churn_rate": 0.04,
                    "net_rev_retention": 1.18,
                    "prev_mrr": 72000,
                    "prev_arr": 864000
                })
        
        # Calculate derived metrics
        for metric in metrics:
            # MRR Growth Rate
            metric["mrr_growth"] = (metric["mrr"] - metric["prev_mrr"]) / metric["prev_mrr"] if metric["prev_mrr"] > 0 else 0
            
            # ARR Growth Rate
            metric["arr_growth"] = (metric["arr"] - metric["prev_arr"]) / metric["prev_arr"] if metric["prev_arr"] > 0 else 0
            
            # LTV:CAC Ratio
            metric["ltv_cac_ratio"] = metric["ltv"] / metric["cac"] if metric["cac"] > 0 else 0
            
            # Runway (months)
            metric["runway_months"] = metric["cash_balance"] / metric["burn"] if metric["burn"] > 0 else 999
        
        return metrics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch company metrics: {str(e)}")


# ===========================
# MODULE 3: DEAL FLOW & PIPELINE
# ===========================

@router.get("/deals/stages")
async def get_deal_stages(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get deal counts by pipeline stage"""
    try:
        stages = []
        
        # Count deals by status (using existing deal statuses as pipeline stages)
        for status in DealStatus:
            count = db.exec(
                select(func.count(Deal.id)).where(Deal.status == status)
            ).first()
            
            # Map deal status to pipeline stages
            stage_mapping = {
                DealStatus.PLANNED: "sourced",
                DealStatus.MEETING: "screened", 
                DealStatus.RESEARCH: "due-diligence",
                DealStatus.DEAL: "term-sheet",
                DealStatus.TRACK: "closed",
                DealStatus.PASSED: "passed",
                DealStatus.CLOSED: "completed"
            }
            
            stage_name = stage_mapping.get(status, status.value.lower())
            
            stages.append({
                "stage": stage_name,
                "count": count or 0,
                "status": status.value
            })
        
        return stages
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch deal stages: {str(e)}")


@router.get("/deals/history")
async def get_deal_history(
    from_date: Optional[str] = Query(None, description="From date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="To date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get deal history for pipeline analytics"""
    try:
        query = select(Deal)
        
        if from_date:
            try:
                from_dt = datetime.fromisoformat(from_date)
                query = query.where(Deal.created_at >= from_dt)
            except ValueError:
                from_dt = datetime.strptime(from_date, "%Y-%m-%d")
                query = query.where(Deal.created_at >= from_dt)
        if to_date:
            try:
                to_dt = datetime.fromisoformat(to_date)
                query = query.where(Deal.created_at <= to_dt)
            except ValueError:
                to_dt = datetime.strptime(to_date, "%Y-%m-%d")
                query = query.where(Deal.created_at <= to_dt)
        
        deals = db.exec(query).all()
        
        history = []
        for deal in deals:
            # Mock closed date based on status
            closed_at = None
            outcome = "pending"
            
            if deal.status == DealStatus.TRACK:
                closed_at = deal.updated_at + timedelta(days=45)  # Mock close time
                outcome = "won"
            elif deal.status == DealStatus.PASSED:
                closed_at = deal.updated_at + timedelta(days=30)
                outcome = "passed"
            elif deal.status == DealStatus.CLOSED:
                closed_at = deal.updated_at
                outcome = "completed"
            
            history.append({
                "deal_id": deal.id,
                "created_at": deal.created_at.isoformat(),
                "closed_at": closed_at.isoformat() if closed_at else None,
                "outcome": outcome,
                "cycle_time_days": (closed_at - deal.created_at).days if closed_at else None
            })
        
        return history
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch deal history: {str(e)}")


# ===========================
# MODULE 4: MARKET TRENDS
# ===========================

@router.get("/market/funding")
async def get_market_funding(
    interval: str = Query("quarterly", description="quarterly or yearly"),
    current_user: User = Depends(get_current_active_user)
):
    """Get VC funding market trends"""
    try:
        # Mock market funding data (would come from external sources like Crunchbase)
        if interval == "quarterly":
            funding_data = [
                {"period": "2024Q1", "total_deals": 2340, "total_funding": 45_600_000_000},
                {"period": "2024Q2", "total_deals": 2180, "total_funding": 41_200_000_000},
                {"period": "2024Q3", "total_deals": 1980, "total_funding": 38_700_000_000},
                {"period": "2024Q4", "total_deals": 2100, "total_funding": 42_100_000_000},
                {"period": "2025Q1", "total_deals": 2250, "total_funding": 46_800_000_000},
            ]
        else:  # yearly
            funding_data = [
                {"period": "2021", "total_deals": 12_400, "total_funding": 240_000_000_000},
                {"period": "2022", "total_deals": 10_800, "total_funding": 195_000_000_000},
                {"period": "2023", "total_deals": 9_200, "total_funding": 158_000_000_000},
                {"period": "2024", "total_deals": 8_600, "total_funding": 167_600_000_000},
            ]
        
        return {
            "interval": interval,
            "data": funding_data,
            "source": "Market Intelligence (Mock Data)",
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch funding trends: {str(e)}")


@router.get("/market/exits")
async def get_market_exits(
    interval: str = Query("yearly", description="quarterly or yearly"),
    current_user: User = Depends(get_current_active_user)
):
    """Get exit activity data"""
    try:
        if interval == "yearly":
            exit_data = [
                {"period": "2021", "ipo_count": 245, "ma_count": 1240, "total_exit_value": 85_000_000_000},
                {"period": "2022", "ipo_count": 86, "ma_count": 980, "total_exit_value": 42_000_000_000},
                {"period": "2023", "ipo_count": 34, "ma_count": 720, "total_exit_value": 28_000_000_000},
                {"period": "2024", "ipo_count": 67, "ma_count": 890, "total_exit_value": 38_500_000_000},
            ]
        else:  # quarterly
            exit_data = [
                {"period": "2024Q3", "ipo_count": 12, "ma_count": 185, "total_exit_value": 8_200_000_000},
                {"period": "2024Q4", "ipo_count": 18, "ma_count": 220, "total_exit_value": 12_800_000_000},
                {"period": "2025Q1", "ipo_count": 15, "ma_count": 195, "total_exit_value": 9_600_000_000},
            ]
        
        return {
            "interval": interval,
            "data": exit_data,
            "source": "Exit Intelligence (Mock Data)",
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch exit data: {str(e)}")


@router.get("/market/sector-allocation")
async def get_sector_allocation(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get sector allocation data"""
    try:
        # Get actual portfolio sector allocation
        companies = db.exec(select(Company)).all()
        
        sector_counts = {}
        for company in companies:
            sector = company.sector or "Unknown"
            sector_counts[sector] = sector_counts.get(sector, 0) + 1
        
        # Add market benchmark data
        market_allocation = {
            "AI/ML": {"portfolio": sector_counts.get("AI/ML", 0), "market_share": 18.5},
            "FinTech": {"portfolio": sector_counts.get("FinTech", 0), "market_share": 22.1},
            "HealthTech": {"portfolio": sector_counts.get("HealthTech", 0), "market_share": 15.3},
            "Blockchain/Crypto": {"portfolio": sector_counts.get("Blockchain/Crypto", 0), "market_share": 8.7},
            "Enterprise SaaS": {"portfolio": sector_counts.get("Enterprise SaaS", 0), "market_share": 28.4},
            "Other": {"portfolio": sum(v for k, v in sector_counts.items() if k not in ["AI/ML", "FinTech", "HealthTech", "Blockchain/Crypto", "Enterprise SaaS"]), "market_share": 7.0}
        }
        
        return {
            "portfolio_allocation": market_allocation,
            "total_companies": len(companies),
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sector allocation: {str(e)}")


# ===========================
# MODULE 5: LP REPORTING
# ===========================

@router.get("/lp/calls")
async def get_lp_calls(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get LP capital call schedule and amounts"""
    try:
        # Mock LP call schedule (would come from fund administration system)
        calls = [
            {"call_number": 1, "date": "2023-01-15", "amount": 25_000_000, "purpose": "Initial closing and first investments"},
            {"call_number": 2, "date": "2023-06-30", "amount": 18_000_000, "purpose": "Follow-on investments Q2"},
            {"call_number": 3, "date": "2023-12-15", "amount": 22_000_000, "purpose": "New investments Q4"},
            {"call_number": 4, "date": "2024-06-30", "amount": 15_000_000, "purpose": "Follow-on and new investments H1"},
            {"call_number": 5, "date": "2024-12-15", "amount": 20_000_000, "purpose": "Portfolio support and new deals"},
        ]
        
        total_called = sum(call["amount"] for call in calls)
        fund_size = 150_000_000  # $150M fund
        remaining_commitment = fund_size - total_called
        
        return {
            "calls": calls,
            "total_called": total_called,
            "fund_size": fund_size,
            "remaining_commitment": remaining_commitment,
            "call_percentage": (total_called / fund_size) * 100,
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch LP calls: {str(e)}")


@router.get("/lp/distributions")
async def get_lp_distributions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get LP distribution schedule and amounts"""
    try:
        # Mock distribution schedule (would come from realized exits)
        distributions = [
            {"distribution_number": 1, "date": "2024-03-30", "amount": 8_500_000, "source": "Exit: TechCorp acquisition"},
            {"distribution_number": 2, "date": "2024-09-15", "amount": 12_300_000, "source": "Exit: AIStartup IPO"},
            {"distribution_number": 3, "date": "2024-12-20", "amount": 6_800_000, "source": "Secondary sale: DataCo"},
        ]
        
        total_distributed = sum(dist["amount"] for dist in distributions)
        
        # Get total capital called for DPI calculation
        calls_data = await get_lp_calls(current_user=current_user, db=db)
        total_called = calls_data["total_called"]
        
        dpi = total_distributed / total_called if total_called > 0 else 0
        
        return {
            "distributions": distributions,
            "total_distributed": total_distributed,
            "total_called": total_called,
            "dpi": round(dpi, 2),
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch distributions: {str(e)}")


# ===========================
# MODULE 6: OPERATIONS & TEAM
# ===========================

@router.get("/operations/compliance-status")
async def get_compliance_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get portfolio company reporting compliance status"""
    try:
        companies = db.exec(select(Company)).all()
        
        # Mock compliance data (would come from portfolio management system)
        compliance_data = []
        total_companies = len(companies)
        compliant_count = 0
        
        for i, company in enumerate(companies):
            # Simulate different compliance statuses
            is_compliant = (i % 4) != 0  # 75% compliance rate
            days_overdue = 0 if is_compliant else (i % 15) + 1
            
            if is_compliant:
                compliant_count += 1
            
            compliance_data.append({
                "company_id": company.id,
                "company_name": company.name,
                "is_compliant": is_compliant,
                "last_report_date": (datetime.now() - timedelta(days=30 if is_compliant else 30 + days_overdue)).date().isoformat(),
                "days_overdue": days_overdue,
                "report_type": "Monthly Update"
            })
        
        compliance_rate = (compliant_count / total_companies) * 100 if total_companies > 0 else 100
        
        return {
            "compliance_data": compliance_data,
            "total_companies": total_companies,
            "compliant_companies": compliant_count,
            "compliance_rate": round(compliance_rate, 1),
            "overdue_companies": total_companies - compliant_count,
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch compliance status: {str(e)}")


@router.get("/operations/gp-activity")
async def get_gp_activity(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get GP team activity metrics"""
    try:
        # Mock GP activity data (would come from CRM/activity tracking)
        gp_activities = [
            {
                "partner_name": "Sarah Chen",
                "role": "Managing Partner",
                "companies_contacted": 45,
                "meetings_attended": 18,
                "deals_reviewed": 32,
                "board_meetings": 8,
                "portfolio_check_ins": 12,
                "avg_response_time_hours": 4.2
            },
            {
                "partner_name": "Michael Rodriguez",
                "role": "General Partner",
                "companies_contacted": 38,
                "meetings_attended": 22,
                "deals_reviewed": 28,
                "board_meetings": 6,
                "portfolio_check_ins": 15,
                "avg_response_time_hours": 6.1
            },
            {
                "partner_name": "David Kim",
                "role": "Principal",
                "companies_contacted": 52,
                "meetings_attended": 31,
                "deals_reviewed": 41,
                "board_meetings": 4,
                "portfolio_check_ins": 18,
                "avg_response_time_hours": 3.8
            }
        ]
        
        # Calculate team totals
        team_summary = {
            "total_companies_contacted": sum(gp["companies_contacted"] for gp in gp_activities),
            "total_meetings": sum(gp["meetings_attended"] for gp in gp_activities),
            "total_deals_reviewed": sum(gp["deals_reviewed"] for gp in gp_activities),
            "total_board_meetings": sum(gp["board_meetings"] for gp in gp_activities),
            "avg_team_response_time": sum(gp["avg_response_time_hours"] for gp in gp_activities) / len(gp_activities)
        }
        
        return {
            "gp_activities": gp_activities,
            "team_summary": team_summary,
            "reporting_period": "Last 30 days",
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch GP activity: {str(e)}")


# ===========================
# MODULE 7: RISK & COMPLIANCE
# ===========================

@router.get("/risk/positions")
async def get_risk_positions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get portfolio risk positions and betas"""
    try:
        companies_query = select(Company, Deal).join(Deal, Company.id == Deal.company_id, isouter=True)
        results = db.exec(companies_query).all()
        
        positions = []
        total_portfolio_value = 0
        
        for company, deal in results:
            # Calculate position value (investment + current valuation markup)
            investment_amount = float(deal.our_target) if deal and deal.our_target else 1_000_000  # Default for mock
            current_value = investment_amount * 1.8  # Mock 80% markup
            total_portfolio_value += current_value
            
            # Mock beta calculation (would use actual market data)
            beta = {
                "AI/ML": 1.4,
                "FinTech": 1.1,
                "HealthTech": 0.9,
                "Blockchain/Crypto": 2.1,
                "Enterprise SaaS": 1.2
            }.get(company.sector, 1.0)
            
            positions.append({
                "company_id": company.id,
                "company_name": company.name,
                "sector": company.sector,
                "investment_amount": investment_amount,
                "current_value": current_value,
                "beta": beta,
                "weight": 0,  # Will calculate after total
                "risk_rating": "Medium" if beta < 1.5 else "High"
            })
        
        # Calculate position weights
        for position in positions:
            position["weight"] = position["current_value"] / total_portfolio_value if total_portfolio_value > 0 else 0
        
        # Sort by value descending
        positions.sort(key=lambda x: x["current_value"], reverse=True)
        
        return positions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch risk positions: {str(e)}")


@router.get("/risk/metrics")
async def get_risk_metrics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get portfolio risk metrics including volatility and correlations"""
    try:
        positions = await get_risk_positions(current_user=current_user, db=db)
        
        # Calculate concentration risk
        total_value = sum(pos["current_value"] for pos in positions)
        top_5_weight = sum(pos["current_value"] for pos in positions[:5]) / total_value if total_value > 0 else 0
        
        # Calculate portfolio beta (weighted average)
        portfolio_beta = sum(pos["beta"] * pos["weight"] for pos in positions)
        
        # Mock other risk metrics (would use actual returns data)
        risk_metrics = {
            "portfolio_beta": round(portfolio_beta, 2),
            "volatility": 0.24,  # 24% annual volatility
            "sharpe_ratio": 1.45,  # (Return - Risk Free Rate) / Volatility
            "max_drawdown": -0.18,  # -18% maximum drawdown
            "var_95": -0.08,  # 95% Value at Risk
            "concentration_risk": {
                "top_1_weight": positions[0]["weight"] if positions else 0,
                "top_3_weight": sum(pos["weight"] for pos in positions[:3]),
                "top_5_weight": top_5_weight,
                "hhi_index": sum(pos["weight"] ** 2 for pos in positions)  # Herfindahl-Hirschman Index
            },
            "sector_concentration": {},
            "correlation_matrix": {}  # Would contain sector/company correlations
        }
        
        # Calculate sector concentration
        sector_values = {}
        for pos in positions:
            sector = pos["sector"] or "Unknown"
            sector_values[sector] = sector_values.get(sector, 0) + pos["current_value"]
        
        for sector, value in sector_values.items():
            risk_metrics["sector_concentration"][sector] = value / total_value if total_value > 0 else 0
        
        return risk_metrics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate risk metrics: {str(e)}")