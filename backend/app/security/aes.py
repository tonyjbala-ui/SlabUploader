"""AES-GCM helpers for settings at-rest encryption.

Wire format (DATA-MODEL): value_enc = nonce(12) || ciphertext.
"""

from __future__ import annotations

import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def encrypt_value(key: bytes, plaintext: str) -> bytes:
    if len(key) != 32:
        raise ValueError("AES key must be 32 bytes")
    nonce = os.urandom(12)
    ciphertext = AESGCM(key).encrypt(nonce, plaintext.encode("utf-8"), None)
    return nonce + ciphertext


def decrypt_value(key: bytes, blob: bytes) -> str:
    if len(key) != 32:
        raise ValueError("AES key must be 32 bytes")
    if len(blob) < 13:
        raise ValueError("ciphertext too short")
    nonce, ciphertext = blob[:12], blob[12:]
    return AESGCM(key).decrypt(nonce, ciphertext, None).decode("utf-8")
