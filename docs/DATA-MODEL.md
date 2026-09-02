# Data Model

Status: SPEC · 2026-08-27 · SlabUploader
Storage: single SQLite file. Schema portable to Postgres.

Conventions:
- IDs: client-generated UUIDv4 for slabs so the SvelteKit client can reference a slab before it exists server-side.
- Timestamps: UTC ISO-8601 TEXT.
- Soft state via status column; no hard deletes for slabs (audit).
- Money: float64 USD, rounded half-up to cents at write.
- All rounded values are what gets stored. No full-precision internal storage.
- Inches stored as 1/8" increments. Sqft/bdft to 2 decimals.
- Multi-select fields stored as JSON arrays of Woo IDs.

---

## slabs

Draft-only. Deleted on successful publish. WooCommerce is the source of truth for product data.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | client-generated UUID |
| `sku` | TEXT UNIQUE NOT NULL | 3-24 [A-Z0-9-] |
| `status` | TEXT NOT NULL | draft \| calibrated \| ready \| publishing \| published \| failed |
| `length_in` | REAL NOT NULL | 1/8" step |
| `thickness_in` | REAL NOT NULL | 1/8" step |
| `sqft` | REAL | 2 decimals |
| `bdft` | REAL | 2 decimals |
| `width_min_in` | REAL | min width at 6" stations, 2 decimals |
| `width_max_in` | REAL | max width at 6" stations, 2 decimals |
| `width_avg_in` | REAL | avg width at 6" stations, 2 decimals |
| `species_id` | INTEGER | → woo_categories (leaf only, 1 required) |
| `wood_category_ids` | INTEGER[] JSON | → woo_categories (leaf, 1+) |
| `edge_type_term_id` | INTEGER | → woo_attribute_terms (1 required) |
| `figure_term_ids` | INTEGER[] JSON | → woo_attribute_terms (1+) |
| `grade_term_ids` | INTEGER[] JSON | → woo_attribute_terms (1+) |
| `thickness_term_id` | INTEGER | → woo_attribute_terms (round-up) |
| `moisture_term_id` | INTEGER | → woo_attribute_terms (1 required, defaults to kiln-dried term; user overrides; not inferred) |
| `fig_tag_ids` | INTEGER[] JSON | → woo_tags (fig-*, 1+) |
| `feat_tag_ids` | INTEGER[] JSON | → woo_tags (feat-*, 0+) |
| `price_per_bdft` | REAL | from pricing_rules for species |
| `price` | REAL NOT NULL | 2 decimals |
| `price_source` | TEXT | 'recommendation' \| 'override' |
| `title` | TEXT | |
| `short_title` | TEXT | |
| `description` | TEXT | |
| `content_source` | TEXT | 'manual' \| 'llm' |
| `client_rev` | INTEGER NOT NULL DEFAULT 1 | |
| `server_rev` | INTEGER NOT NULL DEFAULT 1 | |
| `created_at` | TEXT NOT NULL | |
| `updated_at` | TEXT NOT NULL | |

Indexes: `sku` (unique), `status`, `updated_at`.

### Status state machine

```
draft → calibrated → ready → publishing → published
         │              │                ↑
         └→ failed  ────┴────────────────┘ (woo_product_id in sync_log)
any → failed (with error)
```

1. **draft** — photos taken, no mask confirmed.
2. **calibrated** — BG edge confirmed, length axis confirmed, length/thickness/SKU entered. Client computed sqft/bdft/widths. Draft uploaded to server.
3. **ready** — all mandatory fields populated. Values from Call 1, manual, or mix. Inference is optional. Publishable.
4. **publishing** — Woo create in flight. Poll for result.
5. **published** — Woo product created. This row + all photos deleted. sync_log retained.
6. **failed** — pipeline, inference, or publish error. Error detail stored. Retry available.

---

## slab_photos

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `slab_id` | TEXT FK → slabs.id ON DELETE CASCADE | |
| `kind` | TEXT NOT NULL | 'inventory' |
| `role` | TEXT | 'topdown' \| 'extra' |
| `seq` | INTEGER | display order |
| `original_path` | TEXT | relative to images volume |
| `processed_path` | TEXT | relative to images volume |
| `created_at` | TEXT | |

Rule: only inventory photos. Calibration photos do not exist in this design.

---

