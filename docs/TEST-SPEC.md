# TEST-SPEC — Engineer Test Specification

Status: SPEC · engineer bar · SoT gitea-atd main · 2026-09-07

This document defines every affirmative test case for the SlabUploader, from Phase 0 through production. Each case states **what must happen**, **where the rule lives**, and **how it is verified**. The human walkable practice script is at `docs/UAT-PRACTICE.md` and is left untouched by this file.

---

## 1. Case ID naming convention

Case IDs follow the pattern `<prefix>-<number>`. The prefix identifies the test layer or gate:

| Prefix | Meaning | Examples |
|---|---|---|
| `TV` | Test Vector from `docs/TECH-SPEC-PIPELINE.md` §8 | `TV-1`, `TV-10` |
| `V` | Validation rule (shared validation module) | `V-1`, `V-3` |
| `AES` | AES-GCM encryption / decryption | `AES-1`, `AES-2` |
| `H` | Health endpoint | `H-1` |
| `D` | Draft store (slab creation / persistence) | `D-1` |
| `GC` | Gate C case (early Phase 1, claimable draft listing) | `GC-1`, `GC-5` |
| `W` | WooCommerce mock integration | `W-1`, `W-5` |
| `INF` | Inference endpoint probe / toggle | `INF-1`, `INF-4` |
| `UI` | UI behavior (capture, knobs, overlay, ready gates) | `UI-1`, `UI-5` |
| `UIE` | UI end-to-end (review, publish, settings, full flow) | `UIE-1`, `UIE-10` |
| `API` | API contract (routes, concurrency, error responses) | `API-1`, `API-10` |
| `TAX` | Taxonomy sync / anchor / species cache | `TAX-1`, `TAX-3` |
| `C1` | Call 1 (vision) inference call | `C1-1`, `C1-3` |
| `C2` | Call 2 (content/text) inference call | `C2-1`, `C2-4` |
| `OFF` | Inference OFF path (full suite without inference) | `OFF-1`, `OFF-2` |
| `OPS` | Operations / deployment / backup | `OPS-1`, `OPS-5` |
| `INS` | Instrumentation / observability | `INS-1`, `INS-4` |
| `E2E` | End-to-end browser test (full user flow) | `E2E-1`, `E2E-5` |

Other abbreviations used in this document:

- **sqft**: square feet
- **bdft**: board feet
- **U2Net**: Universal 2 Network, a background-removal model (deferred from the proof of concept)
- **API**: application programming interface
- **E2E**: end-to-end
- **UI**: user interface
- **POC**: proof of concept
- **SKU**: stock keeping unit
- **Woo**: WooCommerce, the WordPress e-commerce plugin
- **HTTP/HTTPS**: Hypertext Transfer Protocol (plain / secure)
- **AES-GCM**: Advanced Encryption Standard in Galois/Counter Mode
- **UUID**: universally unique identifier
- **JSON**: JavaScript Object Notation
- **LLM**: large language model

---

## 2. How cases are executed

Test automation lives in the repo under `backend/tests/` and `frontend/e2e/`. The harness uses:

- **Unit tests**: `backend/tests/unit/` (pytest) and `frontend/src/__tests__/` (Vitest). These run against pure modules with no network calls.
- **API contract tests**: `backend/tests/contract/` (pytest + `httpx` TestClient). These hit the FastAPI app through its test client, asserting request/response shape, status codes, and revision handling.
- **Integration tests**: `backend/tests/integration/` (pytest + `httpx` TestClient + `respx` WooCommerce mock). These verify Woo create, duplicate SKU, taxonomy sync, stale-field recovery, and settings encryption round-trips without touching a real store.
- **UI end-to-end tests**: `frontend/e2e/` (Playwright). These exercise the full browser flow: capture, mask knobs, axis confirm, numbers entry, review, and publish. They run against a started Docker Compose stack with the FastAPI test server and mocked Woo endpoints.
- **Ops / deployment tests**: `deploy/tests/` (shell scripts). These verify compose health, backup/restore, and Caddy routing.

Test dependencies are pinned in `backend/tests/requirements-test.txt` and `frontend/package.json` (devDependencies). CI runs the full suite before any merge; the suite must pass with inference disabled.

---

## Results recording & report-out

Every report maps to named case IDs from this spec. Allowed results only: `pass`, `fail`, `not run`, and optionally `blocked` with a blocker pointer. Never invent pass.

Evidence is required for every `pass` or `fail`: a path or paste of real runner output (pytest, httpx, compose logs, curl). No evidence → `not run`. Report table columns are: case id · result · evidence pointer · blocker (if fail).

