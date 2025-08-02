"""Add TTL cache columns for fresh data tracking

Revision ID: 002_add_ttl_cache_columns
Revises: add_smart_caching_001
Create Date: 2025-08-01 10:52:13.308337

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_ttl_cache_columns'
down_revision = 'add_smart_caching_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add TTL-aware caching columns and archival support."""
    
    # 1. Add last_fetched column to company_data_cache for TTL logic
    op.add_column('company_data_cache', 
        sa.Column('last_fetched', sa.TIMESTAMP(), 
                  server_default=sa.text('now()'), 
                  nullable=False)
    )
    
    # 2. Add archived_at column to messages for archival support
    op.add_column('messages', 
        sa.Column('archived_at', sa.TIMESTAMP(), nullable=True)
    )
    
    # 3. Create index for TTL-aware cache lookups
    # (company_identifier, data_type, last_fetched DESC) for efficient freshness checks
    op.create_index(
        'idx_company_cache_ttl_lookup', 
        'company_data_cache', 
        ['company_identifier', 'data_type', 'last_fetched'], 
        postgresql_using='btree'
    )
    
    # 4. Create index for archived messages (future archival queries)
    op.create_index(
        'idx_messages_archived_at', 
        'messages', 
        ['archived_at'], 
        postgresql_where=sa.text('archived_at IS NOT NULL')
    )


def downgrade() -> None:
    """Remove TTL-aware caching columns and indexes."""
    
    # Drop indexes first
    op.drop_index('idx_messages_archived_at', table_name='messages')
    op.drop_index('idx_company_cache_ttl_lookup', table_name='company_data_cache')
    
    # Drop columns
    op.drop_column('messages', 'archived_at')
    op.drop_column('company_data_cache', 'last_fetched')