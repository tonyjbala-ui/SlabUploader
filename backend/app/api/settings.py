"""Settings endpoints — secrets write-only."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.schemas.settings import SettingsUpdate, SettingsView
from app.services.settings_store import (
    PLAIN_KEYS,
    SECRET_KEYS,
    build_settings_view,
    set_setting,
)

router = APIRouter(prefix="/api/v1", tags=["settings"])


def _db(request: Request) -> Session:
    session_factory = request.app.state.session_factory
    session = session_factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


@router.get("/settings", response_model=SettingsView)
def get_settings(request: Request, db: Session = Depends(_db)) -> SettingsView:
    return build_settings_view(db, request.app.state.settings)


@router.put("/settings", response_model=SettingsView)
def put_settings(
    body: SettingsUpdate,
    request: Request,
    db: Session = Depends(_db),
) -> SettingsView:
    raw = body.model_dump(exclude_unset=True)
    # Reject consumer keys / woo_base_url if present in original payload
    # FastAPI parses known fields; check via request body keys is done below.
    if "woo_consumer_key" in raw or "woo_consumer_secret" in raw:
        raise HTTPException(
            status_code=422,
            detail={
                "error": {
                    "code": "validation",
                    "message": "WooCommerce consumer keys are not implemented",
                    "detail": None,
                }
            },
        )
    if "woo_base_url" in raw:
        raise HTTPException(
            status_code=422,
            detail={
                "error": {
                    "code": "validation",
                    "message": "woo_base_url is read-only (WOO_BASE_URL env)",
                    "detail": None,
                }
            },
        )

    cfg = request.app.state.settings
    for key, value in raw.items():
        if value is None:
            continue
        if key in SECRET_KEYS or key in PLAIN_KEYS:
            set_setting(db, cfg, key, value)
    db.flush()
    return build_settings_view(db, cfg)
