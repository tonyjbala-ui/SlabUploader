# AGENTS.md — SlabUploader

Working contract for coding agents. Read before writing code.

Status: **Gate A freeze** · signed 2026-08-31 PT · docs refactor 2026-09-01 · SoT: Gitea `Ty_Tech/SlabUploader` on **gitea-atd** (not mirrors).

---

## 0. Doc precedence (hard)

When docs disagree, use this order:

1. **`docs/TECH-SPEC-PIPELINE.md`** — deterministic math, image prep, constants, test vectors
2. **`docs/ARCHITECTURE.md`** — hybrid topology, what-runs-where, secrets why, status machine
3. This **`AGENTS.md`** — hard rules for agents (verbatim locks below)
4. **`docs/DATA-MODEL.md`**, **`docs/OPENAPI.md`**, **`docs/CONTENT-WOO.md`**, **`docs/PROMPTS.md`**, **`docs/DEPLOYMENT.md`**, **`docs/UX.md`** (presentation; functional gates stay in this file)
5. **`docs/IMPL-PLAN.md`** — hybrid-aligned Phases 0–6. Phase 2 is a deferred stub only (offline PWA / OCR / ruler). Do not implement deferred stubs or any server happy-path measure/crop as SoT.
6. **`README.md`** — orientation only
7. **`docs/archive/PRD-2026-08.txt`** — frozen archive only. Not a source for new work.

Archived PRD lines that conflict with the files above are non-authoritative (see archive header and known-stale list).

### Known stale (archive / historical only)

- Archived PRD FR17 “Tags: fig-* only” → **wrong**. Locked model is `fig-*` (1+) + `feat-*` (0+). See DATA-MODEL.
- Archived PRD FR19 / overview “species and wood category” pricing → **wrong**. Species `$/bdft` only. Category-weighted pricing is deferred (v1.5).
- Archived PRD FR40 “server-side processing” and NFR “server normalization” → **wrong**. Client owns happy-path measure/crop; server stores drafts and runs U2Net on demand only.
- Archived PRD FR42 / deploy bullets hard-coding `.201` → superseded by env-agnostic DEPLOYMENT (inventory + `APP_HOSTNAME`).
- Older “creds client-side” decision → **wrong**. Server AES-GCM only; never browser storage for secrets.
- Offline-first PWA / OCR / ruler product text → superseded by hybrid + online-only MVP.
- Older “pending” Woo create default → superseded: UAT uses **Woo draft** + `SLAB-UAT-*`.

### Open doc defects

Landed on `docs/refactor-v2`: #5 Application Passwords, #8 Call 1 prefill, #9 confidence gate, #11 `WOO_BASE_URL`, #10 UX spec (`docs/UX.md`), #12 synced-species-only, #15 inline mask knobs (U2Net deferred), #14 taxonomy manufactured last-modified, #2 portable Call1→Call2, #17 shared validation module, #18 409/422 field recovery. Grok Build owns remaining OPENAPI #3 wording if still open.

---

## 0b. Gates (human map)

| Label | Human name | What it means |
|---|---|---|
| Gate A | Docs freeze | Product locks written into the repo |
| Gate B | Run-host setup | Inventory the real host, deploy skeleton |
| Gate C | First draft listing | One Woo draft listing with inference OFF |

Phase map: **Phase 0 = Gates A+B.** **Gate C = early Phase 1** claimable publish slice. Call 1/2 after Gate C, still inside POC. Depth: `docs/IMPL-PLAN.md`.

### Freeze provenance (Gate A)

| SHA | What locked |
|---|---|
| `a94d81d` | gitea-atd `Ty_Tech/SlabUploader` as remotes SoT |
| `457711b` | AGENTS.md + hybrid IMPL Phase 0 |
| `4ec478f` | Contradiction patches (README/PRD/Woo/DEPLOYMENT) |
| `4d9f307` / `4e97770` | Inference review + hybrid capture pipeline (pre-freeze baseline) |

Docs refactor stack on `docs/refactor-v2` (2026-09-01) applies OPENAPI store-only, env-agnostic deploy, CONTENT-WOO/DATA-MODEL facts, hybrid Phases 1–6, PRD archive. Product locks above are unchanged.

---

## 1. Topology (locked — hybrid)

**Client (SvelteKit) owns the happy path:**

