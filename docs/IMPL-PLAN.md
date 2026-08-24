# Implementation Plan

Status: SPEC · 2026-08-24 · SlabUploader
The build plan a professional (or a fresh Hermes session) executes against. Each
phase has: goal, deliverables, acceptance criteria (testable), and exit gate.
Ordering is by dependency — do not skip ahead. Definition of done for EVERY phase:
code + tests + real execution output in the PR/commit message + docs updated.

Ground rules (from AGENTS.md):
- Deterministic core is unit-tested before any UI consumes it.
- No feature without a passing test and shown output.
- Inference stays toggleable; the full suite must pass with it disabled.
- One phase = a reviewable, shippable increment.

---

## Phase 0 — Skeleton & deterministic core (server)
Goal: repo scaffold + the tested deterministic pipeline, no UI, no Woo.

Deliverables:
- `backend/` FastAPI skeleton: app factory, health endpoint, config, logging.
- `pipeline/` implementing TECH-SPEC: constants.py, ruler→scale, geometry, width
  sampler, bdft math, pricing, green-removal, crop/normalize, merch filter.
- `db/`: schema.sql + alembic migration for all tables (DATA-MODEL).
- `tests/`: port every TECH-SPEC test vector (TV-1…TV-9) to pytest; add property
  tests (bdft monotonic in inputs; width sampler returns 3–5 points; crop fill ∈
  [0.75,0.85]).
- Dockerfile for backend; runs `pytest` in CI/local.

Acceptance:
- `pytest` green, covering all 9 TVs + property tests; coverage of `pipeline/` ≥ 95%.
- `GET /api/health` works on the dev container.
- A fixture photo set (3–5 real slab photos) runs end-to-end through the pipeline
  CLI (`python -m app.pipeline.run <dir>`) and prints bdft/widths/normalized outputs
  matching hand-computed expectations.

Exit gate: Ty reviews the pipeline CLI output on real photos; math confirmed.

## Phase 1 — API surface (no Woo, no inference)
Goal: full slab CRUD + photo upload + settings, backed by the Phase-0 core.

Deliverables:
- Routers per OPENAPI: slabs (CRUD + upload + poll), photos (serve), pricing-rules,
  settings (with AES-GCM encryption + test stubs), taxonomy (cache read/write).
- Optimistic concurrency (client_rev/server_rev, 409 paths).
- Status state machine + in-process job queue (processing→ready).
- Integration tests (httpx TestClient): create→upload→poll→ready; revision conflict;
  duplicate SKU; settings encryption round-trip (secret never returned).

Acceptance:
- OPENAPI.md endpoints implemented; a generated `openapi.yaml` matches the doc.
- Integration tests green; secrets never leak into any GET response (asserted).
- `docker compose up` (backend + a throwaway frontend stub) serves the API.

Exit gate: Ty drives the API with curl through a full draft→ready cycle.

## Phase 2 — Frontend: capture & offline PWA
Goal: mobile-first capture flow, fully offline, with the local light pass.

Deliverables:
- SvelteKit + Tailwind app (SPA/SSG), Workbox service worker, IndexedDB stores.
- Capture flow: SKU close-up (Tesseract.js OCR + manual fallback), ruler shot
  (OpenCV.js hint + manual length fallback), 1–5 inventory photos, thickness entry.
- Draft autosave to IndexedDB (rev management), offline banner, upload queue.
- Photo review UI (reorder/delete/retake; mark top-down photo).

Acceptance:
- On a real phone (LAN/Tailscale), the entire capture flow works with airplane mode
  on (photos + OCR + draft persist offline).
- On reconnect, queued draft uploads and the enriched draft merges.
- Lighthouse mobile ≥ 90 on the capture screens; one-hand usable (manual check).
- SW precache verified (reload with network off after first load).

Exit gate: Ty captures a real slab fully offline on his phone; draft survives a
browser restart.

## Phase 3 — Frontend: enrich, review, publish UI
Goal: the enriched review screen and publish action, wired to Phase-1 API.

Deliverables:
- Review screen: all fields editable (dimensions, species/character with confidence
  + manual override, price with recommendation, content with "Refine with AI" toggle,
  normalized photos).
- Species/character inference UI (calls server; shows confidence; manual confirm below
  threshold).
- Publish button (online-only), status polling, success/failure states, error detail.
- Settings UI (FR32): Woo creds + test, inference endpoint + test (vision check),
  pricing rules editor, brand voice/GEO, templates.

Acceptance:
- Full round-trip in browser: capture→upload→review→edit→publish→published (against
  a Woo sandbox/mock in tests; against real store in Phase 6).
