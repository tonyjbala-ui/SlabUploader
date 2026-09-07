# TEST-SPEC — Engineer Bar

Status: SPEC · engineer bar · SoT gitea-atd main · 2026-09-07

Purpose: this document defines every affirmative test case for the SlabUploader through PROD. Each case states what must happen, where the rule lives, and how it is verified. The human UAT walk at `docs/UAT-PRACTICE.md` remains the walkable practice script. Tests are organized by pyramid layer and phased by gate. The full suite passes with inference OFF.

---

## Pyramid overview

| Layer | Cadence | Primary SoT |
|---|---|---|
| Unit | TDD before UI consumes | TECH-SPEC-PIPELINE, issue #17 |
| API / contract | with-code | OPENAPI, DATA-MODEL, issue #5/#11 |
| Integration | with-code | CONTENT-WOO, issue #2/#3/#14/#18 |
| UI / E2E | with-code | UX, TECH-SPEC, issue #8/#9/#15 |
| Ops | with-code | DEPLOYMENT, IMPL-PLAN Phase 6 |

---

## Phase 0 / Gate B — Hybrid skeleton + deterministic core

**Exit evidence:** Ty confirms TV-3, TV-6, TV-7, TV-10 output on real fixtures; `GET /api/health` up; AES round-trip; draft store stub.

### Unit — deterministic core (TDD)

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| TV-1 | Green-sheet synthetic photo: interior green-ish patch that does not touch the border stays after chroma-key; U2Net is not invoked | TECH-SPEC §3.1, §3.4 | TDD |
| TV-2 | Black-sheet synthetic photo: dark interior wood that does not touch the border stays after threshold; flood-fill isolates border-connected pixels only | TECH-SPEC §3.1, §3.4 | TDD |
| TV-3 | Slab 96" long, 1.5" thick, mask 0.64 sqft → bdft = 0.96. Identity: 1 sqft at 1" = 1 bdft. No divide-by-12 | TECH-SPEC §4.6 | TDD |
| TV-4 | Width samples at 6" stations on a 96" length axis report min, max, avg perpendicular to the confirmed axis | TECH-SPEC §4.4 | TDD |
| TV-5 | Slab with one square end and one 45° cut: length axis follows prevailing length, widths stay perpendicular after user confirm | TECH-SPEC §4.1, §4.2 | TDD |
| TV-6 | 3:4 crop, slab centered, 80% fill at extremes, transparent PNG, shorter side ≥ 1600 when source allows | TECH-SPEC §5, §7.1 | TDD |
| TV-7 | Undersized source: after 80% crop shorter side would be below 1600 and source cannot supply it → warn, no upscaling, photo not publishable until retake | TECH-SPEC §5, §7.1 | TDD |
| TV-8 | Pricing: bdft 0.96, species $12.50/bdft → rec 12.00; override 150.00 stored as 150.00; no rule → rec empty, manual 99.99 stored | TECH-SPEC §6, §8 TV-8 | TDD |
| TV-9 | Thickness 1" → Woo range rounds up (e.g. 1"–1 1/2") using synced attribute term, not a hardcoded label | TECH-SPEC §8 TV-9, DATA-MODEL slabs | TDD |
| TV-10 | Rounding: 96.04" → 96"; sqft 0.641 → 0.64; bdft 11.525 → 11.53; price 12.345 → 12.35. Half-up to 2 decimals | TECH-SPEC §8 TV-10 | TDD |

### Unit — shared validation (issue #17 substance)

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| V-1 | SKU charset `[A-Z0-9-]{3,24}` accepted; values outside the charset rejected | TECH-SPEC §2, issue #17 | TDD |
| V-2 | Title, short_title, description: UTF-8 within Woo maxLength enforced at field exit and at submit | TECH-SPEC §2, issue #17 | TDD |
| V-3 | Validation module version hash: client caches module; submit carries hash; mismatch returns 412 with fresh module, not 409 | OPENAPI §validation, issue #17 | TDD |

