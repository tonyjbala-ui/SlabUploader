# SlabUploader

Phone app for listing one-of-a-one wood slabs on the Whidbey Wood Store.

You photograph a slab, confirm the cut and the numbers on the phone, review the listing, and create the WooCommerce product. The phone does the measuring and crop. The server stores the draft, talks to the store, and (later) runs vision.

Owner: Ty (Whidbey). Store: www.whidbeywoodstore.com. Runs in Docker Compose behind Caddy on a host you inventory first (`APP_HOSTNAME`).

## Where we are

Docs freeze signed 2026-08-31. The current docs branch is `docs/refactor-v2`. Read `AGENTS.md` before writing code. If an old PRD line fights TECH-SPEC, ARCHITECTURE, or AGENTS, ignore the PRD. The old PRD is in `docs/archive/`.

The bar for this first version: a real slab, photographed on a phone, listed on the real store. Practice listings are WooCommerce **drafts** with SKUs that start `SLAB-UAT-`. After Ty looks, one real SKU goes **live**. Online only for now. Offline capture waits.

Build order is in `docs/IMPL-PLAN.md`. Empty app on the real host first, then the first draft listing, then vision.

## Documentation

| File | What |
|---|---|
| `AGENTS.md` | Hard rules. Read first. |
| `docs/ARCHITECTURE.md` | What runs on the phone vs the server |
| `docs/TECH-SPEC-PIPELINE.md` | Math, image pipeline, test vectors |
| `docs/DATA-MODEL.md` | SQLite tables and slab statuses |
| `docs/OPENAPI.md` | Phone to server API |
| `docs/CONTENT-WOO.md` | Titles, descriptions, store payload |
| `docs/PROMPTS.md` | Vision and copy prompts (server files) |
| `docs/DEPLOYMENT.md` | Compose, Caddy, backup |
| `docs/UAT-PRACTICE.md` | Walkable practice UAT: host check → App Password → one `SLAB-UAT-*` prove |
| `deploy/INVENTORY.md` | Host worksheet before you bind ports |
| `docs/IMPL-PLAN.md` | Phases and exit gates |
| `docs/archive/PRD-2026-08.txt` | Frozen history. Not a source for new work. |

## Short map

- Phone: mask knobs, square feet, board feet, 3:4 PNG. Server: store, WooCommerce, vision proxy. Server matting ("Try harder") is not in this first listing.
- Board feet = square feet × thickness in inches. No divide-by-12. Test vectors TV-1 through TV-10 run on the phone.
- Secrets never sit in the browser. Encrypted on the server. Store login is a WordPress application password on a low-privilege user, not WooCommerce consumer keys.
- Practice SKUs `SLAB-UAT-*` are always drafts, even if Settings say publish.
- Vision stays off until the first draft listing works. Species suggestion and Generate text come after that, still in this project.
- Two containers (`frontend`, `fastapi`) plus Caddy. One SQLite, image volumes.
- Not in v1: versioning, staff roles, bulk publish, analytics, editing an existing SKU.

## Repo

Source of truth: Gitea `Ty_Tech/SlabUploader` on gitea-atd
(`https://gitea.vps1.afterthedemo.com/Ty_Tech/SlabUploader`). TrueNAS and GitHub copies are not the source of truth for this work.

## Getting started

1. Read `AGENTS.md` and Phase 0 in `docs/IMPL-PLAN.md`.
2. Build the phone math modules and a thin FastAPI health/settings app. Do not put measuring on the server.
3. Ty signs each phase. Do not skip that.
4. Do not implement from `docs/archive/PRD-2026-08.txt`.
