# OpenAPI Contract — SvelteKit Client ↔ FastAPI

Status: SPEC (deliverable #2) · 2026-08-24 · SlabUploader
This is the binding API contract. The machine-readable `openapi.yaml` is generated
from the FastAPI app at implementation time and must match this doc. Base path:
`/api`. All requests/responses JSON unless noted. All timestamps UTC ISO-8601.

## Conventions
- **Auth**: none (ARCH §7). Trusted LAN/Tailscale + HTTPS.
- **Errors** — uniform envelope:
  ```json
  { "error": { "code": "string", "message": "string", "detail": "object|null" } }
  ```
  - `400` `validation` — payload failed validation (Pydantic).
  - `404` `not_found` — unknown slab/setting.
  - `409` `revision_conflict` — `client_rev`/`server_rev` mismatch (send `detail.current_server_rev`).
  - `409` `duplicate_sku` — SKU already exists (FR24a).
  - `422` `unpublishable` — slab not in a publishable state / missing required field.
  - `502` `woo_error` — WooCommerce rejected the request (`detail` carries Woo body).
  - `500` `internal` — unexpected.
- **Revisions**: create/update carry `client_rev`; server echoes `server_rev`. Client
  stores `server_rev` and sends it back on the next update. Mismatch → `409 revision_conflict`.
- **Pagination**: v1 lists are small (single owner, slab-by-slab); lists return full
  arrays. If volume grows, add `?limit&cursor` (documented, not built).

## Schemas (Pydantic v2)

### SlabCreate
```jsonc
{
  "id": "uuid (client-generated)",
  "sku": "string 3..24 [A-Z0-9-]",
  "length_in": 0,          // optional at create; required before publish
  "length_source": "manual|ruler|null",
  "thickness_in": 0,       // optional at create; required before publish
  "species": "string|null",
  "character": "string|null",
  "title": "string|null", "short_title": "string|null", "description": "string|null",
  "price": 0, "price_source": "recommendation|override|null",
  "client_rev": 1
}
```

### Slab (read model)
All of `SlabCreate` fields (resolved) plus:
`status`, `width_avg_in`, `width_source`, `sqft`, `bdft`, `price_per_bdft`,
`species_confidence`, `character_confidence`, `normalized_fill_ok`,
`woo_product_id`, `published_at`, `server_rev`, `created_at`, `updated_at`,
`photos: [PhotoRead]`.

### PhotoRead
```jsonc
{ "id":"uuid","kind":"calibration_sku|calibration_ruler|inventory",
  "role":"topdown|extra|null","seq":1,
  "original_url":"/api/slabs/{id}/photos/{pid}/original",
  "normalized_url":"/api/slabs/{id}/photos/{pid}/normalized|null",
  "is_customer_facing":0|1 }
```

### PriceRule
`{ id, species, character, price_per_bdft, created_at, updated_at }`

### SettingsView (read; secrets masked)
```jsonc
{ "woo_base_url":"https://www.whidbeywoodstore.com",
  "woo_credentials_configured": true,
  "inference_base_url":"http://192.168.1.202:8080",
  "inference_model":"<model>", "inference_enabled": true,
  "content_llm_enabled": false,
  "brand_voice":"…", "geo_context":"…",
  "aspect_ratio":"1:1","output_px":1600,"output_px_min":1000,"fill_target":0.80 }
```
Secrets (keys) are never returned; only a `*_configured` boolean.

---

## Endpoints

### Health & meta
- `GET /api/health` → `{ "status":"ok","version":"…","woo_reachable":bool }`
  (light probe; used by PWA connectivity check, ARCH §3.3)
- `GET /api/meta` → `{ "version":"…","templates_configured":bool }`

### Slabs
- `POST /api/slabs`  body `SlabCreate` → `201` `Slab` (status `draft`).
  - `409 duplicate_sku` if SKU exists.
- `GET /api/slabs` → `200` `[Slab]` (all, most-recent first).
- `GET /api/slabs/{id}` → `200` `Slab` / `404`.
- `PUT /api/slabs/{id}`  body `SlabUpdate` (any subset of editable fields + `client_rev`)
  → `200` `Slab`. Re-runs derived math (sqft/bdft/price recommendation) server-side when
  inputs change. `409 revision_conflict`, `409 duplicate_sku`.
- `DELETE /api/slabs/{id}` → `204` (soft: only allowed while unpublished; published
  slabs are retained for audit).

### Photo upload (offline queue, ARCH §3.2)
- `POST /api/slabs/{id}/upload`  body: JSON manifest
  ```jsonc
  { "client_rev":2,
    "photos":[ { "id":"uuid","kind":"inventory","role":"topdown","seq":1,
                 "blob":"<base64>" , "filename":"slab1_topdown.jpg" } ] }
  ```
  (Photos are base64 in v1 for transport simplicity; total request cap 40 MB.
  If that proves heavy, switch to multipart — documented extension.)
  → `202` `{ "status":"processing" }`. Server runs the authoritative pipeline
  (ruler→scale→geometry→widths→bdft→species/char→pricing→normalization→content)
  asynchronously. Client polls `GET /api/slabs/{id}`.
  - `409 revision_conflict` on stale `client_rev`.
  - Pipeline failure → slab `failed` (poll returns the error).

### Publish
- `POST /api/slabs/{id}/publish` → `202` `{ "status":"publishing" }`.
  Pre-conditions (else `422 unpublishable`): status in `ready`/`review`, length+width+
  thickness present, price present, ≥1 inventory photo, species/character confirmed.
  - Dedupe: if SKU already has a published slab → `409 duplicate_sku` (FR24a).
  - Woo failure → slab `failed`, `sync_log` written, poll returns `502 woo_error`.
  - Success → slab `published`, `woo_product_id` set, images purged (Decision 12).

### Status poll
- `GET /api/slabs/{id}` (same as above) is the poll endpoint. Long-running ops set
  `status` to `processing`/`publishing`; client backs off (1s,2s,4s… cap 10s).

### Photos (serve)
- `GET /api/slabs/{id}/photos/{pid}/original` → `image/*` (original, while retained)
- `GET /api/slabs/{id}/photos/{pid}/normalized` → `image/*` (normalized, while retained)
  - After publish, both → `410 Gone` (images purged, Decision 12).

### Taxonomy (FR25/FR26)
- `POST /api/admin/taxonomy/sync` → `200` `{ "categories":n,"tags":n,"attributes":n,"synced_at":"…" }`
  Pulls from Woo, rebuilds `woo_taxonomy` cache. `502 woo_error` on failure.
- `GET /api/admin/taxonomy` → `200` the cached taxonomy (grouped by kind).
  This is the controlled list for species (Decision 4) and auto-assign (FR26).

### Pricing rules (FR13/14/15)
- `GET /api/pricing-rules` → `[PriceRule]`
- `POST /api/pricing-rules` body `{ species, character, price_per_bdft }` → `201` `PriceRule`
  (`409` if pair exists → use PUT).
- `PUT /api/pricing-rules/{id}` body `{ price_per_bdft }` → `200` `PriceRule`
- `DELETE /api/pricing-rules/{id}` → `204`
- `GET /api/pricing-rules/recommend`?species=…&character=…&bdft=… → `200`
  `{ "price_per_bdft":n|null, "recommendation":n|null }` (FR14; null if no rule).

### Settings (FR32)
- `GET /api/settings` → `200` `SettingsView`
- `PUT /api/settings` body: partial `{ key: value }` for non-secret fields, and
  secret fields by name (values re-encrypted server-side, ARCH §7).
  → `200` `SettingsView`.
- `POST /api/settings/test-woo` → `200` `{ "ok":bool,"detail":"…" }` (validates Woo creds).
- `POST /api/settings/test-inference` → `200` `{ "ok":bool,"vision_capable":bool,"detail":"…" }`
  (sends a tiny image; `vision_capable` false → UI warns, species inference disabled).

---

## Request/response examples

### Create a slab
```
POST /api/slabs
{ "id":"9f1c…","sku":"BW-0042","length_source":null,"client_rev":1 }
→ 201
{ "id":"9f1c…","sku":"BW-0042","status":"draft","server_rev":1, "photos":[], … }
```

### Upload photos (triggers pipeline)
```
POST /api/slabs/9f1c…/upload
{ "client_rev":1, "photos":[ …base64… ] }
→ 202 { "status":"processing" }
GET /api/slabs/9f1c…   (poll)
→ 200 { "status":"ready","bdft":218.4,"width_avg_in":18.2,"price":2730.0,
        "species":"Black Walnut","character":"Cathedral","server_rev":2, … }
```

### Publish
```
POST /api/slabs/9f1c…/publish
→ 202 { "status":"publishing" }
GET /api/slabs/9f1c…   (poll)
→ 200 { "status":"published","woo_product_id":1042,"published_at":"…", … }
```

## Versioning
URL is `/api/v1` at implementation (this doc omits the prefix for brevity). Breaking
changes bump to `/api/v2`; the PWA pins the version it was built against.

## Out of contract (v1)
- Bulk endpoints, staff/role endpoints, webhook push (client polls), analytics.
