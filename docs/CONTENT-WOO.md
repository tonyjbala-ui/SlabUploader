# Content Generation & WooCommerce Integration

Status: SPEC · 2026-08-24 · SlabUploader
Covers: FR16 (deterministic content templates + optional LLM refinement), FR17
(brand voice / GEO), FR18 (editable, never auto-published), FR25–28 (taxonomy sync,
product create, sync log), and the exact WooCommerce REST v3 payload.

## 1. Content generation (FR16–18)

### 1.1 Deterministic templates (always on)
Templates are configured in Settings (`content_templates`, editable per FR32).
Defaults below. Placeholders use `{field}`.

**title** (default):
```
{species} {length_ft}ft {length_in_remainder}in × {width_avg_in}in Wood Slab — {character}
```
Example: `Black Walnut 16ft 0in × 18.2in Wood Slab — Cathedral`
- `length_ft` = floor(length_in / 12), `length_in_remainder` = length_in mod 12 (1 dp).

**short_title** (default):
```
{species} Slab — {character}
```
Example: `Black Walnut Slab — Cathedral`

**description** (default, multi-paragraph):
```
A one-of-a-one {character} {species} slab, {length_ft}ft {length_in_remainder}in long with an
average width of {width_avg_in}in and {thickness_in}in thickness ({bdft} bdft).

Each slab is naturally shaped — width varies along the length at {width_min_in}in to
{width_max_in}in. Sold by the slab; dimensions as measured. {geo_sentence}
```
`geo_sentence` = GEO context sentence from Settings (FR17), e.g.
`"Locally milled and shipped from the Pacific Northwest."` (default if unset: none).

All template math fields come from the deterministic pipeline (never from the LLM).

### 1.2 Call 2 content generation (toggleable)
- Triggered only if `content_llm_enabled` is true AND the user taps "Generate text"
  on the review screen (never automatic).
- **LLM writes prose only**: the prompt sends the slab's deterministic measurements
  as facts, and asks the model to write compelling product description prose
  (character, color, warmth, grain, use cases). Dimensions are never generated
  by the LLM — they are injected by deterministic templates.
- **Template assembly**: after the LLM returns, the server assembles the final
  title, short description, and full description from deterministic templates
  with the LLM prose injected into the description.
- No numeric guardrail needed — dimensions never pass through the LLM.
- Output is always editable (FR18); `content_source` = `llm` when used.
- If the inference endpoint is text-only or unreachable → the button is disabled,
  templates still work. No failure mode blocks publish.

### 1.3 Audit
Every content generation (template or LLM) is logged with inputs (template version,
slab facts), the LLM request/response payload when used (PRD "inference calls logged"),
and the final stored content.

## 2. WooCommerce integration (FR24–28)

### 2.1 Auth & client
- REST v3: `GET/POST/PATCH/DELETE {woo_base_url}/wp-json/wc/v3/…`
- Basic auth: `woo_consumer_key:woo_consumer_secret` (Decision 10; the "username" is
  the consumer key, the "app password" is the consumer secret).
- Client: `httpx` with timeouts (connect 10s, read 60s for image-heavy create).
- `woo_base_url` default: `https://www.whidbeywoodstore.com`.

### 2.2 Taxonomy sync (FR25)
`POST /api/admin/taxonomy/sync` pulls, in order:
1. `GET /products/categories?per_page=100` (paginate) → `woo_taxonomy(kind=category)`
2. `GET /products/tags?per_page=100` → `kind=tag`
3. `GET /products/attributes` → `kind=attribute`
Rebuilds the cache table (delete + insert, single transaction). Returns counts.
Failure → `502 woo_error`; previous cache retained (never delete-then-fail).

### 2.3 Auto-assign taxonomy (FR26)
- **Categories**: species leaf category (1 required) plus wood-category leaf ids (1+).
  Match by name against the synced Woo category cache (case-insensitive, trimmed).
  No match → user override in review, or empty (Woo required-field validation surfaces it).
- **Tags**: `fig-*` only for figure tags (1+ required) and `feat-*` only for feature tags
  (0+). Call 1 free-text observations (character / inclusions / voids / checks) map to
  existing Woo `feat-*` tags. Do not invent generic character or species product tags.
  WooCommerce is authoritative for tag definitions.
