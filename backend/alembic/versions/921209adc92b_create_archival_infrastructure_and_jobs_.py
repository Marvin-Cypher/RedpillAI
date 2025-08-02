"""Create archival infrastructure and jobs table

Revision ID: 004_archive_infrastructure
Revises: 003_performance_indexes
Create Date: 2025-08-01 11:01:37.454889

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_archive_infrastructure'
down_revision = '003_performance_indexes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create archival infrastructure and job tracking."""
    
    # 1. Create archive_jobs table for tracking archival operations
    op.create_table('archive_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('job_type', sa.String(length=50), nullable=False),  # 'messages', 'cache', 'api_logs', 'full_cycle'
        sa.Column('status', sa.String(length=20), server_default='pending', nullable=False),  # 'pending', 'running', 'completed', 'failed'
        sa.Column('started_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('completed_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('parameters', postgresql.JSONB(astext_type=sa.Text()), nullable=True),  # Job parameters
        sa.Column('result', postgresql.JSONB(astext_type=sa.Text()), nullable=True),  # Job results/stats
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 2. Create indexes for archive_jobs table
    op.create_index('idx_archive_jobs_status_type', 'archive_jobs', ['status', 'job_type'])
    op.create_index('idx_archive_jobs_created_at', 'archive_jobs', ['created_at'])
    
    # 3. Create archive_policies table for configurable retention policies
    op.create_table('archive_policies',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('data_type', sa.String(length=50), nullable=False, unique=True),  # 'messages', 'cache', 'api_logs'
        sa.Column('retention_days', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('data_type', name='uq_archive_policies_data_type')
    )
    
    # 4. Insert default archive policies
    op.execute("""
        INSERT INTO archive_policies (data_type, retention_days, is_active) VALUES
        ('messages', 180, true),
        ('expired_cache', 30, true),
        ('api_usage_logs', 90, true),
        ('analytics', 365, true)
    """)
    
    # 5. Add trigger for automatic updated_at timestamp updates
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Apply the trigger to archive_jobs and archive_policies
    op.execute("""
        CREATE TRIGGER update_archive_jobs_updated_at 
        BEFORE UPDATE ON archive_jobs 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)
    
    op.execute("""
        CREATE TRIGGER update_archive_policies_updated_at 
        BEFORE UPDATE ON archive_policies 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade() -> None:
    """Remove archival infrastructure."""
    
    # Drop triggers first
    op.execute("DROP TRIGGER IF EXISTS update_archive_policies_updated_at ON archive_policies")
    op.execute("DROP TRIGGER IF EXISTS update_archive_jobs_updated_at ON archive_jobs")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column()")
    
    # Drop indexes
    op.drop_index('idx_archive_jobs_created_at', table_name='archive_jobs')
    op.drop_index('idx_archive_jobs_status_type', table_name='archive_jobs')
    
    # Drop tables
    op.drop_table('archive_policies')
    op.drop_table('archive_jobs')