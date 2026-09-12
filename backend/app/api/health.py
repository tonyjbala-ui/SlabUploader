"""Health endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health(request: Request) -> dict:
    settings = request.app.state.settings
    return {
        "status": "ok",
        "version": settings.app_version,
        "woo_reachable": False,  # Phase 0 stub — no live Woo probe
    }
