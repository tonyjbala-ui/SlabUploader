# Architecture

Status: SPEC · 2026-08-24 · SlabUploader
Companion to: PRD (root), TECH-SPEC-PIPELINE.md, DATA-MODEL.md, OPENAPI.md, DEPLOYMENT.md.

## 1. Service topology (2 containers + 1 reverse proxy)

Per Decision 11 the original Node service is folded into FastAPI. Final v1 topology:

```
                        ┌──────────────────────────────────────────┐
  mobile (PWA)          │              .201 host                    │
 ┌──────────────┐ HTTPS │  ┌─────────┐        ┌──────────────────┐  │
 │  SvelteKit   │───────┼─▶│  Caddy  │───────▶│  frontend (nginx │  │
 │  browser     │       │  │  :443   │  :5173 │  static + /api   │  │
 │  IndexedDB   │       │  │  slab.* │  ─────▶│  proxy)         │  │
 │  camera API  │       │  └─────────┘        └──────────────────┘  │
 └──────────────┘       │                          │ /api → :8000  │
        │  (offline:    │                          ▼               │
         all local)     │                   ┌──────────────────┐   │
                        │                   │  fastapi         │   │
                        │                   │  :8000           │   │
                        │                   │  ┌────────────┐  │   │
                        │                   │  │ pipeline   │  │   │
                        │                   │  │ (determin. │  │   │
                        │                   │  └────────────┘  │   │
                        │                   │  ┌────────────┐  │   │
                        │                   │  │ woo client │  │   │
                        │                   │  └────────────┘  │   │
                        │                   │  ┌────────────┐  │   │
                        │                   │  │ inference  │  │   │
                        │                   │  └────────────┘  │   │
                        │                   └───────┬──────────┘   │
                        │                           │              │
                        │        SQLite + image vols (named volumes)│
                        └──────────────────────────────────────────┘
                                          │ (configurable OpenAI-compat
                                          ▼  vision endpoint, e.g. .202)
```

- **frontend** — SvelteKit (SSG/SPA mode) + Tailwind. Built to static, served by an
  nginx container. Pure client app; talks to `/api` on the same origin. No build-time
  secrets. This is the PWA (SW + IndexedDB).
- **fastapi** — one Python service owning: deterministic image pipeline, bdft math,
  pricing engine, WooCommerce REST client, taxonomy sync, inference wrapper,
  content generation. SQLite + image storage in named volumes.
- **caddy** — reverse proxy + automatic HTTPS. Fronts `frontend` and routes `/api`
  to `fastapi`. No separate Traefik/systemd — compose is the supervisor (Decision 13).

No message broker in v1. Long jobs (normalization, publish) run in-process via a
small background worker (FastAPI `BackgroundTasks` + a lightweight in-process queue,
or `arq` on SQLite/Redis only if needed). See §6.

## 2. Client/server split (authoritative vs hint)

Per TECH-SPEC §1.5: the client runs a *light* pass for instant feedback; the server
runs the *authoritative* pass. Stored and published values are always the server's.

| Capability | Client (hint) | Server (authoritative) |
|---|---|---|
| SKU OCR | Tesseract.js (accept/manual) | re-run; on mismatch surface both, user picks |
| Ruler scale | OpenCV.js quick check | full tick detection + cross-check |
| Widths / bdft | none (needs server geometry) | full pipeline |
| Green removal / crop | preview only | full normalization |
| Species/character | none | inference (vision) + manual |
| Pricing | none | pricing engine |
| Content (title/desc) | none | templates + optional LLM |

The client never publishes. Only the server writes to WooCommerce (FR24/FR27).

## 3. Offline-first PWA (Decision: full offline per PRD)

### 3.1 What lives on the client (IndexedDB)
- **Draft slabs**: full metadata (all review-screen fields) + photo blobs
  (originals). Calibration photos included. IndexedDB object stores:
  `slabs`, `photos` (blob), `syncQueue`.
- **Service Worker**: precache app shell (SvelteKit build). API is *not* cached —
  network-first for API, but the capture flow itself needs no network.

### 3.2 Capture → queue → sync flow
1. Capture is fully offline: photos → IndexedDB, OCR/ruler hints run locally.
2. Draft persists to IndexedDB after every step (no "save" button — always saved).
3. **Upload queue**: when online, the PWA pushes pending drafts (metadata + photo
   blobs) to `POST /api/slabs/{id}/upload`. Server runs the authoritative pipeline,
   returns the enriched draft. Client merges enriched values, marks synced.
4. **Publish** is always an online action (needs Woo). If offline, the slab stays
   `ready`; publish is enabled when connectivity returns.