### Unit — AES-GCM settings (issue #5 substance)

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| AES-1 | Encrypt then decrypt round-trips for woo_wp_username and woo_app_password; ciphertext never appears in GET settings | ARCHITECTURE §5, issue #5 | TDD |
| AES-2 | Missing SLAB_AES_KEY env at startup: app refuses to start; no fallback to plaintext | AGENTS §4, DATA-MODEL settings | TDD |

### API/contract — health + draft store stub

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| H-1 | `GET /api/health` returns 200 `{ "status":"ok" }` with `woo_reachable` false when credentials not configured | OPENAPI §health, IMPL-PLAN Phase 0 | with-code |
| D-1 | `POST /api/v1/slabs` accepts multipart with data JSON + files + meta; returns 201 with `status: calibrated` and `server_rev` | OPENAPI §slabs, DATA-MODEL slabs | with-code |

---

## Gate C — Early Phase 1 (first draft listing, inference OFF)

**Exit evidence:** Ty opens one `SLAB-UAT-*` Woo draft listing in the store admin. Inference remains OFF.

### API/contract — create + draft

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| GC-1 | `POST /api/v1/slabs` with `SLAB-UAT-*` SKU creates Woo product with `status: "draft"` regardless of `woo_create_status` setting | AGENTS §5, CONTENT-WOO §2.4 | with-code |
| GC-2 | Duplicate SKU before create: `GET /products?sku={sku}` finds existing → 409 `duplicate_sku` with `{ field:"sku", actions:["edit_sku","open_existing"] }` | OPENAPI §slabs, issue #3 | with-code |
| GC-3 | `POST /api/v1/settings/test-woo` returns ok with populated taxonomy; always resyncs taxonomy on success | OPENAPI §settings, issue #14 | with-code |
| GC-4 | `WOO_BASE_URL` is compose-only HTTPS; Settings GET returns it read-only; PUT rejects write attempts with 422 | AGENTS §5, issue #11 | with-code |

### Integration — Woo mock (draft create, SLAB-UAT-*, duplicate SKU, taxonomy)

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| W-1 | Woo mock returns a new product with status draft; server stores `woo_product_id` and purges images | CONTENT-WOO §2.4, IMPL-PLAN Phase 4 | with-code |
| W-2 | Woo mock returns 409 for duplicate SKU; server maps to `{ field:"sku", actions:["edit_sku","open_existing"] }`; draft retained | OPENAPI §slabs, issue #3 | with-code |
| W-3 | Taxonomy sync returns cached data; anchor stays unchanged on no-op sync; anchor bumps only when stored-subset hash changes | ARCHITECTURE §7, issue #14 | with-code |
| W-4 | `test-woo` always runs taxonomy resync after successful connection test | ARCHITECTURE §7, issue #14 | with-code |

### Integration — inference OFF path + test-inference probe (issue #2 substance)

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| INF-1 | With `inference_enabled: false`: slab create skips Call 1; `inference_status` is null; full suite passes end-to-end with no inference network calls | AGENTS §6, IMPL-PLAN Phase 5 | with-code |
| INF-2 | `POST /api/v1/settings/test-inference` returns `{ ok: true, mode: "stateful", vision_capable: true }` on a stateful provider | OPENAPI §settings, issue #2 | with-code |
| INF-3 | `test-inference` returns `{ ok: true, mode: "stateless", vision_capable: true }` on a stateless provider; Call 2 uses full resend | OPENAPI §settings, issue #2 | with-code |
| INF-4 | `test-inference` returns `{ ok: false, mode: "fail" }`: Call 2 enablement blocked; Gate C path remains green with inference OFF | OPENAPI §settings, issue #2 | with-code |

