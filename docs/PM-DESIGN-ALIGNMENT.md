# SlabUploader: PM vs design alignment

**Status:** On gitea-atd for Ty review. 2026-08-31 PT. Human rewrite (unslop). Other doc patches still on HOLD.
**Authors:** Principal PM (product alignment). Dev Manager (technical landmines).
**Baseline on gitea-atd `main`:** `457711b` (AGENTS + Phase 0). `4ec478f` (PRD/README/Woo/DEPLOYMENT patches).
**Also compared:** `/workspace/slabuploader-poc-review-package.md` sections 1-2. Env-agnostic section 3 draft is not on gitea.

---

## How to read this

| Label | Meaning |
|---|---|
| **Agreed** | Review package, AGENTS, and the design specs say the same thing |
| **Conflict** | Live docs disagree. A coding agent can pick the wrong one. |
| **Missing** | Clarity is absent, or it only lives in a `/workspace` draft not on gitea |

---

## 1. POC outcome and Woo safety

**Agreed.** End goal: phone photo becomes a customer-ready listing on www.whidbeywoodstore.com.

Woo safety works like this. Test products are created as drafts with SKU prefix `SLAB-UAT-*`, so customers never see them until Ty intentionally publishes a real SKU. Settings field `woo_create_status` is `draft` or `publish`, default `draft`. Final POC is one real SKU published after Ty review.

This is locked in AGENTS section 5, PRD decisions 12/FR36 (`4ec478f`), CONTENT-WOO, DATA-MODEL, OPENAPI, DEPLOYMENT smoke, and review package section 1.

**Conflict.** None material on Woo safety after `4ec478f`.

**Missing.** Env-agnostic deploy wording still only in `/workspace` package section 3, not on gitea (HOLD). Does not block Woo alignment.

---

## 2. Phone does the math, server stores it

**Agreed.** The phone (client) owns mask, sliders, axis, sqft, bdft, and the 3:4 PNG. The server stores those numbers, runs U2Net on demand, talks to Woo, and proxies inference. The server must not recompute happy-path math as the source of truth.

Locked in ARCHITECTURE, TECH-SPEC, AGENTS section 1, IMPL-PLAN Phase 0 (`457711b`), README, and the PRD stack rewrite (`4ec478f`).

**Conflict.** IMPL-PLAN Phases 1+ still carry stale offline/OCR/ruler and `processing` to `ready` language. Banners say ignore those sections, but agents skim past banners. OPENAPI PUT still says the server re-runs derived math (see blocker B1 below).

**Missing.** Full rewrite of IMPL-PLAN Phases 1 to 6 for hybrid plus Woo draft UAT.

---

## 3. Board-foot formula

**Agreed.** `bdft = sqft x thickness_in` (TECH-SPEC TV-3). Same in AGENTS, IMPL-PLAN Phase 0, PRD FR4, DEPLOYMENT smoke.

**Conflict.** None after `4ec478f`. CONTENT-WOO `length_ft = floor(length_in / 12)` is display conversion only, not bdft math.

**Missing.** None.

---

## 4. Image prep (3:4, 1600, sliders)

**Agreed.** Sheet and sliders, mask confirm, 3:4 PNG, 80% fill, at least 1600px or retake, no fake upscale. TECH-SPEC sections 3 to 5, AGENTS, ARCHITECTURE, and review package section 2 match.

**Conflict (narrow).** PRD FR19 still prices by "species and wood category." TECH-SPEC and DATA-MODEL price by species only ($/bdft). CONTENT-WOO still says media upload is JPEG. TECH-SPEC wants transparent PNG (warn W4).

**Missing.** Explicit line in PRD when writes reopen: wood category is for taxonomy, not for $/bdft in the POC.

---

## 5. Where secrets live

**Agreed.** Woo and inference secrets sit on the server under AES-GCM. `SLAB_AES_KEY` is env only. Never in the browser. ARCHITECTURE, AGENTS section 4, PRD D15, DATA-MODEL.

**Conflict (soft).** DATA-MODEL and OPENAPI still list sheet/slider prefs in server settings. ARCHITECTURE and AGENTS say localStorage (warn W3).

**Missing.** None.

---

## 6. Inference stays OFF until first draft listing works

**Agreed.** The test suite must pass with inference OFF. First draft listing (Gate C) means inference OFF, manual path, and Woo draft. Call 1 and Call 2 come after that, still inside the POC. Call 2 is user-triggered. LoRA is deferred. No LLM dimensions.

