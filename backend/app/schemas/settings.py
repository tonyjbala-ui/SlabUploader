"""Settings schemas — secrets never returned on GET."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, model_validator


class SettingsView(BaseModel):
    woo_base_url: str
    woo_wp_username: str | None = None
    woo_credentials_configured: bool = False
    inference_base_url: str | None = None
    inference_model: str | None = None
    inference_enabled: bool = False
    content_llm_enabled: bool = False
    brand_voice: str | None = None
    geo_context: str | None = None
    woo_create_status: str = "draft"
    aspect_ratio: str = "3:4"
    output_px: int = 1600
    output_px_min: int = 1600
    fill_target: float = 0.80


class SettingsUpdate(BaseModel):
    woo_wp_username: str | None = None
    woo_app_password: str | None = None
    inference_base_url: str | None = None
    inference_api_key: str | None = None
    inference_model: str | None = None
    inference_enabled: bool | None = None
    content_llm_enabled: bool | None = None
    brand_voice: str | None = None
    geo_context: str | None = None
    woo_create_status: str | None = None
    aspect_ratio: str | None = None
    output_px: int | None = None
    output_px_min: int | None = None
    fill_target: float | None = None

    # Reject legacy consumer keys
    woo_consumer_key: Any | None = Field(default=None, exclude=True)
    woo_consumer_secret: Any | None = Field(default=None, exclude=True)
    woo_base_url: Any | None = Field(default=None, exclude=True)

    @model_validator(mode="after")
    def reject_forbidden(self) -> "SettingsUpdate":
        raw = self.model_dump(exclude_unset=True)
        # pydantic already excluded those fields from dump if exclude=True,
        # so check via model_extra / construction — handled in router.
        return self
