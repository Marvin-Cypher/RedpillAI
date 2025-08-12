"""Add talent intelligence tables

Revision ID: talent_intelligence_001
Revises: safe_crm_schema_enhancement
Create Date: 2025-08-08 03:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text
import uuid

# revision identifiers
revision = 'talent_intelligence_001'
down_revision = 'safe_crm_schema_enhancement'
branch_labels = None
depends_on = None


def table_exists(connection, table_name):
    """Check if a table exists in the database"""
    result = connection.execute(
        text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table_name}')")
    )
    return result.scalar()


def column_exists(connection, table_name, column_name):
    """Check if a column exists in a table"""
    result = connection.execute(
        text(f"""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = '{table_name}' 
                AND column_name = '{column_name}'
            )
        """)
    )
    return result.scalar()


def upgrade():
    """Add talent intelligence tables"""
    connection = op.get_bind()
    
    # Create talent_profiles table
    if not table_exists(connection, 'talent_profiles'):
        op.create_table(
            'talent_profiles',
            sa.Column('person_id', sa.String(), nullable=False),
            sa.Column('is_talent', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('talent_score', sa.Float(), nullable=True),
            sa.Column('talent_categories', postgresql.JSON(), nullable=True),
            sa.Column('manual_classification', sa.String(length=500), nullable=True),
            sa.Column('suggested_by_ai', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('suggestion_confidence', sa.Float(), nullable=True),
            sa.Column('achievement_summary', sa.Text(), nullable=True),
            sa.Column('career_highlights', postgresql.JSON(), nullable=True),
            sa.Column('classified_by', sa.String(), nullable=True),
            sa.Column('classified_at', sa.DateTime(), nullable=True),
            sa.Column('last_scored_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.ForeignKeyConstraint(['person_id'], ['persons.id'], ),
            sa.ForeignKeyConstraint(['classified_by'], ['users.id'], ),
            sa.PrimaryKeyConstraint('person_id')
        )
        op.create_index('ix_talent_profiles_is_talent', 'talent_profiles', ['is_talent'])
        op.create_index('ix_talent_profiles_talent_score', 'talent_profiles', ['talent_score'])
    
    # Create person_professionals table
    if not table_exists(connection, 'person_professionals'):
        op.create_table(
            'person_professionals',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('person_id', sa.String(), nullable=False),
            sa.Column('linkedin_url', sa.String(length=500), nullable=True),
            sa.Column('github_url', sa.String(length=500), nullable=True),
            sa.Column('twitter_url', sa.String(length=500), nullable=True),
            sa.Column('personal_website', sa.String(length=500), nullable=True),
            sa.Column('current_title', sa.String(length=200), nullable=True),
            sa.Column('current_company', sa.String(length=200), nullable=True),
            sa.Column('experience_years', sa.Integer(), nullable=True),
            sa.Column('previous_roles', postgresql.JSON(), nullable=True),
            sa.Column('education', postgresql.JSON(), nullable=True),
            sa.Column('skills', postgresql.JSON(), nullable=True),
            sa.Column('languages', postgresql.JSON(), nullable=True),
            sa.Column('professional_summary', sa.Text(), nullable=True),
            sa.Column('location', sa.String(length=200), nullable=True),
            sa.Column('remote_preference', sa.Boolean(), nullable=True),
            sa.Column('data_sources', postgresql.JSON(), nullable=False, server_default='[]'),
            sa.Column('last_updated_from_sources', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.ForeignKeyConstraint(['person_id'], ['persons.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_person_professionals_person_id', 'person_professionals', ['person_id'])
    
    # Create achievements table
    if not table_exists(connection, 'achievements'):
        op.create_table(
            'achievements',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('person_id', sa.String(), nullable=False),
            sa.Column('achievement_type', sa.String(length=50), nullable=False),
            sa.Column('title', sa.String(length=500), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('date_achieved', sa.DateTime(), nullable=True),
            sa.Column('source_url', sa.String(length=1000), nullable=True),
            sa.Column('verification_status', sa.String(length=50), nullable=False, server_default='UNVERIFIED'),
            sa.Column('impact_score', sa.Float(), nullable=True),
            sa.Column('tags', postgresql.JSON(), nullable=True),
            sa.Column('achievement_metadata', postgresql.JSON(), nullable=True),
            sa.Column('data_source_id', sa.String(), nullable=True),
            sa.Column('verified_by', sa.String(), nullable=True),
            sa.Column('verified_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.ForeignKeyConstraint(['person_id'], ['persons.id'], ),
            sa.ForeignKeyConstraint(['verified_by'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_achievements_person_id', 'achievements', ['person_id'])
        op.create_index('ix_achievements_type', 'achievements', ['achievement_type'])
        op.create_index('ix_achievements_verification', 'achievements', ['verification_status'])
    
    # Create platform_profiles table
    if not table_exists(connection, 'platform_profiles'):
        op.create_table(
            'platform_profiles',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('person_id', sa.String(), nullable=False),
            sa.Column('platform', sa.String(length=50), nullable=False),
            sa.Column('profile_url', sa.String(length=1000), nullable=False),
            sa.Column('username', sa.String(length=200), nullable=True),
            sa.Column('display_name', sa.String(length=200), nullable=True),
            sa.Column('followers_count', sa.Integer(), nullable=True),
            sa.Column('following_count', sa.Integer(), nullable=True),
            sa.Column('posts_count', sa.Integer(), nullable=True),
            sa.Column('engagement_score', sa.Float(), nullable=True),
            sa.Column('verified_account', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('bio', sa.Text(), nullable=True),
            sa.Column('last_activity', sa.DateTime(), nullable=True),
            sa.Column('profile_data', postgresql.JSON(), nullable=True),
            sa.Column('scrape_frequency', sa.String(length=50), nullable=False, server_default='weekly'),
            sa.Column('data_source_id', sa.String(), nullable=True),
            sa.Column('last_scraped', sa.DateTime(), nullable=True),
            sa.Column('next_scrape_scheduled', sa.DateTime(), nullable=True),
            sa.Column('scrape_errors', postgresql.JSON(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.ForeignKeyConstraint(['person_id'], ['persons.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_platform_profiles_person_id', 'platform_profiles', ['person_id'])
        op.create_index('ix_platform_profiles_platform', 'platform_profiles', ['platform'])
        op.create_index('ix_platform_profiles_username', 'platform_profiles', ['username'])
    
    # Create data_sources table
    if not table_exists(connection, 'data_sources'):
        op.create_table(
            'data_sources',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('source_name', sa.String(length=100), nullable=False),
            sa.Column('source_type', sa.String(length=50), nullable=False),
            sa.Column('source_url', sa.String(length=1000), nullable=True),
            sa.Column('api_identifier', sa.String(length=200), nullable=True),
            sa.Column('confidence_score', sa.Float(), nullable=True),
            sa.Column('data_quality', sa.String(length=50), nullable=True),
            sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('last_fetched', sa.DateTime(), nullable=True),
            sa.Column('fetch_frequency', sa.String(length=50), nullable=True, server_default='daily'),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('error_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('last_error', sa.Text(), nullable=True),
            sa.Column('source_metadata', postgresql.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_data_sources_name', 'data_sources', ['source_name'])
        op.create_index('ix_data_sources_type', 'data_sources', ['source_type'])
    
    # Create company_data_sources_talent table (for multi-source company data)
    if not table_exists(connection, 'company_data_sources_talent'):
        op.create_table(
            'company_data_sources_talent',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('company_id', sa.String(), nullable=False),
            sa.Column('data_source_id', sa.String(), nullable=False),
            sa.Column('data_fields', postgresql.JSON(), nullable=False, server_default='{}'),
            sa.Column('conflict_resolution', sa.String(length=50), nullable=True, server_default='latest'),
            sa.Column('priority', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('last_synced', sa.DateTime(), nullable=True),
            sa.Column('sync_status', sa.String(length=50), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
            sa.ForeignKeyConstraint(['data_source_id'], ['data_sources.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_company_data_sources_talent_company', 'company_data_sources_talent', ['company_id'])
        op.create_index('ix_company_data_sources_talent_source', 'company_data_sources_talent', ['data_source_id'])
    
    # Create person_data_sources table (for multi-source person data)
    if not table_exists(connection, 'person_data_sources'):
        op.create_table(
            'person_data_sources',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('person_id', sa.String(), nullable=False),
            sa.Column('data_source_id', sa.String(), nullable=False),
            sa.Column('data_fields', postgresql.JSON(), nullable=False, server_default='{}'),
            sa.Column('confidence_score', sa.Float(), nullable=True),
            sa.Column('last_verified', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.ForeignKeyConstraint(['person_id'], ['persons.id'], ),
            sa.ForeignKeyConstraint(['data_source_id'], ['data_sources.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_person_data_sources_person', 'person_data_sources', ['person_id'])
        op.create_index('ix_person_data_sources_source', 'person_data_sources', ['data_source_id'])
    
    # Add foreign key references for achievements and platform_profiles to data_sources
    if table_exists(connection, 'achievements') and table_exists(connection, 'data_sources'):
        try:
            op.create_foreign_key(
                'fk_achievements_data_source',
                'achievements', 'data_sources',
                ['data_source_id'], ['id']
            )
        except:
            pass  # Foreign key may already exist
    
    if table_exists(connection, 'platform_profiles') and table_exists(connection, 'data_sources'):
        try:
            op.create_foreign_key(
                'fk_platform_profiles_data_source',
                'platform_profiles', 'data_sources',
                ['data_source_id'], ['id']
            )
        except:
            pass  # Foreign key may already exist


def downgrade():
    """Remove talent intelligence tables"""
    connection = op.get_bind()
    
    # Drop tables in reverse order of dependencies
    tables_to_drop = [
        'person_data_sources',
        'company_data_sources_talent',
        'platform_profiles',
        'achievements',
        'person_professionals',
        'talent_profiles',
        'data_sources'
    ]
    
    for table_name in tables_to_drop:
        if table_exists(connection, table_name):
            op.drop_table(table_name)