Gitea issues are the only mechanism for reporting issues found during a test pass. Chat, Slack, and PR comments are not the bug log. On fail, open or update a Gitea issue that includes the case id and evidence pointer; the report table's blocker column links that issue. Do not invent issues that lack runner evidence.

The Test Bar may only summarize what runners printed. Ty also reads raw results and owns gate exit. Gate or phase exit evidence in the Gates section still requires Ty confirmation where IMPL-PLAN mandates it — bots never declare Gate B or Gate C green.

When code does not exist yet, Phase 0 and earlier cases stay `not run`. Do not speculate.

---

## 3. Test pyramid overview

Each row states the test layer, when tests in that layer are written, and what document drives the expected behavior.

| Layer | When written | Primary source of truth |
|---|---|---|
| Unit | TDD: unit tests written before the feature code exists | `docs/TECH-SPEC-PIPELINE.md`, `docs/AGENTS.md` |
| API / contract | Alongside the backend feature code | `docs/OPENAPI.md`, `docs/DATA-MODEL.md` |
| Integration | Alongside the backend feature code | `docs/CONTENT-WOO.md`, `docs/ARCHITECTURE.md` |
| UI / E2E | Alongside the frontend feature code | `docs/UX.md`, `docs/TECH-SPEC-PIPELINE.md` |
| Ops / deployment | Alongside deployment configuration | `docs/DEPLOYMENT.md`, `docs/IMPL-PLAN.md` Phase 6 |

**Test-driven development (TDD)**: write the failing unit test first, then write the minimum code to pass it. This applies to all deterministic core functions: bdft math, pricing, rounding, image crop, and validation rules.

**Tests-with-code**: API contract tests, integration tests, and UI end-to-end tests are written in the same commit that implements the feature. Each feature commit includes its tests and shown execution output in the commit message.

---

## Phase 0 / Gate B — Hybrid skeleton + deterministic core

**Exit evidence**: Ty confirms TV-3, TV-6, TV-7, and TV-10 output on real fixtures; health returns 200; AES round-trip passes; draft store stub persists and retrieves; unit and API cases automated.

### Unit — deterministic core (test-driven)

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| TV-1 | Green-sheet synthetic photo: interior green-ish patch that does not touch the border stays after chroma-key; U2Net is not invoked | `docs/TECH-SPEC-PIPELINE.md` §3.1, §3.4 | Unit test with synthetic image fixture |
| TV-2 | Black-sheet synthetic photo: dark interior wood that does not touch the border stays after threshold; flood-fill isolates border-connected pixels only | `docs/TECH-SPEC-PIPELINE.md` §3.1, §3.4 | Unit test with synthetic image fixture |
| TV-3 | Slab 96" long, 1.5" thick, mask 0.64 square feet → bdft = 0.96. Identity: 1 square foot at 1" thick equals 1 bdft. No divide-by-12. | `docs/TECH-SPEC-PIPELINE.md` §4.6 | Unit test, shown output on real fixtures |
| TV-4 | Width samples at 6" stations on a 96" length axis report min, max, and average perpendicular to the confirmed axis | `docs/TECH-SPEC-PIPELINE.md` §4.4 | Unit test with fixture mask |
| TV-5 | Slab with one square end and one 45° cut: length axis follows prevailing length; widths stay perpendicular after user confirm | `docs/TECH-SPEC-PIPELINE.md` §4.1, §4.2 | Unit test with angled-end fixture |
| TV-6 | 3:4 crop, slab centered, 80 percent fill at extremes, transparent PNG, shorter side ≥ 1600 when source allows | `docs/TECH-SPEC-PIPELINE.md` §5, §7.1 | Unit test, shown output on real fixtures |
| TV-7 | Undersized source: after 80 percent crop shorter side would be below 1600 and source cannot supply it → warn, no upscaling, photo not publishable until retake | `docs/TECH-SPEC-PIPELINE.md` §5, §7.1 | Unit test, shown output on real fixtures |
| TV-8 | Pricing: bdft 0.96, species $12.50/bdft → recommended price 12.00; override 150.00 stored as 150.00; no rule → recommended price empty, manual 99.99 stored | `docs/TECH-SPEC-PIPELINE.md` §6, §8 TV-8 | Unit test with pricing rules |
| TV-9 | Thickness 1" → Woo range rounds up (for example 1"–1 1/2") using synced attribute term, not a hardcoded label | `docs/TECH-SPEC-PIPELINE.md` §8 TV-9, `docs/DATA-MODEL.md` slabs | Unit test with mock taxonomy |
| TV-10 | Rounding: 96.04" → 96"; square feet 0.641 → 0.64; bdft 11.525 → 11.53; price 12.345 → 12.35. Half-up to 2 decimals. | `docs/TECH-SPEC-PIPELINE.md` §8 TV-10 | Unit test, shown output on real fixtures |

