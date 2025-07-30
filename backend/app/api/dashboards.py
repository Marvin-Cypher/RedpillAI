"""
Dashboard API endpoints
Manage customizable dashboards and widgets
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlmodel import Session, select
from datetime import datetime

from ..database import get_db
from ..core.auth import get_current_active_user
from ..models.users import User
from ..models.dashboards import (
    DashboardLayout, DashboardLayoutCreate, DashboardLayoutUpdate, DashboardLayoutRead,
    WidgetConfiguration, WidgetConfigurationCreate, WidgetConfigurationUpdate, WidgetConfigurationRead,
    CompanyDataSource, CompanyDataSourceCreate, CompanyDataSourceUpdate, CompanyDataSourceRead,
    WidgetType, AssetType, WIDGET_LIBRARY
)

router = APIRouter()


# ===========================
# DASHBOARD LAYOUT ENDPOINTS
# ===========================

@router.get("/layouts", response_model=List[DashboardLayoutRead])
async def get_user_dashboard_layouts(
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all dashboard layouts for the current user"""
    try:
        query = select(DashboardLayout).where(DashboardLayout.user_id == current_user.id)
        
        if company_id:
            query = query.where(DashboardLayout.company_id == company_id)
        
        layouts = db.exec(query).all()
        
        # Load widgets for each layout
        result = []
        for layout in layouts:
            widget_query = select(WidgetConfiguration).where(
                WidgetConfiguration.dashboard_layout_id == layout.id
            )
            widgets = db.exec(widget_query).all()
            
            layout_dict = layout.dict()
            layout_dict['widgets'] = [widget.dict() for widget in widgets]
            result.append(DashboardLayoutRead(**layout_dict))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch layouts: {str(e)}")