### UI/E2E — capture knobs, mask/axis, ready gates (phone + PC)

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| UI-1 | Four inline knobs (sheet, sensitivity, edge offset, feather) on capture screen: changing any knob immediately re-runs mask and refreshes overlay without leaving the screen | TECH-SPEC §3.3, UX §Capture, issue #15 | with-code |
| UI-2 | Mask overlay on source photo: user confirms edge; below-threshold edge after tuning → retake; no U2Net control in POC | TECH-SPEC §3.2, §3.5, UX §Capture | with-code |
| UI-3 | Length axis overlay: user rotates if skewed; samples and sqft update live; nearly-square slab: user picks length direction | TECH-SPEC §4.2, UX §Capture | with-code |
| UI-4 | Numbers entry: length 1/8" steps, thickness pick, SKU typed; computed sqft/bdft/widths displayed | TECH-SPEC §4, UX §Capture | with-code |
| UI-5 | Ready-set gates: slab cannot reach `ready` until full named set is filled (SKU, length, thickness, sqft/bdft/widths, ≥1 PNG, species, wood category, edge, figure, grade, thickness band, moisture, price); inline nudges per empty required field, not a submit-time list | AGENTS §7, UX §Review, issue #9 | with-code |

### Ops — compose health

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| OPS-1 | `GET https://${APP_HOSTNAME}/api/health` returns ok after compose up with filled INVENTORY | DEPLOYMENT §8, IMPL-PLAN Phase 0 | with-code |

---

## Phase 1 remainder — Full API surface

**Exit evidence:** Ty drives curl through a full calibrated → ready cycle; OPENAPI endpoints match; revision conflict handled; taxonomy anchor logic verified.

### API/contract — all routes, concurrency, secrets redaction

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| API-1 | `PUT /api/v1/slabs/{id}` updates fields with `client_rev`; server echoes new `server_rev`; mismatch returns 409 `revision_conflict` with `current_server_rev` | OPENAPI §conventions, DATA-MODEL slabs | with-code |
| API-2 | `PUT /api/v1/slabs/{id}` stores client-sent derived fields (sqft, bdft, widths); server does not recompute them as SoT | OPENAPI §slabs PUT, ARCHITECTURE §3 | with-code |
| API-3 | `GET /api/v1/settings` returns `SettingsView` with `woo_credentials_configured` boolean; `woo_app_password` never returned | OPENAPI §settings, issue #5 | with-code |
| API-4 | `POST /api/v1/slabs/{id}/infer-taxon` returns 202 `{ status: "inferring" }`; client polls `GET /api/v1/slabs/{id}` for results; timeout > 45s → 504 | OPENAPI §inference, issue #8 | with-code |
| API-5 | `POST /api/v1/slabs/{id}/infer-content` returns 202; requires `test-inference` ok; below-threshold Call 1 (confidence < 0.7): fields stay empty | OPENAPI §inference, AGENTS §6, issue #8/#9 | with-code |
| API-6 | `POST /api/v1/slabs/{id}/publish`: pre-condition check returns 422 with field keys for missing required fields; UI maps fields, no raw code | OPENAPI §publish, issue #18 | with-code |
| API-7 | `POST /api/v1/admin/taxonomy/sync`: pulls categories/attributes/tags; rebuilds cache; anchor bumps only on stored-subset hash change; 502 retains previous cache | OPENAPI §taxonomy, ARCHITECTURE §7, issue #14 | with-code |
| API-8 | `GET /api/v1/validation/module` returns hash and rules; client caches; submit mismatch returns 412 with fresh module | OPENAPI §validation, issue #17 | with-code |

### Integration — taxonomy sync + anchor

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| TAX-1 | Sync on publish when `now - taxonomy_last_sync_at > 1 hour`; bump anchor only on real change; stale picked id → 422 with current options | ARCHITECTURE §7, CONTENT-WOO §2.2, issue #14 | with-code |
| TAX-2 | Species picker offers only Woo-synced species; no hardcoded fallback; new species selectable only after sync stores it | ARCHITECTURE §7, issue #12 | with-code |

---

## Phase 3 — Frontend review + publish UI

**Exit evidence:** Ty publishes a test slab to the real store as a Woo draft with `SLAB-UAT-*`.

