# Implementation Plan

Status: SPEC · Gate A freeze 2026-08-31 · hybrid rewrite complete 2026-09-01 · SlabUploader

Phases 0–6 below are hybrid-aligned. Phase 2 remains a deferred stub only; offline PWA, OCR, ruler, and server happy-path measure/crop as SoT are not implemented.

The build plan a professional (or a fresh Hermes session) executes against. Each phase
has: goal, deliverables, acceptance criteria (testable), and exit gate. Ordering is by
dependency. Definition of done for every phase: code + tests + real
execution output in the PR/commit message + docs updated.

Ground rules (from AGENTS.md):

- Deterministic core is unit-tested before any UI consumes it.
- No feature without a passing test and shown output.
- Inference stays toggleable; the full suite must pass with it disabled.
- One phase = a reviewable, shippable increment.

Test specification: `docs/TEST-SPEC.md` — pyramid cases, phased by gate, affirmative only.

## Gates (human map)

This file is the only place that defines Gate meanings and how they map onto phases. Other docs may name a gate; they must not restate this table.

| Label | Human name | What it means |
|---|---|---|
| Gate A | Docs freeze | Product locks written into the repo |
| Gate B | Run-host setup | Inventory the real host, deploy skeleton (`frontend/` + `backend/` + compose targets) |
| Gate C | First draft listing | One Woo draft listing with inference OFF |

**Phase 0 = Gates A+B.** **Gate C = early Phase 1** claimable publish slice. Call 1/2 after Gate C is green, still inside POC. Phase 2 is a deferred stub; do not build it next after Phase 1.

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
  (accept client numbers + files — store only, no server-side recompute of SoT).
- `deploy/docker-compose.yml`, `Caddyfile.fragment`, `.env.example` (placeholders only).
- Unit tests for TECH-SPEC **TV-1 through TV-10** (esp. TV-3 bdft, TV-6/7 crop/no-upscale,
  TV-8 pricing, TV-10 rounding).
- Fixture photo set for Ty Gate B review.

Phase 0 covers:

- Server happy-path pipeline / CLI that recomputes mask/crop/bdft as SoT: client is authoritative; server stores client-sent numbers only.
- Real U2Net: stub OK; on-demand later. The one-photo server path stays in architecture.
- Woo create/publish and live taxonomy sync: Phase 1. Species offered in UI, pricing seeds, and Call 1 are **exactly** Woo-synced species-category leaves (CONTENT-WOO §2.2 / AGENTS §6 / DATA-MODEL `woo_categories`).
- Inference Call 1/2, LoRA: Phase 5.
- Offline PWA, IndexedDB sync, OCR, ruler: Phase 2 (deferred stub).
- Fake upscale / inventing pixels: undersized source warns and requires retake.

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
- Client sheet + **four knobs inline** on capture (live re-run, mask overlay on
  source photo); user confirm; length axis overlay + confirm. No U2Net control.
- Client sqft / bdft / 6" widths; 3:4 transparent PNG prep per TECH-SPEC.
- Manual SKU, length, thickness; manual taxonomy as needed for one listing.
- Calibrated draft upload: originals + processed PNGs + client-sent numbers. Server
  stores only (OPENAPI POST returns `status: calibrated`).
- Woo **draft** create with SKU prefix `SLAB-UAT-*` on the configured PROD store.
  Honor AGENTS Woo safety: `SLAB-UAT-*` forces draft even if Settings say publish.
- Inference remains OFF for this slice. Full suite still green with inference disabled.

Acceptance:

- Ty captures a real slab on phone (online), adjusts any mask knob and sees a fresh
  overlay without leaving the screen, confirms mask + axis, sees client numbers.
- Species picker offers **only** Woo-synced species (after test-woo / sync).
- One `SLAB-UAT-*` product appears in Woo admin as **draft** with correct SKU/price/images
  enough for Ty to open and inspect.
- No Call 1/Call 2 required. No offline, OCR, ruler, or U2Net path exercised.
- Duplicate SKU → stop with field-level recovery; no second product.

Exit gate: Ty opens one draft listing in Woo admin. Gate C is green.

