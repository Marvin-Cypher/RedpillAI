"""safe_crm_schema_enhancement

Revision ID: safe_crm_schema_enhancement
Revises: 0d92eded9eaa  
Create Date: 2025-08-07 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'safe_crm_schema_enhancement'
down_revision = '0d92eded9eaa'
branch_labels = None
depends_on = None


def table_exists(connection, table_name):
    """Check if a table exists in the database."""
    result = connection.execute(
        text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = :table_name)"),
        {"table_name": table_name}
    )
    return result.scalar()


def column_exists(connection, table_name, column_name):
    """Check if a column exists in a table."""
    result = connection.execute(
        text("""SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = :table_name AND column_name = :column_name
        )"""),
        {"table_name": table_name, "column_name": column_name}
    )
    return result.scalar()


def upgrade() -> None:
    connection = op.get_bind()
    
    # Add columns to existing companies table if they don't exist
    if not column_exists(connection, 'companies', 'created_by'):
        op.add_column('companies', sa.Column('created_by', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        op.create_index(op.f('ix_companies_created_by'), 'companies', ['created_by'], unique=False)
        op.create_foreign_key('fk_companies_created_by', 'companies', 'users', ['created_by'], ['id'])
    
    if not column_exists(connection, 'companies', 'owner_user_id'):
        op.add_column('companies', sa.Column('owner_user_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        op.create_index(op.f('ix_companies_owner_user_id'), 'companies', ['owner_user_id'], unique=False)
        op.create_foreign_key('fk_companies_owner_user_id', 'companies', 'users', ['owner_user_id'], ['id'])
    
    # Add column to existing deals table if it doesn't exist
    if not column_exists(connection, 'deals', 'contact_person_id'):
        op.add_column('deals', sa.Column('contact_person_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        op.create_index(op.f('ix_deals_contact_person_id'), 'deals', ['contact_person_id'], unique=False)
    
    # Create tables only if they don't exist
    if not table_exists(connection, 'tags'):
        op.create_table('tags',
            sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
            sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
            sa.Column('category', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False, server_default='CUSTOM'),
            sa.Column('color', sqlmodel.sql.sqltypes.AutoString(length=7), nullable=True),
            sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('created_by', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0'),
            sa.ForeignKeyConstraint(['created_by'], ['users.id'], name='fk_tags_created_by'),
            sa.PrimaryKeyConstraint('id', name='pk_tags')
        )
        op.create_index(op.f('ix_tags_id'), 'tags', ['id'], unique=False)
        op.create_index(op.f('ix_tags_name'), 'tags', ['name'], unique=False)
    
    if not table_exists(connection, 'persons'):
        op.create_table('persons',
            sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
            sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
            sa.Column('email', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
            sa.Column('linkedin_url', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
            sa.Column('twitter_handle', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
            sa.Column('bio', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('avatar_url', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
            sa.Column('location', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True),
            sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('company_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('primary_role', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.Column('created_by', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('source', sqlmodel.sql.sqltypes.AutoString(), nullable=True, server_default='manual'),
            sa.Column('confidence_score', sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], name='fk_persons_company_id'),
            sa.ForeignKeyConstraint(['created_by'], ['users.id'], name='fk_persons_created_by'),
            sa.PrimaryKeyConstraint('id', name='pk_persons')
        )
        op.create_index(op.f('ix_persons_company_id'), 'persons', ['company_id'], unique=False)
        op.create_index(op.f('ix_persons_id'), 'persons', ['id'], unique=False)
        op.create_index(op.f('ix_persons_name'), 'persons', ['name'], unique=False)
    
    if not table_exists(connection, 'ownerships'):
        op.create_table('ownerships',
            sa.Column('ownership_type', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
            sa.Column('percentage', sa.Float(), nullable=True),
            sa.Column('shares', sa.BigInteger(), nullable=True),
            sa.Column('share_class', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True, server_default='common'),
            sa.Column('vesting_schedule', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('exercise_price', sa.Float(), nullable=True),
            sa.Column('grant_date', sa.DateTime(), nullable=True),
            sa.Column('notes', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('company_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('person_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.Column('created_by', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('source', sqlmodel.sql.sqltypes.AutoString(), nullable=True, server_default='manual'),
            sa.Column('confidence_score', sa.Integer(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], name='fk_ownerships_company_id'),
            sa.ForeignKeyConstraint(['created_by'], ['users.id'], name='fk_ownerships_created_by'),
            sa.ForeignKeyConstraint(['person_id'], ['persons.id'], name='fk_ownerships_person_id'),
            sa.PrimaryKeyConstraint('id', name='pk_ownerships')
        )
        op.create_index(op.f('ix_ownerships_company_id'), 'ownerships', ['company_id'], unique=False)
        op.create_index(op.f('ix_ownerships_id'), 'ownerships', ['id'], unique=False)
        op.create_index(op.f('ix_ownerships_person_id'), 'ownerships', ['person_id'], unique=False)
    
    if not table_exists(connection, 'activities'):
        op.create_table('activities',
            sa.Column('activity_type', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
            sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
            sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('activity_metadata', sa.JSON(), nullable=True),
            sa.Column('id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('company_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('deal_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('person_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('performed_by', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('performed_by_system', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.Column('occurred_at', sa.DateTime(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], name='fk_activities_company_id'),
            sa.ForeignKeyConstraint(['deal_id'], ['deals.id'], name='fk_activities_deal_id'),
            sa.ForeignKeyConstraint(['performed_by'], ['users.id'], name='fk_activities_performed_by'),
            sa.ForeignKeyConstraint(['person_id'], ['persons.id'], name='fk_activities_person_id'),
            sa.PrimaryKeyConstraint('id', name='pk_activities')
        )
        op.create_index(op.f('ix_activities_company_id'), 'activities', ['company_id'], unique=False)
        op.create_index(op.f('ix_activities_deal_id'), 'activities', ['deal_id'], unique=False)
        op.create_index(op.f('ix_activities_id'), 'activities', ['id'], unique=False)
        op.create_index(op.f('ix_activities_occurred_at'), 'activities', ['occurred_at'], unique=False)
        op.create_index(op.f('ix_activities_performed_by'), 'activities', ['performed_by'], unique=False)
        op.create_index(op.f('ix_activities_person_id'), 'activities', ['person_id'], unique=False)
    
    # Create association tables only if they don't exist
    if not table_exists(connection, 'company_tags'):
        op.create_table('company_tags',
            sa.Column('company_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('tag_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('assigned_at', sa.DateTime(), nullable=False),
            sa.Column('assigned_by', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.ForeignKeyConstraint(['assigned_by'], ['users.id'], name='fk_company_tags_assigned_by'),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], name='fk_company_tags_company_id'),
            sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], name='fk_company_tags_tag_id'),
            sa.PrimaryKeyConstraint('company_id', 'tag_id', name='pk_company_tags')
        )
    
    if not table_exists(connection, 'deal_tags'):
        op.create_table('deal_tags',
            sa.Column('deal_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('tag_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('assigned_at', sa.DateTime(), nullable=False),
            sa.Column('assigned_by', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.ForeignKeyConstraint(['assigned_by'], ['users.id'], name='fk_deal_tags_assigned_by'),
            sa.ForeignKeyConstraint(['deal_id'], ['deals.id'], name='fk_deal_tags_deal_id'),
            sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], name='fk_deal_tags_tag_id'),
            sa.PrimaryKeyConstraint('deal_id', 'tag_id', name='pk_deal_tags')
        )
    
    if not table_exists(connection, 'person_tags'):
        op.create_table('person_tags',
            sa.Column('person_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('tag_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column('assigned_at', sa.DateTime(), nullable=False),
            sa.Column('assigned_by', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
            sa.ForeignKeyConstraint(['assigned_by'], ['users.id'], name='fk_person_tags_assigned_by'),
            sa.ForeignKeyConstraint(['person_id'], ['persons.id'], name='fk_person_tags_person_id'),
            sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], name='fk_person_tags_tag_id'),
            sa.PrimaryKeyConstraint('person_id', 'tag_id', name='pk_person_tags')
        )
    
    # Add foreign key for deals.contact_person_id if persons table exists and FK doesn't exist
    if table_exists(connection, 'persons'):
        try:
            op.create_foreign_key('fk_deals_contact_person_id', 'deals', 'persons', ['contact_person_id'], ['id'])
        except Exception:
            # FK might already exist, ignore the error
            pass


def downgrade() -> None:
    connection = op.get_bind()
    
    # Only drop things that exist
    try:
        op.drop_constraint('fk_deals_contact_person_id', 'deals', type_='foreignkey')
    except Exception:
        pass
        
    try:
        op.drop_constraint('fk_companies_created_by', 'companies', type_='foreignkey')
        op.drop_constraint('fk_companies_owner_user_id', 'companies', type_='foreignkey')
    except Exception:
        pass
    
    # Drop tables if they exist
    for table in ['person_tags', 'deal_tags', 'company_tags', 'activities', 'ownerships', 'persons', 'tags']:
        if table_exists(connection, table):
            op.drop_table(table)
    
    # Drop columns if they exist
    if column_exists(connection, 'deals', 'contact_person_id'):
        op.drop_index(op.f('ix_deals_contact_person_id'), table_name='deals')
        op.drop_column('deals', 'contact_person_id')
    
    if column_exists(connection, 'companies', 'owner_user_id'):
        op.drop_index(op.f('ix_companies_owner_user_id'), table_name='companies')
        op.drop_column('companies', 'owner_user_id')
        
    if column_exists(connection, 'companies', 'created_by'):
        op.drop_index(op.f('ix_companies_created_by'), table_name='companies')
        op.drop_column('companies', 'created_by')