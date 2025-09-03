"""
Enhanced table formatting for RedPill CLI
Provides rich, color-coded tables for financial data
"""

import pandas as pd
from typing import Dict, Any, List, Optional, Literal
from rich.console import Console
from rich.table import Table
from tabulate import tabulate
import re


TableFormat = Literal["rich", "markdown", "simple", "grid", "github"]


class FinancialTableFormatter:
    """Enhanced table formatter optimized for financial data display"""
    
    def __init__(self):
        self.console = Console()
    
    def format_financial_table(
        self,
        data: List[Dict[str, Any]],
        format_type: TableFormat = "rich",
        title: Optional[str] = None,
        highlight_changes: bool = True,
        currency_columns: List[str] = None,
        percentage_columns: List[str] = None
    ) -> str:
        """
        Format financial data into a well-structured table
        
        Args:
            data: List of dictionaries containing table data
            format_type: Output format ("rich", "markdown", "simple", "grid", "github")
            title: Optional table title
            highlight_changes: Whether to highlight positive/negative changes
            currency_columns: Columns to format as currency
            percentage_columns: Columns to format as percentages
        """
        if not data:
            return "No data to display"
        
        df = pd.DataFrame(data)
        currency_columns = currency_columns or []
        percentage_columns = percentage_columns or []
        
        if format_type == "rich":
            return self._create_rich_table(df, title, highlight_changes, currency_columns, percentage_columns)
        elif format_type == "markdown":
            return self._create_markdown_table(df, highlight_changes, currency_columns, percentage_columns)
        else:
            return self._create_tabulate_table(df, format_type, currency_columns, percentage_columns)
    
    def _create_rich_table(
        self,
        df: pd.DataFrame,
        title: Optional[str],
        highlight_changes: bool,
        currency_columns: List[str],
        percentage_columns: List[str]
    ) -> str:
        """Create a rich table with colors and formatting"""
        
        table = Table(
            title=title,
            show_header=True,
            header_style="bold blue",
            border_style="bright_blue"
        )
        
        # Add columns with appropriate styling
        for col in df.columns:
            style = self._get_column_style(col, highlight_changes)
            justify = self._get_column_justify(col, currency_columns, percentage_columns)
            table.add_column(str(col), style=style, justify=justify)
        
        # Add rows with conditional formatting
        for _, row in df.iterrows():
            formatted_row = []
            for col in df.columns:
                value = row[col]
                formatted_value = self._format_cell_value(
                    value, col, currency_columns, percentage_columns, highlight_changes
                )
                formatted_row.append(formatted_value)
            table.add_row(*formatted_row)
        
        # Capture rich output as string
        from io import StringIO
        with self.console.capture() as capture:
            self.console.print(table)
        
        return capture.get()
    
    def _create_markdown_table(
        self,
        df: pd.DataFrame,
        highlight_changes: bool,
        currency_columns: List[str],
        percentage_columns: List[str]
    ) -> str:
        """Create markdown table with enhanced formatting"""
        
        # Format the data
        formatted_df = df.copy()
        for col in df.columns:
            formatted_df[col] = formatted_df[col].apply(
                lambda x: self._format_cell_value(
                    x, col, currency_columns, percentage_columns, highlight_changes, is_markdown=True
                )
            )
        
        # Use tabulate to create markdown
        markdown = tabulate(formatted_df, headers='keys', tablefmt='github', showindex=False)
        
        # Enhance with bold headers
        lines = markdown.split('\n')
        if len(lines) > 1:
            # Make header bold
            header_line = lines[0]
            lines[0] = re.sub(r'\b(\w+)\b', r'**\1**', header_line)
        
        return '\n'.join(lines)
    
    def _create_tabulate_table(
        self,
        df: pd.DataFrame,
        format_type: str,
        currency_columns: List[str],
        percentage_columns: List[str]
    ) -> str:
        """Create tabulate table with basic formatting"""
        
        # Format the data
        formatted_df = df.copy()
        for col in df.columns:
            formatted_df[col] = formatted_df[col].apply(
                lambda x: self._format_cell_value(
                    x, col, currency_columns, percentage_columns, False
                )
            )
        
        return tabulate(formatted_df, headers='keys', tablefmt=format_type, showindex=False)
    
    def create_clean_box_table(
        self,
        data: List[Dict[str, Any]],
        currency_columns: List[str] = None,
        percentage_columns: List[str] = None
    ) -> str:
        """Create a clean box-drawing table like Gemini CLI"""
        if not data:
            return "No data to display"
        
        df = pd.DataFrame(data)
        currency_columns = currency_columns or []
        percentage_columns = percentage_columns or []
        
        # Format values
        formatted_data = []
        for _, row in df.iterrows():
            formatted_row = []
            for col in df.columns:
                value = row[col]
                formatted_value = self._format_cell_value(
                    value, col, currency_columns, percentage_columns, False, is_markdown=False
                )
                formatted_row.append(str(formatted_value))
            formatted_data.append(formatted_row)
        
        headers = list(df.columns)
        
        # Calculate column widths
        col_widths = []
        for i, header in enumerate(headers):
            max_width = len(str(header))
            for row in formatted_data:
                if i < len(row):
                    max_width = max(max_width, len(str(row[i])))
            col_widths.append(max_width + 2)  # Add padding
        
        # Build the table
        lines = []
        
        # Top border
        top_line = "┌" + "┬".join("─" * w for w in col_widths) + "┐"
        lines.append(top_line)
        
        # Header row
        header_cells = []
        for i, header in enumerate(headers):
            cell = f" {header:<{col_widths[i]-2}} "
            header_cells.append(cell)
        lines.append("│" + "│".join(header_cells) + "│")
        
        # Middle border
        middle_line = "├" + "┼".join("─" * w for w in col_widths) + "┤"
        lines.append(middle_line)
        
        # Data rows
        for row in formatted_data:
            row_cells = []
            for i, value in enumerate(row):
                if i < len(col_widths):
                    # Right-align numbers, left-align text
                    if any(c.isdigit() or c in '$%+-.' for c in str(value)):
                        cell = f" {value:>{col_widths[i]-2}} "
                    else:
                        cell = f" {value:<{col_widths[i]-2}} "
                    row_cells.append(cell)
            lines.append("│" + "│".join(row_cells) + "│")
        
        # Bottom border
        bottom_line = "└" + "┴".join("─" * w for w in col_widths) + "┘"
        lines.append(bottom_line)
        
        return "\n".join(lines)
    
    def _get_column_style(self, column: str, highlight_changes: bool) -> str:
        """Get appropriate style for column based on its name"""
        col_lower = column.lower()
        
        if 'symbol' in col_lower or 'ticker' in col_lower:
            return "cyan bold"
        elif 'price' in col_lower or 'cost' in col_lower or '$' in column:
            return "green"
        elif highlight_changes and ('change' in col_lower or 'gain' in col_lower or 'loss' in col_lower):
            return "yellow"  # Will be overridden per-cell for +/- colors
        elif 'volume' in col_lower:
            return "bright_black"
        elif 'market' in col_lower and 'cap' in col_lower:
            return "magenta"
        else:
            return "white"
    
    def _get_column_justify(self, column: str, currency_columns: List[str], percentage_columns: List[str]) -> str:
        """Get text justification for column"""
        col_lower = column.lower()
        
        if column in currency_columns or column in percentage_columns:
            return "right"
        elif any(word in col_lower for word in ['price', 'cost', 'volume', 'change', 'return', 'yield']):
            return "right"
        elif 'symbol' in col_lower or 'name' in col_lower:
            return "center"
        else:
            return "left"
    
    def _format_cell_value(
        self,
        value: Any,
        column: str,
        currency_columns: List[str],
        percentage_columns: List[str],
        highlight_changes: bool,
        is_markdown: bool = False
    ) -> str:
        """Format individual cell values"""
        
        if pd.isna(value) or value is None:
            return "—"
        
        # Currency formatting
        if column in currency_columns or (isinstance(value, (int, float)) and any(word in column.lower() for word in ['price', 'cost'])):
            return f"${value:,.2f}"
        
        # Percentage formatting
        if column in percentage_columns or '%' in column:
            if isinstance(value, (int, float)):
                formatted = f"{value:+.2%}" if value != 0 else "0.00%"
                if highlight_changes and not is_markdown:
                    return f"[green]{formatted}[/green]" if value >= 0 else f"[red]{formatted}[/red]"
                return formatted
        
        # Change value formatting (with +/- signs)
        if 'change' in column.lower() and isinstance(value, (int, float)):
            formatted = f"{value:+,.2f}" if value != 0 else "0.00"
            if highlight_changes and not is_markdown:
                return f"[green]{formatted}[/green]" if value >= 0 else f"[red]{formatted}[/red]"
            return formatted
        
        # Volume formatting (with commas)
        if 'volume' in column.lower() and isinstance(value, (int, float)):
            return f"{int(value):,}"
        
        # Regular numeric formatting
        if isinstance(value, float) and not isinstance(value, bool):
            return f"{value:.2f}"
        elif isinstance(value, int) and not isinstance(value, bool):
            return f"{value:,}"
        
        # String formatting with markdown bold for important columns
        if is_markdown and ('symbol' in column.lower() or 'name' in column.lower()):
            return f"**{value}**"
        
        return str(value)


def format_portfolio_table(holdings: List[Dict[str, Any]], format_type: TableFormat = "rich") -> str:
    """Format portfolio holdings table"""
    formatter = FinancialTableFormatter()
    return formatter.format_financial_table(
        holdings,
        format_type=format_type,
        title="Portfolio Holdings",
        currency_columns=["price", "cost", "value", "unrealized_pl"],
        percentage_columns=["change_percent", "weight", "return"]
    )


def format_quotes_table(quotes: List[Dict[str, Any]], format_type: TableFormat = "rich") -> str:
    """Format stock quotes table"""
    formatter = FinancialTableFormatter()
    return formatter.format_financial_table(
        quotes,
        format_type=format_type,
        title="Stock Quotes",
        highlight_changes=True,
        currency_columns=["price", "open", "high", "low", "close"],
        percentage_columns=["change_percent"]
    )


def format_company_analysis_table(companies: List[Dict[str, Any]], format_type: TableFormat = "rich") -> str:
    """Format company analysis table"""
    formatter = FinancialTableFormatter()
    return formatter.format_financial_table(
        companies,
        format_type=format_type,
        title="Company Analysis",
        currency_columns=["market_cap", "revenue", "price"],
        percentage_columns=["growth_rate", "margin", "return"]
    )