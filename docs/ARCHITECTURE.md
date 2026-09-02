# Architecture

Status: SPEC · hybrid topology locked at Gate A freeze (2026-08-31) · SlabUploader

Normative for hybrid split, swimlane, what-runs-where, secrets **why**, and status
transitions. Ops depth lives in DEPLOYMENT. Schema enums live in DATA-MODEL.
Agent-facing hard rules live in AGENTS.md (verbatim locks stay there).

Companion: `docs/TECH-SPEC-PIPELINE.md`. Historical PRD: `docs/archive/PRD-2026-08.txt` (frozen; not a source for new work). Agent locks: `AGENTS.md`.

## 1. Topology (hybrid)

Phone does the happy-path pipeline (mask, length axis, sqft/bdft, 3:4 PNG).  
FastAPI stores drafts, runs U2Net only on demand, proxies inference, talks to Woo.  
reverse proxy terminates HTTPS.

```
phone (SvelteKit)
  capture, mask, sliders, length axis, sqft/bdft, 3:4 PNG
  if mask still bad → POST one photo → FastAPI U2Net → mask back → user continues

server
  reverse proxy → frontend (static)
        → fastapi : store, settings, taxonomy, Woo, inference proxy, U2Net, prompt files
```

- Happy path never leaves the phone.
- U2Net is explicit “Try harder” (or coverage failure), not every slab.
- Woo + LLM keys stay on the server. Browser does not call Woo or the vision endpoint directly.

## 2. Swimlane

```mermaid
flowchart TB
  subgraph Phone["Phone — SvelteKit"]
    P1[New Wood: 1–5 photos]
    P2[BG overlay + sheet / sensitivity / edge / feather]
    P3{Edge OK?}
    P4[Length axis overlay — rotate / confirm]
    P5[User length + thickness + SKU]
    P6[sqft, bdft, 6in widths, 3:4 PNGs]
    P7[Review: Call 1 pre-fill or manual taxonomy]
    P8[Tap Generate text]
    P9[Review title / desc — publish]
  end

  subgraph API["server — FastAPI"]
    A1[U2Net: one photo in, mask out]
    A2[Store draft: originals + PNGs + numbers]
    A3[Call 1 proxy — vision]
    A4[Call 2 proxy — text]
    A5[Woo: taxonomy, SKU check, create product]
  end

  subgraph LLM["Your OpenAI-compatible endpoint"]
    L1[Wood expert — all photos at 1024]
    L2[Title / desc / short desc]
  end

  subgraph Woo["WooCommerce store"]
    W1[Categories / attributes / fig-* tags]
    W2[New product live or draft per setting]
  end

  P1 --> P2 --> P3
  P3 -->|no — Try harder| A1
  A1 --> P2
  P3 -->|no — Retake| P1
  P3 -->|yes| P4 --> P5 --> P6
  P6 --> A2
  A2 --> A3 --> L1 --> A3 --> P7
  P7 --> P8 --> A4 --> L2 --> A4 --> P9
  P9 --> A5
  A5 --> W1
  A5 --> W2
```

## 3. Clarifications

1. **Happy path** stays on the phone through PNG + numbers. FastAPI is idle until the user has a confirmed mask (or taps Try harder).
2. **Try harder** is U2Net on **one photo** (the one on screen). Mask comes back; sliders still apply. Not a full re-pipeline on the server.
3. **Draft upload** sends **originals + processed PNGs + length/thickness/SKU/sqft/bdft/widths**. Originals are needed if Call 1 or a later retry must not depend on the tab still being open. After successful Woo publish, server deletes both.
4. **Call 1** is server-side so the vision key never sits in the browser. Auto-run
   on slab create **only if** `inference_enabled` is true. If disabled, Call 1
   is skipped; user can manually fill taxonomy and still trigger Call 2. Body:
   all originals downscaled to 1024 + Woo taxonomy snapshot + SKU/length/thickness.
   Timeout 45s → error + retry on the phone. When inference is on, Call 1 results
   **pre-populate** the review screen: species, wood categories, edge/figure/grade
   attributes, `fig-*`/`feat-*` tags (from character/inclusions/voids/checks), with
   confidence. User reviews and overrides. Manual entry stays authoritative;
   Call 1 is assist-only.
