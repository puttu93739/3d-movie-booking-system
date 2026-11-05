"""prevent overlapping screen schedules

Revision ID: e49815320b77
Revises: 71fc1a0965d0
Create Date: 2026-11-05 00:17:40.997366

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e49815320b77'
down_revision: Union[str, Sequence[str], None] = '71fc1a0965d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from alembic import op


def upgrade():
    # Required for equality on integer screen IDs
    # inside a GiST exclusion constraint.
    op.execute(
        "CREATE EXTENSION IF NOT EXISTS btree_gist"
    )

    # Prevent invalid time intervals.
    op.execute("""
        ALTER TABLE shows
        ADD CONSTRAINT ck_shows_valid_interval
        CHECK (end_time > start_time)
    """)

    # No two occupied intervals may overlap
    # on the same physical screen.
    op.execute("""
        ALTER TABLE shows
        ADD CONSTRAINT ex_shows_no_overlap
        EXCLUDE USING gist (
            screen_id WITH =,
            tstzrange(
                start_time,
                end_time + INTERVAL '15 minutes',
                '[)'
            ) WITH &&
        )
    """)


def downgrade():
    op.execute("""
        ALTER TABLE shows
        DROP CONSTRAINT IF EXISTS ex_shows_no_overlap
    """)

    op.execute("""
        ALTER TABLE shows
        DROP CONSTRAINT IF EXISTS ck_shows_valid_interval
    """)

