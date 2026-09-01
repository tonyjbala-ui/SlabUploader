# Implementation Plan

Status: SPEC · Gate A freeze 2026-08-31 · hybrid rewrite complete 2026-09-01 · SlabUploader

Phases 0–6 below are hybrid-aligned. Phase 2 remains a deferred stub only. Do not
implement offline PWA, OCR, ruler, or any server happy-path measure/crop as SoT.

The build plan a professional (or a fresh Hermes session) executes against. Each phase
has: goal, deliverables, acceptance criteria (testable), and exit gate. Ordering is by
dependency. Do not skip ahead. Definition of done for every phase: code + tests + real
execution output in the PR/commit message + docs updated.

Ground rules (from AGENTS.md):

- Deterministic core is unit-tested before any UI consumes it.
- No feature without a passing test and shown output.
- Inference stays toggleable; the full suite must pass with it disabled.
- One phase = a reviewable, shippable increment.

---

## Phase 0 — Hybrid skeleton and client deterministic core (= Gates A+B)

Goal: scaffold the hybrid app and ship a **tested client-authoritative** TECH-SPEC
pipeline (mask → axis → sqft/bdft → 3:4 PNG) plus a minimal FastAPI store/settings
shell. No Woo publish, no inference, no offline/OCR/ruler.

**Gate A (docs):** AGENTS.md + this Phase 0 rewrite + review package locks (signed
2026-08-31). **Gate B (infra/code):** items below.

Scope — in:

- Repo layout: `frontend/` (SvelteKit), `backend/` (FastAPI), `deploy/` stubs; docs stay SoT.
- Client pure modules implementing TECH-SPEC: constants, sheet/chroma/black + sliders,
  mask confirm hooks, length axis, scale, 6" widths, sqft, **bdft = sqft × thickness_in**,
  pricing rec from species $/bdft, 3:4 PNG / 80% fill / ≥1600 guard (**no upscale**).
- FastAPI: app factory, logging, config, `GET /api/health`, SQLite + alembic skeleton,
  settings stub with AES-GCM round-trip (secrets never returned on GET), draft store stub
  (accept client numbers + files — store only, do not recompute SoT).
- `deploy/docker-compose.yml`, `Caddyfile.fragment`, `.env.example` (placeholders only).
- Unit tests for TECH-SPEC **TV-1 through TV-10** (esp. TV-3 bdft, TV-6/7 crop/no-upscale,
  TV-8 pricing, TV-10 rounding).
- Fixture photo set for Ty Gate B review.

Scope — out:

- Server happy-path pipeline / CLI that recomputes mask/crop/bdft as SoT.
- Real U2Net (stub OK; on-demand later).
- Woo create/publish, live taxonomy sync (mock/seed species list OK later).
- Inference Call 1/2, LoRA.
- Offline PWA, IndexedDB sync, OCR, ruler.
- Fake upscale / inventing pixels.

Deliverables:

- `frontend/` scaffold + deterministic modules + unit tests TV-1…TV-10.
- `backend/` FastAPI health + settings encryption + draft persistence stub + schema migration baseline.
- `deploy/` compose + `.env.example` + Caddy fragment.
- Shown output in PR/commit: printed TV-3, TV-6, TV-7 (no-upscale/retake), and TV-10 on **real fixtures**.

Acceptance:

- Gate B: client (or shared pure) tests green for TECH-SPEC vectors; bdft identity holds
  (no `/12`); undersized source warns and refuses fake upscale; rounding matches TV-10.
- `GET https://${APP_HOSTNAME}/api/health` up in compose after `deploy/INVENTORY.md` is filled and Caddy is merged.
- Settings AES round-trip; secret fields never appear in GET.
- Draft can store client-uploaded originals + PNGs + numbers without server recompute.
- Coverage target: deterministic modules ≥ 95% where practical; property checks
  (bdft monotonic in thickness/sqft; fill band; no upscale path).

Exit gate: Ty confirms Gate B math/image prep shown output on real fixtures; health +
encrypted settings + draft store stub demonstrated (curl or thin UI).

**Next:** Gate C = early Phase 1 claimable publish — online hybrid capture + Woo **draft**
+ `SLAB-UAT-*` on the configured store, inference OFF. Call 1/2 after Gate C, still inside POC.

---

## Phase 1 — Gate C claimable path, then full API surface (rewritten)

### Early Phase 1 / Gate C slice (claimable first draft listing)

Goal: one Woo **draft** listing Ty can open in store admin, with inference **OFF**.
Online hybrid capture only. No OCR, ruler, or offline.

Deliverables:

- Online capture of 1–5 inventory photos (no airplane-mode requirement).
- Client sheet/sliders, mask overlay + user confirm, length axis overlay + confirm.
- Client sqft / bdft / 6" widths; 3:4 transparent PNG prep per TECH-SPEC.
- Manual SKU, length, thickness; manual taxonomy as needed for one listing.
- Calibrated draft upload: originals + processed PNGs + client-sent numbers. Server
  stores only (OPENAPI POST returns `status: calibrated`).
