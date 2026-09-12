"""Draft slab store stub — store client numbers as-is (no recompute)."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.db.models import Slab, SlabPhoto
from app.schemas.slabs import PhotoMeta, PhotoRead, SlabCreate, SlabRead

router = APIRouter(prefix="/api/v1", tags=["slabs"])


def _utcnow() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _db(request: Request):
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


def _json_list(value: list[int] | None) -> str | None:
    if value is None:
        return None
    return json.dumps(value)


def _parse_json_list(raw: str | None) -> list[int] | None:
    if raw is None:
        return None
    return list(json.loads(raw))


def _slab_to_read(slab: Slab) -> SlabRead:
    photos = [
        PhotoRead(
            id=p.id,
            kind=p.kind,
            role=p.role,
            seq=p.seq,
            original_url=f"/api/v1/slabs/{slab.id}/photos/{p.id}/original"
            if p.original_path
            else None,
            processed_url=f"/api/v1/slabs/{slab.id}/photos/{p.id}/processed"
            if p.processed_path
            else None,
        )
        for p in (slab.photos or [])
    ]
    return SlabRead(
        id=slab.id,
        sku=slab.sku,
        status=slab.status,
        length_in=slab.length_in,
        thickness_in=slab.thickness_in,
        sqft=slab.sqft,
        bdft=slab.bdft,
        width_min_in=slab.width_min_in,
        width_max_in=slab.width_max_in,
        width_avg_in=slab.width_avg_in,
        species_id=slab.species_id,
        wood_category_ids=_parse_json_list(slab.wood_category_ids),
        edge_type_term_id=slab.edge_type_term_id,
        figure_term_ids=_parse_json_list(slab.figure_term_ids),
        grade_term_ids=_parse_json_list(slab.grade_term_ids),
        thickness_term_id=slab.thickness_term_id,
        moisture_term_id=slab.moisture_term_id,
        fig_tag_ids=_parse_json_list(slab.fig_tag_ids),
        feat_tag_ids=_parse_json_list(slab.feat_tag_ids),
        price_per_bdft=slab.price_per_bdft,
        price=slab.price,
        price_source=slab.price_source,
        title=slab.title,
        short_title=slab.short_title,
        description=slab.description,
        content_source=slab.content_source,
        client_rev=slab.client_rev,
        server_rev=slab.server_rev,
        created_at=slab.created_at,
        updated_at=slab.updated_at,
        species_confidence=slab.species_confidence,
        woo_product_id=slab.woo_product_id,
        published_at=slab.published_at,
        inference_status=slab.inference_status,
        inference_error=slab.inference_error,
        photos=photos,
    )


@router.post("/slabs", status_code=201, response_model=SlabRead)
async def create_slab(
    request: Request,
    data: str = Form(...),
    files: list[UploadFile] | None = File(None, alias="files[]"),
    meta: list[str] | None = Form(None, alias="meta[]"),
    db: Session = Depends(_db),
) -> SlabRead:
    """Accept client-computed numbers + files; persist without recomputing SoT."""
    try:
        payload = SlabCreate.model_validate_json(data)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "validation",
                    "message": str(exc),
                    "detail": None,
                }
            },
        ) from exc

    existing = db.get(Slab, payload.id)
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail={
                "error": {
                    "code": "revision_conflict",
                    "message": "slab id already exists",
                    "detail": {"current_server_rev": existing.server_rev},
                }
            },
        )

    sku_hit = db.scalar(select(Slab).where(Slab.sku == payload.sku))
    if sku_hit is not None:
        raise HTTPException(
            status_code=409,
            detail={
                "error": {
                    "code": "duplicate_sku",
                    "message": "SKU already exists",
                    "detail": {"field": "sku"},
                }
            },
        )

    now = _utcnow()
    # Store client numbers AS-IS — do not recompute bdft/sqft/widths.
    slab = Slab(
        id=payload.id,
        sku=payload.sku,
        status="calibrated",
        length_in=payload.length_in,
        thickness_in=payload.thickness_in,
        sqft=payload.sqft,
        bdft=payload.bdft,
        width_min_in=payload.width_min_in,
        width_max_in=payload.width_max_in,
        width_avg_in=payload.width_avg_in,
        species_id=payload.species_id,
        wood_category_ids=_json_list(payload.wood_category_ids),
        edge_type_term_id=payload.edge_type_term_id,
        figure_term_ids=_json_list(payload.figure_term_ids),
        grade_term_ids=_json_list(payload.grade_term_ids),
        thickness_term_id=payload.thickness_term_id,
        moisture_term_id=payload.moisture_term_id,
        fig_tag_ids=_json_list(payload.fig_tag_ids),
        feat_tag_ids=_json_list(payload.feat_tag_ids),
        price_per_bdft=payload.price_per_bdft,
        price=payload.price,
        price_source=payload.price_source,
        title=payload.title,
        short_title=payload.short_title,
        description=payload.description,
        content_source=payload.content_source,
        client_rev=payload.client_rev,
        server_rev=1,
        created_at=now,
        updated_at=now,
        inference_status=None,
        inference_error=None,
    )
    db.add(slab)

    images_root = Path(request.app.state.settings.images_dir)
    slab_dir = images_root / payload.id
    slab_dir.mkdir(parents=True, exist_ok=True)

    upload_files = files or []
    meta_raw = meta or []
    for idx, upload in enumerate(upload_files):
        photo_meta = PhotoMeta(seq=idx + 1)
        if idx < len(meta_raw):
            try:
                photo_meta = PhotoMeta.model_validate_json(meta_raw[idx])
            except Exception:  # noqa: BLE001
                pass
        photo_id = str(uuid.uuid4())
        safe_name = Path(upload.filename or f"photo-{idx}.bin").name
        dest = slab_dir / f"{photo_id}_{safe_name}"
        content = await upload.read()
        dest.write_bytes(content)
        rel = f"{payload.id}/{dest.name}"
        db.add(
            SlabPhoto(
                id=photo_id,
                slab_id=payload.id,
                kind=photo_meta.kind,
                role=photo_meta.role,
                seq=photo_meta.seq,
                original_path=rel,
                processed_path=None,
                created_at=now,
            )
        )

    db.flush()
    slab = db.scalar(
        select(Slab).options(selectinload(Slab.photos)).where(Slab.id == payload.id)
    )
    assert slab is not None
    return _slab_to_read(slab)


@router.get("/slabs/{slab_id}", response_model=SlabRead)
def get_slab(slab_id: str, db: Session = Depends(_db)) -> SlabRead:
    slab = db.scalar(
        select(Slab).options(selectinload(Slab.photos)).where(Slab.id == slab_id)
    )
    if slab is None:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "not_found",
                    "message": "slab not found",
                    "detail": None,
                }
            },
        )
    return _slab_to_read(slab)
