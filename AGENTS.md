# AGENTS.md — SlabUploader

Working contract for coding agents. Read before writing code.

Status: **Gate A freeze** · signed 2026-08-31 PT · docs refactor 2026-09-01 · SoT: Gitea `Ty_Tech/SlabUploader` on **gitea-atd** (not mirrors).

---

## 0. Doc precedence (hard)

When docs disagree, use this order:

1. **`docs/TECH-SPEC-PIPELINE.md`** — deterministic math, image prep, constants, test vectors
2. **`docs/ARCHITECTURE.md`** — hybrid topology, what-runs-where, secrets why, status machine
3. This **`AGENTS.md`** — hard rules for agents (verbatim locks below)
4. **`docs/DATA-MODEL.md`**, **`docs/OPENAPI.md`**, **`docs/CONTENT-WOO.md`**, **`docs/PROMPTS.md`**, **`docs/DEPLOYMENT.md`**
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

None known after the 2026-09-01 docs refactor on `docs/refactor-v2`. If a greppable DoD item fails, list it here before deleting reconciliation notes.

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
- Sheet detect + chroma-key / black threshold + sliders (sensitivity, edge offset, feather)
- Mask overlay + **user confirm** before measurement
- Length axis overlay (rotate / confirm)
- sqft, bdft, 6" width samples
- 3:4 transparent PNG, 80% fill at extremes, shorter side ≥ 1600 when source allows
- Draft payload: originals + processed PNGs + length/thickness/SKU/sqft/bdft/widths

**Server (FastAPI) owns:**

- Store drafts / settings / taxonomy cache
- **U2Net on demand only** (“Try harder” / coverage failure) — one photo in, mask out; sliders still apply on client
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
- Inference base URL + API key
- AES master key (`SLAB_AES_KEY` env only; never in DB or repo)

**Server:** AES-GCM at rest in SQLite for Woo + inference secrets. Settings UI
POSTs to FastAPI; server encrypts. All Woo and inference calls are server-side.
Woo auth is a dedicated low-privilege WP user's application password over HTTPS
Basic Auth to `/wp-json/wc/v3/`. Do not implement WooCommerce consumer keys
(`ck_`/`cs_`) or the Woo → Settings → Advanced → REST API key UI.

**Browser may persist (non-secret):** sheet mode, sensitivity, edge offset, feather (localStorage OK; reset-to-default required).

Why/flow: `docs/ARCHITECTURE.md` §5. Ciphertext key inventory: `docs/DATA-MODEL.md` settings table.

---

## 5. Woo UAT and create status (Ty locked 2026-08-31)

- Store: **PROD** `www.whidbeywoodstore.com`
- Mid-phase UAT creates: Woo status **draft**, SKU prefix **`SLAB-UAT-*`**
- Settings field **`woo_create_status`**: **`draft | publish`**, default **`draft`**
- Hard rule: if SKU matches `SLAB-UAT-*`, force **Woo draft** even if Settings say publish
- Final POC success: one real (non-UAT) SKU → **Woo publish** only after Ty review
- Duplicate SKU → stop, surface error; no edit-same-SKU in MVP
- After successful publish: purge originals + processed images on server
- Do **not** conflate with slab lifecycle status (below)

Payload and publish sequence depth: `docs/CONTENT-WOO.md` (cites this section for safety policy). Key only: DATA-MODEL `woo_create_status`.

---

## 6. Inference (inside POC, sequenced)

- Feature-flagged; **full suite must pass with inference OFF**.
- **Gate C** claimable path: inference **OFF**; manual taxonomy + deterministic numbers + Woo draft path.
- **Call 1 (vision) / Call 2 (text) only after Gate C is green, still inside overall POC** before “done” — not post-POC.
- Call 1 auto only if `inference_enabled`; Call 2 never auto-fires (user taps Generate text).
- Call 1 body: all inventory photos @1024 (not top-down-only). Confidence threshold 0.7 (configurable) lives in IMPL Phase 5 / PROMPTS.
- LoRA deferred. No numeric/dimension invention by LLM; templates inject deterministic numbers.

Prompt file mechanics: `docs/PROMPTS.md`.

---

## 7. Slab status machine (app-internal only)

`draft → calibrated → ready → publishing → published` (or `failed` with detail).

- **calibrated:** mask + axis confirmed; length/thickness/SKU entered; client computed sqft/bdft/widths; draft uploaded.
- **ready:** mandatory fields filled (manual and/or Call 1); inference optional.
- Inference does not gate publish.
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
- Inference is a remote configurable endpoint, not on the app host by default.
- Historical lab IP/hostname examples in older notes are non-normative.