### Phase 1 remainder (API / settings / taxonomy cache)

Goal: full slab CRUD + photo upload + settings + taxonomy cache read, still hybrid.
No server happy-path math. No `processing` slab status.

Deliverables:

- Routers per OPENAPI: slabs (CRUD + upload + poll), photos (serve), pricing-rules,
  settings (AES-GCM + test stubs), taxonomy (cache read/write + manufactured
  `taxonomy_anchor` / `taxonomy_last_sync_at`).
- Optimistic concurrency (`client_rev` / `server_rev`, 409 paths).
- Status machine only: `draft → calibrated → ready → publishing → published | failed`.
  Job queue only for publish and inference (later). U2Net-on-demand is deferred from POC. Never for measure/crop.
- Integration tests (httpx TestClient): create calibrated → poll → ready (manual fields);
  revision conflict; duplicate SKU; settings encryption round-trip (secret never returned);
  taxonomy anchor bumps on stored-subset change and stays put on no-op sync.

Acceptance:

- OPENAPI.md endpoints implemented; a generated `openapi.yaml` matches the doc.
- Integration tests green; secrets never leak into any GET response (asserted).
- `docker compose up` (backend + a throwaway frontend stub) serves the API.
- PUT stores client-sent derived fields; does not recompute sqft/bdft/widths as SoT.
- Taxonomy: anchor advances only on real stored-subset change; client re-pulls only
  when anchor is newer; `test-woo` always resyncs; publish respects the 1h threshold.

Exit gate: Ty drives the API with curl through a full calibrated → ready cycle (manual).

---

## Phase 2 — Deferred: offline PWA / OCR / ruler (stub only)

**Deferred post-POC.** The online-only MVP does not implement offline capture.

Capture UX for POC lives in early Phase 1 / Gate C (online hybrid). See AGENTS.md §2.

Offline PWA, OCR, and ruler detection are deferred to a later product decision:

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
  results with confidence. **≥ 0.7** (configurable default) → pre-fill mutable
  fields. **< 0.7** → leave empty; inline nudges. Continue/ready is blocked until
  the **full ready set** is filled — not species + wood category + figure alone.
  Canonical lock (AGENTS §7 / DATA-MODEL slabs **ready**): SKU, length, thickness,
  client sqft/bdft/widths, ≥1 inventory PNG, exactly one species, ≥1 wood category,
  1 edge type, ≥1 figure term, ≥1 fig-* tag, ≥1 grade, thickness store band
  (round-up), 1 moisture (default kiln-dried; not inferred), price. feat-* 0+.
  Title/description may be typed, generated, or templated at publish. Presentation:
  `docs/UX.md`. "Generate text" triggers Call 2; never auto.
- Capture: four knobs on the mask screen with live re-run. No U2Net control in POC.
- Publish button (online-only), poll `publishing` → `published` | `failed`, surface
  error detail from sync_log.
- Settings UI: WP username + application password + test-woo, inference endpoint +
  test (vision + portable-context probe), pricing rules editor, brand voice/GEO,
  `woo_create_status`. Store URL read-only from `WOO_BASE_URL`. Sheet/slider prefs
  stay in client localStorage. Prompts are server files, not UI settings.
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

- Woo client (httpx, Basic auth with WP username + application password, timeouts),
  taxonomy sync into cache tables, auto-assign per CONTENT-WOO §2.3 (categories +
  five attributes + fig-*/feat-* tags only). No WooCommerce consumer keys.
- Media upload of processed PNG inventory photos; product create via `woo_create_status`
  (default **draft**). If SKU matches `SLAB-UAT-*`, force Woo **draft** even when
  Settings say publish.
- Dedupe by SKU before create (any Woo status); `409 duplicate_sku` with field recovery
  paths (edit SKU / open existing); no edit-same-SKU path in MVP.
- `422 stale_field` recovery with current options from cache (CONTENT-WOO §2.6).
- `sync_log` with payload_hash; on success set local `published`, purge originals +
  processed images on server.
