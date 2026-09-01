# SlabUploader docs refactor: proposal (design checkpoint)

Status: PROPOSAL, not a rewrite. No repo files were changed by this work.
SoT for the repo is Gitea `Ty_Tech/SlabUploader` on gitea-atd. TrueNAS and GitHub are mirrors, not SoT.
Date: 2026-09-01. Author: poteto-mode (how-critique + architect-with-checkpoint).

---

## 1. Executive summary for Ty

The docs set is a frozen spec pile with a contradiction ladder bolted on top of it. AGENTS.md section 0 ranks the files so an agent can pick the winner when two disagree, and PM-DESIGN-ALIGNMENT.md catalogs every disagreement (5 blockers, 11 warns, 6 nits). That ladder is the symptom. You only need a tie-breaker because the same decision lives in several places.

The fix is deletion-first, not reorganization. Cut the stale bodies that are already superseded (IMPL-PLAN Phases 2 and 6 offline/OCR/ruler text). Delete the two files whose job was to flag contradictions (PM-DESIGN-ALIGNMENT.md and the PRD's decisions log) once their fixes land. Give each surviving file exactly one Diataxis mode. The result is a small set where every decision has one home, so no ladder is needed.

Target: 12 files down to 9 in-repo (plus an archived PRD). README stays the only explanation. AGENTS.md becomes a short hard-rules reference that points at each spec instead of restating it. TECH-SPEC, ARCHITECTURE, DATA-MODEL, OPENAPI, CONTENT-WOO, PROMPTS stay as single-mode references. DEPLOYMENT becomes env-agnostic.

Nothing here touches the locked product decisions. Hybrid topology, `bdft = sqft * thickness_in`, AES-GCM server secrets, Woo draft + `SLAB-UAT-*` safety, and the A/B/C gate map all carry over unchanged. This is a docs-only change. It does not unblock or start run-host setup until you sign off.

---

## 2. How the current docs set works

Twelve files split into three jobs: lock decisions, specify behavior, and track alignment.

**Decision locks.** `AGENTS.md` is the working contract for coding agents. Its section 0 is a precedence ladder (TECH-SPEC, then ARCHITECTURE, then AGENTS, then DATA-MODEL/OPENAPI/CONTENT-WOO/PROMPTS/DEPLOYMENT, then IMPL-PLAN Phase 0 only, then PRD/README). Sections 1 through 9 restate the locked decisions: hybrid topology, what not to build, the deterministic core, secrets, Woo UAT safety, inference sequencing, the slab status machine, test expectations, and deploy. `Slab capture app PRD.txt` carries product intent plus a dated decisions log (2026-08-31 freeze, 2026-08-27 Ty) that overlaps AGENTS.

**Behavior specs.** Each of the eight `docs/` files owns one slice:
- `TECH-SPEC-PIPELINE.md`: deterministic math and image prep (constants, algorithms, TV-1 through TV-10).
- `ARCHITECTURE.md`: hybrid topology, swimlane, what-runs-where, secrets, status machine.
- `DATA-MODEL.md`: SQLite schema and the slab status state machine.
- `OPENAPI.md`: client-to-server HTTP contract (schemas, endpoints, examples).
- `CONTENT-WOO.md`: content templates plus the WooCommerce payload and publish sequence.
- `PROMPTS.md`: Call 1 / Call 2 prompt files and their management.
- `DEPLOYMENT.md`: compose, Caddy, backup/restore, runbook, smoke test (currently `.201`-bound).
- `IMPL-PLAN.md`: Phases 0 through 6 with acceptance criteria and exit gates; Phase 0 rewritten for hybrid, Phases 1+ still carry the old offline pipeline.

**Alignment tracking.** `PM-DESIGN-ALIGNMENT.md` is a review artifact. It lists what agrees, what conflicts (blockers/warns/nits), and what is missing, plus a recommended patch list. It exists because the other files disagree with each other.

The mechanism that makes this work today is the precedence ladder plus superseded banners. When IMPL-PLAN Phase 2 still says "offline PWA + OCR + ruler," a banner marks it SUPERSEDED and AGENTS section 0 tells an agent to prefer the hybrid rewrite. The system holds together only as long as every reader applies that discipline. PM-DESIGN-ALIGNMENT's own verdict is that agents skim past banners, which is why the contradictions keep costing real work.

---

## 3. Critique (how-skill, critique mode)

### 3.1 Per-file Diataxis mode: today vs should-be

Diataxis has four modes. One file, one mode. The test for each file below is what a reader comes to it to do: learn by doing (tutorial), get a task done (how-to), look up a fact (reference), or understand why (explanation).

| File | Mode today | Mixed? | Should-be | Why |
|---|---|---|---|---|
| `README.md` | explanation + reference table | yes | **explanation** | It already explains the product and points elsewhere. Keep it as the single orientation doc; drop the per-file "what" table that duplicates AGENTS. |
| `AGENTS.md` | reference (hard rules) | no, but bloated | **reference**, slimmed | Correct mode. Problem is scope: sections 1 through 9 restate decisions that already live in TECH-SPEC/ARCHITECTURE/DATA-MODEL. It should be a short list of hard rules plus one pointer per topic, not a second copy of the specs. |
| `Slab capture app PRD.txt` | explanation (intent) + reference (FRs) | yes | **archive** | Product intent is now fully captured in AGENTS + ARCHITECTURE + TECH-SPEC. The FR list and decisions log are stale duplicates. Keep as a frozen historical record, not an active doc. |
| `docs/TECH-SPEC-PIPELINE.md` | reference | no | **reference** (keep) | Clean single mode. This is the math SoT. No structural change; minor status-date bump only. |
| `docs/ARCHITECTURE.md` | explanation + reference | yes | **explanation** | The topology, swimlane, and "what runs where" are understanding material. Keep it as the one place that explains the hybrid split. Move the secrets list to point at DATA-MODEL rather than restating keys. |
| `docs/DATA-MODEL.md` | reference | no | **reference** (keep) | Schema + status machine, lookup-shaped. Fix: drop sheet/slider prefs from server settings (W3), say "client" not "PWA" (N1). |
| `docs/OPENAPI.md` | reference | no | **reference** (keep) | Contract-shaped. Fix the two one-liners that contradict the hybrid lock: PUT must not recompute math as SoT (B1); POST returns `calibrated`, not `draft` (W1). |
| `docs/CONTENT-WOO.md` | reference + how-to (publish sequence) | yes | **reference** | The payload, dedupe, and logging are lookup facts. The "end-to-end publish sequence" is a numbered procedure that belongs in IMPL-PLAN or stays as a short reference list. Fix W4 (PNG not JPEG), W5 (fig-/feat-* only), W11 (no calibration photos). |
| `docs/PROMPTS.md` | reference + how-to (tuning workflow) | yes | **reference** | The prompt files and their inputs are lookup facts. The "tuning workflow" is a short how-to; keep it as a 4-line note or move to DEPLOYMENT runbook. No structural split needed for POC. |
| `docs/DEPLOYMENT.md` | how-to (runbook) + reference (compose/Caddy) | yes | **how-to**, env-agnostic | It is an operations playbook: inventory, deploy, backup, smoke. Make it the single how-to and make it host-agnostic (`APP_HOSTNAME`, inventory worksheet), with `.201` as a non-normative example only. Fix W9 (drop RemBG/ruler/1000px) and W10 (Caddy handle order). |
| `docs/IMPL-PLAN.md` | how-to (phased build) + reference (acceptance) | yes, badly | **how-to**, pruned | Correct mode for a phased plan. The defect is stale bodies: Phase 2 (offline/OCR/ruler) and Phase 6 UAT still specify the killed pipeline; Phase 1 invents a `processing` status (B2). Prune to hybrid-only phases. |
| `docs/PM-DESIGN-ALIGNMENT.md` | explanation (review artifact) | no | **delete** (after fixes land) | Its entire reason for existing is that the other files disagree. Once the blockers/warns are fixed in place, this file has nothing left to say. It is a process artifact, not product documentation. |

### 3.2 Mixed modes (the real reader-load problem)

The set fails Diataxis's "one mode per file" rule in five places:
- `README` mixes explanation with a reference table that duplicates AGENTS.
- `ARCHITECTURE` mixes explanation (topology) with reference (secrets, status machine).
- `CONTENT-WOO` mixes reference (payload) with how-to (publish sequence).
- `PROMPTS` mixes reference (prompt files) with how-to (tuning workflow).
- `DEPLOYMENT` and `IMPL-PLAN` each mix how-to steps with reference tables.

None of these is fatal on its own. The cost shows up in the next section. When a file holds two modes, it also tends to hold two copies of a decision, and that is where contradictions breed.

### 3.3 Duplicated rules (one SoT per decision)

The same locked decision is written in multiple files. Each copy is a place that can go stale or drift. The high-traffic ones:

| Decision | Where it is repeated today | Single home it should have |
|---|---|---|
| `bdft = sqft * thickness_in` (no `/12`) | TECH-SPEC 4.6/TV-3, AGENTS 3, PRD FR4, IMPL Phase 0, DEPLOYMENT smoke | **TECH-SPEC** (math SoT). Everywhere else: one pointer. |
| Hybrid topology / client is math SoT | ARCHITECTURE 1-4, TECH-SPEC 1/9, AGENTS 1, README, PRD stack, IMPL Phase 0 | **ARCHITECTURE** (explanation) + **TECH-SPEC** (math). Others: pointer. |
| Secrets server AES-GCM, never browser | ARCHITECTURE 5, AGENTS 4, DATA-MODEL settings, OPENAPI SettingsView, PRD D15 | **DATA-MODEL** (schema) is the SoT for what's stored; **ARCHITECTURE** explains why. Others: pointer. |
| Woo safety (`woo_create_status`, `SLAB-UAT-*` force draft) | AGENTS 5, CONTENT-WOO 2.4, DATA-MODEL settings, OPENAPI SettingsView, DEPLOYMENT smoke, README, PRD D12/FR36 | **CONTENT-WOO** (publish behavior) is the SoT; **DATA-MODEL** holds the setting key. Others: pointer. |
| Slab status machine (`draft` to `published`) | ARCHITECTURE 6, DATA-MODEL, AGENTS 7, OPENAPI | **DATA-MODEL** (state column) is the SoT; **ARCHITECTURE** explains transitions. Others: pointer. |
| No fake upscale / at least 1600px or retake | TECH-SPEC 5/TV-6/TV-7, AGENTS 2-3, IMPL Phase 0 | **TECH-SPEC**. Others: pointer. |

The pattern is the same in every row: a decision that has one natural home is also restated in three to seven files. The fix is not to edit all copies. Keep the copy in the SoT file and replace the others with a link. That is the laziness protocol applied to docs, and it removes the need for AGENTS section 0's ladder because there will be fewer things that can disagree.

### 3.4 Stale bodies (already superseded, still present)

These are not "needs a fix," they are "the body describes something we decided not to build." They should be deleted or stubbed, not patched:

- **IMPL-PLAN Phase 2**: full offline PWA / Workbox / IndexedDB / Tesseract OCR / OpenCV.js ruler / airplane-mode UAT. Banner says SUPERSEDED; the body still demands all of it (blocker B3).
- **IMPL-PLAN Phase 6**: UAT suite and perf budgets that include offline capture, OCR 1 to 2s, and "server normalization" 3 to 5s (blocker B4).
- **IMPL-PLAN Phase 1**: invents a `processing` slab status and a server job that "processes" photos toward `ready`, which is the old server pipeline under a new name (blocker B2).
- **OPENAPI PUT**: "Server re-runs derived math when inputs change," contradicting client-is-math-SoT (blocker B1).
- **PRD FR40 / NFR**: "server-side processing" and "server normalization" on the publish path (warn W8).
- **DEPLOYMENT section 9 / IMPL Risks**: RemBG server path, ruler row, `output_px` drop to 1000 (warn W9).

### 3.5 The structural root cause

AGENTS.md's contradiction ladder is a symptom, not the disease. A precedence list only earns its keep when the same fact lives in several files and can disagree. Two mechanisms are doing the work that structure should do:
1. **Superseded banners** on stale bodies (IMPL Phase 2/6) rely on readers noticing and obeying them. PM-DESIGN-ALIGNMENT's own finding is that agents skim past banners.
2. **The precedence ladder** in AGENTS section 0 tells an agent which file wins, but it does not stop the losing copy from being read first or trusted by a reader who never opens AGENTS.

Per encode-lessons-in-structure, the fix is to remove the duplicated copies so there is nothing to arbitrate, and to delete the stale bodies so there is no superseded text left to skim past. The ladder can then shrink to "read README for orientation; each spec file owns one topic." PM-DESIGN-ALIGNMENT.md itself is a third instance of the same anti-pattern: a document that exists only to reconcile documents, which disappears once the copies are gone.

### 3.6 Lead judgment (what I would act on)

**Act on.**
- Delete IMPL-PLAN Phase 2 and Phase 6 stale bodies; replace with hybrid-only stubs or fold into Gate C scope. (B3, B4)
- Fix OPENAPI PUT to "server stores client-sent derived fields; does not recompute as SoT." (B1)
- Remove the `processing` status from IMPL Phase 1; keep only the five-state machine. (B2)
- Make DEPLOYMENT env-agnostic per the existing outline (`APP_HOSTNAME`, inventory worksheet, `.201` as example). (B5)
- Delete PM-DESIGN-ALIGNMENT.md after its blockers/warns are applied in place; keep a one-line pointer to the commit that resolved them.
- Archive `Slab capture app PRD.txt` (move to `docs/archive/` or mark frozen); it is no longer an active source.

**Consider.**
- Splitting CONTENT-WOO's publish sequence and PROMPTS' tuning workflow into DEPLOYMENT runbook. Low value for POC; do only if the files feel long after the other cuts.
- Moving ARCHITECTURE's secrets list to a pointer at DATA-MODEL. Nice-to-have; the current duplication is small.

**Noted.**
- Nits (N1 through N6): "PWA" wording, status-date bumps, DEPLOYMENT banner line-break glitch. Cheap to fix in the same pass; no design impact.

**Dismissed.**
- Rewriting TECH-SPEC or DATA-MODEL structure. Both are already clean single-mode references. Do not churn what is correct.

---

## 4. Target design (architect checkpoint)

This is the proposed end state. It stops here for your sign-off; nothing below has been written into the repo.

### 4.1 File list, one mode each

| File | Mode | Owns (single SoT) | Changes from today |
|---|---|---|---|
| `README.md` | explanation | Product orientation: what it is, hybrid in one paragraph, where to read next, repo remotes, POC bar. | Drop the per-file "what" table (duplicates AGENTS). Keep short. |
| `AGENTS.md` | reference | Hard rules only: precedence (shortened), do-not-build list, test/delivery expectations, gate map A/B/C. Each topic gets one pointer to its spec file instead of a restatement. | Slim sections 1 through 9 to pointers. Keep the Woo-safety and inference-sequencing hard rules verbatim (they are agent-critical). |
| `docs/TECH-SPEC-PIPELINE.md` | reference | Deterministic math + image prep SoT: constants, algorithms, TV-1 through TV-10, pricing rule shape. | No structural change. Bump status date; confirm TV-10 is in scope (AGENTS W2). |
| `docs/ARCHITECTURE.md` | explanation | Hybrid topology, swimlane, what-runs-where, why secrets stay server-side, status-machine transitions explained. | Remove "Remaining sections TBD" stale line (N3). Point secrets detail at DATA-MODEL. |
| `docs/DATA-MODEL.md` | reference | SQLite schema SoT + status state machine (the column-level truth) + settings keys. | Drop sheet/slider prefs from server settings (W3); "client" not "PWA" (N1). |
| `docs/OPENAPI.md` | reference | HTTP contract: schemas, endpoints, examples, error envelope. | Fix PUT no-recompute (B1), POST returns `calibrated` (W1), "client" not "PWA" (N1). |
| `docs/CONTENT-WOO.md` | reference | Content templates + Woo payload + dedupe + publish logging SoT. | PNG media (W4), fig-/feat-* only (W5), no calibration photos (W11). Keep publish sequence as a short numbered list, not prose. |
| `docs/PROMPTS.md` | reference | Call 1 / Call 2 prompt files, inputs, management, reset-to-default. | Trim tuning workflow to a 4-line note or move to DEPLOYMENT runbook. |
| `docs/DEPLOYMENT.md` | how-to | Operations playbook: host inventory worksheet, deploy, backup/restore, key rotation, smoke test. Env-agnostic. | Make host-agnostic (`APP_HOSTNAME`, `deploy/INVENTORY.md`); `.201` as non-normative example; fix Caddy handle order (W10); drop RemBG/ruler/1000px (W9). |
| `docs/IMPL-PLAN.md` | how-to | Phased build plan, hybrid-only: Phase 0 (Gates A+B), Gate C first draft listing, then API/Woo/inference/deploy phases. Acceptance + exit gates per phase. | Delete Phase 2 offline body and Phase 6 offline UAT; remove `processing` status from Phase 1; keep gate map aligned to A/B/C. |
| `docs/archive/PRD-2026-08.txt` (moved) | frozen record | Historical product intent + decisions log, as of the freeze. Not a source for new work. | Move PRD here with a header: "Frozen 2026-08-31. Superseded by AGENTS + ARCHITECTURE + TECH-SPEC." No edits to content. |

That is 9 active in-repo files (README, AGENTS, 7 specs) plus one archived file. Down from 12 active.

### 4.2 Ownership and the single-SoT map

Each decision has exactly one home; every other mention is a link:

| Decision | SoT file |
|---|---|
| Math (bdft, sqft, widths, crop, no-upscale) + TV vectors | TECH-SPEC |
| Hybrid topology and what-runs-where | ARCHITECTURE |
| Schema, status machine column, settings keys | DATA-MODEL |
| HTTP contract | OPENAPI |
| Content templates + Woo payload/publish behavior | CONTENT-WOO |
| Prompt files | PROMPTS |
| Deploy operations (env-agnostic) | DEPLOYMENT |
| Build phases and exit gates | IMPL-PLAN |
| Hard rules for agents + gate map A/B/C | AGENTS |
| Product orientation | README |

### 4.3 Deletes and archives

- **Delete** `docs/PM-DESIGN-ALIGNMENT.md` once its blockers (B1 through B5) and warns are applied in place. It is a reconciliation artifact; with the copies removed it has no content left.
- **Archive** `Slab capture app PRD.txt` to `docs/archive/PRD-2026-08.txt`, frozen, unedited, with a superseded header.
- **Delete (in place)** IMPL-PLAN Phase 2 offline body and Phase 6 offline UAT text; replace with hybrid stubs.
- **Delete** the `processing` status from IMPL-PLAN Phase 1.

### 4.4 Migration order (deletion first)

Order matters: remove the stale/duplicated content before adding or rewording, so the diff is mostly minus lines and no new contradiction can be introduced mid-flight.

1. **Delete stale bodies.** IMPL-PLAN Phase 2 offline body, Phase 6 offline UAT, Phase 1 `processing` status; PRD FR40/NFR server-processing wording (if PRD stays active one more pass) or skip since it is being archived.
2. **Fix the two contract contradictions in place.** OPENAPI PUT no-recompute (B1); POST returns `calibrated` (W1). These are wrong-code-if-followed, so they land before anything else that an agent might read.
3. **Make DEPLOYMENT env-agnostic** per `/workspace/slabuploader-env-agnostic-doc-outline.md`; fix Caddy handle order and drop RemBG/ruler/1000px.
4. **De-duplicate to single SoT.** Replace restated decisions in AGENTS, README, ARCHITECTURE with pointers; apply W3/W4/W5/W6/W7/W8/W9/W11/N1 through N6 fixes where they live.
5. **Slim AGENTS.md** sections 1 through 9 to hard-rules-plus-pointers; shorten the precedence ladder now that there are fewer copies.
6. **Archive the PRD**, then **delete PM-DESIGN-ALIGNMENT.md**. Both go last, after their content is confirmed relocated or resolved.

Each step is independently reviewable and shippable as its own docs commit on gitea-atd. None of them touches code, schema migrations, or run-host setup.

### 4.5 What stays locked (do not reopen)

Hybrid topology; `bdft = sqft * thickness_in`; AES-GCM server secrets never in browser; Woo draft + `SLAB-UAT-*` force-draft safety; inference OFF for the first claimable publish with Call 1/2 after Gate C; the A/B/C gate map (docs freeze / run-host setup / first draft listing). This refactor reorganizes and deletes; it does not change any of these.

---

## 5. Non-goals

- No code changes, no schema migrations, no scaffold, no run-host inventory or deploy. Docs only.
- No rewrite of TECH-SPEC or DATA-MODEL structure (both are already correct single-mode references).
- No new taxonomy, no invented categories, no best-practices content beyond what the locked decisions require.
- No reordering of Phases 0 through 6; phase names and gate map stay as delivery chapters.
- No commit or push in this pass. The proposal is a design checkpoint only.
- Not doing the env-agnostic deploy sign-off itself (that is Ty's call via CoS, tracked separately).

---

## 6. Open questions for Ty (max 3)

1. **PRD disposition.** Archive `Slab capture app PRD.txt` to `docs/archive/` as a frozen record, or delete it outright now that AGENTS + ARCHITECTURE + TECH-SPEC carry all active intent? I recommend archive (keeps the decisions log for audit).
2. **PM-DESIGN-ALIGNMENT.md.** Delete it once its blockers/warns are applied in place, or keep a trimmed version as a living "known contradictions" tracker until Gate C is green? I recommend delete-after-fixes; a standing contradiction list recreates the anti-pattern this refactor removes.
3. **Scope of this pass.** Do you want the full target set (sections 4.1 through 4.4) executed in one docs commit, or staged as separate commits per migration step (deletions first, then env-agnostic deploy, then de-duplication)? I recommend staged so each is reviewable and the deletion-first order is visible.

---

## 7. No repo writes confirmed

This pass wrote exactly one file: `/workspace/slabuploader-docs-refactor-proposal.md` (this document), which lives outside the repo at `/workspace/`. No files under `/workspace/gitea-atd/Ty_Tech/SlabUploader/` were created, modified, or deleted. Nothing was committed or pushed. The repo is untouched and remains on its current HEAD; this proposal is a design checkpoint awaiting your sign-off before any rewrite begins.
