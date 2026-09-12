"""AES-GCM settings key/value store."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.config import Settings
from app.db.models import Setting
from app.schemas.settings import SettingsView
from app.security.aes import decrypt_value, encrypt_value

SECRET_KEYS = frozenset({"woo_app_password", "inference_api_key"})
PLAIN_KEYS = frozenset(
    {
        "woo_wp_username",
        "inference_base_url",
        "inference_model",
        "inference_enabled",
        "content_llm_enabled",
        "brand_voice",
        "geo_context",
        "woo_create_status",
        "aspect_ratio",
        "output_px",
        "output_px_min",
        "fill_target",
        "taxonomy_last_sync_at",
        "taxonomy_anchor",
    }
)


def _utcnow() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _encode_plain(value: object) -> str:
    if isinstance(value, (bool, int, float)):
        return json.dumps(value)
    return str(value)


def _decode_plain(key: str, raw: str) -> object:
    if key in {"inference_enabled", "content_llm_enabled"}:
        return json.loads(raw)
    if key in {"output_px", "output_px_min"}:
        return int(raw)
    if key == "fill_target":
        return float(raw)
    return raw


def set_setting(db: Session, cfg: Settings, key: str, value: object) -> None:
    blob = encrypt_value(cfg.aes_key_bytes, _encode_plain(value))
    row = db.get(Setting, key)
    now = _utcnow()
    if row is None:
        db.add(Setting(key=key, value_enc=blob, updated_at=now))
    else:
        row.value_enc = blob
        row.updated_at = now


def get_setting_raw(db: Session, cfg: Settings, key: str) -> str | None:
    row = db.get(Setting, key)
    if row is None:
        return None
    return decrypt_value(cfg.aes_key_bytes, row.value_enc)


def get_setting(db: Session, cfg: Settings, key: str) -> object | None:
    raw = get_setting_raw(db, cfg, key)
    if raw is None:
        return None
    return _decode_plain(key, raw)


def has_secret(db: Session, key: str) -> bool:
    return db.get(Setting, key) is not None


def build_settings_view(db: Session, cfg: Settings) -> SettingsView:
    username = get_setting(db, cfg, "woo_wp_username")
    return SettingsView(
        woo_base_url=cfg.woo_base_url,
        woo_wp_username=str(username) if username is not None else None,
        woo_credentials_configured=has_secret(db, "woo_app_password"),
        inference_base_url=_as_opt_str(get_setting(db, cfg, "inference_base_url")),
        inference_model=_as_opt_str(get_setting(db, cfg, "inference_model")),
        inference_enabled=bool(get_setting(db, cfg, "inference_enabled") or False),
        content_llm_enabled=bool(get_setting(db, cfg, "content_llm_enabled") or False),
        brand_voice=_as_opt_str(get_setting(db, cfg, "brand_voice")),
        geo_context=_as_opt_str(get_setting(db, cfg, "geo_context")),
        woo_create_status=str(get_setting(db, cfg, "woo_create_status") or "draft"),
        aspect_ratio=str(get_setting(db, cfg, "aspect_ratio") or "3:4"),
        output_px=int(get_setting(db, cfg, "output_px") or 1600),
        output_px_min=int(get_setting(db, cfg, "output_px_min") or 1600),
        fill_target=float(get_setting(db, cfg, "fill_target") or 0.80),
    )


def _as_opt_str(value: object | None) -> str | None:
    if value is None:
        return None
    return str(value)