5. Reconciliation: each draft carries a `client_rev` (monotonic int). Server rejects
   an upload whose `client_rev` < the stored rev for that slab (stale). Conflict
   surfaces in UI for the user to resolve. v1 has a single owner, so conflicts are
   rare; the mechanism is there for correctness.

### 3.3 Connectivity detection
`navigator.onLine` + a lightweight `GET /api/health` probe. UI shows offline banner
and disables publish. No hard dependency on either — capture works regardless.

## 4. Data flow (happy path)

```
[client] capture (offline)
   → OCR SKU (hint) / ruler (hint) / 1–5 photos → IndexedDB draft (rev=1)
[online] PWA → POST /api/slabs            {draft, rev=1}
        POST /api/slabs/{id}/upload       {photo blobs}
[server] authoritative pipeline:
   ruler→scale → geometry → widths → bdft → species/char (inference, opt)
   → pricing → normalization → content (opt LLM)
   → store enriched draft (status=review, rev=2), store original+normalized images
[client] GET /api/slabs/{id} → review screen (all fields editable)
[client] PUT /api/slabs/{id}             {overrides, rev=2}
[client] POST /api/slabs/{id}/publish
[server] taxonomy sync (if needed) → Woo create (draft/pending) → store woo_product_id
   → status=published → purge images (Decision 12)
```

## 5. Determinism boundary

Everything left of the "inference" and "content" boxes is deterministic and unit-
tested (PRD "Deterministic core"). The two inference-touching paths are:
- species/character detection (vision) — toggleable, returns confidence
- optional content refinement (text LLM) — toggleable

Both are wrapped so that toggling them OFF leaves a fully functional deterministic
app. The app must pass its entire test suite with inference disabled.

## 6. Concurrency & jobs

- v1 is single-owner, single-slab workflow (no bulk). Concurrency is minimal.
- Long ops (normalization ~3–5s, publish with image upload) use FastAPI
  `BackgroundTasks` + a per-slab status field (`processing`/`ready`/`publishing`/
  `published`/`failed`). Client polls `GET /api/slabs/{id}` (short, exponential backoff).
- If a job dies, the slab is `failed` with a reason; re-publish is idempotent by
  SKU-dedupe (FR24a) — but v1 has no update path, so a failed publish that already
  created the Woo product is surfaced for manual handling (see IMPL-PLAN risk).
- No external broker (Redis) in v1. If the in-process queue proves insufficient,
  add `arq` + a single Redis container — a documented, reversible extension.

## 7. Security (Decision 10, PRD Security)

- No app-level auth. App is reachable only on the trusted LAN/Tailscale
  (domain `slab.tyubumini.local`). HTTPS enforced by Caddy.
- Secrets (Woo consumer key/secret, inference key, AES master key) stored encrypted
  at rest (AES-GCM) in SQLite; the AES key itself is an env var injected by compose,
  never in the DB. Config is editable via the Settings UI (FR32) but values are
  re-encrypted on save.
- Client stores no persistent secrets. The PWA needs none — all secrets server-side.
- All client↔server traffic HTTPS.

## 8. Deployment target

- Host: **.201** (no inference there; inference is a remote configurable endpoint).
- Stack: Docker Compose (`frontend`, `fastapi`) + Caddy (container or host-managed —
  see DEPLOYMENT.md). Domain: `slab.tyubumini.local` (Decision: LAN/Tailscale only).
- Named volumes: `slab_db` (SQLite), `slab_images` (original+normalized). Backed up
  per DEPLOYMENT.md.

## 9. Extensibility (documented, not built)

- Postgres swap for SQLite (DATA-MODEL keeps the schema portable).
- Redis/arq if job volume grows.
- Update path for existing Woo products (v2; v1 is create-only by SKU dedupe).
- Multi-slab bulk (explicit non-goal v1).
- Staff accounts/roles (explicit non-goal v1).

## 10. Tech stack (pinned intent — exact versions at scaffold)

| Layer | Choice |
|---|---|
| Client | SvelteKit, TailwindCSS, Tesseract.js, OpenCV.js, IndexedDB, Camera API, Workbox/SW |
| Server | Python 3.12, FastAPI, Pydantic v2, OpenCV (cv2), numpy, Pillow, RemBG/U²Net (onnx), httpx |
| Woo | WooCommerce REST v3 via httpx (consumer key/secret, Basic auth) |
| DB | SQLite (stdlib `sqlite3` or SQLAlchemy; see DATA-MODEL) |
| Inference | OpenAI-compatible client (configurable base_url/key/model; must be vision-capable) |
| Proxy/HTTPS | Caddy |
| Packaging | Docker Compose |