- `POST /api/v1/admin/taxonomy/sync` against the real store; manufactured anchor.
- Integration tests against a Woo mock (respx) for success + error + duplicate +
  stale-field paths.
- Partial-failure handling (orphaned media noted, per CONTENT-WOO §2.6).

Acceptance:

- Real UAT publish: product appears in store admin as **draft** under `SLAB-UAT-*`,
  correct SKU/price/PNG images/category/tags/attributes; `woo_product_id` stored;
  `sync_log` written with payload_hash.
- Duplicate SKU publish → 409 mapped to SKU field, no second product created.
- Stale taxonomy value → 422 on that field with current options; draft retained.
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
  taxonomy **from the Woo cache only**; confidence threshold **0.7** (configurable
  default; not a POC Settings slider). Auto-run on calibrated create only if
  `inference_enabled`. Not top-down-only.
- Apply AGENTS §6 prefill: ≥ threshold → pre-fill mutable species/categories/attributes/
  tags; < threshold → those fields stay empty. Call 1 is assist only and does not
  define ready. Ready/publish requires the **full ready set** in AGENTS §7 /
  DATA-MODEL (SKU, length, thickness, client sqft/bdft/widths, ≥1 inventory PNG,
  exactly one species, ≥1 wood category, 1 edge type, ≥1 figure term, ≥1 fig-* tag,
  ≥1 grade, thickness store band round-up, 1 moisture default kiln-dried not
  inferred, price; feat-* 0+). Species + wood category + figure is not the gate.
  Presentation: `docs/UX.md`.
- Call 2 (text) proxy: never auto. Portable Call 1 context (full resend default).
  LLM prose only; templates inject deterministic numbers. See `docs/PROMPTS.md`.
- `test-inference` endpoint (vision + portable vs stateful probe). Fail closed if
  neither Call 1→Call 2 path works.
- Feature flags; `inference_log` audit rows; prompt files read fresh each call.
- No numeric/dimension invention by the LLM. LoRA deferred.

Acceptance:

- Local vision model configured: ≥ 0.7 fields pre-fill and remain editable; user
  override sticks.
- Below 0.7: fields stay empty; UI blocks continue/ready until the full AGENTS §7
  / DATA-MODEL ready set is filled (asserted). Species + wood category + figure
  is not the ready definition.
- No doc/code path auto-fills below-threshold guesses or treats inference as a
  publish gate.
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

- E2E capture→publish on iPhone, Android, and PC browsers (desktop Chrome/Edge/Firefox) works (online).
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
| Green-sheet color varies | bad mask, wrong sqft | chroma-key / black threshold + inline knobs + live re-run; retake; U2Net deferred from POC; never drop `output_px_min` below 1600 |
| No vision model available at deploy | species inference off | inference is toggleable; manual species/character fully functional — v1 not blocked |
| Woo partial publish (media up, product POST fails) | orphaned images, confusing state | sync_log + retained images for retry; manual cleanup note; no auto-delete |
| Local vision endpoint not up | inference off | configurable endpoint; deploy-time config; app works without it |
| SQLite contention under concurrent polls | slowdown | single owner, low volume; Postgres path documented |
| Host port/Caddy collision with co-resident apps (e.g. bolt.diy) | deploy conflict | Phase 0/6 inventory worksheet before any port bind |

Ruler detection is **deferred** with offline/OCR (Phase 2 stub). Manual length is
authoritative for POC. Ruler confidence is not a POC risk row.

---

## Definition of Done (v1, project-level)

- All 6 phases exit-gated by Ty (Phase 2 remains deferred stub unless product reopens it).
- Hybrid online acceptance met (measured in Phase 6 UAT). Gates A/B/C meanings match AGENTS §0b.
- `pytest` + integration + UAT green; inference-off path green.
- Deployed on the inventoried host (`APP_HOSTNAME` from `deploy/INVENTORY.md`), HTTPS, backed up, restore tested, runbook + key-rotation verified.
- Repo on gitea-atd (`Ty_Tech/SlabUploader`) is source of truth; docs current.
- `docs/archive/PRD-2026-08.txt` is frozen history only; live docs are the implementation SoT.