Review package, AGENTS section 6, ARCHITECTURE, PROMPTS, Phase 0 out-of-scope.

**Conflict.** None on sequencing intent.

**Missing.** Phase 5 rewrite later if any "top-down only" flavor remains versus "all photos @1024."

---

## 7. Slab status vs Woo create status

**Agreed.** Slab lifecycle: `draft` to `calibrated` to `ready` to `publishing` to `published` or `failed`. Woo create status: `draft` or `publish`. Do not conflate them. A slab can show `published` while the storefront still only has a Woo draft. AGENTS and CONTENT-WOO say this explicitly.

**Conflict (soft).** The word "published" is overloaded. OPENAPI POST creates a "calibrated draft" but returns `status: draft` (warn W1).

**Missing.** Optional glossary row when writes reopen.

---

## 8. Online only

**Agreed.** No offline PWA in the POC. Review package, AGENTS, README (`4ec478f`), PRD decision 18, TECH-SPEC, Phase 0.

**Conflict.** IMPL-PLAN Phase 2 and Phase 6 still specify offline capture. Superseded banners exist. Agents may skim past them.

**Missing.** Phase 2/6 body rewrite when writes reopen.

---

## 9. Phase and gate map

Human names for the gates:

| Label | Human name | What it means |
|---|---|---|
| Gate A | Docs freeze | Product locks written into the repo |
| Gate B | Run-host setup | Inventory the real host, deploy skeleton |
| Gate C | First draft listing | One Woo draft listing with inference OFF |

**Agreed.** Phases 0 to 6 stay. Phase 0 covers docs freeze and run-host setup. First draft listing is early Phase 1. Inference starts after first draft listing.

**Conflict.** Docs freeze raced onto gitea while Ty HOLDed further writes and asked for env-agnostic deploy plus this alignment. Deploy docs still hard-code `.201` in AGENTS section 9, DEPLOYMENT, and PRD FR42 (blockers B2/B5).

**Missing.** Ty sign-off via CoS on the env-agnostic deploy amend before run-host setup. Coding agents and inventory are held.

---

## Matrix

| Topic | Status |
|---|---|
| POC outcome and Woo safety | Agreed (on gitea) |
| Phone math vs server store | Agreed core. Conflict in Phase 1+ / OPENAPI PUT. |
| bdft formula | Agreed |
| Image prep | Agreed. Narrow pricing/PNG conflicts. |
| Secrets location | Agreed. Soft prefs storage drift. |
| Inference OFF then Call 1/2 | Agreed |
| Slab lifecycle vs woo_create_status | Agreed. Wording overload residual. |
| Online only | Agreed. Phase 2/6 text stale. |
| Phase / gate sequencing | Map agreed. Missing env-agnostic sign before run-host setup. |

---

## PM take

Core product intent and the design source of truth (TECH-SPEC, ARCHITECTURE, AGENTS, Phase 0, Woo safety) align after `457711b` and `4ec478f`. What is left is implementer landmines, not a PM vs architecture fight. OPENAPI still tells the server to recompute math. Deploy docs hard-code a host. IMPL-PLAN bodies still describe the old offline pipeline.

**Recommend via CoS:** when HOLD lifts, authorize one small docs commit for env-agnostic deploy plus OPENAPI "no server recompute" before any coding agents or run-host setup. Optional IMPL-PLAN 1+/2/6 and PRD FR19 cleanup in the same or a follow-on commit.

---

## Technical consistency audit

**Status:** Workspace-only. No gitea commit, push, or SSH.
**Authors:** Dev Manager, for CoS / Principal PM.
**Repo HEAD:** `4ec478f` on `main` (`Ty_Tech/SlabUploader` @ gitea-atd).
**Audit date:** 2026-08-31 PT.
**HOLD:** Do not write to gitea until CoS lifts HOLD. Fixes below are recommended drafts only. Env-agnostic deploy amend remains unsigned. See `/workspace/slabuploader-poc-review-package.md` section 3 and `/workspace/slabuploader-env-agnostic-doc-outline.md`.

---

### What the docs freeze locked in (SHAs + files)

```
git log -5 --oneline
4ec478f docs: finish Gate A contradiction patches
457711b docs: Gate A freeze - AGENTS.md + hybrid Phase 0
a94d81d docs: set gitea-atd Ty_Tech/SlabUploader as remotes SoT
4d9f307 docs: lock inference review - prompts, Call 1/2, feat tags
4e97770 docs: lock revised capture pipeline and hybrid architecture
```

