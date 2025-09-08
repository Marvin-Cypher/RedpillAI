#!/usr/bin/env python3
"""
Migrate existing chart files to workspace tracking system
"""

import os
import re
import asyncio
from pathlib import Path
from datetime import datetime
from app.services.creation_recorder import creation_recorder, CreationType, CreationCategory

async def migrate_existing_charts():
    """Find and register existing chart HTML files"""
    
    charts_dir = Path("/Users/marvin/redpill-project/frontend/public/charts")
    
    if not charts_dir.exists():
        print("❌ Charts directory not found")
        return
    
    chart_files = list(charts_dir.glob("*.html"))
    print(f"📊 Found {len(chart_files)} chart files")
    
    migrated = 0
    skipped = 0
    
    for chart_file in chart_files:
        filename = chart_file.name
        print(f"\n🔍 Processing: {filename}")
        
        # Skip table files
        if "table" in filename.lower():
            print("⏭️  Skipping table file")
            skipped += 1
            continue
            
        # Parse filename to extract metadata
        # Format examples:
        # TSLA_equity_1y_20250903_185257.html
        # BTC_crypto_1m_20250829_102801.html
        # AAPL_vs_MSFT_vs_GOOGL_comparison_1y_20250829_153104.html
        
        try:
            # Extract symbol(s)
            if "_vs_" in filename:
                # Multi-asset comparison
                symbols_part = filename.split("_comparison_")[0]
                symbols = symbols_part.split("_vs_")
                asset_type = "comparison"
                main_symbol = symbols[0]
            else:
                # Single asset
                parts = filename.replace(".html", "").split("_")
                if len(parts) >= 3:
                    main_symbol = parts[0]
                    asset_type = parts[1] if parts[1] in ["equity", "crypto"] else "equity"
                    symbols = [main_symbol]
                else:
                    print(f"⚠️  Cannot parse filename format: {filename}")
                    skipped += 1
                    continue
            
            # Extract period
            period_match = re.search(r'_(\d+[ymwd])_', filename)
            period = period_match.group(1) if period_match else "1y"
            
            # Extract timestamp from filename
            timestamp_match = re.search(r'_(\d{8}_\d{6})\.html$', filename)
            if timestamp_match:
                timestamp_str = timestamp_match.group(1)
                created_at = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
            else:
                # Use file modification time as fallback
                created_at = datetime.fromtimestamp(chart_file.stat().st_mtime)
            
            # Check if already exists
            existing_charts = await creation_recorder.get_user_creations(
                user_id="default",
                creation_type=CreationType.CHART,
                limit=1000
            )
            
            chart_url = f"/charts/{filename}"
            already_exists = any(
                creation.metadata.chart_url == chart_url 
                for creation in existing_charts
            )
            
            if already_exists:
                print(f"✅ Already tracked: {main_symbol}")
                skipped += 1
                continue
            
            # Create chart record
            creation_id = await creation_recorder.record_chart_creation(
                user_id="default",
                symbol=main_symbol,
                asset_type=asset_type,
                chart_result={
                    "chart_url": chart_url,
                    "web_viewer_url": f"http://localhost:3002{chart_url}",
                    "interactive": True,
                    "data_points": 250,  # estimated
                    "symbols": symbols,
                    "period": period,
                    "migrated": True,
                    "original_created_at": created_at.isoformat()
                },
                openbb_tool="chart_migration",
                parameters={
                    "symbols": symbols, 
                    "period": period, 
                    "asset_type": asset_type,
                    "filename": filename,
                    "migrated_from": str(chart_file),
                    "original_timestamp": created_at.isoformat()
                }
            )
            
            print(f"✅ Migrated: {main_symbol} -> {creation_id}")
            migrated += 1
            
        except Exception as e:
            print(f"❌ Error processing {filename}: {str(e)}")
            skipped += 1
            continue
    
    print(f"\n🎉 Migration complete!")
    print(f"✅ Migrated: {migrated} charts")
    print(f"⏭️  Skipped: {skipped} files")

if __name__ == "__main__":
    asyncio.run(migrate_existing_charts())