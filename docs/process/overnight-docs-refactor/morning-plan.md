# SlabUploader morning brief — docs refactor v2

For: Ty  
From: overnight CoS run (grokbot_ty)  
Date: 2026-09-01  
Branch: [docs/refactor-v2](https://gitea.vps1.afterthedemo.com/Ty_Tech/SlabUploader/src/branch/docs/refactor-v2)  
SoT: gitea-atd `Ty_Tech/SlabUploader`  
**main untouched** at `e1e087b`.

---

## What happened overnight

Ty authorized overnight execution of proposal v2 on `docs/refactor-v2`. CoS defaults used for the three open questions:

1. Archive PRD with a strong superseded header  
2. Delete PM-DESIGN only after DoD green + provenance in AGENTS  
3. Hybrid-align IMPL Phases 3–5 in the same stack  

Four docs commits landed and were pushed after each commit. Author/committer: `grokbot_ty <grokbot_ty@gitea.local>` (local env only; global git config unchanged).

| # | SHA | Subject |
|---|---|---|
| 1 | `48720d8` | docs: stop wrong-code paths (OPENAPI store-only, Gate C, TV-10) |
| 2 | `369d404` | docs: env-agnostic deploy (APP_HOSTNAME, inventory, Caddy order) |
| 3 | `3ac5e36` | docs: factual CONTENT-WOO/DATA-MODEL fixes + hybrid Phases 3-5 |
| 4 | `779fa7d` | docs: archive PRD, gate map in AGENTS, drop PM-DESIGN |

Tip of branch: **`779fa7d`**.

---

## What changed (plain English)

**Coding agents can no longer rebuild the old server pipeline from leftover sentences.**

- **OPENAPI** now stores client math on PUT. Create returns `calibrated` (examples too). No “server re-runs derived math.”
- **IMPL-PLAN** owns a real **Gate C** path: online phone capture → mask/axis → numbers → Woo **draft** with `SLAB-UAT-*`, inference off. Phase 2 is a short deferred stub (offline/OCR/ruler). Phases 3–5 rewritten for hybrid. Phase 6 is online UAT only.
- **Deploy** no longer hard-codes `.201`. Fill `deploy/INVENTORY.md`, use `APP_HOSTNAME`, Caddy routes `/api/*` to fastapi before the frontend catch-all.
- **CONTENT-WOO** uploads processed **PNG** (keeps alpha), uses fig-*/feat-* tags and the five locked attributes, and cites AGENTS for Woo force-draft safety.
- **DATA-MODEL** drops sheet/slider prefs from server settings (localStorage on the phone).
- **PRD** moved to `docs/archive/PRD-2026-08.txt` with a “not a source for new work” header listing non-authoritative FRs. Live docs no longer point at a root PRD path.
- **AGENTS** keeps every product lock in full sentences, plus Gate A/B/C table, freeze SHA provenance, and an open-doc-defects slot (currently empty).
- **PM-DESIGN-ALIGNMENT.md** deleted after DoD greps went green and provenance moved into AGENTS.

No product locks were reopened. No app code, no schema migration, no host inventory, no merge to main.

---

## What stays locked

| Lock | Status |
|---|---|
| Hybrid: phone owns measure/crop; server stores / Woo / inference proxy / on-demand U2Net | Locked |
| `bdft = sqft × thickness_in` (no `/12`) | Locked |
| Secrets never in browser; AES-GCM server; `SLAB_AES_KEY` env only | Locked |
| Woo UAT draft + `SLAB-UAT-*` force draft; real publish after your review | Locked |
| Inference OFF until Gate C; Call 1/2 after, still inside POC | Locked |
| Gate A = docs freeze · Gate B = run-host · Gate C = first draft listing | Locked in AGENTS table |
| Online-only POC; env-agnostic deploy | Locked |

Woo firebreak in one line: test products hit the real store as **drafts** under obvious `SLAB-UAT-*` SKUs so shoppers never see them.

---

## DoD report

Proposal §6 checks run before PM-DESIGN delete. Result: **green**.

- No active-doc “re-runs derived math”
- No IMPL acceptance that requires airplane mode, OCR, ruler, or offline UAT for POC (Phase 2 only lists those as deferred out-of-scope)
- No `processing→ready` status path
- No DEPLOYMENT RemBG / `output_px` 1000 happy-path SoT
- No CONTENT-WOO “JPEG bytes” for processed media
- No AGENTS false FR4 `/12` landmine
- AGENTS still has bdft lock, never-browser + AES + `SLAB_AES_KEY`, `SLAB-UAT-*` force draft, inference OFF until Gate C, Gate A/B/C table, TV-1…TV-10, hybrid one-liner
- Gate C slice in IMPL; PRD only under archive with header; `deploy/INVENTORY.md` present; freeze provenance in AGENTS
- CONTENT-WOO cites AGENTS.md for force-draft policy

Detail: `/workspace/slabuploader-docs-refactor-status.md`

---

## Still open (your calls, not docs debt)

1. **Sign the branch** when you want it treated as SoT for implementers (merge strategy is yours; overnight did not merge to main).
2. **Gate B** (host inventory on a real machine) is still **not** open. Docs are ready; no SSH/inventory was run.
3. **Coding agents:** safe for Phase 0 / contract work after commit 1; safe for capture/Woo/inference feature docs after commit 3. Prefer waiting for your explicit “open scaffold” before anyone writes app code.
4. **DM residual nits** (not blockers; see fold-in below): OPENAPI “duplicate SKU” wording could say “exists in Woo (any status)” not only “published”; compose/Caddy same-network note is implied but could be louder.

---

## How PPM / DM morning notes fold in

Both files were present under `/workspace/` and were read for this brief.

### Principal PM (`slabuploader-morning-ppm-notes.md`)

- Product-lock risk of v2: **low if followed literally**. Overnight followed literally: AGENTS locks stayed verbatim, Phases 3–5 got full hybrid align (not top-down-only), PRD archive got the superseded-FR header.
- Open Q recommendations matched CoS defaults; all three executed.
- Bottom line they wanted: sign v2 direction, not v1. Execution is done on the branch; your sign-off is on using it.

### Dev Manager (`slabuploader-morning-dm-notes.md`)

- Notes were written **before** commits landed (tip was still `e1e087b`). Their staging advice matched what ran: wrong-code-first → env-agnostic → factual+Phases 3–5 → archive/DoD.
- Agent-safe checkpoints they named: after 1 (contract), after 3 (feature docs), after 4 (cleanup). All three SHAs are on origin.
- Landmines they flagged that **were** covered overnight: B1/W1, Gate C before Phase 2 stub, env-agnostic + INVENTORY + Caddy order, confidence 0.7 in Phase 5, CONTENT-WOO PNG/tags, no workspace `/workspace/*.md` as repo SoT (agents still start at AGENTS in-repo).
- Landmines still **optional polish** (not blocking DoD): OPENAPI duplicate-SKU “any Woo status” wording; explicit same-Docker-network sentence next to Caddy fragment.

---

## Links

- Branch: https://gitea.vps1.afterthedemo.com/Ty_Tech/SlabUploader/src/branch/docs/refactor-v2  
- Open PR (if you want one): https://gitea.vps1.afterthedemo.com/Ty_Tech/SlabUploader/pulls/new/docs/refactor-v2  
- Proposal: `/workspace/slabuploader-docs-refactor-proposal-v2.md`  
- Interrogate verdict: `/workspace/slabuploader-docs-refactor-interrogate.md`  
- Status / DoD detail: `/workspace/slabuploader-docs-refactor-status.md`

---

## Suggested morning order

1. Skim this page and the four commit subjects above.  
2. Open AGENTS.md on the branch (Gate table + locks).  
3. Spot-check OPENAPI PUT/POST and IMPL Gate C if you want proof.  
4. Decide: leave branch as SoT for docs, open a PR, and/or open Gate B inventory.  
5. Do not merge to main until you mean to.