### Unit — shared validation

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| V-1 | SKU charset `[A-Z0-9-]{3,24}` accepted; values outside the charset rejected | `docs/TECH-SPEC-PIPELINE.md` §2, issue #17 | Unit test with valid and invalid SKU strings |
| V-2 | Title, short title, description: UTF-8 within WooCommerce maxLength enforced at field exit and at submit | `docs/TECH-SPEC-PIPELINE.md` §2, issue #17 | Unit test with boundary-length strings |
| V-3 | Validation module version hash: client caches module; submit carries hash; mismatch returns 412 with fresh module, not 409 | `docs/OPENAPI.md` §validation, issue #17 | Unit test of validation module hash comparison |

### Unit — AES-GCM settings

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| AES-1 | Encrypt then decrypt round-trips for woo_wp_username and woo_app_password; ciphertext never appears in GET settings | `docs/ARCHITECTURE.md` §5, issue #5 | Unit test with round-trip encryption |
| AES-2 | Missing SLAB_AES_KEY environment variable at startup: app refuses to start; no fallback to plaintext | `docs/AGENTS.md` §4, `docs/DATA-MODEL.md` settings | Unit test with missing env var |

### API / contract — health + draft store stub

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| H-1 | `GET /api/health` returns 200 `{ "status":"ok" }` with `woo_reachable` false when credentials are not configured | `docs/OPENAPI.md` §health, `docs/IMPL-PLAN.md` Phase 0 | API contract test via httpx TestClient |
| D-1 | `POST /api/v1/slabs` accepts multipart with data JSON + files + metadata; returns 201 with `status: calibrated` and `server_rev` | `docs/OPENAPI.md` §slabs, `docs/DATA-MODEL.md` slabs | API contract test via httpx TestClient |

---

## Gate C — Early Phase 1 (first draft listing, inference disabled)

**Exit evidence**: Ty opens one `SLAB-UAT-*` WooCommerce draft listing in the real store admin; inference OFF; mocked-store automation is not Gate C exit.

### API / contract — create + draft

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| GC-1 | `POST /api/v1/slabs` with `SLAB-UAT-*` SKU creates a WooCommerce product with `status: "draft"` regardless of the `woo_create_status` setting | `docs/AGENTS.md` §5, `docs/CONTENT-WOO.md` §2.4 | API contract test with mocked Woo |
| GC-2 | Duplicate SKU before create: `GET /products?sku={sku}` finds existing → 409 `duplicate_sku` with `{ field:"sku", actions:["edit_sku","open_existing"] }` | `docs/CONTENT-WOO.md` §2.5, `docs/OPENAPI.md` §slabs, issue #3 | API contract test with pre-existing SKU in mock |
| GC-3 | `POST /api/v1/settings/test-woo` returns ok with populated taxonomy; always resyncs taxonomy on success | `docs/OPENAPI.md` §settings, issue #14 | API contract test with mocked Woo taxonomy |
| GC-4 | `WOO_BASE_URL` is compose-only HTTPS; Settings GET returns it read-only; PUT rejects write attempts with 422 | `docs/AGENTS.md` §5, issue #11 | API contract test with PUT attempt |
| GC-5 | FastAPI refuses to start when `WOO_BASE_URL` environment variable is missing or set to `http://` | `docs/AGENTS.md` §4, `docs/DEPLOYMENT.md` §3 | Unit test for startup config validation |

### Integration — WooCommerce mock (draft create, SLAB-UAT-*, duplicate SKU, taxonomy)

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| W-1 | Woo mock returns a new product with status draft; server stores `woo_product_id` and purges images | `docs/CONTENT-WOO.md` §2.4, `docs/IMPL-PLAN.md` Phase 4 | Integration test with respx mock |
| W-2 | Woo mock returns 409 for duplicate SKU; server maps to `{ field:"sku", actions:["edit_sku","open_existing"] }`; draft retained | `docs/OPENAPI.md` §slabs, issue #3 | Integration test with respx mock returning 409 |
| W-3 | Taxonomy sync returns cached data; anchor stays unchanged on no-op sync; anchor bumps only when stored-subset hash changes | `docs/ARCHITECTURE.md` §7, issue #14 | Integration test with taxonomy mock |
| W-4 | `test-woo` always runs taxonomy resync after successful connection test | `docs/ARCHITECTURE.md` §7, issue #14 | Integration test: assert taxonomy resync call |
| W-5 | Failed publish: slab status `failed`, photos retained, sync_log written; retry from same screen without re-photographing → success → photos purged | `docs/CONTENT-WOO.md` §2.6, `docs/TECH-SPEC-PIPELINE.md` §5, `docs/DATA-MODEL.md` slabs | Integration test with retryable mock failure |

