"""Add performance indexes for query optimization

Revision ID: 003_performance_indexes
Revises: 002_add_ttl_cache_columns
Create Date: 2025-08-01 10:56:48.230788

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_performance_indexes'
down_revision = '002_add_ttl_cache_columns'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add critical performance indexes for query optimization."""
    
    # 1. Enable pg_trgm extension for trigram search
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    
    # 2. Companies table indexes
    # GIN trigram index for fuzzy company name search (non-concurrent for Alembic)
    op.create_index(
        'idx_companies_name_trigram',
        'companies',
        ['name'],
        postgresql_using='gin',
        postgresql_ops={'name': 'gin_trgm_ops'}
    )
    
    # B-tree index for company type and sector filtering
    op.create_index(
        'idx_companies_type_sector', 
        'companies', 
        ['company_type', 'sector'],
        postgresql_using='btree'
    )
    
    # 3. Deals table indexes
    # Composite index for deal pipeline queries (company_id, status)
    op.create_index(
        'idx_deals_company_status', 
        'deals', 
        ['company_id', 'status'],
        postgresql_using='btree'
    )
    
    # 4. Conversations table indexes
    # Composite index for user chat history (user_id, conversation_type)
    op.create_index(
        'idx_conversations_user_type', 
        'conversations', 
        ['user_id', 'conversation_type'],
        postgresql_using='btree'
    )
    
    # 5. Enhanced cache index optimization
    # Create optimized cache lookup index with last_fetched for TTL queries
    # Note: We keep existing indexes and add this new one for better performance
    op.create_index(
        'idx_company_cache_optimized_lookup', 
        'company_data_cache', 
        ['company_identifier', 'data_type', 'last_fetched'],
        postgresql_using='btree'
    )
    
    # 6. Additional user email trigram index for fuzzy search
    op.create_index(
        'idx_users_email_trigram',
        'users',
        ['email'],
        postgresql_using='gin',
        postgresql_ops={'email': 'gin_trgm_ops'}
    )


def downgrade() -> None:
    """Remove performance indexes."""
    
    # Drop indexes in reverse order
    op.drop_index('idx_users_email_trigram', table_name='users')
    op.drop_index('idx_company_cache_optimized_lookup', table_name='company_data_cache')
    op.drop_index('idx_conversations_user_type', table_name='conversations')
    op.drop_index('idx_deals_company_status', table_name='deals')
    op.drop_index('idx_companies_type_sector', table_name='companies')
    op.drop_index('idx_companies_name_trigram', table_name='companies')
    
    # Note: We don't drop pg_trgm extension as it might be used elsewhere