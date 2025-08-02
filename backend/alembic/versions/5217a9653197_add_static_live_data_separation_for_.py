"""Add static/live data separation for parallel processing

Revision ID: 5217a9653197
Revises: 004_archive_infrastructure
Create Date: 2025-08-01 11:24:47.579225

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = '5217a9653197'
down_revision = '004_archive_infrastructure'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Add columns for static/live data separation to enable parallel processing:
    - last_fetched_static: Track when static data (profiles, funding, team) was last fetched
    - last_fetched_live: Track when live data (prices, metrics) was last fetched  
    - data_category: Classify data type for intelligent TTL management
    - parallel_fetch_lock: Prevent duplicate concurrent API calls for same company
    """
    
    # Add static data timestamp (30-day TTL)
    op.add_column('company_data_cache', 
        sa.Column('last_fetched_static', sa.TIMESTAMP(), nullable=True,
                  comment='When static data (profile/funding/team) was last fetched')
    )
    
    # Add live data timestamp (5-15 min TTL)
    op.add_column('company_data_cache',
        sa.Column('last_fetched_live', sa.TIMESTAMP(), nullable=True,
                  comment='When live data (prices/metrics) was last fetched')
    )
    
    # Add data category for intelligent caching
    op.add_column('company_data_cache',
        sa.Column('data_category', sa.String(20), nullable=True,
                  comment='Data category: static, live, or mixed')
    )
    
    # Add parallel fetch lock to prevent duplicate concurrent calls
    op.add_column('company_data_cache',
        sa.Column('parallel_fetch_lock', sa.TIMESTAMP(), nullable=True,
                  comment='Lock timestamp to prevent concurrent fetches for same company')
    )
    
    # Create index for efficient parallel processing queries
    op.create_index(
        'idx_company_cache_parallel_fetch',
        'company_data_cache',
        ['company_identifier', 'data_category', 'last_fetched_static']
    )
    
    # Update existing records to set appropriate data categories
    op.execute("""
        UPDATE company_data_cache 
        SET data_category = CASE 
            WHEN data_type IN ('profile', 'funding', 'team') THEN 'static'
            WHEN data_type IN ('price', 'metrics', 'news') THEN 'live' 
            ELSE 'mixed'
        END,
        last_fetched_static = CASE 
            WHEN data_type IN ('profile', 'funding', 'team') THEN last_fetched
            ELSE NULL
        END,
        last_fetched_live = CASE 
            WHEN data_type IN ('price', 'metrics', 'news') THEN last_fetched
            ELSE NULL
        END
    """)


def downgrade() -> None:
    """Remove parallel processing columns and indexes."""
    
    # Drop the index
    op.drop_index('idx_company_cache_parallel_fetch', table_name='company_data_cache')
    
    # Drop the columns in reverse order
    op.drop_column('company_data_cache', 'parallel_fetch_lock')
    op.drop_column('company_data_cache', 'data_category')  
    op.drop_column('company_data_cache', 'last_fetched_live')
    op.drop_column('company_data_cache', 'last_fetched_static')