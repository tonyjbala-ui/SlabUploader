# OpenAPI Contract — SvelteKit Client ↔ FastAPI

Status: SPEC · 2026-08-27 · SlabUploader
Base path: `/api/v1`. All requests/responses JSON unless noted.
All timestamps UTC ISO-8601.

## Conventions

### Auth
No client auth. Trusted LAN/Tailscale + HTTPS.

### Errors
Uniform envelope:
```json
{ "error": { "code": "string", "message": "string", "detail": "object|null" } }
```
- `400 validation` — payload failed validation.
- `404 not_found` — unknown slab/photo/setting.
- `409 revision_conflict` — client_rev/server_rev mismatch. `detail` carries `current_server_rev`.
- `409 duplicate_sku` — SKU already published in WooCommerce.
- `422 unpublishable` — slab not in a publishable state or missing required field.
- `502 woo_error` — WooCommerce rejected the request. `detail` carries Woo error body.
- `500 internal` — unexpected.

### Revisions
Create/update carry `client_rev`. Server echoes `server_rev`. Client stores `server_rev` and sends it back on the next update. Mismatch → `409 revision_conflict`.

### Photos
Uploaded as `multipart/form-data`. Max 40 MB per request. Two fields per photo:
- `files[]` — the original image file
- `meta[]` — JSON `{ kind: "inventory", role: "topdown"|"extra", seq: 1 }`

### Pagination
Lists are small (single owner, slab-by-slab). Lists return full arrays.

### API Version
URL is `/api/v1`. Breaking changes bump to `/api/v2`.

---

## Schemas

### SlabCreate
```jsonc
{
  "id": "uuid (client-generated)",
  "sku": "string 3..24 [A-Z0-9-]",
  "length_in": 96.0,           // 1/8" step
  "thickness_in": 1.5,        // 1/8" step
  "sqft": 0.64,              // computed by client
  "bdft": 0.96,              // computed by client
  "width_min_in": 14.0,
  "width_max_in": 22.0,
  "width_avg_in": 18.2,
  "species_id": 42,          // → woo_categories (leaf)
  "wood_category_ids": [15, 23],  // JSON array → woo_categories (leaf, 1+)
  "edge_type_term_id": 8,    // → woo_attribute_terms
  "figure_term_ids": [3],    // JSON array → woo_attribute_terms (1+)
  "grade_term_ids": [7],     // JSON array → woo_attribute_terms (1+)
  "thickness_term_id": 12,   // → woo_attribute_terms (round-up)
  "moisture_term_id": 5,     // → woo_attribute_terms (defaults kiln-dried)
  "fig_tag_ids": [99],       // JSON array → woo_tags (fig-*, 1+)
  "feat_tag_ids": [42],      // JSON array → woo_tags (feat-*, 0+)
  "price_per_bdft": 12.50,   // from pricing_rules
  "price": 12.00,            // 2 decimals
  "price_source": "recommendation|override|null",
  "title": "string|null",
  "short_title": "string|null",
  "description": "string|null",
  "content_source": "manual|llm|null",
  "client_rev": 1
}
```
Photos come as multipart `files[]` + `meta[]` alongside this JSON (wrapped in a multipart request where one part is the JSON and the others are the files).

### Slab (read model)
All `SlabCreate` fields (resolved) plus:
`status`, `species_confidence`, `woo_product_id`, `published_at`,
`server_rev`, `created_at`, `updated_at`, `photos: [PhotoRead]`,
`inference_status: null|inferring|done|failed`, `inference_error: string|null`.

### PhotoRead
```jsonc
{ "id": "uuid", "kind": "inventory", "role": "topdown|extra",
  "seq": 1, "original_url": "/api/v1/slabs/{id}/photos/{pid}/original",
  "processed_url": "/api/v1/slabs/{id}/photos/{pid}/processed|null" }
```

### InferenceCall1Result (returned by infer-taxon)

Taxonomy fields are Woo IDs from the synced cache. Character/inclusions/voids/checks
are free-text observations; the server maps them to Woo `feat-*` product tags after
the call returns. WooCommerce is the authoritative source for `feat-*` definitions.

```jsonc
{ "species_id": 42, "species_confidence": 0.92,
  "wood_category_ids": [15, 23],
  "edge_type_term_id": 8,
  "figure_term_ids": [3], "figure_confidence": 0.87,
  "grade_term_ids": [7], "grade_confidence": 0.75,
  "character": { "type": "knot", "severity": "minor" },
  "inclusions": { "type": "bark pocket", "severity": "none" },
  "voids": "none",
  "checks": "none",
  "wood_categories": [ { "name": "Live edge", "confidence": 0.95 },
                       { "name": "Bowl blank", "confidence": 0.82 },
                       { "name": "Table slab", "confidence": 0.61 } ] }
```

