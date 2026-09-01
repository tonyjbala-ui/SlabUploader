# SlabUploader docs refactor v2 — execution status

Date: 2026-09-01  
Branch: `docs/refactor-v2` @ `779fa7d`  
Remote: origin (gitea-atd `Ty_Tech/SlabUploader`)  
main: `e1e087b` (untouched; no merge)

Author/committer for all four commits: `grokbot_ty <grokbot_ty@gitea.local>` via env only.

---

## Commits (section 5 order)

| # | Full SHA | Subject | Pushed |
|---|---|---|---|
| 1 | `48720d83e1ae33d637c75b182110ba1b6d455483` | docs: stop wrong-code paths (OPENAPI store-only, Gate C, TV-10) | yes |
| 2 | `369d404c29bee0e8cd67bf44fa5bf35ae7768b75` | docs: env-agnostic deploy (APP_HOSTNAME, inventory, Caddy order) | yes |
| 3 | `3ac5e36dc3c73148d81640d7d94252db8c1dfef8` | docs: factual CONTENT-WOO/DATA-MODEL fixes + hybrid Phases 3-5 | yes |
| 4 | `779fa7d484c325d4a3675698d7723a9dc497c3a5` | docs: archive PRD, gate map in AGENTS, drop PM-DESIGN | yes |

No no-op commits. All four had real diffs.

CoS open-question defaults applied:

1. PRD archived with strong superseded header  
2. PM-DESIGN deleted only after DoD green + provenance in AGENTS  
3. IMPL Phases 3–5 hybrid-aligned in commit 3 (not guard-only)

---

## DoD (proposal §6) — PASS

### Wrong-code absences (active docs, not archive)

| Check | Result |
|---|---|
| No `re-runs derived math` / server re-runs derived on slab PUT | PASS (OPENAPI store-only language) |
| No IMPL acceptance requiring offline capture, airplane mode, Tesseract, OpenCV ruler for POC | PASS (Phase 2 deferred stub only; Phase 6 says no offline UAT cases) |
| No IMPL `processing→ready` as slab status | PASS |
| No DEPLOYMENT normative RemBG / ruler / `output_px` 1000 happy path | PASS |
| No CONTENT-WOO “JPEG bytes” as processed listing media SoT | PASS (PNG bytes) |
| No active AGENTS line claiming PRD FR4 still uses `/12` | PASS |

Note: Phase 2 stub still *names* Tesseract/OpenCV/airplane as **out of scope**. That is not acceptance. DoD greps that treat any mention as failure are false positives.

### Lock presences in AGENTS (verbatim)

| Lock | Result |
|---|---|
| bdft identity / no `/12` | PASS |
| never browser secrets / AES-GCM / `SLAB_AES_KEY` | PASS |
| `SLAB-UAT-*` force draft | PASS |
| inference OFF until Gate C | PASS |
| Gate A / B / C table rows | PASS (§0b) |
| TV-1 through TV-10 | PASS |
| hybrid client math SoT one-liner | PASS (Client owns happy path) |

### Structural

| Check | Result |
|---|---|
| Gate C slice in IMPL (capture + Woo draft listing exit) | PASS |
| PRD only under `docs/archive/` with superseded header; no root PRD path | PASS |
| README / AGENTS / ARCHITECTURE do not point at missing root PRD | PASS |
| `deploy/INVENTORY.md` exists | PASS |
| Freeze provenance in AGENTS | PASS (§0b) |
| Open doc defects section | PASS (none listed) |
| PM-DESIGN-ALIGNMENT deleted | PASS (DoD green first) |
| CONTENT-WOO cites AGENTS for force-draft | PASS |

### Optional smoke

- `SLAB-UAT` present in AGENTS and CONTENT-WOO  
- CONTENT-WOO defers safety policy to AGENTS §5  

---

## File map after tip

Active:

- `README.md`, `AGENTS.md`
- `docs/ARCHITECTURE.md`, `TECH-SPEC-PIPELINE.md`, `DATA-MODEL.md`, `OPENAPI.md`, `CONTENT-WOO.md`, `PROMPTS.md`, `DEPLOYMENT.md`, `IMPL-PLAN.md`
- `deploy/INVENTORY.md`

Archive:

- `docs/archive/PRD-2026-08.txt`

Deleted:

- `docs/PM-DESIGN-ALIGNMENT.md`

---

## Residual (non-DoD)

From DM morning notes; not required to claim cleanup done:

1. OPENAPI duplicate SKU language still says “already published” in places; preferred “exists in Woo (any status).”
2. Caddy fragment could explicitly say frontend and fastapi share the compose network (handle order already fixed).
3. Gate B host inventory still held for Ty; docs only.

---

## main safety

```
main:            e1e087b
docs/refactor-v2: 779fa7d
origin/main:     e1e087b
origin/docs/refactor-v2: 779fa7d
```

No commit to main. No merge to main.
