"""
Enhanced table formatting for RedPill CLI
Provides rich, color-coded tables for financial data
"""

import pandas as pd
from typing import Dict, Any, List, Optional, Literal
from rich.console import Console
from rich.table import Table
from tabulate import tabulate
from pathlib import Path
import pandas as pd
import re


TableFormat = Literal["rich", "markdown", "simple", "grid", "github"]


class FinancialTableFormatter:
    """Enhanced table formatter optimized for financial data display with smart OpenBB integration"""
    
    def __init__(self):
        self.console = Console()
        # Thresholds for determining when to use OpenBB vs clean box tables
        self.MAX_CLI_ROWS = 15
        self.MAX_CLI_COLUMNS = 8
        self.MAX_CELL_LENGTH = 50
    
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
    
    def should_use_openbb_table(self, data: List[Dict[str, Any]]) -> bool:
        """
        Determine if data should use OpenBB interactive tables instead of clean box tables
        
        Returns True when:
        - Too many rows (>15)
        - Too many columns (>8) 
        - Content is too wide (cells >50 chars)
        - Data would benefit from interactive features (sorting, filtering)
        """
        if not data:
            return False
            
        num_rows = len(data)
        num_columns = len(data[0].keys()) if data else 0
        
        # Check row/column limits
        if num_rows > self.MAX_CLI_ROWS or num_columns > self.MAX_CLI_COLUMNS:
            return True
            
        # Check content complexity
        for row in data:
            for value in row.values():
                if str(value) and len(str(value)) > self.MAX_CELL_LENGTH:
                    return True
                    
        # Check for data types that benefit from OpenBB tables
        financial_keywords = ['price', 'volume', 'market_cap', 'revenue', 'earnings', 'pe_ratio', 'dividend']
        column_names = [col.lower() for col in data[0].keys()] if data else []
        
        # If >4 financial columns, prefer interactive OpenBB tables
        financial_col_count = sum(1 for col in column_names if any(keyword in col for keyword in financial_keywords))
        if financial_col_count > 4:
            return True
            
        return False
        
    def create_openbb_table_recommendation(self, data: List[Dict[str, Any]]) -> str:
        """
        Create a message recommending OpenBB interactive tables for complex data
        """
        num_rows = len(data)
        num_columns = len(data[0].keys()) if data else 0
        
        reasons = []
        if num_rows > self.MAX_CLI_ROWS:
            reasons.append(f"{num_rows} rows (>{self.MAX_CLI_ROWS} recommended for CLI)")
        if num_columns > self.MAX_CLI_COLUMNS:
            reasons.append(f"{num_columns} columns (>{self.MAX_CLI_COLUMNS} recommended for CLI)")
            
        reason_text = ", ".join(reasons)
        
        return f"""
📊 **Large Dataset Detected** ({reason_text})

For better experience with this data, consider using OpenBB's interactive tables:

```python
import openbb as obb

# Your data query here, then:
data.charting.table()  # Interactive table with sorting, filtering, search
```

**Interactive Features Available:**
- ✅ Column sorting and filtering  
- ✅ Search across all data
- ✅ Adjustable column widths
- ✅ Export capabilities
- ✅ Pagination for large datasets

**CLI Preview** (first {min(10, len(data))} rows):
{self.create_clean_box_table(data[:10])}
        """.strip()
    
    def create_openbb_interactive_table(self, data: List[Dict[str, Any]]) -> str:
        """
        Create actual OpenBB interactive table using the OpenBB Platform
        Generates HTML file and opens it in browser like OpenBB does
        """
        try:
            # Import required modules
            import sys
            import tempfile
            import webbrowser
            import os
            from datetime import datetime
            sys.path.append('/Users/marvin/redpill-project/openbb-source/openbb_platform')
            
            import pandas as pd
            
            # Convert data to DataFrame
            df = pd.DataFrame(data)
            
            # Create OpenBB-style interactive HTML table
            table_id = f"openbb_table_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>OpenBB Interactive Table</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
        }}
        .openbb-container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        .openbb-header {{
            background: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
        }}
        .table-container {{
            overflow-x: auto;
            max-height: 600px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }}
        th {{
            background: #f8f9fa;
            font-weight: 600;
            padding: 12px;
            border-bottom: 2px solid #dee2e6;
            position: sticky;
            top: 0;
            cursor: pointer;
            user-select: none;
        }}
        th:hover {{
            background: #e9ecef;
        }}
        td {{
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
        }}
        tr:hover {{
            background: rgba(37, 99, 235, 0.05);
        }}
        .search-box {{
            padding: 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
        }}
        .search-input {{
            width: 100%;
            padding: 10px;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            font-size: 14px;
        }}
        .footer {{
            padding: 15px 20px;
            background: #f8f9fa;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
        }}
    </style>
