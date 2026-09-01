# SlabUploader

Mobile-first, self-hosted app for publishing one-of-a-one wood slabs to WooCommerce.
Field capture (offline) → deterministic measurement/pricing/normalization → publish a
single slab to the store as a pending product.

Owner: Ty (Whidbey). Store: www.whidbeywoodstore.com. Deploy: .201 (Caddy, Docker).

## Status
**Planning complete — ready for implementation.** All 20 product decisions locked
(PRD "Decisions log", 2026-08-24). Build plan in `docs/IMPL-PLAN.md` (phases 0–6).

## Documentation
| File | What |
|---|---|
| `Slab capture app PRD.txt` | Requirements + locked decisions (source of truth for "what") |
| `docs/ARCHITECTURE.md` | Services, client/server split, offline PWA, data flow |
| `docs/TECH-SPEC-PIPELINE.md` | Deterministic math + image pipeline, constants, 9 test vectors |
| `docs/DATA-MODEL.md` | SQLite schema + status state machine |
| `docs/OPENAPI.md` | Client↔server API contract (deliverable #2) |
| `docs/CONTENT-WOO.md` | Content templates + WooCommerce payload/integration |
| `docs/PROMPTS.md` | Call 1 vision prompt + Call 2 content prompt (server files) |
| `docs/DEPLOYMENT.md` | Compose, Caddy, backup/restore, key rotation (deliverable #4) |
| `docs/IMPL-PLAN.md` | Phased build plan with acceptance criteria + exit gates |
| `AGENTS.md` | Working contract + hard rules for anyone implementing |

## Quick orientation
- **Deterministic core** (measurements, pricing, normalization, Woo sync) is pure,
  network-free, and unit-tested. Inference (species/character + optional content) is
  the *only* scoped-LLM surface, and it's toggleable — the app fully works without it.
- **Offline-first PWA**: capture works with no network; drafts + photos persist in
  IndexedDB and sync when online.
- **Two containers** (`frontend`, `fastapi`) + Caddy. Single SQLite + image volumes.
- **v1 non-goals**: no versioning, no staff/roles, no bulk publish, no analytics,
  no update path (create-only, SKU-deduped).

## Repo remotes
- Canonical: `github.com/TyTech99/SlabUploader`
- Mirror: Gitea `TyTech_Internal/SlabUploader` (truenas.local:30008)

## Getting started (implementer)
1. Read `AGENTS.md` (hard rules) and `docs/IMPL-PLAN.md` (phases).
2. Start at Phase 0 — scaffold + the tested deterministic pipeline.
3. Don't skip the exit gates; Ty signs each phase.
