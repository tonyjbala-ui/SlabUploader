"""Config: https-only WOO_BASE_URL; AES key required."""

from __future__ import annotations

import base64
import os

import pytest
from pydantic import ValidationError

from app.config import Settings


def _valid_key() -> str:
    return base64.b64encode(os.urandom(32)).decode("ascii")


def test_http_woo_url_rejected() -> None:
    with pytest.raises(ValidationError) as excinfo:
        Settings(
            SLAB_AES_KEY=_valid_key(),
            WOO_BASE_URL="http://insecure.example.com",
        )
    assert "https://" in str(excinfo.value)


def test_missing_scheme_woo_url_rejected() -> None:
    with pytest.raises(ValidationError):
        Settings(
            SLAB_AES_KEY=_valid_key(),
            WOO_BASE_URL="www.example.com",
        )


def test_https_woo_url_accepted() -> None:
    s = Settings(
        SLAB_AES_KEY=_valid_key(),
        WOO_BASE_URL="https://www.whidbeywoodstore.com/",
    )
    assert s.woo_base_url == "https://www.whidbeywoodstore.com"


def test_missing_aes_key_rejected() -> None:
    with pytest.raises(ValidationError):
        Settings(
            SLAB_AES_KEY="",
            WOO_BASE_URL="https://www.example.com",
        )