### Integration — inference disabled path + test-inference probe (issue #2 substance)

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| INF-1 | With `inference_enabled: false`: slab create skips Call 1; `inference_status` is null; full suite passes end-to-end with no inference network calls | `docs/AGENTS.md` §6, `docs/IMPL-PLAN.md` Phase 5 | Integration test asserting zero inference calls |
| INF-2 | `POST /api/v1/settings/test-inference` returns `{ ok: true, mode: "stateful", vision_capable: true }` on a stateful provider | `docs/OPENAPI.md` §settings, issue #2 | Integration test with mocked inference endpoint |
| INF-3 | `test-inference` returns `{ ok: true, mode: "stateless", vision_capable: true }` on a stateless provider; Call 2 uses full resend | `docs/OPENAPI.md` §settings, issue #2 | Integration test with mocked inference endpoint |
| INF-4 | `test-inference` returns `{ ok: false, mode: "fail" }`: Call 2 enablement blocked; Gate C path remains green with inference disabled | `docs/OPENAPI.md` §settings, issue #2 | Integration test: assert Call 2 blocked |

### UI end-to-end — capture knobs, mask, axis, ready gates (phone + PC)

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| UI-1 | Four inline knobs (sheet, sensitivity, edge offset, feather) on capture screen: changing any knob immediately re-runs mask and refreshes overlay without leaving the screen | `docs/TECH-SPEC-PIPELINE.md` §3.3, `docs/UX.md` §Capture, issue #15 | Playwright E2E test: knob change → overlay update, no navigation |
| UI-2 | Mask overlay on source photo: user confirms edge; below-threshold edge after tuning → retake; no U2Net control in the proof of concept | `docs/TECH-SPEC-PIPELINE.md` §3.2, §3.5, `docs/UX.md` §Capture | Playwright E2E test: mask overlay visible, confirm/retake paths |
| UI-3 | Length axis overlay: user rotates if skewed; samples and square feet update live; nearly-square slab: user picks length direction | `docs/TECH-SPEC-PIPELINE.md` §4.2, `docs/UX.md` §Capture | Playwright E2E test: axis rotation, live number update |
| UI-4 | Numbers entry: length 1/8" steps, thickness pick, SKU typed; computed square feet/bdft/widths displayed | `docs/TECH-SPEC-PIPELINE.md` §4, `docs/UX.md` §Capture | Playwright E2E test: type inputs, assert computed output |
| UI-5 | Ready-set gates: slab cannot reach `ready` until full named set is filled (SKU, length, thickness, square feet/bdft/widths, ≥1 PNG, species, wood category, edge, figure, grade, thickness band, moisture, price); inline nudges per empty required field, not a submit-time list | `docs/AGENTS.md` §7, `docs/UX.md` §Review, issue #9 | Playwright E2E test: attempt ready with missing fields, assert nudges |

### Ops — compose health

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| OPS-1 | `GET https://${APP_HOSTNAME}/api/health` returns ok after compose up with filled inventory | `docs/DEPLOYMENT.md` §8, `docs/IMPL-PLAN.md` Phase 0 | Shell script: compose up → curl health endpoint |

---

## Phase 1 remainder — Full API surface

**Exit evidence**: agent-written test automation drives a full calibrated to ready cycle via the API; all OPENAPI endpoints match expected responses; revision conflict handled; taxonomy anchor logic verified.

