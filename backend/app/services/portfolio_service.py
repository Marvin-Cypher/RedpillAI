"""
Portfolio Management Service - Real portfolio storage and operations
"""

from typing import Dict, List, Optional, Any
import json
import os
from datetime import datetime
import logging
from dataclasses import dataclass, asdict


@dataclass
class Holding:
    symbol: str
    amount: float
    average_price: Optional[float] = None
    last_updated: str = None
    
    def __post_init__(self):
        if not self.last_updated:
            self.last_updated = datetime.now().isoformat()


class PortfolioService:
    """Real portfolio management - stores and modifies actual holdings"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.data_dir = "/tmp/redpill_portfolios"
        os.makedirs(self.data_dir, exist_ok=True)
        
    def _get_portfolio_path(self, user_id: str) -> str:
        safe_user_id = user_id.replace('/', '_').replace('\\', '_')
        return os.path.join(self.data_dir, f"{safe_user_id}_portfolio.json")
    
    def get_portfolio(self, user_id: str) -> Dict[str, Holding]:
        """Get user's current portfolio"""
        portfolio_path = self._get_portfolio_path(user_id)
        
        if os.path.exists(portfolio_path):
            try:
                with open(portfolio_path, 'r') as f:
                    data = json.load(f)
                holdings = {}
                for symbol, holding_data in data.items():
                    holdings[symbol] = Holding(**holding_data)
                return holdings
            except Exception as e:
                self.logger.error(f"Error loading portfolio: {e}")
                return {}
        return {}
    
    def save_portfolio(self, user_id: str, holdings: Dict[str, Holding]) -> bool:
        """Save portfolio to storage"""
        try:
            portfolio_path = self._get_portfolio_path(user_id)
            # Convert holdings to dict for JSON serialization
            portfolio_data = {}
            for symbol, holding in holdings.items():
                portfolio_data[symbol] = asdict(holding)
            
            with open(portfolio_path, 'w') as f:
                json.dump(portfolio_data, f, indent=2)
            return True
        except Exception as e:
            self.logger.error(f"Error saving portfolio: {e}")
            return False
    
    def add_holding(self, user_id: str, symbol: str, amount: float, price: Optional[float] = None) -> Dict[str, Any]:
        """Add holding to portfolio"""
        try:
            holdings = self.get_portfolio(user_id)
            symbol = symbol.upper()
            
            if symbol in holdings:
                # Update existing
                existing = holdings[symbol]
                existing.amount += amount
                if price:
                    existing.average_price = price
                existing.last_updated = datetime.now().isoformat()
            else:
                # Add new
                holdings[symbol] = Holding(symbol=symbol, amount=amount, average_price=price)
            
            if self.save_portfolio(user_id, holdings):
                return {
                    "success": True,
                    "message": f"✅ Added {amount} {symbol} to portfolio",
                    "new_total": holdings[symbol].amount
                }
            else:
                return {"success": False, "message": "Failed to save portfolio"}
        except Exception as e:
            return {"success": False, "message": f"Error: {e}"}
    
    def remove_holding(self, user_id: str, symbol: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """Remove or reduce holding - THIS IS THE KEY METHOD"""
        try:
            holdings = self.get_portfolio(user_id)
            symbol = symbol.upper()
            
            if symbol not in holdings:
                return {"success": False, "message": f"❌ No {symbol} found in portfolio"}
            
            current = holdings[symbol]
            
            if amount is None or amount >= current.amount:
                # Remove completely
                removed_amount = current.amount
                del holdings[symbol]
                message = f"🗑️ Removed all {removed_amount} {symbol} from portfolio"
            else:
                # Partial removal
                current.amount -= amount
                current.last_updated = datetime.now().isoformat()
                message = f"🗑️ Removed {amount} {symbol}, {current.amount} remaining"
            
            if self.save_portfolio(user_id, holdings):
                return {
                    "success": True,
                    "message": message,
                    "remaining_holdings": len(holdings)
                }
            else:
                return {"success": False, "message": "Failed to save changes"}
                
        except Exception as e:
            return {"success": False, "message": f"Error: {e}"}
    
    def get_summary(self, user_id: str) -> Dict[str, Any]:
        """Get portfolio summary"""
        try:
            holdings = self.get_portfolio(user_id)
            
            if not holdings:
                return {
                    "success": True,
                    "message": "📊 Portfolio is empty",
                    "holdings": {}
                }
            
            summary = {}
            for symbol, holding in holdings.items():
                summary[symbol] = {
                    "amount": holding.amount,
                    "avg_price": holding.average_price,
                    "last_updated": holding.last_updated
                }
            
            return {
                "success": True,
                "message": f"📊 Portfolio contains {len(holdings)} assets",
                "holdings": summary
            }
        except Exception as e:
            return {"success": False, "message": f"Error: {e}"}


# Global instance
portfolio_service = PortfolioService()