@router.get("/layouts/{layout_id}", response_model=DashboardLayoutRead)
async def get_dashboard_layout(
    layout_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific dashboard layout"""
    try:
        layout = db.get(DashboardLayout, layout_id)
        
        if not layout:
            raise HTTPException(status_code=404, detail="Dashboard layout not found")
        
        if layout.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this layout")
        
        # Load widgets
        widget_query = select(WidgetConfiguration).where(
            WidgetConfiguration.dashboard_layout_id == layout_id
        )
        widgets = db.exec(widget_query).all()
        
        layout_dict = layout.dict()
        layout_dict['widgets'] = [widget.dict() for widget in widgets]
        
        return DashboardLayoutRead(**layout_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch layout: {str(e)}")


@router.post("/layouts", response_model=DashboardLayoutRead)
async def create_dashboard_layout(
    layout_data: DashboardLayoutCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new dashboard layout"""
    try:
        # If this is set as default, unset other defaults for this company
        if layout_data.is_default:
            existing_defaults = db.exec(
                select(DashboardLayout).where(
                    DashboardLayout.user_id == current_user.id,
                    DashboardLayout.company_id == layout_data.company_id,
                    DashboardLayout.is_default == True
                )
            ).all()
            
            for default_layout in existing_defaults:
                default_layout.is_default = False
                db.add(default_layout)
        
        # Create new layout
        layout = DashboardLayout(
            **layout_data.dict(),
            user_id=current_user.id
        )
        
        db.add(layout)
        db.commit()
        db.refresh(layout)
        
        layout_dict = layout.dict()
        layout_dict['widgets'] = []
        
        return DashboardLayoutRead(**layout_dict)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create layout: {str(e)}")


@router.put("/layouts/{layout_id}", response_model=DashboardLayoutRead)
async def update_dashboard_layout(
    layout_id: str,
    layout_update: DashboardLayoutUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a dashboard layout"""
    try:
        layout = db.get(DashboardLayout, layout_id)
        
        if not layout:
            raise HTTPException(status_code=404, detail="Dashboard layout not found")
        
        if layout.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this layout")
        
        # Handle default layout changes
        if layout_update.is_default and not layout.is_default:
            # Unset other defaults for this company
            existing_defaults = db.exec(
                select(DashboardLayout).where(
                    DashboardLayout.user_id == current_user.id,
                    DashboardLayout.company_id == layout.company_id,
                    DashboardLayout.is_default == True
                )
            ).all()
            
            for default_layout in existing_defaults:
                default_layout.is_default = False
                db.add(default_layout)
        
        # Update layout
        update_data = layout_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(layout, field, value)
        
        layout.updated_at = datetime.utcnow()
        
        db.add(layout)
        db.commit()
        db.refresh(layout)
        
        # Load widgets
        widget_query = select(WidgetConfiguration).where(
            WidgetConfiguration.dashboard_layout_id == layout_id
        )
        widgets = db.exec(widget_query).all()
        
        layout_dict = layout.dict()
        layout_dict['widgets'] = [widget.dict() for widget in widgets]
        
        return DashboardLayoutRead(**layout_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update layout: {str(e)}")


@router.delete("/layouts/{layout_id}")
async def delete_dashboard_layout(
    layout_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a dashboard layout"""
    try:
        layout = db.get(DashboardLayout, layout_id)
        
        if not layout:
            raise HTTPException(status_code=404, detail="Dashboard layout not found")
        
        if layout.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this layout")
        
        # Delete associated widgets
        widgets = db.exec(
            select(WidgetConfiguration).where(
                WidgetConfiguration.dashboard_layout_id == layout_id
            )
        ).all()
        
        for widget in widgets:
            db.delete(widget)
        
        # Delete layout
        db.delete(layout)
        db.commit()
        
        return {"message": "Dashboard layout deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete layout: {str(e)}")


# ===========================
# WIDGET CONFIGURATION ENDPOINTS
# ===========================

@router.post("/layouts/{layout_id}/widgets", response_model=WidgetConfigurationRead)
async def add_widget_to_layout(
    layout_id: str,
    widget_data: WidgetConfigurationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add a widget to a dashboard layout"""
    try:
        # Verify layout ownership
        layout = db.get(DashboardLayout, layout_id)
        if not layout or layout.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Dashboard layout not found")
        
        # Create widget
        widget = WidgetConfiguration(
            **widget_data.dict(),
            dashboard_layout_id=layout_id
        )
        
        db.add(widget)
        db.commit()
        db.refresh(widget)
        
        return WidgetConfigurationRead(**widget.dict())
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add widget: {str(e)}")


@router.put("/widgets/{widget_id}", response_model=WidgetConfigurationRead)
async def update_widget_configuration(
    widget_id: str,
    widget_update: WidgetConfigurationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a widget configuration"""
    try:
        widget = db.get(WidgetConfiguration, widget_id)
        
        if not widget:
            raise HTTPException(status_code=404, detail="Widget not found")
        
        # Verify ownership through layout
        layout = db.get(DashboardLayout, widget.dashboard_layout_id)
        if not layout or layout.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this widget")
        
        # Update widget
        update_data = widget_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(widget, field, value)
        
        widget.updated_at = datetime.utcnow()
        
        db.add(widget)
        db.commit()
        db.refresh(widget)
        
        return WidgetConfigurationRead(**widget.dict())
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update widget: {str(e)}")


@router.delete("/widgets/{widget_id}")
async def remove_widget_from_layout(
    widget_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove a widget from a dashboard layout"""
    try:
        widget = db.get(WidgetConfiguration, widget_id)
        
        if not widget:
            raise HTTPException(status_code=404, detail="Widget not found")
        
        # Verify ownership through layout
        layout = db.get(DashboardLayout, widget.dashboard_layout_id)
        if not layout or layout.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to remove this widget")
        
        db.delete(widget)
        db.commit()
        
        return {"message": "Widget removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to remove widget: {str(e)}")


# ===========================
# COMPANY DATA SOURCE ENDPOINTS
# ===========================

@router.get("/companies/{company_id}/data-sources", response_model=List[CompanyDataSourceRead])
async def get_company_data_sources(
    company_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get data sources for a company"""
    try:
        sources = db.exec(
            select(CompanyDataSource).where(CompanyDataSource.company_id == company_id)
        ).all()
        
        return [CompanyDataSourceRead(**source.dict()) for source in sources]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch data sources: {str(e)}")


@router.post("/companies/{company_id}/data-sources", response_model=CompanyDataSourceRead)
async def create_company_data_source(
    company_id: str,
    source_data: CompanyDataSourceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a data source for a company"""
    try:
        # If this is set as primary, unset other primary sources
        if source_data.is_primary:
            existing_primary = db.exec(
                select(CompanyDataSource).where(
                    CompanyDataSource.company_id == company_id,
                    CompanyDataSource.is_primary == True
                )
            ).all()
            
            for primary_source in existing_primary:
                primary_source.is_primary = False
                db.add(primary_source)
        
        source = CompanyDataSource(
            **source_data.dict(),
            company_id=company_id
        )
        
        db.add(source)
        db.commit()
        db.refresh(source)
        
        return CompanyDataSourceRead(**source.dict())
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create data source: {str(e)}")


@router.put("/data-sources/{source_id}", response_model=CompanyDataSourceRead)
async def update_company_data_source(
    source_id: str,
    source_update: CompanyDataSourceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a company data source"""
    try:
        source = db.get(CompanyDataSource, source_id)
        
        if not source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        # Handle primary source changes
        if source_update.is_primary and not source.is_primary:
            existing_primary = db.exec(
                select(CompanyDataSource).where(
                    CompanyDataSource.company_id == source.company_id,
                    CompanyDataSource.is_primary == True
                )
            ).all()
            
            for primary_source in existing_primary:
                primary_source.is_primary = False
                db.add(primary_source)
        
        # Update source
        update_data = source_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(source, field, value)
        
        source.updated_at = datetime.utcnow()
        
        db.add(source)
        db.commit()
        db.refresh(source)
        
        return CompanyDataSourceRead(**source.dict())
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update data source: {str(e)}")


# ===========================
# WIDGET LIBRARY ENDPOINTS
# ===========================

@router.get("/widget-library")
async def get_widget_library(
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_active_user)
):
    """Get available widget types from the library"""
    try:
        widgets = WIDGET_LIBRARY
        
        if category:
            widgets = [w for w in widgets if w.category == category]
        
        return {
            "widgets": [widget.dict() for widget in widgets],
            "categories": list(set([w.category for w in WIDGET_LIBRARY])),
            "total_count": len(widgets)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch widget library: {str(e)}")


@router.get("/widget-types")
async def get_widget_types(
    current_user: User = Depends(get_current_active_user)
):
    """Get available widget types"""
    try:
        return {
            "widget_types": [wt.value for wt in WidgetType],
            "asset_types": [at.value for at in AssetType]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch widget types: {str(e)}")


# ===========================
# DASHBOARD UTILITIES
# ===========================

@router.post("/layouts/{layout_id}/duplicate")
async def duplicate_dashboard_layout(
    layout_id: str,
    new_name: Optional[str] = Query(None, description="Name for the duplicated layout"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Duplicate a dashboard layout with all its widgets"""
    try:
        # Get original layout
        original_layout = db.get(DashboardLayout, layout_id)
        
        if not original_layout or original_layout.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Dashboard layout not found")
        
        # Create new layout
        new_layout = DashboardLayout(
            company_id=original_layout.company_id,
            user_id=current_user.id,
            layout_name=new_name or f"{original_layout.layout_name} (Copy)",
            is_default=False  # Copies are never default
        )
        
        db.add(new_layout)
        db.commit()
        db.refresh(new_layout)
        
        # Copy widgets
        original_widgets = db.exec(
            select(WidgetConfiguration).where(
                WidgetConfiguration.dashboard_layout_id == layout_id
            )
        ).all()
        
        for widget in original_widgets:
            new_widget = WidgetConfiguration(
                dashboard_layout_id=new_layout.id,
                widget_type=widget.widget_type,
                position_x=widget.position_x,
                position_y=widget.position_y,
                width=widget.width,
                height=widget.height,
                is_visible=widget.is_visible,
                config=widget.config
            )
            db.add(new_widget)
        
        db.commit()
        
        return {"message": "Dashboard layout duplicated successfully", "new_layout_id": new_layout.id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to duplicate layout: {str(e)}")


@router.get("/layouts/{layout_id}/export")
async def export_dashboard_layout(
    layout_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export a dashboard layout configuration"""
    try:
        layout = db.get(DashboardLayout, layout_id)
        
        if not layout or layout.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Dashboard layout not found")
        
        # Get widgets
        widgets = db.exec(
            select(WidgetConfiguration).where(
                WidgetConfiguration.dashboard_layout_id == layout_id
            )
        ).all()
        
        export_data = {
            "layout": {
                "name": layout.layout_name,
                "created_at": layout.created_at.isoformat(),
                "updated_at": layout.updated_at.isoformat()
            },
            "widgets": [
                {
                    "type": widget.widget_type,
                    "position": {
                        "x": widget.position_x,
                        "y": widget.position_y,
                        "w": widget.width,
                        "h": widget.height
                    },
                    "config": widget.config,
                    "visible": widget.is_visible
                }
                for widget in widgets
            ],
            "export_version": "1.0",
            "exported_at": datetime.utcnow().isoformat()
        }
        
        return export_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export layout: {str(e)}")