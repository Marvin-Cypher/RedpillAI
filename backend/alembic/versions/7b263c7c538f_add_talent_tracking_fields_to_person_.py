"""Add talent tracking fields to Person model

Revision ID: 7b263c7c538f
Revises: talent_intelligence_001
Create Date: 2025-08-08 16:06:29.290473

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '7b263c7c538f'
down_revision = 'talent_intelligence_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to persons table
    op.add_column('persons', sa.Column('github_username', sa.String(length=50), nullable=True))
    op.add_column('persons', sa.Column('is_tracked', sa.Boolean(), nullable=True))
    op.add_column('persons', sa.Column('track_reason', sa.String(), nullable=True))
    op.add_column('persons', sa.Column('is_founder', sa.Boolean(), nullable=True))
    op.add_column('persons', sa.Column('founder_since', sa.DateTime(), nullable=True))
    op.add_column('persons', sa.Column('startup_stage', sa.String(), nullable=True))
    op.add_column('persons', sa.Column('last_activity_check', sa.DateTime(), nullable=True))
    op.add_column('persons', sa.Column('activity_signals', sa.JSON(), nullable=True))
    op.add_column('persons', sa.Column('signal_strength', sa.Float(), nullable=True))
    op.add_column('persons', sa.Column('previous_companies', sa.JSON(), nullable=True))
    op.add_column('persons', sa.Column('expertise_areas', sa.JSON(), nullable=True))
    op.add_column('persons', sa.Column('achievements', sa.JSON(), nullable=True))
    
    # Create indexes for tracking fields
    op.create_index('ix_persons_is_founder', 'persons', ['is_founder'], unique=False)
    op.create_index('ix_persons_is_tracked', 'persons', ['is_tracked'], unique=False)
    
    # Set default values for existing rows
    op.execute("UPDATE persons SET is_tracked = FALSE WHERE is_tracked IS NULL")
    op.execute("UPDATE persons SET is_founder = FALSE WHERE is_founder IS NULL")


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_persons_is_tracked', table_name='persons')
    op.drop_index('ix_persons_is_founder', table_name='persons')
    
    # Drop columns
    op.drop_column('persons', 'achievements')
    op.drop_column('persons', 'expertise_areas')
    op.drop_column('persons', 'previous_companies')
    op.drop_column('persons', 'signal_strength')
    op.drop_column('persons', 'activity_signals')
    op.drop_column('persons', 'last_activity_check')
    op.drop_column('persons', 'startup_stage')
    op.drop_column('persons', 'founder_since')
    op.drop_column('persons', 'is_founder')
    op.drop_column('persons', 'track_reason')
    op.drop_column('persons', 'is_tracked')
    op.drop_column('persons', 'github_username')