- Inference disabled → review screen fully functional with manual species/character.
- Every field is editable and the override persists (asserted in a test).

Exit gate: Ty publishes a test slab to the real store as a **pending** product.

## Phase 4 — WooCommerce integration (real)
Goal: production Woo sync, taxonomy, dedupe, logging (FR24–28).

Deliverables:
- Woo client (httpx, Basic auth, timeouts), taxonomy sync, auto-assign, media upload,
  product create (status=pending default), dedupe, sync_log.
- `POST /api/admin/taxonomy/sync` against the real store.
- Integration tests against a Woo mock (respx) for success + error + duplicate paths.
- Partial-failure handling (orphaned media noted, per CONTENT-WOO §2.6).

Acceptance:
- Real publish: product appears in store admin as pending, correct SKU/price/images/
  category/tags; `woo_product_id` stored; `sync_log` written with payload_hash.
- Duplicate SKU publish → 409, no second product created.
- Woo error (bad creds / 500) → slab `failed` with detail; retry path works.
- All Woo integration tests green (mock + one live smoke).

Exit gate: Ty verifies a real pending product in the store is correct.

## Phase 5 — Inference (vision + optional content)
Goal: scoped, toggleable inference with guardrails.

Deliverables:
- Vision wrapper: species/character detection from the top-down photo via the
  configurable OpenAI-compatible endpoint; returns confidence; logs request/response.
- Content refinement (optional LLM) with the numeric-accuracy guardrail (CONTENT-WOO
  §1.2).
- `test-inference` endpoint (vision capability check).
- All inference code behind feature flags; suite passes with everything OFF.

Acceptance:
- With a local vision model configured: species/character suggestion appears with
  confidence; low confidence → manual confirm required.
- With inference OFF: full app works, tests green (explicit test asserts no network
  calls to the inference endpoint).
- LLM refinement rejects output that alters a measurement (guardrail test).
- Inference payloads stored for audit (asserted present after a call).

Exit gate: Ty runs species detection on 3 real slabs; results acceptable or manually
corrected (that's the design).

## Phase 6 — Deployment, UAT, hardening
Goal: production on .201 + user acceptance tests (PRD deliverable: UATs after prototype).

Deliverables:
- .201 inventory pass (DEPLOYMENT §1) → final compose + Caddyfile.
- Deploy to `slab.tyubumini.local`; backup/restore runbook executed once (restore tested).
- **UAT suite** built from PRD acceptance criteria: a scripted set of real slabs
  (≥3 species, ≥1 cathedral, ≥1 manual-width fallback, ≥1 offline capture, ≥1
  duplicate-SKU attempt) with expected bdft/price/image-fill asserted.
- Performance check: capture OCR 1–2s, server normalization 3–5s per slab (PRD NFR).
- Docs: README, runbook, key-rotation verified.

Acceptance (PRD success metrics, measured):
- E2E capture→publish on iPhone AND Android browsers works.
- Manual length override recalculates widths/sqft/bdft correctly (UAT asserts).
- Normalization: slab ~80% frame in ≥95% of UAT photos.
- Woo product created with normalized images + correct taxonomy.
- Deterministic functions unit-tested; inference calls logged for audit.
- Backup restore demonstrated once.

Exit gate: Ty signs off on UAT results; v1 declared done.

---

## Risks & mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Ruler detection unreliable in field lighting | bad scale → bad widths | manual length is authoritative fallback (always available); ruler confidence surfaced; UAT gates it |
| Green-sheet color varies / U²Net CPU latency > budget | slow/failed normalization | chroma-key primary (fast); U²Net fallback; `output_px` can drop to 1000 min; GPU path documented |
| No vision model available at deploy | species inference off | inference is toggleable; manual species/character fully functional — v1 not blocked |
| Woo partial publish (media up, product POST fails) | orphaned images, confusing state | sync_log + retained images for retry; manual cleanup note; no auto-delete |
| Local llama.cpp vision endpoint not up on .202 | inference off | configurable endpoint; deploy-time config; app works without it |
| SQLite contention under concurrent polls | slowdown | single owner, low volume; Postgres path documented |
| .201 port/Caddy collision with bolt.diy | deploy conflict | Phase-0/6 inventory pass before any port bind |

## Definition of Done (v1, project-level)
- All 6 phases exit-gated by Ty.
- PRD acceptance criteria met (measured in Phase 6 UAT).
- `pytest` + integration + UAT green; inference-off path green.
- Deployed on .201, HTTPS, backed up, restore tested, runbook + key-rotation verified.
- Repo mirrored to Gitea (GitHub canonical); docs current.
