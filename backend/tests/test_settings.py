"""AES-1: encrypt round-trip; secret absent from GET."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.config import Settings
from app.security.aes import decrypt_value, encrypt_value


def test_aes_round_trip(app_settings: Settings) -> None:
    key = app_settings.aes_key_bytes
    blob1 = encrypt_value(key, "super-secret-app-password")
    blob2 = encrypt_value(key, "super-secret-app-password")
    assert blob1 != blob2  # fresh nonce
    assert decrypt_value(key, blob1) == "super-secret-app-password"
    assert decrypt_value(key, blob2) == "super-secret-app-password"


def test_settings_put_get_masks_secret(client: TestClient) -> None:
    put = client.put(
        "/api/v1/settings",
        json={
            "woo_wp_username": "slab-uploader",
            "woo_app_password": "wp_app_password_secret_value",
        },
    )
    assert put.status_code == 200
    body = put.json()
    assert body["woo_wp_username"] == "slab-uploader"
    assert body["woo_credentials_configured"] is True
    assert "woo_app_password" not in body
    assert "wp_app_password_secret_value" not in put.text

    get = client.get("/api/v1/settings")
    assert get.status_code == 200
    gbody = get.json()
    assert gbody["woo_credentials_configured"] is True
    assert "woo_app_password" not in gbody
    assert "wp_app_password_secret_value" not in get.text
    assert gbody["woo_base_url"].startswith("https://")
