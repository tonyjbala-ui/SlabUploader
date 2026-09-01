# SlabUploader docs refactor: proposal v2 (post-interrogate)

Status: PROPOSAL v2. Not a rewrite. No repo files changed by this document.
SoT: Gitea `Ty_Tech/SlabUploader` on gitea-atd.
Date: 2026-09-01.
Basis: `/workspace/slabuploader-docs-refactor-proposal.md` revised for Act-on findings in `/workspace/slabuploader-docs-refactor-interrogate.md`.
Panel that forced the revision: composer-2.5, DpBlu-Qwen3.6-27b, UbuDual-Qwen3.8-27b, grok-composer-2.5-fast (all four completed).

---

## 1. Executive summary for Ty

Direction from v1 stands: deletion-first cleanup, one Diataxis mode per file, one home per locked decision, product locks unchanged.

v1 is **not** sign-off ready. Four-model interrogate blocked it for structural execution bugs, not for wrong product intent.

v2 changes the execution rules:

1. **AGENTS.md stays the agent working contract.** Hard locks stay verbatim. Pointers add depth; they do not replace lock text.
2. **Named SoT hierarchy** for Woo safety and secrets (agent-facing policy vs schema vs payload).
3. **Gate C hybrid capture slice is written before Phase 2 body delete.**
4. **IMPL Phases 3–5 + Risks get hybrid alignment or an explicit “do not implement” guard.** No claim that superseded text is gone after Phase 2/6 only.
5. **PRD archive is allowed only with reference rewrite + superseded FR header** (or fix W6–W8 first).
6. **Contract wrong-code lines (OPENAPI B1/W1, AGENTS/IMPL W2) land in commit 1** with greppable DoD before PM-DESIGN dies.
7. **File count and inventory worksheet are honest.** Target is 10 active docs files + DEPLOYMENT-owned inventory worksheet, not “9.”

Nothing here reopens: hybrid client math, `bdft = sqft × thickness_in`, AES-GCM server secrets, Woo draft + `SLAB-UAT-*`, inference OFF until first draft listing, gates A/B/C meaning, env-agnostic deploy.

---

## 2. What v1 got right (kept)

- Stale IMPL Phase 2 offline/OCR/ruler body and Phase 6 offline UAT must go.
- Phase 1 must not invent `processing → ready`.
- OPENAPI PUT must not recompute client math as SoT; POST calibrated wording must match status machine.
- DEPLOYMENT must become env-agnostic per `/workspace/slabuploader-env-agnostic-doc-outline.md`.
- TECH-SPEC and DATA-MODEL structure stay; no churn for purity.
- PM-DESIGN-ALIGNMENT is a reconciliation artifact and should not live forever.
- Docs only. No code, schema migration, run-host work, commit, or push in the design pass.

---

## 3. v1 defects fixed in v2 (Act-on map)

| ID | Defect | v2 rule |
|---|---|---|
| A1 | Slim AGENTS to pointers drops locks | Verbatim hard-rules block retained |
| A2 | Woo dual-SoT | AGENTS = policy; CONTENT-WOO = payload cites AGENTS |
| A3 | Secrets SoT = DATA-MODEL | AGENTS policy; ARCHITECTURE why; DATA-MODEL keys only |
| A4 | PRD archive orphans references | Same-commit reference rewrite |
| A5 | W6–W8 “applied” by silence | Superseded header or fix-before-archive; PM delete gated |
| A6 | Phase 2 delete leaves Gate C homeless | Write Gate C slice first |
| A7 | Phases 3–5 still stale | Hybrid-align or keep AGENTS guard |
| A8 | W2 TV-10 unscheduled | Mandatory AGENTS + IMPL Phase 0 edit |
| A9 | Deletion-first overclaim / B1 late | Commit 1 = B1/W1/W2 + IMPL wrong-code deletes |
| A10 | Gate table only in PM-DESIGN | Copy into AGENTS before PM delete |
| A11 | No docs DoD | Greppable acceptance section |
| A12 | “9 files” false; INVENTORY missing | Recount; map inventory under DEPLOYMENT |
| A13 | AGENTS known-stale FR4 false | Rewrite known-stale against HEAD |

---

## 4. Target design

### 4.1 File list and modes