| SHA | Commit | Files locked |
|---|---|---|
| `457711b` | Docs freeze: AGENTS.md + hybrid Phase 0 | `AGENTS.md` (new, 148 lines). `docs/IMPL-PLAN.md` Phase 0 rewrite, plus banner that Phases 1+ are still stale. |
| `4ec478f` | Finish docs-freeze contradiction patches | `README.md`, `Slab capture app PRD.txt`, `docs/CONTENT-WOO.md`, `docs/DATA-MODEL.md`, `docs/DEPLOYMENT.md`, `docs/OPENAPI.md` |

Already consistent before the freeze (not rewritten in those SHAs, but source of truth per AGENTS precedence):

- `docs/TECH-SPEC-PIPELINE.md`: client-authoritative math, `bdft = sqft x thickness_in`, TV-1 through TV-10, no `/12`
- `docs/ARCHITECTURE.md`: hybrid topology, AES-GCM secrets, slab status machine
- `docs/PROMPTS.md`: Call 1/2 (no freeze delta)

Product locks now in-repo via AGENTS + patches:

- Hybrid: client is happy-path measure/crop source of truth. Server stores, runs on-demand U2Net, talks to Woo, proxies inference.
- `bdft = sqft x thickness_in` (no `/12`)
- Secrets: server AES-GCM only. Never browser.
- Online-only POC. Offline, OCR, and ruler are deferred.
- `woo_create_status` is `draft` or `publish`, default `draft`. `SLAB-UAT-*` forces Woo draft on PROD so customers never see test products.
- Health: `GET /api/health`
- Phase 0 covers docs freeze and run-host setup. First draft listing is early Phase 1 claimable Woo draft with inference OFF.

---

### What already agrees (safe if agents follow AGENTS)

Agents that follow AGENTS.md section 0 precedence and ignore flagged-stale text will get these right:

| Topic | Where it agrees |
|---|---|
| Doc precedence | AGENTS section 0: TECH-SPEC, then ARCHITECTURE, then AGENTS, then DATA/OPENAPI/CONTENT/PROMPTS/DEPLOY, then IMPL Phase 0 only, then PRD/README intent |
| Who runs what | AGENTS section 1, ARCHITECTURE sections 1 to 4, TECH-SPEC section 1.5 / 9.8, README, PRD Architecture rewrite (post-`4ec478f`), DEPLOYMENT layout note |
| bdft + TV-3 | TECH-SPEC section 4.6 + TV-3. AGENTS section 3. PRD FR4. IMPL Phase 0. DEPLOYMENT smoke section 8.4. |
| No fake upscale / at least 1600 | TECH-SPEC section 5 + TV-6/7. AGENTS sections 2 to 3. IMPL Phase 0. |
| Secrets AES-GCM server | ARCHITECTURE section 5. AGENTS section 4. DATA-MODEL `settings`. OPENAPI SettingsView. PRD D15. |
| Woo safety | AGENTS section 5. CONTENT-WOO section 2.4. DATA-MODEL `woo_create_status`. OPENAPI SettingsView. DEPLOYMENT smoke section 8. README. PRD D12/FR36. |
| Slab vs Woo status | AGENTS section 7. ARCHITECTURE section 6. DATA-MODEL. CONTENT-WOO section 2.4. |
| Inference sequenced | AGENTS section 6. ARCHITECTURE clarifications 4 to 5. OPENAPI infer endpoints. First draft listing keeps inference OFF. |
| Phase 0 hybrid scope | IMPL-PLAN Phase 0 (post-`457711b`) matches AGENTS. Phase 2 banner says SUPERSEDED. |
| Health path | AGENTS section 9. DEPLOYMENT sections 7 to 8. OPENAPI Health. IMPL Phase 0. |

If agents start at AGENTS + TECH-SPEC + ARCHITECTURE + IMPL Phase 0 only, the run-host skeleton is coherent. The landmines sit in Phases 1+/risks/PRD leftovers/OPENAPI one-liners and the hard-coded `.201` deploy story.

---

### Remaining contradictions

Severity:

- **Blocker**: wrong code if followed
- **Warn**: likely wrong path or wasted work
- **Nit**: wording drift, low blast radius

#### Blockers

**B1. OPENAPI says server re-runs derived math when inputs change.**
Where: `docs/OPENAPI.md`, `PUT /api/v1/slabs/{id}` (around L154).
Wrong path: Implement server-side recompute of sqft/bdft/widths as source of truth on PUT. Violates AGENTS section 3 and TECH-SPEC sections 1.5 / 9.8.
Fix: Server stores client-sent derived fields. May validate shape/ranges. Must not recompute mask/sqft/bdft as authoritative. Client re-runs TECH-SPEC math and PUTs new numbers.

