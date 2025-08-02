"""Update company types to public, crypto, private

Revision ID: c55ac6131ce8
Revises: 5217a9653197
Create Date: 2025-08-01 16:25:02.994293

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c55ac6131ce8'
down_revision = '5217a9653197'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Update existing company type values (enum values already added manually)
    # TRADITIONAL -> PRIVATE (most traditional companies in VC are private)
    op.execute("UPDATE companies SET company_type = 'PRIVATE' WHERE company_type = 'TRADITIONAL'")
    
    # Keep CRYPTO as CRYPTO
    # Keep AI, FINTECH, SAAS as PRIVATE (they're typically private companies)
    op.execute("UPDATE companies SET company_type = 'PRIVATE' WHERE company_type IN ('AI', 'FINTECH', 'SAAS')")
    
    # For known public companies, set to PUBLIC
    op.execute("""
        UPDATE companies SET company_type = 'PUBLIC' 
        WHERE LOWER(name) IN ('amazon', 'nvidia', 'microsoft', 'google', 'alphabet', 'apple', 'tesla', 'meta', 'netflix')
    """)


def downgrade() -> None:
    # Reverse the changes
    op.execute("UPDATE companies SET company_type = 'traditional' WHERE company_type = 'private'")
    op.execute("UPDATE companies SET company_type = 'traditional' WHERE company_type = 'public'")
    # Keep crypto as crypto