- Woo **draft** create with SKU prefix `SLAB-UAT-*` on the configured PROD store.
  Honor AGENTS Woo safety: `SLAB-UAT-*` forces draft even if Settings say publish.
- Inference remains OFF for this slice. Full suite still green with inference disabled.

Acceptance:

- Ty captures a real slab on phone (online), confirms mask + axis, sees client numbers.
- One `SLAB-UAT-*` product appears in Woo admin as **draft** with correct SKU/price/images
  enough for Ty to open and inspect.
- No Call 1/Call 2 required. No offline, OCR, or ruler path exercised.
- Duplicate SKU → stop with error; no second product.

Exit gate: Ty opens one draft listing in Woo admin. Gate C is green.

### Phase 1 remainder (API / settings / taxonomy cache)

Goal: full slab CRUD + photo upload + settings + taxonomy cache read, still hybrid.
No server happy-path math. No `processing` slab status.

Deliverables:

- Routers per OPENAPI: slabs (CRUD + upload + poll), photos (serve), pricing-rules,
  settings (AES-GCM + test stubs), taxonomy (cache read/write).
- Optimistic concurrency (`client_rev` / `server_rev`, 409 paths).
- Status machine only: `draft → calibrated → ready → publishing → published | failed`.
  Job queue only for publish, inference (later), and U2Net-on-demand. Never for measure/crop.
- Integration tests (httpx TestClient): create calibrated → poll → ready (manual fields);
  revision conflict; duplicate SKU; settings encryption round-trip (secret never returned).

Acceptance:

- OPENAPI.md endpoints implemented; a generated `openapi.yaml` matches the doc.
- Integration tests green; secrets never leak into any GET response (asserted).
- `docker compose up` (backend + a throwaway frontend stub) serves the API.
- PUT stores client-sent derived fields; does not recompute sqft/bdft/widths as SoT.

Exit gate: Ty drives the API with curl through a full calibrated → ready cycle (manual).

---

## Phase 2 — Deferred: offline PWA / OCR / ruler (stub only)

**Deferred post-POC.** Do not implement for the online-only MVP.

Capture UX for POC lives in early Phase 1 / Gate C (online hybrid). See AGENTS.md §2.

Out of scope until a later product decision reopens offline:

- Workbox service worker, IndexedDB draft sync, airplane-mode capture
- Tesseract.js OCR for SKU
- OpenCV.js ruler / scale detection

No airplane-mode acceptance. No OCR or ruler exit gate in POC.

---

## Phase 3 — Frontend: enrich, review, publish UI (rewritten)

Goal: online review + publish UI on top of Gate C calibrated drafts. Hybrid only.
Client already owns mask/numbers/PNGs. This phase does not re-measure on the server.

Deliverables:

- Review screen after calibrated upload: all fields editable (length, thickness, SKU,
  widths/sqft/bdft shown as client-computed with manual override paths, species and
  wood categories, five attributes, fig-*/feat-* tags, price with species $/bdft
  recommendation, title/short/description).
- Show client-processed transparent PNGs (and originals while retained). No server
  re-crop UI as SoT.
- Inference UI (only meaningful after Gate C and when `inference_enabled`): Call 1
  results with confidence; manual confirm required below threshold **0.7**
  (configurable). "Generate text" triggers Call 2; never auto.
- Publish button (online-only), poll `publishing` → `published` | `failed`, surface
  error detail from sync_log.
- Settings UI: Woo creds + test, inference endpoint + test (vision check), pricing
  rules editor, brand voice/GEO, `woo_create_status`. Sheet/slider prefs stay in
  client localStorage. Prompts are server files, not UI settings.
- Secrets never appear in GET settings responses (masked `*_configured` only).

Acceptance:

- Browser round-trip: online capture → mask/axis confirm → calibrated upload →
  review → edit → publish → local `published` (Woo mock in tests; real store Phase 6).
- Inference OFF → full manual taxonomy + content path works; no inference network calls.
- Field overrides persist across poll/refresh (asserted).
- No offline/IndexedDB requirement. No OCR/ruler UI.

Exit gate: Ty publishes a test slab to the real store as a **Woo draft** (`SLAB-UAT-*`).
(Gate A lock: not pending/published for UAT.)

---

## Phase 4 — WooCommerce integration (rewritten)

Goal: production Woo sync, taxonomy, dedupe, logging. Browser never calls Woo.
Media bytes are client-processed **PNGs**. Safety policy from AGENTS §5.

Deliverables:

- Woo client (httpx, Basic auth, timeouts), taxonomy sync into cache tables, auto-assign
  per CONTENT-WOO §2.3 (categories + five attributes + fig-*/feat-* tags only).
- Media upload of processed PNG inventory photos; product create via `woo_create_status`
  (default **draft**). If SKU matches `SLAB-UAT-*`, force Woo **draft** even when
  Settings say publish.
- Dedupe by SKU before create; `409 duplicate_sku`; no edit-same-SKU path in MVP.
- `sync_log` with payload_hash; on success set local `published`, purge originals +
  processed images on server.