### InferenceCall2Result (returned by infer-content)
```jsonc
{ "title": "string", "short_title": "string", "description": "string" }
```

### PriceRule
```jsonc
{ "id": "uuid", "species": "string", "price_per_bdft": 12.50,
  "created_at": "timestamp", "updated_at": "timestamp" }
```

### SettingsView (read; secrets masked)
```jsonc
{ "woo_base_url": "https://www.whidbeywoodstore.com",
  "woo_credentials_configured": true,
  "inference_base_url": "http://192.168.1.202:8080/v1",
  "inference_model": "<model>", "inference_enabled": true,
  "content_llm_enabled": false,
  "brand_voice": "...", "geo_context": "...",
  "publish_status": "published",
  "aspect_ratio": "3:4", "output_px": 1600, "output_px_min": 1600,
  "fill_target": 0.80,
  "user_sensitivity": 0.5, "user_edge_offset": 0, "user_feather": 1,
  "user_sheet_mode": "auto" }
```
Secrets (keys) are never returned. Only a `*_configured` boolean.

---

## Endpoints

### Health & meta
- `GET /api/v1/health` → `{ "status":"ok", "version":"...", "woo_reachable": bool }`
- `GET /api/v1/meta` → `{ "version":"...", "templates_configured": bool }`

### Slabs
- `POST /api/v1/slabs` — Create a calibrated draft. Body: multipart with `data` (SlabCreate JSON) + `files[]` (photos) + `meta[]` (photo metadata).
  - Returns `201` `Slab` (status `draft`).
  - Server auto-runs Call 1 **only if** `inference_enabled` is true. `inference_status` becomes `inferring`, then `done`/`failed`.
  - `409 duplicate_sku` if SKU already published.
- `GET /api/v1/slabs` → `200` `[Slab]` (most recent first).
- `GET /api/v1/slabs/{id}` → `200` `Slab` / `404`.
  - Also used as the poll endpoint for inference and publish. Long-running ops set status to `inferring`/`publishing`; client backs off (1s, 2s, 4s, cap 10s).
- `PUT /api/v1/slabs/{id}` — Update draft fields. Body: partial `SlabCreate` (any subset of editable fields + `client_rev`).
  - Server re-runs derived math when inputs change.
  - `409 revision_conflict`, `409 duplicate_sku`.
- `DELETE /api/v1/slabs/{id}` → `204`. Soft: only unpublished drafts. Published slabs cannot be deleted from the app.

### Photo operations
- `POST /api/v1/slabs/{id}/u2net/{pid}` — "Try harder." Server runs U2Net on this one photo, returns a better mask.
  - Returns `202` `{ mask_url: "..." }`. Client uses the mask to re-compute area/widths locally.
  - `404` if photo not found.
- `GET /api/v1/slabs/{id}/photos/{pid}/original` → `image/*` (original, while retained).
- `GET /api/v1/slabs/{id}/photos/{pid}/processed` → `image/*` (processed PNG, while retained).
  - After publish, both → `410 Gone`.

### Inference
- `POST /api/v1/slabs/{id}/infer-taxon` — Trigger or retry Call 1 (vision).
  - Server reads the Call 1 prompt file fresh, uses cached taxonomy + original
    photos downscaled to 1024px + user metadata, and sends to the configured
    vision endpoint.
  - Returns `202` `{ "status": "inferring" }`. Client polls `GET /api/v1/slabs/{id}` for results.
  - Timeout > 45s → `504 gateway_timeout` with error detail.
- `POST /api/v1/slabs/{id}/infer-content` — Trigger Call 2 (text).
  - Server reads the Call 2 prompt file fresh, uses available taxonomy
    (from Call 1 results or manually-entered values) + deterministic numbers
    + brand voice + GEO context, sends to the LLM for prose generation, then
    assembles title/description/short description from deterministic templates
    with the LLM prose injected.
  - Requires that inference was previously tested as connected
    (`test-inference` succeeded at least once). If not connected, returns `422`.
  - Returns `202` `{ "status": "inferring" }`. Client polls for results.
  - Timeout > 45s → `504` with error detail.

### Publish
- `POST /api/v1/slabs/{id}/publish` — Publish to WooCommerce.
  - Pre-conditions: status in `ready`, all required fields set. Else `422 unpublishable`.
  - Dedupe: if SKU already has a published product → `409 duplicate_sku`.
  - Returns `202` `{ "status": "publishing" }`. Client polls.
  - Woo failure → slab `failed`, `sync_log` written, poll returns `502 woo_error`.
  - Success → slab `published`, `woo_product_id` set, images purged, draft row deleted.