| File | Mode | Owns | v2 change vs today |
|---|---|---|---|
| `README.md` | explanation | Orientation, remotes, POC bar, where to read next | Drop duplicate “what” table bloat; deploy line env-agnostic; PRD row → archive path when moved |
| `AGENTS.md` | reference (agent contract) | **Verbatim** hard rules + Gate A/B/C table + test/delivery + short precedence while copies remain | Add pointers *beside* locks; never replace locks; rewrite known-stale; absorb gate table + open-doc-defects until clear |
| `docs/TECH-SPEC-PIPELINE.md` | reference | Math + image prep + TV-1…**TV-10** | Status bump only; no structural rewrite |
| `docs/ARCHITECTURE.md` | explanation **and** normative topology reference | Hybrid split, swimlane, what-runs-where, secrets **why**, status transitions explained | Keep tables; fix “Remaining sections TBD” (N3); secrets detail points to DATA-MODEL keys, policy stays here + AGENTS |
| `docs/DATA-MODEL.md` | reference | Schema, status enum, settings **keys** | Drop server sheet/slider prefs (W3); “client” not “PWA” (N1); not the never-browser policy home |
| `docs/OPENAPI.md` | reference | HTTP contract | B1 PUT store-only; W1 POST `calibrated` **and** examples; N1 PWA wording |
| `docs/CONTENT-WOO.md` | reference | Templates, Woo payload, dedupe, publish logging | W4 PNG; W5 fig-/feat-*; W11 no calibration photos; **attributes = five locked attrs not species/character/length as attrs**; cite AGENTS for SLAB-UAT force-draft |
| `docs/PROMPTS.md` | reference | Call 1/2 files, inputs, reset-to-default | Keep short tuning note in-file (no split for POC) |
| `docs/DEPLOYMENT.md` | how-to | Env-agnostic playbook | `APP_HOSTNAME` / inventory; corrected Caddy `handle /api/*` then frontend `handle`; drop RemBG/ruler/1000px SoT (W9); W10 |
| `docs/IMPL-PLAN.md` | how-to | Phases + exit gates, hybrid-only | Gate C slice with capture+draft listing; stub Phase 2 deferred; kill `processing`; hybrid-align 3–5 + Risks; Phase 6 online UAT only; TV-1…TV-10 in Phase 0 |
| `deploy/INVENTORY.md` | how-to worksheet | Host inventory filled at Gate B | Created empty/template when DEPLOYMENT goes env-agnostic; owned by DEPLOYMENT, not a second product spec |
| `docs/archive/PRD-2026-08.txt` | frozen record | Historical PRD | Move + superseded header listing non-authoritative FRs; **or** fix W6–W8 before freeze |

**Active count:** 10 docs surfaces (README, AGENTS, 8 under `docs/` excluding archive) + inventory worksheet. Plus archived PRD. Not “9.”

**Delete after DoD green:** `docs/PM-DESIGN-ALIGNMENT.md` (reconciliation body). Preserve freeze provenance by lifting SHA-to-lock summary into AGENTS or a one-screen freeze note inside AGENTS.

### 4.2 Ownership hierarchy (single home, typed)

| Decision | Normative home | Depth / implementation home | Others |
|---|---|---|---|
| Math, crop, no-upscale, TV vectors | TECH-SPEC | — | AGENTS verbatim summary + pointer |
| Hybrid what-runs-where | ARCHITECTURE | — | AGENTS verbatim summary + pointer |
| Schema columns, status enum, settings keys | DATA-MODEL | OPENAPI shapes | Pointers only |
| HTTP behavior | OPENAPI | — | Pointers |
| Woo **payload** / templates / publish sequence | CONTENT-WOO | — | — |
| Woo **safety policy** (`SLAB-UAT-*` force draft, UAT draft default, no edit-same-SKU, purge-after-publish) | **AGENTS** | CONTENT-WOO cites AGENTS; DATA-MODEL has `woo_create_status` key | README one-liner OK |
| Secrets **never-browser / AES / SLAB_AES_KEY env** | **AGENTS** | ARCHITECTURE why/flow; DATA-MODEL key list | — |
| Inference sequencing (OFF until Gate C; Call 2 manual) | **AGENTS** | PROMPTS file mechanics; ARCHITECTURE call placement | — |
| Gate A/B/C human map | **AGENTS** | IMPL-PLAN phase mapping | — |
| Build phases / acceptance | IMPL-PLAN | — | AGENTS gate map + “incomplete rewrite” guard until 1+ clean |
| Deploy ops | DEPLOYMENT (+ inventory worksheet) | — | AGENTS deploy sketch points here |
| Product orientation | README | — | — |

### 4.3 AGENTS verbatim hard-rules block (non-negotiable list)

Keep short full sentences in AGENTS for all of:

- Hybrid: client owns happy-path math/mask/PNG; server stores, Woo, inference proxy, on-demand U2Net
- `bdft = sqft × thickness_in` (no `/12`)
- No fake upscale; &lt;1600 after crop → warn + retake
- Do-not-build table (offline PWA, OCR, ruler, server happy-path pipeline, etc.)
- Secrets never in browser storage or JS bundles; AES-GCM server; `SLAB_AES_KEY` env only
- Woo UAT: draft default; `SLAB-UAT-*` force draft; real publish only after Ty review; duplicate SKU stops
- Inference OFF for full suite and Gate C; Call 1/2 after Gate C still inside POC; Call 2 never auto
- Status machine names: `draft → calibrated → ready → publishing → published | failed` (not Woo draft)
- Gate table A/B/C
- Test/delivery: no feature without passing test + shown output; deterministic core unit-tested first
- TV-1 through TV-10 required
- While IMPL 1+ rewrite incomplete: implement only Phase 0 + sections explicitly marked rewritten

Pointers after each block are encouraged. Replacing any bullet with only a link is forbidden.

### 4.4 IMPL-PLAN hybrid shape (Gate C home)

**Phase 0** (unchanged intent): Gates A+B; client TECH-SPEC modules; thin FastAPI health/settings; TV-1…TV-10.

**Early Phase 1 / Gate C slice** (must exist as real deliverables before Phase 2 stub):

- Online capture 1–5 photos (no OCR/ruler/offline)
- Client sheet/sliders, mask confirm, length axis confirm
- Client sqft/bdft/widths; calibrated draft upload (server stores client numbers)
- Manual SKU/length/thickness/taxonomy as needed for one listing
- Woo **draft** create with `SLAB-UAT-*` on configured store; inference OFF
- Exit: one draft listing Ty can open in Woo admin

**Phase 1 remainder:** broader API/settings/taxonomy cache as needed; **no** `processing` status; no server happy-path math SoT.

**Phase 2:** deferred stub only (offline PWA / OCR / ruler). No airplane-mode acceptance.

**Phases 3–5:** rewrite enough to match hybrid + all-photos@1024 Call 1 + inference after Gate C. Remove top-down-only vision SoT and offline-era assumptions. Confidence threshold 0.7 (from PRD FR22a / current Phase 5) moves here or PROMPTS deliberately.

**Phase 6:** online UAT only; env-agnostic host; no OCR/offline/server-normalization budgets; no `output_px`→1000; no ruler risk row as SoT.

### 4.5 PRD disposition (v2)

**Recommend archive** to `docs/archive/PRD-2026-08.txt` with:

```text
Frozen 2026-08-31. Not a source for new work.
Superseded by AGENTS + ARCHITECTURE + TECH-SPEC + DATA-MODEL + CONTENT-WOO + IMPL-PLAN.
Non-authoritative if they conflict: FR17 tag wording, FR19 category-weighted pricing,
FR40 server-side processing, NFR server normalization timing, FR42 host .201 binding,
and any line AGENTS known-stale still lists.
```

Same commit must update AGENTS, README, ARCHITECTURE companion, TECH-SPEC scope, IMPL DoD language, CONTENT-WOO FR cites.

Alternate: fix W6–W8/FR42 in PRD then archive with a shorter header. Do not archive unedited without the non-authoritative list.

### 4.6 PM-DESIGN-ALIGNMENT deletion gate

Delete only when **all** are true:

1. Docs DoD greps green (section 6).
2. Gate A/B/C table lives in AGENTS.
3. Freeze SHA-to-lock one-liner or small table lifted into AGENTS.
4. Residual open items (if any) listed under AGENTS “open doc defects,” not only in chat.
5. PRD archive/reference step done or PRD fixed in place.

Until then keep the file or a trimmed “open defects” section. Do not delete on hope.

---

## 5. Migration order (v2)

Honest label: **wrong-code-first, then deletes, then env-agnostic add, then de-dupe.** Not pure deletion-first.

### Commit 1 — Stop wrong code if followed
1. OPENAPI: PUT stores client-sent derived fields (no recompute as SoT). POST returns `calibrated`. Update **examples** too (W1).
2. AGENTS + IMPL Phase 0: TV-1 through TV-10 (W2).
3. IMPL: remove `processing`; write Gate C hybrid capture+draft-listing slice; stub Phase 2 deferred; strip Phase 6 offline/OCR/server-normalization UAT; start Risks cleanup (W9).
4. AGENTS: fix known-stale list vs HEAD (drop false FR4 `/12` warning).

**Checkpoint:** safe for agents on contract + Phase 0/Gate C docs. Still may have duplicate prose elsewhere.

### Commit 2 — Env-agnostic deploy
1. DEPLOYMENT + AGENTS §9 + README + IMPL host wording per env outline.
2. Add `deploy/INVENTORY.md` template.
3. Corrected Caddy fragment (`handle /api/*` then frontend `handle`).
4. Drop RemBG/ruler/1000px as deploy SoT.

