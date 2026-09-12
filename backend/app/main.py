"""FastAPI application factory."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI

from app import __version__
from app.api import health, settings as settings_api, slabs
from app.config import Settings, get_settings
from app.db.models import Base
from app.db.session import get_engine, get_session_factory
from app.logging_config import setup_logging

logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> FastAPI:
    cfg = settings or get_settings()
    setup_logging(cfg.log_level)

    engine = get_engine(cfg)
    session_factory = get_session_factory(engine)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        Path(cfg.images_dir).mkdir(parents=True, exist_ok=True)
        # Ensure parent of sqlite path exists
        if cfg.database_url.startswith("sqlite"):
            # sqlite:////data/slab.db or sqlite:///C:/tmp/x.db
            raw = cfg.database_url.split("sqlite:///", 1)[-1]
            db_path = Path(raw)
            if raw.startswith("/") and not raw.startswith("//"):
                # absolute posix-style from sqlite:////data/...
                db_path = Path("/" + raw.lstrip("/"))
            db_path.parent.mkdir(parents=True, exist_ok=True)
        Base.metadata.create_all(bind=engine)
        logger.info(
            "SlabUploader API starting version=%s woo_base_url=%s",
            cfg.app_version,
            cfg.woo_base_url,
        )
        yield
        engine.dispose()

    app = FastAPI(
        title="SlabUploader API",
        version=cfg.app_version or __version__,
        lifespan=lifespan,
    )
    app.state.settings = cfg
    app.state.engine = engine
    app.state.session_factory = session_factory

    app.include_router(health.router)
    app.include_router(settings_api.router)
    app.include_router(slabs.router)
    return app


# Module-level app for uvicorn: uvicorn app.main:app
# Lazily constructed so import-time tests can inject env first.
def __getattr__(name: str):
    if name == "app":
        return create_app()
    raise AttributeError(name)
