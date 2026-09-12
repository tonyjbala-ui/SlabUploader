"""Pytest fixtures for Phase 0 API tests."""

from __future__ import annotations

import base64
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import Settings, clear_settings_cache
from app.main import create_app


@pytest.fixture()
def aes_key_b64() -> str:
    return base64.b64encode(os.urandom(32)).decode("ascii")


@pytest.fixture()
def app_settings(tmp_path: Path, aes_key_b64: str) -> Settings:
    clear_settings_cache()
    db_path = tmp_path / "slab.db"
    images = tmp_path / "images"
    images.mkdir()
    return Settings(
        SLAB_AES_KEY=aes_key_b64,
        WOO_BASE_URL="https://www.example-woo.test",
        APP_HOSTNAME="slab.test.local",
        DATABASE_URL=f"sqlite:///{db_path.as_posix()}",
        IMAGES_DIR=str(images),
        APP_VERSION="0.0.1-phase0-test",
    )


@pytest.fixture()
def client(app_settings: Settings) -> TestClient:
    app = create_app(app_settings)
    with TestClient(app) as test_client:
        yield test_client
