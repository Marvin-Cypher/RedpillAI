"""Add deal terms fields to deals table

Revision ID: add_deal_terms_fields
Revises: 
Create Date: 2025-08-06

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = 'a1b2c3d4e5f6'
down_revision = 'c55ac6131ce8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to deals table
    op.add_column('deals', sa.Column('lead_partner', sa.String(length=255), nullable=True))
    op.add_column('deals', sa.Column('co_investors', sa.Text(), nullable=True))
    op.add_column('deals', sa.Column('board_seat', sa.Boolean(), nullable=True, default=False))
    op.add_column('deals', sa.Column('pro_rata_rights', sa.Boolean(), nullable=True, default=True))
    op.add_column('deals', sa.Column('liquidation_preference', sa.String(length=50), nullable=True))
    op.add_column('deals', sa.Column('anti_dilution', sa.String(length=50), nullable=True))


def downgrade() -> None:
    # Remove columns from deals table
    op.drop_column('deals', 'anti_dilution')
    op.drop_column('deals', 'liquidation_preference')
    op.drop_column('deals', 'pro_rata_rights')
    op.drop_column('deals', 'board_seat')
    op.drop_column('deals', 'co_investors')
    op.drop_column('deals', 'lead_partner')