</head>
<body>
    <div class="openbb-container">
        <div class="openbb-header">
            <h1>📊 OpenBB Interactive Table</h1>
            <p>Sortable • Searchable • Responsive</p>
        </div>
        <div class="search-box">
            <input type="text" class="search-input" placeholder="Search across all columns..." id="searchInput" onkeyup="filterTable()">
        </div>
        <div class="table-container">
            {df.to_html(table_id=table_id, escape=False, index=False, classes="interactive-table")}
        </div>
        <div class="footer">
            Generated by OpenBB Platform • {len(data)} rows × {len(data[0].keys()) if data else 0} columns • {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        </div>
    </div>

    <script>
        // Table sorting functionality
        document.querySelectorAll('th').forEach(header => {{
            header.addEventListener('click', () => {{
                const table = header.closest('table');
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                const column = Array.from(header.parentNode.children).indexOf(header);
                
                const isNumeric = rows.every(row => {{
                    const cell = row.cells[column];
                    return cell && !isNaN(parseFloat(cell.textContent));
                }});
                
                rows.sort((a, b) => {{
                    const aValue = a.cells[column] ? a.cells[column].textContent.trim() : '';
                    const bValue = b.cells[column] ? b.cells[column].textContent.trim() : '';
                    
                    if (isNumeric) {{
                        return parseFloat(aValue) - parseFloat(bValue);
                    }}
                    return aValue.localeCompare(bValue);
                }});
                
                tbody.innerHTML = '';
                rows.forEach(row => tbody.appendChild(row));
            }});
        }});
        
        // Table filtering functionality
        function filterTable() {{
            const input = document.getElementById('searchInput');
            const filter = input.value.toLowerCase();
            const table = document.querySelector('table');
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {{
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filter) ? '' : 'none';
            }});
        }}
    </script>
</body>
</html>
            """
            
            # Save HTML file to charts directory for web access
            charts_dir = Path("/Users/marvin/redpill-project/frontend/public/charts")
            charts_dir.mkdir(parents=True, exist_ok=True)
            
            html_file = charts_dir / f"{table_id}.html"
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            # Generate URL for the table - use file:// URL so it works without server
            table_url = f"file://{html_file.absolute()}"
            
            # Auto-open in browser (like OpenBB does)
            try:
                webbrowser.open(table_url)
                browser_opened = True
            except Exception as e:
                browser_opened = False
            
            return f"""
🔥 **OpenBB Interactive Table Generated Successfully!**

📊 **Data:** {len(data)} rows × {len(data[0].keys()) if data else 0} columns
🌐 **URL:** {table_url}
{'🚀 **Browser:** Opened automatically' if browser_opened else '🔗 **Browser:** Open the URL above manually'}

**Interactive Features:**
✅ Click column headers to sort
✅ Use search box to filter data  
✅ Responsive design with hover effects
✅ Sticky headers for large datasets

**CLI Preview** (first 5 rows):
{self.create_clean_box_table(data[:5])}
            """.strip()
            
        except Exception as e:
            # Fallback to clean box table if OpenBB integration fails
            return f"""
⚠️ **OpenBB Table Generation Failed**: {str(e)}

Using clean CLI format instead:

{self.create_clean_box_table(data)}
            """.strip()


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