"""Slab request/response schemas (Phase 0 stub)."""

from __future__ import annotations

import re
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


SKU_RE = re.compile(r"^[A-Z0-9-]{3,24}$")


class PhotoMeta(BaseModel):
    kind: Literal["inventory"] = "inventory"
    role: Literal["topdown", "extra"] = "extra"
    seq: int = 1


class SlabCreate(BaseModel):
    id: str
    sku: str
    length_in: float
    thickness_in: float
    sqft: float | None = None
    bdft: float | None = None
    width_min_in: float | None = None
    width_max_in: float | None = None
    width_avg_in: float | None = None
    species_id: int | None = None
    wood_category_ids: list[int] | None = None
    edge_type_term_id: int | None = None
    figure_term_ids: list[int] | None = None
    grade_term_ids: list[int] | None = None
    thickness_term_id: int | None = None
    moisture_term_id: int | None = None
    fig_tag_ids: list[int] | None = None
    feat_tag_ids: list[int] | None = None
    price_per_bdft: float | None = None
    price: float = 0.0
    price_source: str | None = None
    title: str | None = None
    short_title: str | None = None
    description: str | None = None
    content_source: str | None = None
    client_rev: int = 1

    @field_validator("sku")
    @classmethod
    def sku_format(cls, value: str) -> str:
        if not SKU_RE.match(value):
            raise ValueError("sku must match [A-Z0-9-]{3,24}")
        return value


class PhotoRead(BaseModel):
    id: str
    kind: str
    role: str | None = None
    seq: int | None = None
    original_url: str | None = None
    processed_url: str | None = None


class SlabRead(BaseModel):
    id: str
    sku: str
    status: str
    length_in: float
    thickness_in: float
    sqft: float | None = None
    bdft: float | None = None
    width_min_in: float | None = None
    width_max_in: float | None = None
    width_avg_in: float | None = None
    species_id: int | None = None
    wood_category_ids: list[int] | None = None
    edge_type_term_id: int | None = None
    figure_term_ids: list[int] | None = None
    grade_term_ids: list[int] | None = None
    thickness_term_id: int | None = None
    moisture_term_id: int | None = None
    fig_tag_ids: list[int] | None = None
    feat_tag_ids: list[int] | None = None
    price_per_bdft: float | None = None
    price: float
    price_source: str | None = None
    title: str | None = None
    short_title: str | None = None
    description: str | None = None
    content_source: str | None = None
    client_rev: int
    server_rev: int
    created_at: str
    updated_at: str
    species_confidence: float | None = None
    woo_product_id: int | None = None
    published_at: str | None = None
    inference_status: str | None = None
    inference_error: str | None = None
    photos: list[PhotoRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}
