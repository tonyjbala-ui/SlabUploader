"""D-1: draft POST stores client bdft as-is; status calibrated."""

from __future__ import annotations

import json
import uuid

from fastapi.testclient import TestClient


def test_create_calibrated_draft_stores_client_bdft(client: TestClient) -> None:
    slab_id = str(uuid.uuid4())
    # Deliberately inconsistent with sqft*thickness so we prove no server recompute.
    payload = {
        "id": slab_id,
        "sku": "BW-0042",
        "length_in": 96.0,
        "thickness_in": 1.5,
        "sqft": 0.64,
        "bdft": 9.99,
        "width_min_in": 14.0,
        "width_max_in": 22.0,
        "width_avg_in": 18.2,
        "price": 12.0,
        "client_rev": 1,
    }
    resp = client.post(
        "/api/v1/slabs",
        data={
            "data": json.dumps(payload),
            "meta[]": json.dumps({"kind": "inventory", "role": "topdown", "seq": 1}),
        },
        files=[
            ("files[]", ("topdown.jpg", b"fake-jpeg-bytes", "image/jpeg")),
        ],
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "calibrated"
    assert body["server_rev"] == 1
    assert body["bdft"] == 9.99
    assert body["sqft"] == 0.64
    assert body["id"] == slab_id
    assert len(body["photos"]) == 1

    got = client.get(f"/api/v1/slabs/{slab_id}")
    assert got.status_code == 200
    assert got.json()["bdft"] == 9.99
