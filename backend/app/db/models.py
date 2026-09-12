"""SQLAlchemy models for Phase 0 baseline (settings / slabs / slab_photos)."""

from __future__ import annotations

from sqlalchemy import (
    LargeBinary,
    ForeignKey,
    Index,
    Integer,
    Float,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(Text, primary_key=True)
    value_enc: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)


class Slab(Base):
    __tablename__ = "slabs"
    __table_args__ = (
        UniqueConstraint("sku", name="uq_slabs_sku"),
        Index("ix_slabs_status", "status"),
        Index("ix_slabs_updated_at", "updated_at"),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    sku: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    length_in: Mapped[float] = mapped_column(Float, nullable=False)
    thickness_in: Mapped[float] = mapped_column(Float, nullable=False)
    sqft: Mapped[float | None] = mapped_column(Float, nullable=True)
    bdft: Mapped[float | None] = mapped_column(Float, nullable=True)
    width_min_in: Mapped[float | None] = mapped_column(Float, nullable=True)
    width_max_in: Mapped[float | None] = mapped_column(Float, nullable=True)
    width_avg_in: Mapped[float | None] = mapped_column(Float, nullable=True)
    species_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    wood_category_ids: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    edge_type_term_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    figure_term_ids: Mapped[str | None] = mapped_column(Text, nullable=True)
    grade_term_ids: Mapped[str | None] = mapped_column(Text, nullable=True)
    thickness_term_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    moisture_term_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fig_tag_ids: Mapped[str | None] = mapped_column(Text, nullable=True)
    feat_tag_ids: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_per_bdft: Mapped[float | None] = mapped_column(Float, nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    price_source: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    short_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_source: Mapped[str | None] = mapped_column(Text, nullable=True)
    client_rev: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    server_rev: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)
    inference_thread_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    inference_status: Mapped[str | None] = mapped_column(Text, nullable=True)
    inference_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    species_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    woo_product_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    published_at: Mapped[str | None] = mapped_column(Text, nullable=True)

    photos: Mapped[list["SlabPhoto"]] = relationship(
        back_populates="slab",
        cascade="all, delete-orphan",
    )


class SlabPhoto(Base):
    __tablename__ = "slab_photos"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    slab_id: Mapped[str] = mapped_column(
        Text, ForeignKey("slabs.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str | None] = mapped_column(Text, nullable=True)
    seq: Mapped[int | None] = mapped_column(Integer, nullable=True)
    original_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    processed_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str | None] = mapped_column(Text, nullable=True)

    slab: Mapped[Slab] = relationship(back_populates="photos")