- **Attributes**: the five locked Woo attributes only — Edge Type, Figure, Grade,
  Thickness, Moisture — using term ids from the cache. Do not publish species, character,
  length, or free-text thickness as product attributes. Missing attributes are skipped,
  not created (v1: no attribute creation).
- Every assignment is overridable in the review screen (FR26).

### 2.4 Product create payload (FR27)
`POST /products` — body (only non-null fields sent):
```jsonc
{
  "name": "{title}",
  "type": "simple",
  "status": "{woo_create_status}", // draft | publish; default draft; SLAB-UAT-* forced draft
  "sku": "{sku}",
  "regular_price": "{price}",     // 2 dp string, e.g. "2730.00"
  "description": "{description}",
  "short_description": "{short_title}",
  "categories": [ { "id": <species category id> } ],
  "tags": [ { "id": <fig-* tag id> }, { "id": <feat-* tag id> }, … ],
  "images": [
    { "src": "<data URL or pre-uploaded attachment URL>", "alt": "{species} {character} slab" }
  ],
  "attributes": [ … if present … ],
  "virtual": false,
  "downloadable": false,
  "catalog_visibility": "visible"
}
```
**Image upload strategy** (Woo v3): `images[].src` accepts a URL or a data URL.
For reliability the server:
1. For each customer-facing inventory photo in `seq` order (processed transparent PNGs
   from the client TECH-SPEC path): `POST /media` with the **PNG bytes** → get attachment
   `source_url`. Woo accepts `image/*`; keep alpha. Do not re-encode to JPEG and drop alpha.
2. Reference those `source_url` values in `images` (≤5 inventory photos).
3. Only `kind=inventory` photos. Calibration photos do not exist in this design.

**Status** comes from Settings key **`woo_create_status`** (`draft` | `publish`, default
**`draft`**). Woo **safety policy** (UAT draft default, `SLAB-UAT-*` force draft even when
Settings say publish, no edit-same-SKU, purge originals + processed images after successful
publish) is owned by **AGENTS.md §5**. This file owns payload shape and publish sequence
only. Do not diverge from AGENTS on force-draft. Do not conflate Woo create status with
slab lifecycle status `published` (means Woo create succeeded locally).

### 2.5 Dedupe & idempotency (FR24a)
Before create: `GET /products?sku={sku}`.
- Found → `409 duplicate_sku` (v1 has no update path; human resolves).
- Not found → proceed. (Single-owner, slab-by-slab, so no TOCTOU concern in practice;
  the check is still done for correctness.)

### 2.6 Sync result & logging (FR28)
- On success: set `slabs.woo_product_id`, `status=published`, `published_at`, write
  `sync_log(status=success, woo_product_id, payload_hash)`.
- On Woo HTTP error: `status=failed`, `sync_log(status=failed, http_status, error,
  detail=<Woo error body>)`. Surface in UI + poll response.
- **Partial-failure note** (risk, see IMPL-PLAN): if media uploads succeed but the
  final product POST fails, orphaned Woo attachments may exist. v1: log it; a manual
  cleanup note is surfaced. Not auto-deleted (could delete a real image).

## 3. End-to-end publish sequence (server side)
```
1. validate slab publishable (length,width,thickness,price,species,char,≥1 photo)
2. dedupe by SKU (GET /products?sku=)            → 409 duplicate_sku if exists
3. (re)sync taxonomy if cache older than 1h       → best-effort; use existing cache on fail
4. resolve category/tags/attributes (auto-assign + overrides)
5. upload processed PNG inventory images → media  → source_urls
6. POST /products (status per AGENTS §5 + woo_create_status) → woo_product_id
7. write sync_log(success), set slab published, purge originals + processed images
   on any failure at 2–6: write sync_log(failed), slab=failed, (images retained for retry)
```

## 4. What is deterministic vs scoped-inference here
- Deterministic: templates, all dimension text, category/tag/attribute resolution,
  payload assembly, dedupe, logging, title assembly.
- Scoped inference: optional LLM prose generation for description only. The LLM
  never touches dimensions.
