# Data Model (SQLite, v1)

Status: SPEC · 2026-08-24 · SlabUploader
Storage: single SQLite file (volume `slab_db`). Schema kept portable to Postgres
(DATETIME→TIMESTAMPTZ, TEXT blobs→bytea/objects). All math values stored full
precision (float64); display rounding is a presentation concern (TECH-SPEC §2).

## Conventions
- IDs: `TEXT` UUIDv4 (client-generated for slabs so the PWA can reference a slab
  before it exists server-side).
- Timestamps: UTC ISO-8601 `TEXT` (`YYYY-MM-DDTHH:MM:SSZ`).
- Soft state via `status` column; no hard deletes for slabs (audit). Images purged
  on publish (Decision 12) but the slab row + metadata retained.
- Money stored as float64 USD, rounded half-up to cents at write (TECH-SPEC §2).
- `client_rev` / `server_rev`: monotonic ints for optimistic concurrency (ARCH §3.2).

## ERD (text)
```
slabs 1─N slab_photos
slabs 1─0..1 sync_log (latest)   [sync_log is an append-only history; 1 per publish attempt]
pricing_rules  N─1 (species, character)  [unique pair]
woo_taxonomy (cache)  categories / tags / attributes
settings 1 row (key→encrypted value)
```

## Tables

### slabs
| col | type | notes |
|---|---|---|
| id | TEXT PK | client-generated UUID |
| sku | TEXT UNIQUE NOT NULL | from OCR or manual; dedupe key (FR24a) |
| status | TEXT NOT NULL | `draft` `processing` `ready` `review` `publishing` `published` `failed` |
| species | TEXT | controlled value (from woo_taxonomy categories) or free until confirmed |
| species_confidence | REAL NULL | from inference, if used |
| species_source | TEXT | `inference` `manual` |
| character | TEXT | controlled value |
| character_confidence | REAL NULL | |
| character_source | TEXT | `inference` `manual` |
| length_in | REAL NOT NULL | authoritative (ruler-derived or manual) |
| length_source | TEXT | `ruler` `manual` |
| width_avg_in | REAL | average of sampled widths (TECH-SPEC §5.2) |
| width_source | TEXT | `sampled` `manual` |
| thickness_in | REAL NOT NULL | always manual (FR8) |
| sqft | REAL | (L×w_avg)/144 |
| bdft | REAL | (L×w_avg×t)/12 (Decision 18) |
| price_per_bdft | REAL NULL | copied from pricing rule at compute time (snapshot) |
| price | REAL NOT NULL | final authoritative price (override or recommendation) |
| price_source | TEXT | `recommendation` `override` |
| title | TEXT | generated/edited |
| short_title | TEXT | |
| description | TEXT | |
| content_source | TEXT | `template` `llm` `manual` |
| normalized_fill_ok | INTEGER | 0/1 — met ~80% fill target (TECH-SPEC TV-6) |
| woo_product_id | INTEGER NULL | set on successful publish (FR28) |
| published_at | TEXT NULL | |
| client_rev | INTEGER NOT NULL DEFAULT 1 | |
| server_rev | INTEGER NOT NULL DEFAULT 1 | |
| created_at | TEXT NOT NULL | |
| updated_at | TEXT NOT NULL | |

Index: `sku` (unique), `status`, `updated_at`.

### slab_photos
| col | type | notes |
|---|---|---|
| id | TEXT PK | |
| slab_id | TEXT FK→slabs.id ON DELETE CASCADE | |
| kind | TEXT NOT NULL | `calibration_sku` `calibration_ruler` `inventory` |
| role | TEXT | for inventory: `topdown` (the width-sampling photo) or `extra` |
| seq | INTEGER | display order (FR23 reorder) |
| original_path | TEXT | relative to images volume |
| normalized_path | TEXT NULL | set after normalization |
| is_customer_facing | INTEGER | calibration=0, inventory=1 (FR2: calibration never uploaded) |
| created_at | TEXT | |

Rule: only `kind=inventory` photos are uploaded to WooCommerce. Calibration photos
are internal-only (FR2).

### pricing_rules
| col | type | notes |
|---|---|---|
| id | TEXT PK | uuid (PRD pricing schema) |
| species | TEXT NOT NULL | |
| character | TEXT NOT NULL | |
| price_per_bdft | REAL NOT NULL | flat (Decision 5; no tiers) |
| created_at | TEXT | |
| updated_at | TEXT | |

`UNIQUE (species, character)`. Seeded from synced Woo categories (Decision 4);
user sets `price_per_bdft` per value in Settings (FR13).

### woo_taxonomy (cache)
| col | type | notes |
|---|---|---|
| kind | TEXT | `category` `tag` `attribute` |
| woo_id | INTEGER | Woo term id |
| name | TEXT | |
| parent_id | INTEGER NULL | categories |
| slug | TEXT | |
| synced_at | TEXT | |

`UNIQUE (kind, woo_id)`. Rebuilt by `POST /api/admin/taxonomy/sync` (FR25). This is
the controlled list for species (Decision 4 — species drawn from categories) and
the taxonomy auto-assign source (FR26).

### sync_log (append-only history)
| col | type | notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| slab_id | TEXT FK | |
| attempt | INTEGER | 1,2,… per slab |
| action | TEXT | `create` |
| woo_product_id | INTEGER NULL | |
| status | TEXT | `success` `failed` `blocked_duplicate_sku` |
| http_status | INTEGER NULL | |
| error | TEXT NULL | machine-readable code |
| detail | TEXT NULL | human-readable message / Woo error body |
| payload_hash | TEXT | sha256 of the Woo product payload sent (audit, FR28) |
| created_at | TEXT | |

FR28: log sync results, surface errors, store Woo product ID on success.

### settings (key/value, encrypted values)
| col | type | notes |
|---|---|---|
| key | TEXT PK | |
| value_enc | BLOB | AES-GCM ciphertext (see Security) |
| updated_at | TEXT | |

Keys:
- `woo_base_url` (plaintext-OK, but encrypted for uniformity)
- `woo_consumer_key`, `woo_consumer_secret` (secret)
- `inference_base_url`, `inference_api_key` (secret), `inference_model`
- `inference_enabled` (bool), `content_llm_enabled` (bool)
- `brand_voice` (text), `geo_context` (text)
- `content_templates` (JSON: title/short_title/description templates, FR16)
- `aspect_ratio` = `1:1`, `output_px` = 1600, `output_px_min` = 1000 (Decision 20)
- `fill_target` = 0.80

The AES-GCM master key is an env var (`SLAB_AES_KEY`, 32 bytes base64) injected by
compose — never stored in the DB. Each `value_enc` = `nonce(12) || ciphertext`.

## Status state machine
```
draft → processing → ready → review → publishing → published
                     │                                ↑ (woo_product_id set)
                     └→ failed (retry → publishing)
any → failed (with error)
```
- `processing`: server pipeline running.
- `ready`: enriched, awaiting user review.
- `review`: user has opened/edited the review screen.
- `publishing`: Woo create in flight.
- `published`: Woo product created (draft/pending on the store — never live without
  human action, per test-target decision).
- `failed`: pipeline or publish error; `sync_log.detail` has the reason.

## Concurrency
- Single owner. Optimistic locking via `server_rev`: an update must send the `server_rev`
  it last read; server rejects on mismatch (409) → client re-fetches. This is the
  server-side counterpart to the client `client_rev` (ARCH §3.2).

## Backup
- SQLite file + images volume are the only durable state. Backup = `sqlite3 .backup`
  of the DB file (WAL-safe) + `tar` of the images volume. See DEPLOYMENT.md.
