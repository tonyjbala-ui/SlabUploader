"""Runtime configuration via pydantic-settings.

WOO_BASE_URL must be https:// (compose SoT). SLAB_AES_KEY is required (32-byte base64).
"""

from __future__ import annotations

import base64
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=None,
        extra="ignore",
        populate_by_name=True,
    )

    slab_aes_key: str = Field(..., validation_alias="SLAB_AES_KEY")
    woo_base_url: str = Field(..., validation_alias="WOO_BASE_URL")
    app_hostname: str = Field(default="", validation_alias="APP_HOSTNAME")
    database_url: str = Field(
        default="sqlite:////data/slab.db",
        validation_alias="DATABASE_URL",
    )
    images_dir: str = Field(default="/images", validation_alias="IMAGES_DIR")
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")
    app_version: str = Field(default="0.0.1-phase0", validation_alias="APP_VERSION")

    @field_validator("woo_base_url")
    @classmethod
    def woo_base_url_must_be_https(cls, value: str) -> str:
        if not value or not value.startswith("https://"):
            raise ValueError(
                "WOO_BASE_URL must start with https:// (http:// is rejected)"
            )
        return value.rstrip("/")

    @field_validator("slab_aes_key")
    @classmethod
    def slab_aes_key_must_be_32_bytes(cls, value: str) -> str:
        if not value:
            raise ValueError("SLAB_AES_KEY is required; refusing plaintext fallback")
        try:
            raw = base64.b64decode(value, validate=True)
        except Exception as exc:  # noqa: BLE001
            raise ValueError("SLAB_AES_KEY must be valid base64") from exc
        if len(raw) != 32:
            raise ValueError("SLAB_AES_KEY must decode to exactly 32 bytes")
        return value

    @property
    def aes_key_bytes(self) -> bytes:
        return base64.b64decode(self.slab_aes_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


def clear_settings_cache() -> None:
    get_settings.cache_clear()