### Commit 3 — Factual fixes in place
1. CONTENT-WOO: W4, W5, W11, attributes bullet (C4), cite AGENTS for safety policy.
2. DATA-MODEL / OPENAPI: W3 sheet prefs out of server settings; N1 client not PWA.
3. ARCHITECTURE: N3 status line; keep topology tables.
4. IMPL Phases 3–5 hybrid alignment (or AGENTS guard left on if partial).

### Commit 4 — De-dupe and archive
1. README/ARCHITECTURE/CONTENT-WOO: replace long restatements with pointers where AGENTS/TECH-SPEC already state the lock (locks remain in AGENTS).
2. Archive PRD with header + rewrite all live references.
3. Copy Gate table + freeze provenance into AGENTS if not already.
4. Run DoD (section 6). Delete PM-DESIGN only if green.

Each commit is reviewable. Agent-safe checkpoints: after commit 1, after commit 3, after commit 4. Do not hand a half-finished commit 4 tree to implementers.

---

## 6. Docs refactor definition of done

Run from repo root after the last commit. All must pass before Ty treats the cleanup as done.

**Wrong-code absences (active docs, not archive):**

- No `re-runs derived math` / “server re-runs derived” on slab PUT.
- No IMPL acceptance requiring offline capture, airplane mode, Tesseract OCR, or OpenCV ruler for POC.
- No IMPL `processing→ready` as a slab status.
- No DEPLOYMENT normative SoT that RemBG/ruler/`output_px` 1000 define the happy path.
- No CONTENT-WOO “JPEG bytes” as processed listing media SoT (PNG).
- No active AGENTS line claiming PRD FR4 still uses `/12` if PRD FR4 is already correct.

**Lock presences in AGENTS (verbatim):**

- `bdft` identity / no `/12`
- never browser secrets / AES-GCM / `SLAB_AES_KEY`
- `SLAB-UAT-*` force draft
- inference OFF until Gate C
- Gate A / Gate B / Gate C table rows
- TV-1 through TV-10
- hybrid client math SoT one-liner

**Structural:**

- Gate C slice exists in IMPL with capture + Woo draft listing exit.
- PRD either absent from active paths or only under `docs/archive/` with superseded header; README/AGENTS/ARCHITECTURE do not point at a missing root PRD path.
- `deploy/INVENTORY.md` exists when DEPLOYMENT claims it.
- PM-DESIGN-ALIGNMENT deleted only with DoD green + provenance relocated.

**Optional smoke:** `rg` for `SLAB-UAT` in AGENTS and CONTENT-WOO; CONTENT-WOO must cite AGENTS for force-draft policy rather than diverging.

---

## 7. What stays locked (do not reopen)

Hybrid topology; `bdft = sqft × thickness_in`; AES-GCM server secrets never in browser; Woo draft + `SLAB-UAT-*` force-draft; inference OFF for first claimable publish; Call 1/2 after Gate C still inside POC; Gate A docs freeze / Gate B run-host / Gate C first draft listing; env-agnostic deploy direction; online-only POC.

---

## 8. Non-goals

- No code, schema migrations, scaffold, or run-host inventory execution in this design pass.
- No TECH-SPEC or DATA-MODEL structural rewrite.
- No Diataxis split of PROMPTS tuning or CONTENT-WOO short publish list for POC.
- No product lock renegotiation.
- No commit/push until Ty signs this v2 (or a successor).
- N5 workspace review-package hygiene stays out of repo commits.

---

## 9. Open questions for Ty (max 3)

1. **PRD:** Archive with strong superseded header (recommended), or fix W6–W8/FR42 in place then archive?
2. **PM-DESIGN:** Delete after DoD green with provenance in AGENTS (recommended), or keep a trimmed open-defects file until Gate C is green?
3. **IMPL 3–5:** Full hybrid rewrite in the same docs stack as Phase 2/6 cleanup (recommended for less guard complexity), or minimal wrong-path deletes + AGENTS “incomplete rewrite” guard until a later commit?

---

## 10. Consider-class items folded or deferred

| Item | v2 handling |
|---|---|
| W1 examples | Folded into commit 1 |
| CONTENT-WOO attributes | Folded into commit 3 |
| Corrected Caddy fragment | Folded into commit 2 target text |
| ARCHITECTURE normative topology | Folded into §4.1 |
| FR42 vs archive | Open Q1 |
| Confidence 0.7 relocate | Folded into Phase 5 / PROMPTS note in §4.4 |
| Step-4 split | Folded into commits 3–4 |
| N5 workspace | Non-goal |

---

## 11. No repo writes confirmed

This v2 document lives at `/workspace/slabuploader-docs-refactor-proposal-v2.md` only. Interrogate verdict at `/workspace/slabuploader-docs-refactor-interrogate.md`. Original v1 left in place for audit. **No changes under** `/workspace/gitea-atd/Ty_Tech/SlabUploader/`. No git commit. No push.