### UI/E2E — review, field recovery, publish outcome (phone + PC)

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| UIE-1 | Review screen: all fields editable; client-computed sqft/bdft/widths shown with manual override; typed override persists across poll/refresh | IMPL-PLAN Phase 3, UX §Review | with-code |
| UIE-2 | Call 1 prefill ≥ 0.7: fields pre-filled and mutable; user override sticks; below 0.7 fields empty; inline nudges for every still-required control | AGENTS §6, issue #8/#9, UX §Review | with-code |
| UIE-3 | Duplicate SKU at publish: under SKU field, "This SKU already exists in the store (any status)"; edit SKU or open existing; draft retained; no raw 409 | AGENTS §5, CONTENT-WOO §2.5, issue #3, issue #18 | with-code |
| UIE-4 | Stale field at publish: field shows "This value is no longer valid. Pick from the current list"; draft retained; no raw 422 | CONTENT-WOO §2.6, issue #18 | with-code |
| UIE-5 | Publish success: screen shows listing created, woo_product_id when available; local draft and photos gone; slab status `published` | CONTENT-WOO §2.6, DATA-MODEL slabs | with-code |
| UIE-6 | Publish failure: plain message, no status number, no stack; retry from same screen without re-photographing | CONTENT-WOO §2.6, issue #18 | with-code |
| UIE-7 | Inference OFF: full manual taxonomy + content path works; no inference network calls; Generate text disabled; templates still work | IMPL-PLAN Phase 3, UX §Review | with-code |
| UIE-8 | Settings UI: WP username + app password + test-woo; inference endpoint + test; pricing rules; `woo_create_status`; store URL read-only | IMPL-PLAN Phase 3, issue #11 | with-code |

### UI/E2E — capture knobs live re-run (issue #15 substance)

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| UIE-9 | Changing sensitivity slider immediately refreshes mask overlay without leaving screen or server round trip | TECH-SPEC §3.3, issue #15, UX §Capture | with-code |
| UIE-10 | Changing edge offset pulls cut in/out; feather changes alpha blend; sheet switch (auto/green/black) re-runs; all persisted in localStorage until reset | TECH-SPEC §3.3, issue #15 | with-code |

---

## Phase 5 — Inference (after Gate C is green)

**Exit evidence:** Ty runs species detection on 3 real slabs; results acceptable or manually corrected.

### Integration — Call 1/2, portable context, confidence gating

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| C1-1 | Call 1 sends all inventory photos @1024 + Woo taxonomy only + SKU/length/thickness; model constrained to cached taxonomy from Woo cache | IMPL-PLAN Phase 5, issue #12 | with-code |
| C1-2 | Confidence ≥ 0.7: species, wood categories, edge, figure, grade, feat-* pre-filled and mutable; user override wins | AGENTS §6, issue #8/#9 | with-code |
| C1-3 | Confidence < 0.7: those fields stay empty; ready blocked until full named set is filled; species + one figure is not the gate | AGENTS §6, issue #8/#9 | with-code |
| C2-1 | Call 2 triggered only by user tap; portable Call 1 context: full resend default; confirmed vs inferred labels carried | ARCHITECTURE §9, issue #2 | with-code |
| C2-2 | Test-inference stateful mode: `previous_response_id` used when available; stateless mode: full resend; fail mode: Call 2 blocked | OPENAPI §settings, issue #2 | with-code |
| C2-3 | LLM does not invent dimensions; templates inject deterministic numbers into title/description | PROMPTS §Call 2, AGENTS §6 | with-code |
| C2-4 | Audit: inference_log stores request_payload and response_payload per call; prompt file edits apply without restart | DATA-MODEL inference_log, PROMPTS §Management | with-code |

### UI/E2E — inference OFF path

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| OFF-1 | Full suite (calibrated → ready → publish → success) passes with `inference_enabled: false`; zero calls to inference endpoint asserted | AGENTS §6, IMPL-PLAN Phase 5 | with-code |
| OFF-2 | `test-inference` fail mode blocks Call 2 enablement only; Gate C inference-OFF path unaffected | OPENAPI §settings, issue #2 | with-code |

---

## Phase 6 / Ops — Deployment, UAT, hardening

**Exit evidence:** Ty signs off on UAT results; v1 declared done.