### API / contract — all routes, concurrency, secrets redaction

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| API-1 | `PUT /api/v1/slabs/{id}` updates fields with `client_rev`; server echoes new `server_rev`; mismatch returns 409 `revision_conflict` with `current_server_rev` | `docs/OPENAPI.md` §conventions, `docs/DATA-MODEL.md` slabs | API contract test with httpx TestClient |
| API-2 | `PUT /api/v1/slabs/{id}` stores client-sent derived fields (square feet, bdft, widths); server does not recompute them as source of truth | `docs/OPENAPI.md` §slabs PUT, `docs/ARCHITECTURE.md` §3 | API contract test: assert no server-side recompute |
| API-3 | `GET /api/v1/settings` returns `SettingsView` with `woo_credentials_configured` boolean; `woo_app_password` never returned | `docs/OPENAPI.md` §settings, issue #5 | API contract test: assert password absent from response |
| API-4 | `POST /api/v1/slabs/{id}/infer-taxon` returns 202 `{ status: "inferring" }`; client polls `GET /api/v1/slabs/{id}` for results; timeout greater than 45 seconds returns 504 | `docs/OPENAPI.md` §inference, issue #8 | API contract test with mocked inference |
| API-5 | `POST /api/v1/slabs/{id}/infer-content` returns 202; requires `test-inference` ok; below-threshold Call 1 (confidence below 0.7): fields stay empty | `docs/OPENAPI.md` §inference, `docs/AGENTS.md` §6, issue #8/#9 | API contract test with confidence-gated mock |
| API-6 | `POST /api/v1/slabs/{id}/publish`: pre-condition check returns 422 with field keys for missing required fields; UI maps fields, no raw code | `docs/OPENAPI.md` §publish, issue #18 | API contract test with incomplete slab |
| API-7 | `POST /api/v1/admin/taxonomy/sync`: pulls categories/attributes/tags; rebuilds cache; anchor bumps only on stored-subset hash change; 502 retains previous cache | `docs/OPENAPI.md` §taxonomy, `docs/ARCHITECTURE.md` §7, issue #14 | Integration test with taxonomy mock |
| API-8 | `GET /api/v1/validation/module` returns hash and rules; client caches; submit mismatch returns 412 with fresh module | `docs/OPENAPI.md` §validation, issue #17 | API contract test: assert 412 on stale hash |
| API-9 | `DELETE /api/v1/slabs/{id}`: soft-delete returns 204; unpublished drafts only; published slabs undeletable | `docs/OPENAPI.md` §slabs DELETE | API contract test with published slab |
| API-10 | `test-woo` fails closed: missing credentials or non-HTTPS URL returns `{ ok: false, detail: "..." }` without crashing | `docs/OPENAPI.md` §settings test-woo | API contract test with bad credentials |

### Integration — taxonomy sync + anchor

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| TAX-1 | Sync on publish when `now - taxonomy_last_sync_at > 1 hour`; bump anchor only on real change; stale picked id returns 422 with current options | `docs/ARCHITECTURE.md` §7, `docs/CONTENT-WOO.md` §2.2, issue #14 | Integration test with time-skewed sync |
| TAX-2 | Species picker offers only WooCommerce-synced species; no hardcoded fallback; new species selectable only after sync stores it | `docs/ARCHITECTURE.md` §7, issue #12 | Integration test: assert species list matches cache |
| TAX-3 | Client reads taxonomy anchor; re-pulls full taxonomy only when anchor advances past client's last value; no-per-navigation sync | `docs/ARCHITECTURE.md` §7, `docs/OPENAPI.md` §taxonomy | Integration test with anchor versioning |

---

## Phase 3 — Frontend review + publish UI

**Exit evidence**: Ty publishes a test slab to the real store as a WooCommerce draft `SLAB-UAT-*`; automation covers UI cases; Ty is the exit.

### UI end-to-end — review, field recovery, publish outcome (phone + PC)

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| UIE-1 | Review screen: all fields editable; client-computed square feet/bdft/widths shown with manual override; typed override persists across poll and refresh | `docs/IMPL-PLAN.md` Phase 3, `docs/UX.md` §Review | Playwright E2E test: edit, poll, refresh, assert persistence |
| UIE-2 | Call 1 prefill at or above 0.7 confidence: fields pre-filled and mutable; user override sticks; below 0.7 fields empty; inline nudges for every still-required control | `docs/AGENTS.md` §6, issue #8/#9, `docs/UX.md` §Review | Playwright E2E test with mocked Call 1 results |
| UIE-3 | Duplicate SKU at publish: under SKU field, "This SKU already exists in the store (any status)"; edit SKU or open existing; draft retained; no raw 409 | `docs/UX.md` §Publish, `docs/CONTENT-WOO.md` §2.5, `docs/AGENTS.md` §5, issue #3/#18 | Playwright E2E test with pre-existing SKU |
| UIE-4 | Stale field at publish: field shows "This value is no longer valid. Pick from the current list"; draft retained; no raw 422 | `docs/CONTENT-WOO.md` §2.6, issue #18 | Playwright E2E test with removed taxonomy item |
| UIE-5 | Publish success: screen shows listing created, `woo_product_id` when available; local draft and photos gone; slab status `published` | `docs/CONTENT-WOO.md` §2.6, `docs/DATA-MODEL.md` slabs | Playwright E2E test: assert published state and cleanup |
| UIE-6 | Publish failure: plain message, no status number, no stack; retry from same screen without re-photographing | `docs/CONTENT-WOO.md` §2.6, issue #18 | Playwright E2E test: assert retry path preserves state |
| UIE-7 | Inference disabled: full manual taxonomy + content path works; no inference network calls; Generate text disabled; templates still work | `docs/IMPL-PLAN.md` Phase 3, `docs/UX.md` §Review | Playwright E2E test with inference flag off |
| UIE-8 | Settings UI: WordPress username + application password + test-woo; inference endpoint + test; pricing rules; brand voice/GEO; `woo_create_status`; store URL read-only | `docs/IMPL-PLAN.md` Phase 3, `docs/OPENAPI.md` §settings, issue #11 | Playwright E2E test: settings form and test buttons |
| UIE-9 | Changing sensitivity slider immediately refreshes mask overlay without leaving screen or server round trip | `docs/TECH-SPEC-PIPELINE.md` §3.3, issue #15, `docs/UX.md` §Capture | Playwright E2E test: slider → overlay update, no HTTP call |
| UIE-10 | Changing edge offset pulls cut in/out; feather changes alpha blend; sheet switch (auto/green/black) re-runs; all persisted in localStorage until reset | `docs/TECH-SPEC-PIPELINE.md` §3.3, issue #15 | Playwright E2E test: knob changes, persist, reset |