## pricing_rules

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK UUID | |
| `species` | TEXT NOT NULL | matches woo_categories.name (leaf) |
| `price_per_bdft` | REAL NOT NULL | flat, no tiers |
| `created_at` | TEXT | |
| `updated_at` | TEXT | |

`UNIQUE(species)`. Seeded from synced Woo categories. User sets price per species.

---

## woo_categories

| Column | Type | Notes |
|---|---|---|
| `woo_id` | INTEGER PK | |
| `name` | TEXT | |
| `slug` | TEXT | |
| `parent_id` | INTEGER | NULL for root |
| `synced_at` | TEXT | |

Only species + wood category. Sync pulls all Woo categories; the app filters to the two we use.

`UNIQUE(woo_id)`.

---

## woo_attributes

| Column | Type | Notes |
|---|---|---|
| `woo_id` | INTEGER PK | |
| `name` | TEXT | |
| `slug` | TEXT | |
| `type` | TEXT | 'select' |
| `synced_at` | TEXT | |

Only the five first-class attributes: Edge Type, Figure, Grade, Thickness, Moisture.

`UNIQUE(woo_id)`.

---

## woo_attribute_terms

| Column | Type | Notes |
|---|---|---|
| `woo_id` | INTEGER PK | |
| `attribute_id` | INTEGER FK → woo_attributes.woo_id | |
| `name` | TEXT | |
| `slug` | TEXT | |
| `synced_at` | TEXT | |

The actual selectable values. E.g., "Cathedral" under Figure, "1\"–1 1/2\"" under Thickness.

`UNIQUE(woo_id)`.

---

## woo_tags

| Column | Type | Notes |
|---|---|---|
| `woo_id` | INTEGER PK | |
| `name` | TEXT | |
| `slug` | TEXT | |
| `synced_at` | TEXT | |

Only `fig-*` and `feat-*` tags. Other Woo tags ignored. WooCommerce is the
authoritative source for tag definitions; this table caches synced Woo tags.

`UNIQUE(woo_id)`.

---

## settings

| Column | Type | Notes |
|---|---|---|
| `key` | TEXT PK | |
| `value_enc` | BLOB | AES-GCM ciphertext |
| `updated_at` | TEXT | |

Keys (server settings; secrets encrypted at rest):
- `woo_wp_username`, `woo_app_password`
  (username + WordPress application password for a dedicated low-priv WP user;
  not WooCommerce consumer keys)
- Store URL is **not** a settings row: `WOO_BASE_URL` env (compose), HTTPS only
- `inference_base_url`, `inference_api_key`, `inference_model`
- `inference_enabled`, `content_llm_enabled`
- `brand_voice`, `geo_context`
- `woo_create_status` ('draft' | 'publish'), default `draft` — Woo product create status key only; safety policy lives in AGENTS.md §5
- `aspect_ratio` ('3:4'), `output_px` (1600), `output_px_min` (1600), `fill_target` (0.80)

Sheet/slider prefs (`sheet_mode`, sensitivity, edge offset, feather) are **not** server
settings keys in POC. Client localStorage is source of truth (AGENTS §4 / ARCHITECTURE §5).
Optional server sync of those prefs is out of scope for POC.

**Prompt files** — not in the settings table. Stored as text files in
`/data/prompts/` (server volume). Read fresh on each invocation. Default
prompts shipped with the app; owner edits directly. A reset-to-default script
restores originals.

This table is the ciphertext **key inventory** and schema only. The never-browser /
AES-GCM / `SLAB_AES_KEY` env policy lives in AGENTS.md §4; flow lives in ARCHITECTURE §5.

AES master key is an env var (`SLAB_AES_KEY`, 32 bytes base64). Never in the DB.
Each `value_enc` = `nonce(12) || ciphertext`.

---

## sync_log

Append-only history. Not deleted on publish.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `slab_id` | TEXT FK | |
| `sku` | TEXT | |
| `woo_product_id` | INTEGER | |
| `status` | TEXT | 'success' \| 'failed' |
| `http_status` | INTEGER | |
| `error` | TEXT | machine-readable code |
| `detail` | TEXT | Woo error body |
| `payload_hash` | TEXT | sha256 of Woo payload sent |
| `created_at` | TEXT | |

---

## inference_log

Append-only audit.

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `slab_id` | TEXT FK | |
| `call` | TEXT | '1' \| '2' |
| `request_payload` | TEXT | JSON of what was sent |
| `response_payload` | TEXT | JSON of what came back |
| `created_at` | TEXT | |