### Ops — compose health, deploy path, backup/restore

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| OPS-2 | INVENTORY.md filled: APP_HOST, APP_HOSTNAME, ports verified free, Caddy location confirmed, DNS reachable from phone on LAN/Tailscale | DEPLOYMENT §1, IMPL-PLAN Phase 6 | with-code |
| OPS-3 | Compose health: `GET https://${APP_HOSTNAME}/api/health` ok; `test-woo` ok with species populated; `woo_create_status=draft`; inference OFF for early gates | DEPLOYMENT §8, UAT-PRACTICE §1 | with-code |
| OPS-4 | Backup: `deploy/backup.sh` creates WAL-safe `.backup` of slab.db and tar of images volume; retention 7 daily + 4 weekly | DEPLOYMENT §6 | with-code |
| OPS-5 | Restore: stop compose → restore DB + untar images → start compose → health ok; tested at least once before declaring backup done | DEPLOYMENT §6, IMPL-PLAN Phase 6 | with-code |

### Ops — instrumentation (issue #6 substance)

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| INS-1 | Health non-200 on DB or volume failure; `woo_reachable` false on Woo unreachable | OPENAPI §health, issue #6 | with-code |
| INS-2 | Request ID logged on every server request | issue #6 | with-code |
| INS-3 | Inference latency, model name, and confidence recorded in inference_log | DATA-MODEL inference_log, issue #6 | with-code |
| INS-4 | Sync_log written with payload_hash on every publish attempt; retains success and failure | DATA-MODEL sync_log, issue #6 | with-code |

### Ops — E2E on all target browsers

| Case | Expected behavior | SoT | Cadence |
|---|---|---|---|
| E2E-1 | Capture → mask/axis confirm → calibrated upload → review → publish → Woo draft `SLAB-UAT-*` works on iOS Safari (phone) | UX §Browser compatibility, IMPL-PLAN Phase 6 | with-code |
| E2E-2 | Same flow works on Android Chrome (phone) | UX §Browser compatibility, IMPL-PLAN Phase 6 | with-code |
| E2E-3 | Same flow works on desktop Chrome, Edge, Firefox (PC) | UX §Browser compatibility, IMPL-PLAN Phase 6 | with-code |
| E2E-4 | Manual length override recalculates widths/sqft/bdft correctly on all three browser families | TECH-SPEC §4.3, IMPL-PLAN Phase 6 | with-code |
| E2E-5 | Client crop: slab ~80% frame; shorter side ≥ 1600 when source allows; undersized source warns and requests retake | TECH-SPEC §5, IMPL-PLAN Phase 6 | with-code |

---

## Cadence summary

- **Deterministic core (TV-1…TV-10, validation, AES):** TDD. Unit tests written before any UI consumes the functions. Property checks: bdft monotonic in thickness/sqft; fill band; no upscale path.
- **UI, FastAPI, Woo/inference adapters:** tests-with-code. Each feature commit includes its test and shown execution output.
- **Integration tests:** httpx TestClient with Woo mock (respx) for success, error, duplicate, stale-field, and taxonomy-anchor paths.
- **Full suite must pass with inference OFF.** Call 1/Call 2 cases gated after Gate C is green.
- **bdft = sqft × thickness_in (no /12).** TV-3 is the identity proof. Gate B requires TV-3, TV-6, TV-7, TV-10 show-output on real fixtures.

---

## Cross-reference