---

## Phase 5 — Inference (after Gate C is green)

**Exit evidence**: Ty runs species detection on 3 real slabs with judgment on acceptance; automation covers Call 1/2 cases; full inference-disabled path green.

### Integration — Call 1/2, portable context, confidence gating

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| C1-1 | Call 1 sends all inventory photos at 1024px + WooCommerce taxonomy only + SKU/length/thickness; model constrained to cached taxonomy from WooCommerce cache | `docs/IMPL-PLAN.md` Phase 5, issue #12 | Integration test: inspect Call 1 request payload |
| C1-2 | Confidence at or above 0.7: species, wood categories, edge, figure, grade, feat-* pre-filled and mutable; user override wins | `docs/AGENTS.md` §6, issue #8/#9 | Integration test with high-confidence mock response |
| C1-3 | Confidence below 0.7: those fields stay empty; ready blocked until full named set is filled; species plus one figure is not the gate | `docs/AGENTS.md` §6, issue #8/#9 | Integration test with low-confidence mock response |
| C2-1 | Call 2 triggered only by user tap; portable Call 1 context: full resend default; confirmed versus inferred labels carried | `docs/ARCHITECTURE.md` §9, issue #2 | Integration test: assert no auto-trigger, full resend |
| C2-2 | Test-inference stateful mode: `previous_response_id` used when available; stateless mode: full resend; fail mode: Call 2 blocked | `docs/OPENAPI.md` §settings, issue #2 | Integration test with three probe modes |
| C2-3 | LLM does not invent dimensions; templates inject deterministic numbers into title and description | `docs/PROMPTS.md` §Call 2, `docs/AGENTS.md` §6 | Integration test: inspect Call 2 response for invented numbers |
| C2-4 | Audit: inference_log stores request_payload and response_payload per call; prompt file edits apply without restart | `docs/DATA-MODEL.md` inference_log, `docs/PROMPTS.md` §Management | Integration test: verify log entry, edit prompt file |

### UI end-to-end — inference disabled path

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| OFF-1 | Full suite (calibrated to ready to publish to success) passes with `inference_enabled: false`; zero calls to inference endpoint asserted | `docs/AGENTS.md` §6, `docs/IMPL-PLAN.md` Phase 5 | Playwright E2E test with network assertion for zero inference calls |
| OFF-2 | `test-inference` fail mode blocks Call 2 enablement only; Gate C inference-disabled path unaffected | `docs/OPENAPI.md` §settings, issue #2 | Playwright E2E test: assert Call 2 disabled, full suite passes |

---

## Phase 6 / Ops — Deployment, user acceptance, hardening

**Exit evidence**: deployment smoke automated; Ty walks `docs/UAT-PRACTICE.md` and signs off on UAT results; v1 declared done.

### Ops — compose health, deploy path, backup/restore

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| OPS-2 | INVENTORY.md filled: APP_HOST, APP_HOSTNAME, ports verified free, Caddy location confirmed, DNS reachable from phone on LAN/Tailscale | `docs/DEPLOYMENT.md` §1, `docs/IMPL-PLAN.md` Phase 6 | Shell script: port scan, Caddy check, DNS resolve |
| OPS-3 | Compose health: `GET https://${APP_HOSTNAME}/api/health` ok; `test-woo` ok with species populated; `woo_create_status=draft`; inference disabled for early gates | `docs/DEPLOYMENT.md` §8, `docs/UAT-PRACTICE.md` §1 | Shell script: curl health + test-woo endpoints |
| OPS-4 | Backup: `deploy/backup.sh` creates WAL-safe `.backup` of slab.db and tar of images volume; retention 7 daily + 4 weekly | `docs/DEPLOYMENT.md` §6 | Shell script: run backup, verify files and retention |
| OPS-5 | Restore: stop compose → restore DB + untar images → start compose → health ok; tested at least once before declaring backup done | `docs/DEPLOYMENT.md` §6, `docs/IMPL-PLAN.md` Phase 6 | Shell script: full restore cycle with health assertion |

