# SlabUploader

Mobile-first, self-hosted app for publishing one-of-a-one wood slabs to WooCommerce.
Phone capture (online) → hybrid measure/crop on device → review → WooCommerce create.

Owner: Ty (Whidbey). Store: www.whidbeywoodstore.com. Deploy: .201 (Caddy, Docker).

## Status
**POC requirements freeze in progress (Gate A, 2026-08-31).** Read `AGENTS.md` before
any implementation. TECH-SPEC + ARCHITECTURE beat stale PRD/README lines. Do **not**
treat older “planning complete / ready for implementation” wording as a green light
to code the obsolete server-pipeline Phase 0.

POC bar: phone → customer-ready listing on the real store; UAT creates as **Woo draft**
with `SLAB-UAT-*` SKUs; one real SKU **Woo publish** after Ty review. Online-only for POC
(offline deferred). Build plan: `docs/IMPL-PLAN.md` (Phase 0 = hybrid Gates A+B).

## Documentation
| File | What |
|---|---|
| `AGENTS.md` | Working contract + hard rules (read first) |
| `Slab capture app PRD.txt` | Requirements + decisions (intent; superseded lines called out in AGENTS) |
| `docs/ARCHITECTURE.md` | Hybrid client/server split, data flow |
| `docs/TECH-SPEC-PIPELINE.md` | Deterministic math + image pipeline, constants, test vectors |
| `docs/DATA-MODEL.md` | SQLite schema + slab status state machine |
| `docs/OPENAPI.md` | Client↔server API contract |
| `docs/CONTENT-WOO.md` | Content templates + WooCommerce payload/integration |
| `docs/PROMPTS.md` | Vision + content prompts (server files) |
| `docs/DEPLOYMENT.md` | Compose, Caddy, backup/restore, key rotation |
| `docs/IMPL-PLAN.md` | Phased build plan with acceptance criteria + exit gates |

## Quick orientation
- **Hybrid:** phone owns mask/sliders/sqft/bdft/3:4 PNG; server stores, Woo, inference proxy, on-demand U2Net.
- **Deterministic core** is unit-tested and network-free. Inference is toggleable; app works with it off.
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