5. **Call 2** does not auto-fire. User taps Generate text. Server sends curated
   Call 1 results (or manually-entered taxonomy if Call 1 failed) + deterministic
   numbers + brand/GEO for prose generation; assembles title/description/short
   description from deterministic templates with the LLM prose injected.
6. **Woo** is only FastAPI. Browser never sees the WordPress application
   password. Duplicate SKU → stop, show error, no edit-same-SKU in MVP.
7. **Settings** (species $/bdft, prompts, inference endpoint, Woo credentials,
   publish status) live on the server; the phone is just the form.

## 4. What runs where

| Job | Where |
|---|---|
| Camera, 1-5 photos | Client |
| Sheet detect, chroma-key / black threshold, sliders, flood-fill | Client |
| U2Net | Server, on demand |
| Length axis overlay, 6" widths, sqft, bdft | Client |
| 3:4 PNG, 80% fill (configurable aspect) | Client |
| Draft + originals + processed PNGs | Server (after user continues) |
| Species $/bdft, Woo creds, prompts, brand/GEO | Server |
| Call 1 (vision, all photos @1024) | Server proxy |
| Call 2 (title/desc) | Server proxy, after Call 1 curation |
| Woo taxonomy sync + publish | Server |

## 5. Secrets and settings

**Server-side only (never in browser JS):**
1. WordPress username + **application password** for a dedicated low-privilege
   WP user. Server uses HTTP Basic Auth (`username:application_password`) against
   `/wp-json/wc/v3/`. Stored encrypted at rest in SQLite (AES-GCM). Not Woo
   consumer keys. Not the account login password.
2. Inference endpoint base URL + API key. Stored encrypted. Server proxies all
   inference calls.
3. AES master key. Env var on server (`SLAB_AES_KEY`), never in the DB.

**Browser-side (no secrets):**
1. User preferences: sheet mode, sensitivity, edge offset, feather. Persisted in localStorage, reset-to-default available.
2. Species list with $/bdft. Read from server settings sync.
3. Taxonomy snapshot (categories, attributes, tags). Read from server. No auth needed.

**Flow:**
1. Operator creates a low-privilege WP user on the store (HTTPS required for
   Application Passwords UI). Generates an application password under
   Users → Profile.
2. User enters that username + application password in Settings UI on the phone.
3. Browser POSTs them to `/api/v1/settings` on FastAPI. Server encrypts with
   AES-GCM and stores ciphertext only.
4. Server syncs taxonomy from Woo, caches in SQLite.
5. Client reads taxonomy from `/api/v1/admin/taxonomy` — no auth needed.
6. All Woo calls go server-to-Woo. Browser never calls Woo REST directly.

Browser-to-Woo REST would need CORS on the store, which this design does not use.

## 6. Status machine

```
draft → calibrated → ready → publishing → published
         │              │                ↑
         └→ failed  ────┴────────────────┘ (woo_product_id set)
any → failed (with error)
```

1. **draft** — user took photos, no mask confirmed yet.
2. **calibrated** — user confirmed the BG edge, confirmed length axis, entered length/thickness/SKU. Client computed sqft/bdft/widths. Draft uploaded to server.
3. **ready** — all mandatory fields populated (species, wood category, edge type, figure, grade, thickness, price, title/desc/short desc, at least one photo). Values can come from Call 1, manual entry, or a mix. Inference is optional; the user can fill everything by hand and go straight to ready.
4. **publishing** — Woo create in flight. Poll for result.
5. **published** — Woo product created, woo_product_id stored. Images purged.
6. **failed** — pipeline, inference, or publish error. Error detail stored. Retry available.

Call 1 and Call 2 are assist-only. They do not gate the flow. If the user skips inference, the path is: calibrated → ready → publishing → published.