| This spec | Live doc |
|---|---|
| TV-1…TV-10 | `docs/TECH-SPEC-PIPELINE.md` §8 |
| V-1…V-3 | `docs/TECH-SPEC-PIPELINE.md` §2, `docs/OPENAPI.md` §validation |
| AES-1…AES-2 | `docs/ARCHITECTURE.md` §5, `docs/AGENTS.md` §4 |
| GC-1…GC-4, W-1…W-4 | `docs/CONTENT-WOO.md` §2.4-2.5, `docs/OPENAPI.md` §slabs/§settings |
| INF-1…INF-4 | `docs/OPENAPI.md` §settings, `docs/AGENTS.md` §6 |
| UI-1…UI-5 | `docs/TECH-SPEC-PIPELINE.md` §3-§4, `docs/UX.md` §Capture/§Review |
| UIE-1…UIE-10 | `docs/UX.md` §Review/§Publish, `docs/CONTENT-WOO.md` §2.5-2.6 |
| C1-1…C2-4 | `docs/AGENTS.md` §6-§7, `docs/PROMPTS.md` §Call 1/2 |
| OPS-1…OPS-5, E2E-1…E2E-5 | `docs/DEPLOYMENT.md` §1-§8, `docs/IMPL-PLAN.md` Phase 6 |
| INS-1…INS-4 | `docs/AGENTS.md` §6, `docs/DATA-MODEL.md` §sync_log/inference_log |

---

## Issue #19 mapping

This spec folds affirmative case substance from issue #19 where the rule exists in a live doc. Issue #19 is not closed by this work.

| Issue #19 item | Cases | SoT doc(s) |
|---|---|---|
| #2 portable multi-turn | INF-2, INF-3, INF-4, C2-1, C2-2 | OPENAPI §settings, ARCHITECTURE §9 |
| #3 duplicate SKU wording | GC-2, W-2, UIE-3 | OPENAPI §slabs, CONTENT-WOO §2.5 |
| #5 Application Passwords | AES-1, AES-2, API-3 | ARCHITECTURE §5, DATA-MODEL settings |
| #6 instrumentation | INS-1, INS-2, INS-3, INS-4 | DATA-MODEL sync_log/inference_log |
| #8/#9 Call 1 prefill + 0.7 | UIE-2, C1-2, C1-3 | AGENTS §6, PROMPTS §Call 1 |
| #11 WOO_BASE_URL | GC-4, UIE-8 | AGENTS §5, DEPLOYMENT §3 |
| #12 synced-species-only | C1-1, TAX-2 | ARCHITECTURE §7, CONTENT-WOO §2.2 |
| #14 taxonomy_anchor | TAX-1, W-3, W-4, API-7 | ARCHITECTURE §7, OPENAPI §taxonomy |
| #15 four inline knobs | UI-1, UIE-9, UIE-10 | TECH-SPEC §3.3, UX §Capture |
| #17 shared validation | V-1, V-2, V-3, API-8 | OPENAPI §validation |
| #18 409/422 recovery | UIE-3, UIE-4, UIE-5, UIE-6 | CONTENT-WOO §2.5-2.6, OPENAPI §slabs |

---

## Gates and phase map

| Phase / Gate | Cases | Exit evidence |
|---|---|---|
| Phase 0 / Gate B | TV-1…TV-10, V-1…V-3, AES-1…AES-2, H-1, D-1, OPS-1 | Ty confirms TV-3, TV-6, TV-7, TV-10 on real fixtures; health up; AES round-trip; draft store |
| Gate C (early Phase 1) | GC-1…GC-4, W-1…W-4, INF-1…INF-4, UI-1…UI-5 | Ty opens one `SLAB-UAT-*` Woo draft; inference OFF |
| Phase 1 remainder | API-1…API-8, TAX-1, TAX-2 | Ty drives curl calibrated → ready; OPENAPI matches; revision + taxonomy green |
| Phase 3 | UIE-1…UIE-10 | Ty publishes test slab as Woo draft `SLAB-UAT-*` |
| Phase 5 | C1-1…C2-4, OFF-1, OFF-2 | Ty runs species detection on 3 real slabs; inference OFF path green |
| Phase 6 / PROD | OPS-2…OPS-5, INS-1…INS-4, E2E-1…E2E-5 | Ty signs off on UAT; v1 done |

---

## Rules that do not change

- Inference is optional. The full suite passes with inference OFF. Call 1/2 cases are gated after Gate C.
- `bdft = sqft × thickness_in`. No divide-by-12. TV-3 proves the identity.
- Client is authoritative for deterministic math; server stores client-sent numbers.
- No new product locks in this document. All rules reference existing live docs or issue #19 substance.