**B2. IMPL-PLAN Phase 1 invents a `processing` to `ready` status.**
Where: `docs/IMPL-PLAN.md` Phase 1 (around L75).
Wrong path: Add a `processing` slab status and a server job that "processes" photos toward `ready`. Reintroduces the old server pipeline under a new name.
Fix: Rewrite Phase 1 to hybrid. CRUD + upload stores client-calibrated payloads. Status machine is only `draft` to `calibrated` to `ready` to `publishing` to `published` or `failed`. Queue only for publish, inference, and U2Net-on-demand. Never for measure/crop.

**B3. IMPL-PLAN Phase 2 body still specifies offline, OCR, and ruler.**
Where: `docs/IMPL-PLAN.md` Phase 2 (around L86 to L106). Banner says SUPERSEDED, but Goal/Deliverables/Acceptance/Exit still demand Tesseract OCR, OpenCV.js ruler, Workbox, IndexedDB, airplane-mode UAT.
Wrong path: Implement the body. Builds the exact "do not build" list in AGENTS section 2.
Fix: Replace Phase 2 body with a short stub: "Deferred post-POC. Capture UX lives in early Phase 1 / first draft listing (online hybrid). See AGENTS section 2." Delete OCR/ruler/offline acceptance lines.

**B4. IMPL-PLAN Phase 6 UAT still requires offline capture, OCR, and "server normalization".**
Where: `docs/IMPL-PLAN.md` Phase 6 (around L181 to L183, L175 to L179).
Wrong path: Write UAT scripts and perf budgets for OCR 1 to 2s and server normalization 3 to 5s. Gate exit on offline capture.
Fix: UAT suite is the hybrid online path. Drop offline capture. Perf is client measure/crop budgets plus U2Net-on-demand only. Inventory host via `APP_*` (see env-agnostic section).

**B5. Deploy docs still hard-code `.201` / `slab.tyubumini.local`.**
Where: `AGENTS.md` section 9. `docs/DEPLOYMENT.md` title/target/sections 1, 4, 6, 7. `README.md` L6. `docs/IMPL-PLAN.md` Phase 0 Gate B (.201 inventory), Phase 6, Risks, DoD. PRD FR42 / deploy bullets.
Wrong path: Bake `192.168.1.201` / `slab.tyubumini.local` into compose, Caddy, health URLs, runbooks. Treat TyUBUMini as mandatory. Skip inventory worksheet.
Fix: Apply `/workspace/slabuploader-env-agnostic-doc-outline.md`. Use `APP_HOST` / `APP_HOSTNAME` / ports and `deploy/INVENTORY.md`. Historical lab as non-normative callout only. Do not push until CoS lifts HOLD.

#### Warns

**W1. OPENAPI create returns `status: draft` for a "calibrated draft".**
Where: `docs/OPENAPI.md` `POST /api/v1/slabs` (around L146 to L147).
Wrong path: Skip `calibrated` entirely. Conflate "photos taken" draft with "mask+numbers uploaded" calibrated. Break first-draft-listing poll/UI assumptions.
Fix: POST after client confirm returns `201` with `status: calibrated` (align ARCHITECTURE section 6, DATA-MODEL, AGENTS section 7).

**W2. AGENTS says "TV-10 only after TECH-SPEC defines it," but TECH-SPEC already has TV-10.**
Where: `AGENTS.md` section 3 (around L80) vs `docs/TECH-SPEC-PIPELINE.md` section 8 TV-10 Rounding (around L192 to L196).
Wrong path: Skip rounding unit tests thinking TV-10 is undefined.
Fix: AGENTS should say "Port TV-1 through TV-10." IMPL Phase 0 acceptance should include TV-10.

**W3. DATA-MODEL / OPENAPI put sheet prefs in server `settings`. ARCHITECTURE/AGENTS say localStorage.**
Where: DATA-MODEL settings keys `user_sensitivity|edge_offset|feather|sheet_mode` (around L184). OPENAPI SettingsView (around L132 to L133). Versus AGENTS section 4 / ARCHITECTURE section 5.
Wrong path: Dual-write prefs to SQLite AES settings table, or encrypt non-secrets, or fight over which wins on load.
Fix: Remove sheet/slider prefs from server settings schema, or mark optional sync later. Keep localStorage as source of truth for POC.

