# Listing copy and the store

How titles and descriptions are built, how we talk to WooCommerce, and the exact create payload. Templates always run. Generate text is optional and never publishes on its own.

## 1. Titles and descriptions

### 1.1 Templates (always on)
Templates live in Settings. Defaults below. Placeholders use `{field}`.

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
`geo_sentence` is the geography sentence from Settings, e.g.
`"Locally milled and shipped from the Pacific Northwest."` (default if unset: none).

All template math fields come from the deterministic pipeline (never from the LLM).

### 1.2 Generate text (optional)
The mill owner taps Generate text on review. It never runs by itself. It is off unless `content_llm_enabled` is true.

The model writes prose only (character, color, grain, uses). Measured length, width, thickness, square feet, and board feet are facts in the prompt. The model does not invent numbers. Templates inject those numbers into the title and description after the prose comes back.

The mill owner can always edit the result. `content_source` is `llm` when this path ran.

If the text endpoint is missing or down, disable the button. Templates still work. Publish is never blocked because Generate text failed.

### 1.3 Audit
Every content generation (template or LLM) is logged with inputs (template version,
slab facts), the LLM request/response payload when used (inference calls logged for audit),
and the final stored content.

## 2. WooCommerce

### 2.1 Auth & client
- REST v3 surface unchanged: `GET/POST/PATCH/DELETE {WOO_BASE_URL}/wp-json/wc/v3/…`
- Auth is **WordPress Application Passwords**, not WooCommerce consumer keys
  (`ck_`/`cs_`) and not the user's login password.
- Create a **dedicated low-privilege WordPress user** (shop manager, or a custom
  role with product create/edit + media upload). A dedicated low-privilege user, not the admin account, is used.
- Generate the application password under **Users → Profile → Application
  Passwords**. WordPress requires **HTTPS** for that UI; the store must already
  be on TLS (Caddy enforces HTTPS on the app side too).
- Basic auth shape: `woo_wp_username:woo_app_password` (username + application
  password). Spaces in the generated password are ignored by WordPress; store
  the value as entered.
- FastAPI is the sole Woo caller. Credentials live encrypted at rest in SQLite
  (AES-GCM, `SLAB_AES_KEY` env). The browser never holds them.
- Rotation: revoke the application password in the WP user profile, enter a new
  one in Settings UI, then `POST /api/v1/settings/test-woo`.
- Client: `httpx` with timeouts (connect 10s, read 60s for image-heavy create).
- Store URL is **`WOO_BASE_URL`** from Docker Compose / host `.env` (HTTPS only).
  FastAPI refuses `http://` at startup. Not a Settings field; UI shows it read-only.

### 2.2 Store lists (species, tags, attributes)
`POST /api/v1/admin/taxonomy/sync` pulls, in order:
1. `GET /products/categories?per_page=100` (paginate) → species + wood-category leaves
2. `GET /products/tags?per_page=100` → `fig-*` / `feat-*` only (other tags ignored)
3. `GET /products/attributes` (+ terms) → five locked attributes

Rebuilds cache tables in one transaction. Failure → `502 woo_error`; previous
cache retained (never delete-then-fail).

**Manufactured stamps.** Woo REST has **no** usable last-modified on categories,
attributes, or tags. FastAPI persists `taxonomy_last_sync_at` (every successful
pull) and `taxonomy_anchor` (bump only when stored-subset hash changes, including
deletions). Client re-pulls the full taxonomy iff the anchor advanced. No Woo-side
taxonomy timestamp; no per-navigation sync.

**Triggers:** (1) successful `test-woo` **always** resyncs; (2) publish if
`now - taxonomy_last_sync_at > 1 hour` then reconcile (bump only on real change);
(3) optional app launch / Settings refresh. If a picked id vanished after a refresh, show that field as no longer valid. The selection is not silently swapped.

**Species exclusivity.** UI pickers, pricing seeds, and Call 1 species lists are
**exactly** the synced species-category leaves. No hardcoded, invented, or fallback
species set. A species new in Woo is selectable only after the next sync stores it.

### 2.3 What goes on the listing