### Ops — instrumentation (issue #6 substance)

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| INS-1 | Health non-200 on database or volume failure; `woo_reachable` false on WooCommerce unreachable | `docs/OPENAPI.md` §health, issue #6 | Unit test with simulated DB/volume failure |
| INS-2 | Request ID logged on every server request | issue #6 | Unit test: assert request ID in log output |
| INS-3 | Inference request_payload and response_payload recorded in inference_log; payloads contain model name and confidence data | `docs/DATA-MODEL.md` inference_log, issue #6 | Integration test: assert log entry after inference call |
| INS-4 | Sync_log written with payload_hash on every publish attempt; retains success and failure | `docs/DATA-MODEL.md` sync_log, issue #6 | Integration test: assert sync_log entries for success and failure |

### Ops — end-to-end on all target browsers

| Case | What must happen | Where the rule lives | Verified by |
|---|---|---|---|
| E2E-1 | Capture to mask/axis confirm to calibrated upload to review to publish to WooCommerce draft `SLAB-UAT-*` works on iOS Safari (phone) | `docs/UX.md` §Browser compatibility, `docs/IMPL-PLAN.md` Phase 6 | Playwright E2E on iOS Safari |
| E2E-2 | Same flow works on Android Chrome (phone) | `docs/UX.md` §Browser compatibility, `docs/IMPL-PLAN.md` Phase 6 | Playwright E2E on Android Chrome |
| E2E-3 | Same flow works on desktop Chrome, Edge, Firefox (PC) | `docs/UX.md` §Browser compatibility, `docs/IMPL-PLAN.md` Phase 6 | Playwright E2E on desktop browsers |
| E2E-4 | Manual length override recalculates widths/square feet/bdft correctly on all three browser families | `docs/TECH-SPEC-PIPELINE.md` §4.3, `docs/IMPL-PLAN.md` Phase 6 | Playwright E2E: override length, assert recalculation |
| E2E-5 | Client crop: slab approximately 80 percent frame; shorter side ≥ 1600 when source allows; undersized source warns and requests retake | `docs/TECH-SPEC-PIPELINE.md` §5, `docs/IMPL-PLAN.md` Phase 6 | Playwright E2E: inspect crop output dimensions |

---

## When tests are written

**Deterministic core** (TV-1 through TV-10, validation, AES): test-driven development. Unit tests written before any user interface consumes the functions. Property checks: bdft monotonic in thickness and square feet; fill band; no upscale path.

**User interface, FastAPI, WooCommerce/inference adapters**: tests-with-code. Each feature commit includes its test and shown execution output.

**Integration tests**: httpx TestClient with a respx WooCommerce mock covering success, error, duplicate, stale-field, and taxonomy-anchor paths.

**Full suite must pass with inference disabled.** Call 1/Call 2 cases are gated after Gate C is green.

bdft equals square feet times thickness in inches (no divide-by-12). TV-3 proves the identity. Gate B requires TV-3, TV-6, TV-7, and TV-10 to show output on real fixtures.

---

## Cross-reference

| These cases | Source of truth document(s) |
|---|---|
| TV-1 through TV-10 | `docs/TECH-SPEC-PIPELINE.md` §8 |
| V-1 through V-3 | `docs/TECH-SPEC-PIPELINE.md` §2, `docs/OPENAPI.md` §validation |
| AES-1 through AES-2 | `docs/ARCHITECTURE.md` §5, `docs/AGENTS.md` §4 |
| GC-1 through GC-5, W-1 through W-5 | `docs/CONTENT-WOO.md` §2.4–2.6, `docs/OPENAPI.md` §slabs/§settings, `docs/DEPLOYMENT.md` §3 |
| INF-1 through INF-4 | `docs/OPENAPI.md` §settings, `docs/AGENTS.md` §6 |
| UI-1 through UI-5 | `docs/TECH-SPEC-PIPELINE.md` §3–§4, `docs/UX.md` §Capture/§Review |
| UIE-1 through UIE-10 | `docs/UX.md` §Review/§Publish, `docs/CONTENT-WOO.md` §2.5–2.6, `docs/IMPL-PLAN.md` Phase 3 |
| C1-1 through C2-4 | `docs/AGENTS.md` §6–§7, `docs/PROMPTS.md` §Call 1/2 |
| OPS-1 through OPS-5, E2E-1 through E2E-5 | `docs/DEPLOYMENT.md` §1–§8, `docs/IMPL-PLAN.md` Phase 6 |
| INS-1 | `docs/OPENAPI.md` §health, `docs/AGENTS.md` §6 |
| INS-2 | issue #6 |
| INS-3 through INS-4 | `docs/DATA-MODEL.md` §inference_log/sync_log, `docs/AGENTS.md` §6 |

