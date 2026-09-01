# SlabUploader

Mobile-first, self-hosted app for publishing one-of-a-one wood slabs to WooCommerce.
Phone capture (online) → hybrid measure/crop on device → review → WooCommerce create.

Owner: Ty (Whidbey). Store: www.whidbeywoodstore.com. Deploy: Docker Compose + Caddy on an inventoried host (`APP_HOSTNAME`).

## Status

**Gate A freeze signed 2026-08-31.** Docs refactor on branch `docs/refactor-v2` (2026-09-01).
Read `AGENTS.md` before any implementation. TECH-SPEC + ARCHITECTURE + AGENTS beat archived PRD lines.

POC bar: phone → customer-ready listing on the real store; UAT creates as **Woo draft**
with `SLAB-UAT-*` SKUs; one real SKU **Woo publish** after Ty review. Online-only for POC
(offline deferred). Build plan: `docs/IMPL-PLAN.md` (Phase 0 = hybrid Gates A+B; Gate C =
early Phase 1 first draft listing).

## Documentation

| File | What |
|---|---|
| `AGENTS.md` | Working contract + hard rules (read first) |
| `docs/ARCHITECTURE.md` | Hybrid client/server split, data flow |
| `docs/TECH-SPEC-PIPELINE.md` | Deterministic math + image pipeline, constants, test vectors |
| `docs/DATA-MODEL.md` | SQLite schema + slab status state machine |
| `docs/OPENAPI.md` | Client↔server API contract |
| `docs/CONTENT-WOO.md` | Content templates + WooCommerce payload/integration |
| `docs/PROMPTS.md` | Vision + content prompts (server files) |
| `docs/DEPLOYMENT.md` | Env-agnostic compose, Caddy, backup/restore |
| `deploy/INVENTORY.md` | Host inventory worksheet (Gate B) |
| `docs/IMPL-PLAN.md` | Phased build plan with acceptance criteria + exit gates |
| `docs/archive/PRD-2026-08.txt` | Frozen historical PRD only (not a source for new work) |

## Quick orientation

Hard locks live in `AGENTS.md`. Short map:

- **Hybrid:** phone owns mask/sliders/sqft/bdft/3:4 PNG; server stores, Woo, inference proxy, on-demand U2Net.
- **bdft** = sqft × thickness_in (no `/12`). TV-1 through TV-10 on the client.
- **Secrets** never in browser; AES-GCM on server; `SLAB_AES_KEY` env only.
- **Woo UAT:** draft default; `SLAB-UAT-*` force draft (AGENTS §5).
- **Inference OFF** until Gate C; Call 1/2 after, still inside POC.
- **Online-only for POC** (offline PWA deferred).
- **Two containers** (`frontend`, `fastapi`) + Caddy. Single SQLite + image volumes.
- **v1 non-goals:** no versioning, no staff/roles, no bulk publish, no analytics, no SKU update path.

## Repo remotes

- Canonical SoT: Gitea `Ty_Tech/SlabUploader` on **gitea-atd** (`https://gitea.vps1.afterthedemo.com/Ty_Tech/SlabUploader`)
- Optional later mirrors: `gitea-truenas`, GitHub — not SoT for this workstream

## Getting started (implementer)

1. Read `AGENTS.md` (hard rules) and Phase 0 in `docs/IMPL-PLAN.md`.
2. Start at Phase 0 — hybrid client TECH-SPEC modules + thin FastAPI health/settings (not a server happy-path pipeline).
3. Do not skip exit gates; Ty signs each phase via the delivery process.
4. Do not implement from `docs/archive/PRD-2026-08.txt`.