### Taxonomy
- `GET /api/v1/admin/taxonomy` → `200` taxonomy grouped by kind:
  ```jsonc
  { "categories": [...], "attributes": [{ name, slug, terms: [...] }],
    "tags": [...] }
  ```
- `POST /api/v1/admin/taxonomy/sync` → `200` `{ "categories": n, "attributes": n, "tags": n, "synced_at": "..." }`.
  - Pulls from Woo, rebuilds the cache. `502 woo_error` on failure; previous cache retained.

### Pricing
- `GET /api/v1/admin/pricing` → `[PriceRule]`
- `POST /api/v1/admin/pricing` → `201` `PriceRule`
- `PUT /api/v1/admin/pricing/{id}` → `200` `PriceRule`
- `DELETE /api/v1/admin/pricing/{id}` → `204`

### Settings
- `GET /api/v1/settings` → `200` `SettingsView`
- `PUT /api/v1/settings` — Update settings. Body: partial `{ key: value }`.
  - Secrets re-encrypted server-side. `200` `SettingsView` returned.
- `POST /api/v1/settings/test-woo` → `200` `{ "ok": bool, "detail": "..." }`
- `POST /api/v1/settings/test-inference` → `200` `{ "ok": bool, "vision_capable": bool, "detail": "..." }`

---

## Request/response examples

### Create a slab (multipart)
```
POST /api/v1/slabs
Content-Type: multipart/form-data; boundary=---

---
Content-Disposition: form-data; name="data"
Content-Type: application/json

{ "id":"9f1c...","sku":"BW-0042","length_in":96.0,"thickness_in":1.5,
  "sqft":0.64,"bdft":0.96,"width_min_in":14.0,"width_max_in":22.0,
  "width_avg_in":18.2,"species_id":42,"wood_category_ids":[15,23],
  "edge_type_term_id":8,"figure_term_ids":[3],"grade_term_ids":[7],
  "thickness_term_id":12,"moisture_term_id":5,"fig_tag_ids":[99],
  "price_per_bdft":12.50,"price":12.00,"price_source":"recommendation",
  "title":null,"short_title":null,"description":null,
  "content_source":null,"client_rev":1 }

---
Content-Disposition: form-data; name="files[]"; filename="topdown.jpg"
Content-Type: image/jpeg

<binary>
---
Content-Disposition: form-data; name="meta[]"
Content-Type: application/json

{ "kind": "inventory", "role": "topdown", "seq": 1 }
---
```
Response: `201`
```json
{ "id":"9f1c...","sku":"BW-0042","status":"draft",
  "inference_status":"inferring","server_rev":1,"photos":[...],... }
```

### Call 1 completes (poll)
```
GET /api/v1/slabs/9f1c...
→ 200 { "status":"draft","inference_status":"done",
         "species_id":42,"species_confidence":0.92,
         "wood_category_ids":[15],"edge_type_term_id":8,
         "figure_term_ids":[3],"grade_term_ids":[7],
         "inference_error":null, ... }
```

### Call 2 (user taps Generate)
```
POST /api/v1/slabs/9f1c.../infer-content
→ 202 { "status":"inferring" }
GET /api/v1/slabs/9f1c...
→ 200 { "title":"Black Walnut 8ft 0in × 18.2in Slab — Cathedral",
         "short_title":"Black Walnut Slab — Cathedral",
         "description":"A one-of-a-one cathedral black walnut slab...",
         "content_source":"llm", ... }
```

### Publish
```
POST /api/v1/slabs/9f1c.../publish
→ 202 { "status":"publishing" }
GET /api/v1/slabs/9f1c...
→ 200 { "status":"published","woo_product_id":1042,"published_at":"..." }
```

### Taxonomy sync
```
POST /api/v1/admin/taxonomy/sync
→ 200 { "categories": 24, "attributes": 5, "tags": 12, "synced_at": "..." }
```

### Test connections
```
POST /api/v1/settings/test-woo
→ 200 { "ok": true, "detail": "Connected to Whidbey Wood Store" }

POST /api/v1/settings/test-inference
→ 200 { "ok": true, "vision_capable": true, "detail": "Model Qwen3.8-27B confirmed" }
```

---

## Versioning
URL is `/api/v1`. Breaking changes bump to `/api/v2`. The PWA pins the version it was built against.

## Out of contract (v1)
- Bulk endpoints, staff/role endpoints, webhook push, analytics.
