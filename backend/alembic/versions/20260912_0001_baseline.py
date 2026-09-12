"""baseline settings slabs slab_photos

Revision ID: 20260912_0001
Revises:
Create Date: 2026-09-12

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260912_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "settings",
        sa.Column("key", sa.Text(), primary_key=True),
        sa.Column("value_enc", sa.LargeBinary(), nullable=False),
        sa.Column("updated_at", sa.Text(), nullable=False),
    )
    op.create_table(
        "slabs",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("sku", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("length_in", sa.Float(), nullable=False),
        sa.Column("thickness_in", sa.Float(), nullable=False),
        sa.Column("sqft", sa.Float(), nullable=True),
        sa.Column("bdft", sa.Float(), nullable=True),
        sa.Column("width_min_in", sa.Float(), nullable=True),
        sa.Column("width_max_in", sa.Float(), nullable=True),
        sa.Column("width_avg_in", sa.Float(), nullable=True),
        sa.Column("species_id", sa.Integer(), nullable=True),
        sa.Column("wood_category_ids", sa.Text(), nullable=True),
        sa.Column("edge_type_term_id", sa.Integer(), nullable=True),
        sa.Column("figure_term_ids", sa.Text(), nullable=True),
        sa.Column("grade_term_ids", sa.Text(), nullable=True),
        sa.Column("thickness_term_id", sa.Integer(), nullable=True),
        sa.Column("moisture_term_id", sa.Integer(), nullable=True),
        sa.Column("fig_tag_ids", sa.Text(), nullable=True),
        sa.Column("feat_tag_ids", sa.Text(), nullable=True),
        sa.Column("price_per_bdft", sa.Float(), nullable=True),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("price_source", sa.Text(), nullable=True),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("short_title", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("content_source", sa.Text(), nullable=True),
        sa.Column("client_rev", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("server_rev", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.Text(), nullable=False),
        sa.Column("inference_thread_id", sa.Text(), nullable=True),
        sa.Column("inference_status", sa.Text(), nullable=True),
        sa.Column("inference_error", sa.Text(), nullable=True),
        sa.Column("species_confidence", sa.Float(), nullable=True),
        sa.Column("woo_product_id", sa.Integer(), nullable=True),
        sa.Column("published_at", sa.Text(), nullable=True),
        sa.UniqueConstraint("sku", name="uq_slabs_sku"),
    )
    op.create_index("ix_slabs_status", "slabs", ["status"])
    op.create_index("ix_slabs_updated_at", "slabs", ["updated_at"])
    op.create_table(
        "slab_photos",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("slab_id", sa.Text(), sa.ForeignKey("slabs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.Text(), nullable=False),
        sa.Column("role", sa.Text(), nullable=True),
        sa.Column("seq", sa.Integer(), nullable=True),
        sa.Column("original_path", sa.Text(), nullable=True),
        sa.Column("processed_path", sa.Text(), nullable=True),
        sa.Column("created_at", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("slab_photos")
    op.drop_index("ix_slabs_updated_at", table_name="slabs")
    op.drop_index("ix_slabs_status", table_name="slabs")
    op.drop_table("slabs")
    op.drop_table("settings")