When vision is on and it is at least 0.7 sure, it fills species, wood categories,
edge, figure, grade, and feature tags (character, inclusions, voids, checks map
to existing `feat-*` tags only). The mill owner can change every filled value.
Typed values always win.

If it is less sure, those fields stay empty. That empty-start subset is not
the submit list. Review will not continue until the full ready set is filled:
SKU, length, thickness, price, species, wood category, edge type, figure,
grade, thickness band, moisture, fig-* tags, and inventory PNG(s). Species
plus one figure is not enough. Presentation: `docs/UX.md`.
Low-confidence guesses are not filled.

Names from vision or from typing match store ids case-insensitive, trimmed. No
match leaves the field empty so they can pick from the list. The store will still
reject a missing required field at publish.


Field rules:
- **Categories**: species leaf (1 required) plus wood-category leaf ids (1+).
- **Tags**: `fig-*` (1+ required) and `feat-*` (0+). Only documented
  character or species product tags are used. Woo is authoritative for tag definitions.
- **Attributes**: the five locked Woo attributes only — Edge Type, Figure, Grade,
  Thickness, Moisture — using term ids from the cache. Species,
  character, length, or free-text thickness as product attributes. Missing
  attributes are skipped, not created (v1: no attribute creation).

Vision only suggests. It never blocks publish. With vision off, everything is typed.

### 2.4 Create payload
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
   `source_url`. Woo accepts `image/*`; keep alpha. JPEG re-encoding drops alpha and must not happen.
2. Reference those `source_url` values in `images` (≤5 inventory photos).
3. Only `kind=inventory` photos. Calibration photos do not exist in this design.

**Status** comes from Settings `woo_create_status` (`draft` or `publish`, default
`draft`). Practice SKUs `SLAB-UAT-*` are always created as drafts, even if Settings
say publish. Existing SKUs are not edited in this version. After a successful create,
the server deletes the original and processed photos. A slab marked published in the
app means the store create succeeded. That is not the same as WooCommerce "publish."
The force-draft rule is in `AGENTS.md`. This file only owns the payload and the steps.

### 2.5 Duplicate SKU
Before create: `GET /products?sku={sku}` (any store status).
- Found: stop. The phone shows the SKU field with Edit SKU and Open existing listing. This version does not update the other product.
- Not found: create. Still do the check every time.

### 2.6 After a failed publish

The mill owner sees a message on the field, not a status number or a stack. The form stays on the phone. The server marks the slab failed so they can try again.

If the SKU already exists: under SKU, "This SKU already exists in the store (any status)." Edit SKU, or open the existing listing (admin link when we have it).

If a category, attribute, or price is no longer valid: under that field, "This value is no longer valid. Pick from the current list," with the current store options.

The server still writes `sync_log`. Success still sets `woo_product_id`, marks published locally, and deletes photos.

- **Partial-failure note** (risk, see IMPL-PLAN): if media uploads succeed but the
  final product POST fails, orphaned Woo attachments may exist. v1: log it; surface
  a manual cleanup note. Not auto-deleted.

## 3. End-to-end publish sequence (server side)
```
1. check the listing against the shared rules (current copy of the rules on submit)
2. look up the SKU in the store (any status). Stop if it already exists.
3. refresh store lists if the last successful pull is older than 1 hour. Only bump the client list-version if something actually changed.
4. resolve categories, tags, and attributes from the synced lists (vision names or typed names)
5. upload processed PNG inventory photos to media, keep the URLs
6. POST /products with draft/publish per Settings, always draft for SLAB-UAT-* SKUs
7. on success: log, mark published locally, delete originals and processed photos
   on failure: log, mark failed, keep photos, put the error on the field (§2.6)
```

## 4. What the model may and may not do

Templates, numbers, matching names to store ids, payload, dedupe, logging: code.
Generate text may write description prose only. It must not invent dimensions. It may only pick species and attributes that exist in the synced store lists.

Presentation: `docs/UX.md`. The wire uses `{ field, code, message, actions[] }`. The mill owner never sees those codes. If the phone's copy of the rules is stale, refresh the copy and retry. That is not a duplicate-SKU conflict.