- Capture 1–5 photos
- Sheet detect + chroma-key / black threshold + **four knobs inline on capture** (sheet, sensitivity, edge offset, feather) with **live re-run** and mask overlay on the source photo
- Mask overlay + **user confirm** before measurement
- Length axis overlay (rotate / confirm)
- sqft, bdft, 6" width samples
- 3:4 transparent PNG, 80% fill at extremes, shorter side ≥ 1600 when source allows
- Draft payload: originals + processed PNGs + length/thickness/SKU/sqft/bdft/widths

**Server (FastAPI) owns:**

- Store drafts / settings / taxonomy cache
- **U2Net “Try harder”** — **deferred from POC**, not deleted. Architecture keeps the one-photo server path for awkward backgrounds post-POC. POC mask tuning is **client-side only** (sheet + four knobs, live re-run). Do not implement U2Net in Gate C / first listing.
- WooCommerce (taxonomy sync, SKU check, create product) — browser never calls Woo
- Inference **proxy** (Call 1 / Call 2) — keys never in browser
- Prompt files (server text files, read fresh)

Happy path never leaves the phone until the user continues after confirmed mask + numbers.

Depth: `docs/ARCHITECTURE.md`.

---

## 2. What NOT to build (early phases / MVP)

| Deferred / killed for early phases | Notes |
|---|---|
| Offline capture / PWA / IndexedDB sync | Online-only MVP |
| OCR (SKU) | Manual SKU entry |
| Ruler detection / OpenCV on client for scale | Manual length; scale = longest_axis_px / L |
| Server-side happy-path pipeline | No server chroma-key / crop / bdft math as SoT |
| Fake upscale / inventing pixels | Warn + retake if < 1600 after crop |
| U2Net “Try harder” server mask | Deferred from POC (keep in architecture; do not delete) |
| LoRA / fine-tune | Deferred |
| Figure-/category-weighted pricing | v1.5 |
| Auto-dimension overlay | v1.5 |
| Bulk publish, staff roles, analytics, SKU update path | Non-goals |

---

## 3. Deterministic core (non-negotiable)

Encode TECH-SPEC exactly:

- **bdft = sqft × thickness_in** (identity: 1 sqft @ 1" = 1 bdft). **No `/12`.**
- Units: inches in 1/8" steps; sqft/bdft 2 decimals; price half-up 2 decimals.
- Manual length, thickness, SKU, price always win.
- Image prep: sheet/sliders → mask confirm → length axis confirm → 3:4 PNG / 80% fill / ≥1600px when source allows.
- **No inventing pixels. No fake upscale.** Undersized source → warn + retake; photo not publishable until retake.
- Pricing: species `$/bdft` from Settings, seeded by Woo species sync; `rec = bdft × price_per_bdft`; user override sticks; missing rule → empty rec, manual allowed.
- Port TECH-SPEC **TV-1 through TV-10** (including TV-10 Rounding). Client (or shared pure modules the client uses) is authoritative for math; server **stores** client-sent numbers — does not recompute as SoT.

Depth: `docs/TECH-SPEC-PIPELINE.md`.

---

## 4. Secrets and settings

**Never in browser storage / JS bundles:**

- Woo WordPress username + application password (not consumer keys)
- Inference API key (treat inference URL as sensitive)
- AES master key (`SLAB_AES_KEY` env only; never in DB or repo)

**`WOO_BASE_URL`:** compose / host `.env` only (`https://` required). Settings shows it **read-only**. Not a SQLite settings row. Not user-editable. FastAPI rejects `http://` at startup. Do not reintroduce an editable store URL.

**Server:** AES-GCM at rest in SQLite for Woo Application Password + inference secrets. Settings UI POSTs username + application password to FastAPI; server encrypts. All Woo and inference calls are server-side. Dedicated low-privilege WP user (product create/edit + media). Rotate by revoking the application password in WP Users → Profile and re-entering in Settings. Do not implement WooCommerce consumer keys (`ck_`/`cs_`) or the Woo → Settings → Advanced → REST API key UI.

**Browser may persist (non-secret):** sheet mode, sensitivity, edge offset, feather (localStorage OK; reset-to-default required).

Why/flow: `docs/ARCHITECTURE.md` §5. Ciphertext key inventory: `docs/DATA-MODEL.md` settings table.

---

## 5. Woo UAT and create status (Ty locked 2026-08-31)

- Store URL: **`WOO_BASE_URL`** from Docker Compose (`https://` only). Intended UAT/POC store is Whidbey Wood Store production; the compose value is the SoT, not a Settings field.
- Mid-phase UAT creates: Woo status **draft**, SKU prefix **`SLAB-UAT-*`**
- Settings field **`woo_create_status`**: **`draft | publish`**, default **`draft`**
- Hard rule: if SKU matches `SLAB-UAT-*`, force **Woo draft** even if Settings say publish
- Final POC success: one real (non-UAT) SKU → **Woo publish** only after Ty review
- Duplicate SKU → stop; UI maps **409** to the SKU field (edit SKU or open existing). No edit-in-place of the other listing in MVP
- After successful publish: purge originals + processed images on server
- Do **not** conflate with slab lifecycle status (below)

Payload and publish sequence depth: `docs/CONTENT-WOO.md` (cites this section for safety policy). Key only: DATA-MODEL `woo_create_status`.

---

## 6. Inference (inside POC, sequenced)

- Feature-flagged; **full suite must pass with inference OFF**.
- **Gate C** claimable path: inference **OFF**; manual taxonomy + deterministic numbers + Woo draft path.
- **Call 1 (vision) / Call 2 (text) only after Gate C is green, still inside overall POC** before “done” — not post-POC.
- Call 1 auto only if `inference_enabled`; Call 2 never auto-fires (user taps Generate text).
- Call 1 body: all inventory photos @1024 (not top-down-only). Taxonomy lists sent to Call 1 are **exactly the Woo-synced species / attribute / tag sets**. No hardcoded or invented species.
- **Confidence 0.7 (default):** ≥ 0.7 → pre-populate species, wood categories, edge, figure, grade, and feat-* from Call 1 (**mutable**). < 0.7 → those fields stay **empty**; user is gated before ready. Mandatory floor: species + ≥1 figure (product also requires ≥1 wood category). Presentation: `docs/UX.md`. Inference never auto-publishes.
- **Taxonomy cache:** `taxonomy_last_sync_at` vs `taxonomy_anchor` (bump only on stored-subset hash change, including deletions). Client re-pulls iff the anchor advanced. `test-woo` always syncs; publish if last_sync >1h. No per-nav sync. No Woo taxonomy timestamp.
- Call 2 portable context: default full resend; never require `previous_response_id`. `test-inference` two-turn probe `stateful|stateless|fail`. Fail blocks **Call 2 enablement only**.
- LoRA deferred. No numeric/dimension invention by LLM; templates inject deterministic numbers.

Prompt file mechanics: `docs/PROMPTS.md`.

---

## 7. Slab status machine (app-internal only)

`draft → calibrated → ready → publishing → published` (or `failed` with detail).

- **calibrated:** mask + axis confirmed; length/thickness/SKU entered; client computed sqft/bdft/widths; draft uploaded.
- **ready:** mandatory fields filled (exactly one species, ≥1 wood category, ≥1 figure, plus remaining required listing fields). Values from Call 1 only when confidence ≥ 0.7, else manual. Inference optional.
- Inference does not gate publish. Below-threshold Call 1 does not prefill; empty mandatory fields block ready (see UX spec).
- Never confuse slab `draft` with **Woo draft** (`woo_create_status`).

---

## 8. Test and delivery expectations

- No feature without a passing test and shown execution output (PR/commit message).
- Deterministic core unit-tested before UI consumes it.
- One phase = reviewable, shippable increment; Ty exit-gates phases.
- Phase naming: Phase 0–6 stay delivery chapters. **Phase 0 = Gates A+B.** **Gate C = early Phase 1** claimable publish slice.
- Do not write secrets, real Woo application passwords, or AES keys into the repo.
- Prefer fixing docs when code and locked decisions diverge — do not silently reintroduce `/12`, offline, ruler, or server happy-path pipeline.

---

## 9. Deploy sketch (see DEPLOYMENT.md)

- Target: inventoried Docker host. Docker Compose (`frontend` + `fastapi`) + Caddy → `https://${APP_HOSTNAME}` (LAN/Tailscale).
- Fill `deploy/INVENTORY.md` before binding ports or merging Caddy (co-resident apps can collide; bolt.diy is one example).
- Health: `GET https://${APP_HOSTNAME}/api/health`.
- `WOO_BASE_URL` in compose (HTTPS). Settings displays it read-only.
- Inference is a remote configurable endpoint, not on the app host by default.
- Historical lab IP/hostname examples in older notes are non-normative.