---

## Issue #19 mapping

This spec folds affirmative case substance from issue #19 where the rule exists in a live doc. Issue #19 is not closed by this work.

| Issue #19 item | Cases | Source of truth document(s) |
|---|---|---|
| #2 portable multi-turn | INF-2, INF-3, INF-4, C2-1, C2-2 | `docs/OPENAPI.md` §settings, `docs/ARCHITECTURE.md` §9 |
| #3 duplicate SKU wording | GC-2, W-2, UIE-3 | `docs/OPENAPI.md` §slabs, `docs/CONTENT-WOO.md` §2.5 |
| #5 Application Passwords | AES-1, AES-2, API-3 | `docs/ARCHITECTURE.md` §5, `docs/DATA-MODEL.md` settings |
| #6 instrumentation | INS-1, INS-2, INS-3, INS-4 | `docs/DATA-MODEL.md` sync_log/inference_log, issue #6 |
| #8/#9 Call 1 prefill + 0.7 | UIE-2, C1-2, C1-3 | `docs/AGENTS.md` §6, `docs/PROMPTS.md` §Call 1 |
| #11 WOO_BASE_URL | GC-4, UIE-8 | `docs/AGENTS.md` §5, `docs/DEPLOYMENT.md` §3 |
| #12 synced-species-only | C1-1, TAX-2 | `docs/ARCHITECTURE.md` §7, `docs/CONTENT-WOO.md` §2.2 |
| #14 taxonomy_anchor | TAX-1, W-3, W-4, API-7 | `docs/ARCHITECTURE.md` §7, `docs/OPENAPI.md` §taxonomy |
| #15 four inline knobs | UI-1, UIE-9, UIE-10 | `docs/TECH-SPEC-PIPELINE.md` §3.3, `docs/UX.md` §Capture |
| #17 shared validation | V-1, V-2, V-3, API-8 | `docs/OPENAPI.md` §validation |
| #18 409/422 recovery | UIE-3, UIE-4, UIE-5, UIE-6 | `docs/CONTENT-WOO.md` §2.5–2.6, `docs/OPENAPI.md` §slabs |

---

## Gates and phase map

| Phase / Gate | Cases | Exit evidence |
|---|---|---|
| Phase 0 / Gate B | TV-1 through TV-10, V-1 through V-3, AES-1 through AES-2, H-1, D-1, OPS-1, GC-5 | Ty confirms TV-3, TV-6, TV-7, TV-10 on real fixtures; health up; AES round-trip; draft store; unit/API automated |
| Gate C (early Phase 1) | GC-1 through GC-4, W-1 through W-5, INF-1 through INF-4, UI-1 through UI-5 | Ty opens one `SLAB-UAT-*` WooCommerce draft in real store admin; inference OFF; mocked-store not exit |
| Phase 1 remainder | API-1 through API-10, TAX-1, TAX-2, TAX-3 | Agent-written test automation drives full calibrated to ready cycle; OPENAPI matches; revision and taxonomy green |
| Phase 3 | UIE-1 through UIE-10 | Ty publishes test slab as Woo draft `SLAB-UAT-*`; automation UI cases; Ty is exit |
| Phase 5 | C1-1 through C2-4, OFF-1, OFF-2 | Ty runs species detection on 3 real slabs with judgment on acceptance; automation Call 1/2 cases; inference disabled path green |
| Phase 6 / production | OPS-2 through OPS-5, INS-1 through INS-4, E2E-1 through E2E-5 | Deployment smoke automated; Ty walks `docs/UAT-PRACTICE.md` and signs off on UAT; v1 done |

---

## Rules that do not change

- Inference is optional. The full suite passes with inference disabled. Call 1/Call 2 cases are gated after Gate C.
- bdft equals square feet times thickness in inches. No divide-by-12. TV-3 proves the identity.
- Client is authoritative for deterministic math; server stores client-sent numbers.
- No new product locks in this document. All rules reference existing live docs or issue #19 substance.