**W4. CONTENT-WOO media upload says "JPEG bytes". TECH-SPEC output is transparent PNG.**
Where: `docs/CONTENT-WOO.md` section 2.4 (around L114) vs TECH-SPEC section 5 / PRD FR31.
Wrong path: Re-encode processed PNGs to JPEG and lose alpha before Woo media upload.
Fix: Say "PNG bytes (processed inventory images)." Mention Woo accepts image/*. Keep alpha.

**W5. CONTENT-WOO tag auto-assign still says `[character]` / optional `[species]` tags.**
Where: `docs/CONTENT-WOO.md` section 2.3 (around L81 to L83) vs DATA-MODEL / PRD D8: `fig-*` + `feat-*` only.
Wrong path: Create non-fig/feat Woo tags named after character strings. Ignore feat-* mapping.
Fix: Rewrite section 2.3 to match DATA-MODEL: fig-* (1+) + feat-* (0+ from Call 1). No generic character/species tag invent.

**W6. PRD FR17 vs D8 / DATA-MODEL on tags.**
Where: PRD FR17 "Tags: fig-* only, 1+ required" vs Decisions log #8 + DATA-MODEL `fig_tag_ids` + `feat_tag_ids`.
Wrong path: Drop feat-* from schema/UI/publish payload.
Fix: FR17 should say fig-* (1+) and feat-* (0+). Cite DATA-MODEL.

**W7. PRD FR19 + pricing schema still "species and wood category".**
Where: PRD FR19 (around L134). PRD pricing schema `wood_category: string` (around L241). Versus TECH-SPEC section 6 / DATA-MODEL `pricing_rules` = species only.
Wrong path: Build wood-category pricing tiers or composite keys.
Fix: FR19 + schema become species-only. Wood-category pricing is deferred.

**W8. PRD FR40 + NFR still say "server-side processing" / "server normalization".**
Where: PRD FR40 (around L190). NFR Performance (around L200 to L201).
Wrong path: Put measure/crop on the publish path server-side. Budget 3 to 5s server normalization as a feature.
Fix: FR40 is Woo sync + status/log only (client already did processing). NFR is client local processing plus optional U2Net latency. Drop "server normalization."

**W9. DEPLOYMENT section 9 / Risks still mention RemBG, ruler, `output_px` drop to 1000.**
Where: `docs/DEPLOYMENT.md` section 9 (around L161). `docs/IMPL-PLAN.md` Risks (around L201 to L202).
Wrong path: Add RemBG server path. Lower OUTPUT_PX_MIN below 1600 (violates TECH-SPEC TV-7; undersized means retake, not a lower min).
Fix: Delete ruler row for POC or mark deferred. U2Net-on-demand only. Never drop below 1600.

**W10. Caddy fragment shape is foot-gunny.**
Where: `docs/DEPLOYMENT.md` section 4. Site-level `reverse_proxy frontend:80` plus `handle /api/* { reverse_proxy fastapi:8000 }`.
Wrong path: Ship as-written. `/api/*` may never reach fastapi depending on Caddy directive order. Health smoke fails.
Fix: Explicit `handle /api/*` to fastapi and `handle { reverse_proxy frontend }` (or `handle_path`) so API wins. Keep service name `fastapi` consistent with compose.

**W11. Calibration-photo language leftovers in CONTENT-WOO.**
Where: CONTENT-WOO section 2.4 (around L116 to L117) "Calibration photos are excluded (FR2)". PRD D1 says no calibration photos exist.
Wrong path: Invent `kind=calibration` in upload meta / schema. OPENAPI/DATA-MODEL correctly only allow `inventory`.
Fix: Delete the sentence. Say "only inventory photos (kind=inventory)."

#### Nits

**N1.** DATA-MODEL / OPENAPI still say "PWA" (DATA-MODEL L7; OPENAPI Versioning L301). Risk: agents scaffold Workbox. Fix: "client" / "SvelteKit app". Offline PWA deferred.

**N2.** PRD Architecture header still "Client (mobile web / PWA)" (around L210). Body correctly says offline deferred. Fix: "Client (mobile web / SvelteKit)".

**N3.** ARCHITECTURE status line "Remaining sections TBD" (L4). Topology is locked. Stale TBD undercuts confidence. Fix: "Hybrid topology locked at docs freeze. Remaining ops sections TBD."

**N4.** TECH-SPEC status date still 2026-08-27. AGENTS docs freeze 2026-08-31. Content matches. Optional status bump.

**N5.** Review package Appendix C checklist items 1 to 7 largely done in-repo. Item 0 (env-agnostic) not done. Package preamble still reads pre-freeze in places ("AGENTS referenced, file missing"). Mark items 1 to 7 done. Keep item 0 open.

**N6.** DEPLOYMENT docs-freeze banner line-break glitch (L4 to L8). "LAN/Tailscale" sentence split across the callout. Fix when env-agnostic rewrite lands.

---

### Env-agnostic gap

| Artifact | Role | Normative host? |
|---|---|---|
| Repo: `AGENTS.md` section 9, `docs/DEPLOYMENT.md`, `README.md`, `IMPL-PLAN.md` Gate B / Phase 6 / DoD, PRD FR42 | Current source of truth agents will read | Yes. Hard-codes `.201` / TyUBUMini / `slab.tyubumini.local` / `192.168.1.201`. |
| Workspace: `/workspace/slabuploader-poc-review-package.md` section 3 | Proposed deploy source of truth. Not in repo. | No. Uses `APP_HOST` / `APP_HOSTNAME` / inventory worksheet. Lab example is non-normative. |
| Workspace: `/workspace/slabuploader-env-agnostic-doc-outline.md` | Patch outline for CoS-signed amend | Same |

These two workspace markdown files are drafts, not source of truth yet. Agents must not treat `/workspace/*.md` as repo authority. Until the env-agnostic amend lands under CoS HOLD lift, run-host inventory is blocked if agents assume `.201` is mandatory, and equally blocked if they invent a different host without inventory.

Product locks (hybrid, bdft, Woo safety) are independent of this gap and already in-repo.

---

### Recommended next doc patches when CoS lifts HOLD

Docs only. No scaffold or code. Do not reopen hybrid, Woo, or bdft locks.

1. **Env-agnostic deploy cut (run-host unblocker).** Per `/workspace/slabuploader-env-agnostic-doc-outline.md`:
   - `AGENTS.md` section 9 becomes inventory-first + `https://${APP_HOSTNAME}/api/health`. Lab example is a callout only.
   - `docs/DEPLOYMENT.md` title/target/section 1 point at `deploy/INVENTORY.md` worksheet. Caddy uses `${APP_HOSTNAME}`. Fix handle order (W10). Drop RemBG SoT smell (W9).
   - `README.md` deploy line. PRD FR42 / deploy bullets. `IMPL-PLAN` Gate B / Phase 6 / Risks / DoD host wording.
2. **OPENAPI one-liners (B1, W1).** PUT does not recompute source of truth. POST returns `calibrated`.
3. **AGENTS TV-10 (W2).** Require TV-1 through TV-10.
4. **IMPL-PLAN Phase 1 (B2).** Kill `processing` to `ready`. Hybrid CRUD/store language.
5. **IMPL-PLAN Phase 2 (B3).** Replace body with deferred stub.
6. **IMPL-PLAN Phase 6 + Risks (B4, W9).** Online UAT only. No OCR/offline/server-normalization budgets. No `output_px` to 1000.
7. **CONTENT-WOO (W4, W5, W11).** PNG media. fig-*/feat-* assign. No calibration photos.
8. **DATA-MODEL / OPENAPI settings (W3, N1).** Drop server sheet prefs (or defer). Say "client" not "PWA".
9. **PRD leftovers (W6 to W8, N2).** FR17 feat-*. FR19 species-only. FR40/NFR hybrid wording. Pricing schema.
10. **Refresh workspace review package.** Mark Appendix C items 1 to 7 done. Keep item 0 plus sign-off for env-agnostic only.

After patches: one docs commit on gitea-atd, report SHA to CoS, then run-host inventory on the designated host. Still no silent `.201` assumption.

---

### Audit verdict

The docs freeze did land the critical product locks: hybrid, bdft, AES, Woo draft/`SLAB-UAT-*`, Phase 0 rewrite, AGENTS precedence. Scaffolding run-host math/AES/health is safe if agents obey AGENTS + TECH-SPEC + Phase 0.

Run-host deploy, and any agent that reads IMPL Phase 1/2/6, OPENAPI PUT, or PRD FR40/NFR without the precedence discipline, will still ship the wrong architecture: server recompute, `processing` status, offline/OCR/ruler, JPEG without alpha, hard-coded `.201`.

Highest-ROI doc fixes when HOLD lifts: (1) env-agnostic deploy, (2) OPENAPI "re-runs derived math", (3) gut IMPL Phase 2/6 stale bodies, (4) Phase 1 status machine.
