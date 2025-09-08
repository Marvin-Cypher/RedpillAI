"""Add smart caching tables for cost optimization

Revision ID: add_smart_caching_001
Revises: previous_revision
Create Date:8-25 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_smart_caching_001'
down_revision = None  # Replace with actual previous revision
branch_labels = None
depends_on = None


def upgrade():
    # Create company_data_cache table for shared data
    op.create_table('company_data_cache',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('company_identifier', sa.String(length=255), nullable=False),
        sa.Column('data_type', sa.String(length=50), nullable=False),
        sa.Column('data_version', sa.Integer(), nullable=True, default=1),
        sa.Column('cached_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=False),
        sa.Column('confidence_score', sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column('cache_hit_count', sa.Integer(), nullable=True, default=0),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.Column('expires_at', sa.TIMESTAMP(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('company_identifier', 'data_type', name='uq_company_data_cache_identifier_type')
    )
    
    # Create indexes for performance
    op.create_index('idx_company_cache_identifier_type', 'company_data_cache', ['company_identifier', 'data_type'])
    op.create_index('idx_company_cache_expires', 'company_data_cache', ['expires_at'])
    op.create_index('idx_company_cache_source', 'company_data_cache', ['source'])

    # Create cache_analytics table for tracking usage
    op.create_table('cache_analytics',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('cache_entry_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('accessed_by_user', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('access_timestamp', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.Column('cache_hit', sa.Boolean(), nullable=True, default=True),
        sa.ForeignKeyConstraint(['cache_entry_id'], ['company_data_cache.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['accessed_by_user'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_cache_analytics_timestamp', 'cache_analytics', ['access_timestamp'])
    op.create_index('idx_cache_analytics_user', 'cache_analytics', ['accessed_by_user'])

    # Create user_company_data table for private data
    op.create_table('user_company_data',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_identifier', sa.String(length=255), nullable=False),
        sa.Column('data_type', sa.String(length=50), nullable=False),
        sa.Column('private_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'company_identifier', 'data_type', name='uq_user_company_data')
    )
    
    op.create_index('idx_user_company_data_lookup', 'user_company_data', ['user_id', 'company_identifier', 'data_type'])

    # Create realtime_data_cache table for short-lived data
    op.create_table('realtime_data_cache',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('data_key', sa.String(length=255), nullable=False),
        sa.Column('data_payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.Column('expires_at', sa.TIMESTAMP(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('data_key', name='uq_realtime_data_cache_key')
    )
    
    op.create_index('idx_realtime_cache_key_expires', 'realtime_data_cache', ['data_key', 'expires_at'])

    # Create api_usage_log table for cost tracking
    op.create_table('api_usage_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('api_service', sa.String(length=50), nullable=False),
        sa.Column('endpoint', sa.String(length=100), nullable=True),
        sa.Column('query_params', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('response_cached', sa.Boolean(), nullable=True, default=False),
        sa.Column('cost_estimate', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('execution_time_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_api_usage_user_service_date', 'api_usage_log', ['user_id', 'api_service', 'created_at'])
    op.create_index('idx_api_usage_created_at', 'api_usage_log', ['created_at'])

    # Add caching-related columns to existing companies table
    op.add_column('companies', sa.Column('enrichment_source', sa.String(length=50), nullable=True))
    op.add_column('companies', sa.Column('last_enriched_at', sa.TIMESTAMP(), nullable=True))
    op.add_column('companies', sa.Column('enrichment_status', sa.String(length=20), server_default='pending', nullable=True))
    op.add_column('companies', sa.Column('data_confidence_score', sa.Numeric(precision=3, scale=2), nullable=True))
    op.add_column('companies', sa.Column('total_funding', sa.BigInteger(), nullable=True))
    op.add_column('companies', sa.Column('last_funding_date', sa.Date(), nullable=True))
    op.add_column('companies', sa.Column('investor_count', sa.Integer(), server_default='0', nullable=True))
    op.add_column('companies', sa.Column('key_metrics', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('companies', sa.Column('market_intelligence', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    # Create indexes for new company columns
    op.create_index('idx_companies_enrichment_status', 'companies', ['enrichment_status'])
    op.create_index('idx_companies_last_enriched', 'companies', ['last_enriched_at'])


def downgrade():
    # Drop indexes first
    op.drop_index('idx_companies_last_enriched', table_name='companies')
    op.drop_index('idx_companies_enrichment_status', table_name='companies')
    op.drop_index('idx_api_usage_created_at', table_name='api_usage_log')
    op.drop_index('idx_api_usage_user_service_date', table_name='api_usage_log')
    op.drop_index('idx_realtime_cache_key_expires', table_name='realtime_data_cache')
    op.drop_index('idx_user_company_data_lookup', table_name='user_company_data')
    op.drop_index('idx_cache_analytics_user', table_name='cache_analytics')
    op.drop_index('idx_cache_analytics_timestamp', table_name='cache_analytics')
    op.drop_index('idx_company_cache_source', table_name='company_data_cache')
    op.drop_index('idx_company_cache_expires', table_name='company_data_cache')
    op.drop_index('idx_company_cache_identifier_type', table_name='company_data_cache')

    # Drop columns from companies table
    op.drop_column('companies', 'market_intelligence')
    op.drop_column('companies', 'key_metrics')
    op.drop_column('companies', 'investor_count')
    op.drop_column('companies', 'last_funding_date')
    op.drop_column('companies', 'total_funding')
    op.drop_column('companies', 'data_confidence_score')
    op.drop_column('companies', 'enrichment_status')
    op.drop_column('companies', 'last_enriched_at')
    op.drop_column('companies', 'enrichment_source')

    # Drop tables
    op.drop_table('api_usage_log')
    op.drop_table('realtime_data_cache')
    op.drop_table('user_company_data')
    op.drop_table('cache_analytics')
    op.drop_table('company_data_cache')