- `POST /api/admin/taxonomy/sync` against the real store.
- Integration tests against a Woo mock (respx) for success + error + duplicate paths.
- Partial-failure handling (orphaned media noted, per CONTENT-WOO §2.6).

Acceptance:

- Real UAT publish: product appears in store admin as **draft** under `SLAB-UAT-*`,
  correct SKU/price/PNG images/category/tags/attributes; `woo_product_id` stored;
  `sync_log` written with payload_hash.
- Duplicate SKU publish → 409, no second product created.
- Woo error (bad creds / 500) → slab `failed` with detail; retry path works.
- All Woo integration tests green (mock + one live smoke).

Exit gate: Ty verifies a real **Woo draft** `SLAB-UAT-*` product in the store is correct.

---

## Phase 5 — Inference (vision + optional content) (rewritten)

Goal: scoped, toggleable inference **after Gate C is green**, still inside POC.
Does not gate publish. Full suite must pass with inference OFF.

Deliverables:

- Call 1 (vision) proxy: **all inventory photos** downscaled to 1024 + Woo taxonomy
  snapshot + user metadata; OpenAI-compatible endpoint; model constrained to cached
  taxonomy; confidence threshold **0.7** (configurable; relocate from older PRD FR22a).
  Auto-run on calibrated create only if `inference_enabled`. Not top-down-only.
- Call 2 (text) proxy: never auto. User taps Generate text. LLM prose only; templates
  inject deterministic numbers. See `docs/PROMPTS.md`.
- `test-inference` endpoint (vision capability check) before Call 2 is allowed.
- Feature flags; `inference_log` audit rows; prompt files read fresh each call.
- No numeric/dimension invention by the LLM. LoRA deferred.

Acceptance:

- Local vision model configured: taxonomy suggestions appear with confidence; below
  0.7 → manual confirm required.
- Inference OFF: app works end-to-end; tests assert zero calls to the inference endpoint.
- Audit payloads present after a call; prompt file edits apply without server restart.
- Gate C path remains green with inference OFF.

Exit gate: Ty runs species detection on 3 real slabs; results acceptable or manually
corrected (that is the design).

---

## Phase 6 — Deployment, UAT, hardening (rewritten, online only)

Goal: production deploy on the **inventoried** host + online user acceptance tests.

Deliverables:

- Host inventory pass: complete `deploy/INVENTORY.md` per DEPLOYMENT §1 → final compose + Caddyfile.
- Deploy to `https://${APP_HOSTNAME}` from inventory; backup/restore runbook executed once (restore tested).
- **UAT suite** for the hybrid online path: scripted real slabs (≥3 species, ≥1 cathedral,
  ≥1 manual-width path, ≥1 duplicate-SKU attempt) with expected bdft/price/image-fill
  asserted. **No** offline capture, OCR, or ruler cases in POC UAT.
- Performance: client measure/crop budgets on device; optional U2Net-on-demand latency.
  No server happy-path “normalization 3–5s” budget. No OCR 1–2s budget.
- Docs: README, runbook, key-rotation verified.

Acceptance (measured):

- E2E capture→publish on iPhone and Android browsers works (online).
- Manual length override recalculates widths/sqft/bdft correctly (UAT asserts).
- Client crop: slab ~80% frame in ≥95% of UAT photos; shorter side ≥1600 when source allows.
- Woo product created with processed PNG images + correct taxonomy.
- Deterministic functions unit-tested; inference calls logged for audit when used.
- Backup restore demonstrated once.

Exit gate: Ty signs off on UAT results; v1 declared done.

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Green-sheet color varies / U2Net CPU latency high | slow or failed “Try harder” | chroma-key / black threshold primary on client; U2Net on demand only; never drop `output_px_min` below 1600 (undersized → retake) |
| No vision model available at deploy | species inference off | inference is toggleable; manual species/character fully functional — v1 not blocked |
| Woo partial publish (media up, product POST fails) | orphaned images, confusing state | sync_log + retained images for retry; manual cleanup note; no auto-delete |
| Local vision endpoint not up | inference off | configurable endpoint; deploy-time config; app works without it |
| SQLite contention under concurrent polls | slowdown | single owner, low volume; Postgres path documented |
| Host port/Caddy collision with co-resident apps (e.g. bolt.diy) | deploy conflict | Phase 0/6 inventory worksheet before any port bind |

Ruler detection is **deferred** with offline/OCR (Phase 2 stub). Manual length is
authoritative for POC. Do not treat ruler confidence as a POC risk row.

---

## Definition of Done (v1, project-level)

- All 6 phases exit-gated by Ty (Phase 2 remains deferred stub unless product reopens it).
- Hybrid online acceptance met (measured in Phase 6 UAT). Gates A/B/C meanings match AGENTS §0b.
- `pytest` + integration + UAT green; inference-off path green.
- Deployed on the inventoried host (`APP_HOSTNAME` from `deploy/INVENTORY.md`), HTTPS, backed up, restore tested, runbook + key-rotation verified.
- Repo on gitea-atd (`Ty_Tech/SlabUploader`) is source of truth; docs current.
- Do not treat `docs/archive/PRD-2026-08.txt` as implementation SoT.
