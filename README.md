# SlabUploader

Browser app for listing one-of-a-kind wood slabs on the Whidbey Wood Store.

You photograph a slab, confirm the cut and the numbers, review the listing, and create the WooCommerce product. The browser does the measuring and crop. The server stores the draft, talks to the store, and (later) runs vision. Runs on phones and PCs.

Owner: Ty (Whidbey). Store: www.whidbeywoodstore.com. Runs in Docker Compose behind Caddy on a host you inventory first (`APP_HOSTNAME`).

## Where we are

Gate A freeze signed 2026-08-31. All live docs sit on `main`. Read `AGENTS.md` before writing code.

The bar for this first version: a real slab, photographed on a phone or a PC, listed on the real store. Practice listings are WooCommerce **drafts** with SKUs that start `SLAB-UAT-`. After Ty reviews, one real SKU goes **live**. Online only for now; offline capture is deferred.

Build order is in `docs/IMPL-PLAN.md`. Empty app on the real host first, then the first draft listing, then vision.

## Documentation

| File | What |
|---|---|
| `AGENTS.md` | Hard rules. Read first. |
| `docs/ARCHITECTURE.md` | Hybrid topology, what runs where, secrets, status machine |
| `docs/TECH-SPEC-PIPELINE.md` | Math, image pipeline, constants, test vectors TV-1–TV-10 |
| `docs/DATA-MODEL.md` | SQLite tables, slab statuses, settings |
| `docs/OPENAPI.md` | Browser to server API |
| `docs/CONTENT-WOO.md` | Titles, descriptions, WooCommerce payload |
| `docs/PROMPTS.md` | Call 1 / Call 2 prompt files (server text files) |
| `docs/DEPLOYMENT.md` | Compose, Caddy, secrets placement, ops |
| `docs/UX.md` | Presentation: what the mill owner sees and does |
| `docs/UAT-PRACTICE.md` | Walkable practice UAT for `SLAB-UAT-*` |
| `docs/IMPL-PLAN.md` | Phases 0–6, exit gates, deferred stub (Phase 2) |
| `deploy/INVENTORY.md` | Host worksheet before binding ports |
| `docs/archive/PRD-2026-08.txt` | Frozen history, not a source for new work |

## Short map

- Client (SvelteKit) owns the happy path: mask knobs, sqft, bdft, 3:4 PNG. Server (FastAPI) stores drafts, talks to WooCommerce, and proxies vision. Server matting ("Try harder") is deferred from POC; POC mask tuning is client-side only.
- Board feet = square feet × thickness in inches. No divide-by-12. Test vectors TV-1 through TV-10 run in the browser.
- Secrets never sit in the browser. Encrypted on the server. Store login is a WordPress application password on a low-privilege user; WooCommerce consumer keys are not implemented.
- Practice SKUs `SLAB-UAT-*` are always drafts, even if Settings say publish.
- Vision stays off until the first draft listing works. Species suggestion and Generate text come after, still inside this project.
- Two containers (`frontend`, `fastapi`) plus Caddy. One SQLite, image volumes. Inventory the host first.

Where deferred items live: `docs/ARCHITECTURE.md` §4 and `docs/IMPL-PLAN.md` Phase 2 (offline PWA, OCR, ruler — deferred stub).

## Repo

Source of truth: Gitea `Ty_Tech/SlabUploader` on gitea-atd
(`https://gitea.vps1.afterthedemo.com/Ty_Tech/SlabUploader`). TrueNAS and GitHub copies are not the source of truth for this work.

## Getting started

1. Read `AGENTS.md` and Phase 0 in `docs/IMPL-PLAN.md`.
2. Build the client math modules and a thin FastAPI health/settings app. Measuring lives in the browser.
3. Ty signs each phase.
4. Live docs on `main` are the source of truth. The archive PRD is frozen history only.
