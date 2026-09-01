# Implementation Plan

Status: SPEC · Gate A freeze 2026-08-31 · SlabUploader
Phase 0 rewritten for hybrid topology (client-authoritative TECH-SPEC). Phases 1+ still contain stale offline/OCR/ruler/pending language — do not implement those lines; follow AGENTS.md.
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

## Phase 0 — Hybrid skeleton & client deterministic core (= Gates A+B)

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
- Unit tests for TECH-SPEC **TV-1…TV-9** (esp. TV-3 bdft, TV-6/7 crop/no-upscale, TV-8 pricing).
- Fixture photo set for Ty Gate B review.

Scope — out:
- Server happy-path pipeline / CLI that recomputes mask/crop/bdft as SoT.
- Real U2Net (stub OK; on-demand later).
- Woo create/publish, live taxonomy sync (mock/seed species list OK later).
- Inference Call 1/2, LoRA.
- Offline PWA, IndexedDB sync, OCR, ruler.
- Fake upscale / inventing pixels.

Deliverables:
- `frontend/` scaffold + deterministic modules + unit tests TV-1…TV-9.
- `backend/` FastAPI health + settings encryption + draft persistence stub + schema migration baseline.
- `deploy/` compose + `.env.example` + Caddy fragment.
- Shown output in PR/commit: printed TV-3, TV-6, and TV-7 (no-upscale/retake) on **real fixtures**.

Acceptance:
- Gate B: client (or shared pure) tests green for TECH-SPEC vectors; bdft identity holds
  (no `/12`); undersized source warns and refuses fake upscale.
- `GET /api/health` up in compose over HTTPS hostname after `.201` inventory + Caddy merge.
- Settings AES round-trip; secret fields never appear in GET.
- Draft can store client-uploaded originals + PNGs + numbers without server recompute.
- Coverage target: deterministic modules ≥ 95% where practical; property checks
  (bdft monotonic in thickness/sqft; fill band; no upscale path).

Exit gate: Ty confirms Gate B math/image prep shown output on real fixtures; health +
encrypted settings + draft store stub demonstrated (curl or thin UI).

**Next (not Phase 0):** Gate C = early Phase 1 claimable publish — Woo **draft** +
`SLAB-UAT-*` on prod, inference OFF. Call 1/2 after Gate C, still inside POC.

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
> **SUPERSEDED for POC (Gate A 2026-08-31):** online-only; no OCR/ruler/offline PWA. Do not implement this section as written. Capture UX moves to early Phase 1 / Gate C shape per AGENTS.md.

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
  pricing rules editor, brand voice/GEO. Prompts are server files, not UI settings.

Acceptance:
- Full round-trip in browser: capture→upload→review→edit→publish→published (against
  a Woo sandbox/mock in tests; against real store in Phase 6).
- Inference disabled → review screen fully functional with manual species/character.
- Every field is editable and the override persists (asserted in a test).

Exit gate: Ty publishes a test slab to the real store as a **Woo draft** (`SLAB-UAT-*`) product.
(Gate A lock: not pending/published for UAT.)

## Phase 4 — WooCommerce integration (real)
Goal: production Woo sync, taxonomy, dedupe, logging (FR24–28).

Deliverables:
- Woo client (httpx, Basic auth, timeouts), taxonomy sync, auto-assign, media upload,
  product create via `woo_create_status` (default **draft**; `SLAB-UAT-*` forces draft), dedupe, sync_log.
- `POST /api/admin/taxonomy/sync` against the real store.
- Integration tests against a Woo mock (respx) for success + error + duplicate paths.
- Partial-failure handling (orphaned media noted, per CONTENT-WOO §2.6).

Acceptance:
- Real UAT publish: product appears in store admin as **draft** under `SLAB-UAT-*`, correct SKU/price/images/
  category/tags; `woo_product_id` stored; `sync_log` written with payload_hash.
- Duplicate SKU publish → 409, no second product created.
- Woo error (bad creds / 500) → slab `failed` with detail; retry path works.
- All Woo integration tests green (mock + one live smoke).

Exit gate: Ty verifies a real **Woo draft** `SLAB-UAT-*` product in the store is correct.

## Phase 5 — Inference (vision + optional content)
Goal: scoped, toggleable inference with guardrails.

Deliverables:
- Vision wrapper: species/character detection from the top-down photo via the
  configurable OpenAI-compatible endpoint; model constrained to Woo species list
  for accuracy; returns confidence (threshold 0.7, configurable); logs
  request/response.
- Content wrapper: Call 2 reads prompts/call2.txt; LLM writes prose only,
  dimensions injected by deterministic templates. No numeric guardrail needed.
  See docs/PROMPTS.md.
- `test-inference` endpoint (vision capability check).
- All inference code behind feature flags; suite passes with everything OFF.

Acceptance:
- With a local vision model configured: species/character suggestion appears with
  confidence; low confidence → manual confirm required.
- With inference OFF: full app works, tests green (explicit test asserts no network
  calls to the inference endpoint).
- Inference payloads stored for audit (asserted present after a call).
- Call 1 prompt file edits survive server restart (read fresh each invocation).

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
- Repo on gitea-atd (`Ty_Tech/SlabUploader`) is source of truth; docs current.
