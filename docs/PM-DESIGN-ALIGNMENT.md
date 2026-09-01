# SlabUploader — PM requirements ↔ design alignment report

Status: WORKSPACE ONLY · 2026-08-31 PT · **do not commit/push** (Ty HOLD on gitea writes)  
Authors: Principal PM (product alignment §§1–9 + matrix) · Dev Manager (technical consistency / landmines)  
Baseline commits on gitea-atd `main`: `457711b` (AGENTS + Phase 0), `4ec478f` (PRD/README/Woo/DEPLOYMENT patches)  
Also compared: `/workspace/slabuploader-poc-review-package.md` §§1–2 (env-agnostic §3 draft not on gitea)

---

## How to read

| Label | Meaning |
|---|---|
| **Agreed** | Review package intent, AGENTS, and design specs (TECH-SPEC / ARCHITECTURE / landed patches) say the same thing |
| **Conflict** | Two or more live SoT docs disagree; coding agents can pick the wrong one |
| **Missing** | Required clarity absent, or only lives in `/workspace` drafts not on gitea |

---

## 1. POC outcome & Woo firebreak

| | |
|---|---|
| **Agreed** | Phone → customer-ready listing on **www.whidbeywoodstore.com**. UAT on PROD as **Woo draft** + **`SLAB-UAT-*`** (forced draft). Final POC = one real SKU → **Woo publish** after Ty review. Settings field **`woo_create_status`**: `draft | publish`, default `draft`. Landed in AGENTS §5, PRD decisions 12/FR36 (4ec478f), CONTENT-WOO, DATA-MODEL, OPENAPI, DEPLOYMENT smoke, review package §1. |
| **Conflict** | None material on the firebreak itself after 4ec478f. |
| **Missing** | Env-agnostic deploy wording still only in `/workspace` package §3 — not on gitea (HOLD). Does not block Woo alignment. |

---

## 2. Hybrid vs server pipeline

| | |
|---|---|
| **Agreed** | ARCHITECTURE + TECH-SPEC + AGENTS §1 + IMPL-PLAN Phase 0 (457711b) + README + PRD stack/calibration rewrite (4ec478f): **client** owns mask/sliders/axis/sqft/bdft/3:4 PNG; **server** stores, U2Net on demand, Woo, inference proxy. Server must not recompute happy-path math as SoT. |
| **Conflict** | **IMPL-PLAN Phases 1+** still carry stale offline/OCR/ruler/`pending`/`processing→ready` language (banners say ignore). OPENAPI PUT still says server re-runs derived math (see Dev Manager B1). |
| **Missing** | Full rewrite of IMPL-PLAN Phases 1–6 to hybrid + Woo draft UAT. |

---

## 3. bdft formula

| | |
|---|---|
| **Agreed** | TECH-SPEC: `bdft = sqft × thickness_in` (TV-3). AGENTS, IMPL-PLAN Phase 0, PRD FR4 (patched), DEPLOYMENT smoke. |
| **Conflict** | None on formula after 4ec478f. CONTENT-WOO `length_ft = floor(length_in / 12)` is **display conversion**, not bdft. |
| **Missing** | — |

---

## 4. Image prep (3:4, 1600, sliders)

| | |
|---|---|
| **Agreed** | TECH-SPEC §§3–5: sheet/sliders, mask confirm, 3:4 PNG, 80% fill, ≥1600 or retake, no fake upscale. AGENTS + ARCHITECTURE + review package §2 match. |
| **Conflict** | Narrow: PRD FR19 still “species **and wood category**” pricing while TECH-SPEC/DATA-MODEL = **species-only** $/bdft. CONTENT-WOO media “JPEG” vs TECH-SPEC transparent PNG (Dev Manager W4). |
| **Missing** | Explicit “wood category for taxonomy, not for $/bdft in POC” in PRD when writes reopen. |

---

## 5. Secrets location

| | |
|---|---|
| **Agreed** | ARCHITECTURE + AGENTS §4 + PRD D15 (patched) + DATA-MODEL: Woo + inference secrets **server AES-GCM**; `SLAB_AES_KEY` env only; never browser. |
| **Conflict** | Soft: DATA-MODEL/OPENAPI still list sheet/slider prefs in server settings while ARCHITECTURE/AGENTS say localStorage (Dev Manager W3). |
| **Missing** | — |

---

## 6. Inference OFF-first, then Call 1/2

| | |
|---|---|
| **Agreed** | Review package + AGENTS §6 + ARCHITECTURE + PROMPTS + Phase 0 out-of-scope: suite passes OFF; **Gate C** = OFF + manual + Woo draft; **Call 1/2 after Gate C**, still inside POC; Call 2 user-triggered; LoRA deferred; no LLM dimensions. |
| **Conflict** | None on sequencing intent. |
| **Missing** | Phase 5 rewrite later for “all photos @1024” vs older “top-down only” flavor if any remains. |

---

## 7. Slab lifecycle vs `woo_create_status`

| | |
|---|---|
| **Agreed** | Slab: `draft → calibrated → ready → publishing → published|failed`. Woo: **`woo_create_status`** `draft | publish`. Explicit do-not-conflate in AGENTS/CONTENT-WOO. Slab `published` ≠ storefront live when create was Woo draft. |
| **Conflict** | Soft word overload on “published.” OPENAPI POST “calibrated draft” returning `status: draft` (Dev Manager W1). |
| **Missing** | Optional glossary row when writes reopen. |

---

## 8. Online-only

| | |
|---|---|
| **Agreed** | Review package + AGENTS + README (4ec478f) + PRD decision 18 + TECH-SPEC. Phase 0 excludes offline PWA. |
| **Conflict** | IMPL-PLAN Phase 2 / Phase 6 still specify offline capture (superseded banners — agents may skim past). |
| **Missing** | Phase 2/6 body rewrite when writes reopen. |

---

## 9. Phase / Gate sequencing

| | |
|---|---|
| **Agreed** | Phase 0–6 retained. **Phase 0 = Gates A+B.** **Gate C = early Phase 1.** Inference after Gate C. |
| **Conflict** | Gate A raced onto gitea while Ty HOLDed further writes and asked env-agnostic + this alignment. Deploy host hard-coding still in AGENTS §9 / DEPLOYMENT / PRD FR42 (B2/B5). |
| **Missing** | Ty sign via CoS on env-agnostic deploy amend before Gate B. Coding agents / inventory held. |

---

## Matrix (quick)

| Topic | Status |
|---|---|
| POC outcome & Woo firebreak | **Agreed** (on gitea) |
| Hybrid vs server pipeline | **Agreed** core; **Conflict** residual Phase 1+ / OPENAPI PUT |
| bdft formula | **Agreed** |
| Image prep | **Agreed**; narrow pricing/PNG conflicts |
| Secrets location | **Agreed**; soft prefs storage drift |
| Inference OFF → Call 1/2 | **Agreed** |
| Slab lifecycle vs woo_create_status | **Agreed** (wording overload residual) |
| Online-only | **Agreed**; Phase 2/6 text stale |
| Phase/Gate sequencing | **Agreed** map; **Missing** env-agnostic sign before Gate B |

---

## Principal PM conclusion

Core product intent and design SoT (**TECH-SPEC, ARCHITECTURE, AGENTS, Phase 0, Woo firebreak**) **align** after `457711b`/`4ec478f`. Remaining risk is **implementer landmines** (OPENAPI recompute, hard-coded host, stale IMPL-PLAN bodies) — not a PM↔architecture split.

**Recommend via CoS:** when HOLD lifts, authorize one small docs commit for **env-agnostic deploy + OPENAPI “no server recompute SoT”** before any coding agents or Gate B; optional IMPL-PLAN 1+/2/6 and PRD FR19 cleanup in the same or follow-on commit.

---

## Dev Manager — technical consistency (full audit)

# SlabUploader PM↔design alignment — technical consistency

**Status:** Workspace-only audit (HOLD). No gitea commit/push/SSH performed.  
**Authors:** Dev Manager (executor) · for CoS / Principal PM  
**Repo HEAD:** `4ec478f` on `main` (`Ty_Tech/SlabUploader` @ gitea-atd)  
**Audit date:** 2026-08-31 PT  
**HOLD note:** Do **not** write to gitea until CoS lifts HOLD. Fixes below are **recommended workspace drafts only** — this report does not edit the repo. Env-agnostic deploy amend remains unsigned (see `/workspace/slabuploader-poc-review-package.md` §3 / `/workspace/slabuploader-env-agnostic-doc-outline.md`).

---

## 1. What Gate A actually locked in repo (SHAs + files)

```
git log -5 --oneline
4ec478f docs: finish Gate A contradiction patches
457711b docs: Gate A freeze — AGENTS.md + hybrid Phase 0
a94d81d docs: set gitea-atd Ty_Tech/SlabUploader as remotes SoT
4d9f307 docs: lock inference review — prompts, Call 1/2, feat tags
4e97770 docs: lock revised capture pipeline and hybrid architecture
```

| SHA | Commit | Files locked |
|---|---|---|
| **`457711b`** | Gate A freeze — AGENTS.md + hybrid Phase 0 | `AGENTS.md` (new, 148 lines); `docs/IMPL-PLAN.md` Phase 0 rewrite (+ banner that Phases 1+ are still stale) |
| **`4ec478f`** | Finish Gate A contradiction patches | `README.md`, `Slab capture app PRD.txt`, `docs/CONTENT-WOO.md`, `docs/DATA-MODEL.md`, `docs/DEPLOYMENT.md`, `docs/OPENAPI.md` |

**Already consistent before Gate A (not rewritten in those SHAs, but SoT per AGENTS precedence):**
- `docs/TECH-SPEC-PIPELINE.md` — client-authoritative math, `bdft = sqft × thickness_in`, TV-1…**TV-10**, no `/12`
- `docs/ARCHITECTURE.md` — hybrid topology, AES-GCM secrets, slab status machine
- `docs/PROMPTS.md` — Call 1/2 (not re-audited deeply; no Gate A delta)

**Gate A product locks now in-repo (via AGENTS + patches):**
- Hybrid: client = happy-path measure/crop SoT; server = store / on-demand U2Net / Woo / inference proxy
- `bdft = sqft × thickness_in` (no `/12`)
- Secrets: server AES-GCM only; never browser
- Online-only POC (offline/OCR/ruler deferred)
- `woo_create_status` = `draft | publish`, default `draft`; `SLAB-UAT-*` force Woo draft on PROD
- Health: `GET /api/health`
- Phase 0 = Gates A+B; Gate C = early Phase 1 claimable Woo draft, inference OFF

---

## 2. Consistent (safe for agents)

Agents that follow **AGENTS.md §0 precedence** and ignore flagged-stale text will get these right:

| Topic | Where it agrees |
|---|---|
| Doc precedence | AGENTS §0: TECH-SPEC → ARCHITECTURE → AGENTS → DATA/OPENAPI/CONTENT/PROMPTS/DEPLOY → IMPL Phase 0 only → PRD/README intent |
| Hybrid who-runs-what | AGENTS §1, ARCHITECTURE §§1–4, TECH-SPEC §1.5 / §9.8, README Quick orientation, PRD Architecture rewrite (post-4ec478f), DEPLOYMENT layout note (no server happy-path SoT) |
| bdft formula + TV-3 | TECH-SPEC §4.6 + TV-3; AGENTS §3; PRD FR4 patched; IMPL Phase 0; DEPLOYMENT smoke §8.4 |
| No fake upscale / ≥1600 | TECH-SPEC §5 + TV-6/7; AGENTS §2–3; IMPL Phase 0 |
| Secrets AES-GCM server | ARCHITECTURE §5; AGENTS §4; DATA-MODEL `settings`; OPENAPI SettingsView masks secrets; PRD D15 patched |
| Woo firebreak | AGENTS §5; CONTENT-WOO §2.4; DATA-MODEL `woo_create_status`; OPENAPI SettingsView; DEPLOYMENT smoke §8; README; PRD D12/FR36 |
| Slab vs Woo status | AGENTS §7; ARCHITECTURE §6; DATA-MODEL status machine; CONTENT-WOO §2.4 explicit “do not conflate” |
| Inference sequenced | AGENTS §6; ARCHITECTURE clarifications 4–5; OPENAPI infer endpoints; Gate C = OFF |
| Phase 0 hybrid scope | IMPL-PLAN Phase 0 (post-457711b) matches AGENTS; Phase 2 banner says SUPERSEDED |
| Health path | AGENTS §9; DEPLOYMENT §7–8; OPENAPI Health; IMPL Phase 0 |

**Bottom line for scaffold agents:** If they start at AGENTS + TECH-SPEC + ARCHITECTURE + IMPL Phase 0 **only**, Gate B skeleton is coherent. The landmines are in **Phases 1+/risks/PRD leftovers/OPENAPI one-liners** and the **hard-coded .201 deploy story**.

---

## 3. Remaining contradictions / landmines

Severity: **blocker** = will cause wrong code if followed; **warn** = likely wrong path / wasted work; **nit** = wording drift, low blast radius.

### BLOCKER

#### B1. OPENAPI: “Server re-runs derived math when inputs change”
- **Where:** `docs/OPENAPI.md` → `PUT /api/v1/slabs/{id}` bullet (~L154)
- **What agents might do wrong:** Implement server-side recompute of sqft/bdft/widths as SoT on PUT — directly violates AGENTS §3 / TECH-SPEC §1.5 / §9.8 (“server stores the numbers the client sends”).
- **Recommended fix (draft only):** Change to: server **stores** client-sent derived fields; may validate shape/ranges; **must not** recompute mask/sqft/bdft as authoritative. Client re-runs TECH-SPEC math and PUTs new numbers.

#### B2. IMPL-PLAN Phase 1 invents `processing→ready` status
- **Where:** `docs/IMPL-PLAN.md` Phase 1 (~L75): “Status state machine + in-process job queue (**processing→ready**).”
- **What agents might do wrong:** Add a `processing` slab status and a server job that “processes” photos toward `ready` — reintroduces server happy-path pipeline under a new name.
- **Recommended fix:** Rewrite Phase 1 to hybrid: CRUD + upload stores **client-calibrated** payloads; status machine = `draft → calibrated → ready → publishing → published|failed` only; queue only for publish/inference/U2Net-on-demand — never for measure/crop.

#### B3. IMPL-PLAN Phase 2 body still specifies offline/OCR/ruler (banner insufficient for careless agents)
- **Where:** `docs/IMPL-PLAN.md` Phase 2 (~L86–106). Banner says SUPERSEDED, but Goal/Deliverables/Acceptance/Exit still demand Tesseract OCR, OpenCV.js ruler, Workbox, IndexedDB, airplane-mode UAT.
- **What agents might do wrong:** Implement the body (agents often skim past blockquotes). Builds the exact “do not build” list in AGENTS §2.
- **Recommended fix:** Replace Phase 2 body with a short stub: “Deferred post-POC. Capture UX lives in early Phase 1 / Gate C (online hybrid). See AGENTS §2.” Delete OCR/ruler/offline acceptance lines.

#### B4. IMPL-PLAN Phase 6 UAT still requires offline capture + OCR + “server normalization”
- **Where:** `docs/IMPL-PLAN.md` Phase 6 (~L181–183, L175–179)
- **What agents might do wrong:** Write UAT scripts / perf budgets for OCR 1–2s and server normalization 3–5s; gate exit on offline capture — contradicts online-only POC and client SoT.
- **Recommended fix:** UAT suite = hybrid online path; drop offline capture requirement; perf = client measure/crop budgets + U2Net-on-demand only; inventory host via `APP_*` (see §4).

#### B5. Deploy SoT still hard-codes `.201` / `slab.tyubumini.local` (Gate B blocker per review package)
- **Where:** `AGENTS.md` §9; `docs/DEPLOYMENT.md` title/target/§1/§4/§6/§7; `README.md` L6; `docs/IMPL-PLAN.md` Phase 0 Gate B (.201 inventory), Phase 6, Risks, DoD; PRD FR42 / deploy bullets
- **What agents might do wrong:** Bake `192.168.1.201` / `slab.tyubumini.local` into compose, Caddy, health URLs, runbooks; treat TyUBUMini as mandatory; skip inventory worksheet; block on wrong host.
- **Recommended fix:** Apply workspace outline `/workspace/slabuploader-env-agnostic-doc-outline.md` — `APP_HOST` / `APP_HOSTNAME` / ports; `deploy/INVENTORY.md`; historical lab as non-normative callout only. **Do not push until CoS lifts HOLD.**

---

### WARN

#### W1. OPENAPI create returns slab status `draft` for a “calibrated draft”
- **Where:** `docs/OPENAPI.md` `POST /api/v1/slabs` (~L146–147): “Create a **calibrated** draft” → Returns `201` with `status: draft`
- **What agents might do wrong:** Skip `calibrated` entirely; conflate “photos taken” draft with “mask+numbers uploaded” calibrated; break Gate C poll/UI assumptions.
- **Recommended fix:** POST after client confirm → `201` with `status: calibrated` (align ARCHITECTURE §6 / DATA-MODEL / AGENTS §7). Keep local pre-upload client state out of API or document separately.

#### W2. AGENTS says “TV-10 only after TECH-SPEC defines it” — but TECH-SPEC already has TV-10
- **Where:** `AGENTS.md` §3 (~L80) vs `docs/TECH-SPEC-PIPELINE.md` §8 TV-10 Rounding (~L192–196)
- **What agents might do wrong:** Skip rounding unit tests (length 1/8", sqft/bdft 2dp, price half-up) thinking TV-10 is undefined.
- **Recommended fix:** AGENTS: “Port TV-1…**TV-10**.” IMPL Phase 0 acceptance: include TV-10.

#### W3. DATA-MODEL / OPENAPI put sheet prefs in server `settings`; ARCHITECTURE/AGENTS say localStorage
- **Where:** DATA-MODEL settings keys `user_sensitivity|edge_offset|feather|sheet_mode` (~L184); OPENAPI SettingsView (~L132–133); vs AGENTS §4 / ARCHITECTURE §5 (browser localStorage only)
- **What agents might do wrong:** Dual-write prefs to SQLite AES settings table; or encrypt non-secrets; or fight over which wins on load.
- **Recommended fix:** Remove sheet/slider prefs from server settings schema (or mark optional sync later). Keep localStorage as SoT for POC.

#### W4. CONTENT-WOO media upload says “JPEG bytes”; TECH-SPEC output is transparent PNG
- **Where:** `docs/CONTENT-WOO.md` §2.4 (~L114): `POST /media` with **JPEG** bytes; TECH-SPEC §5 / PRD FR31: transparent **PNG**
- **What agents might do wrong:** Re-encode processed PNGs to JPEG (lose alpha) before Woo media upload.
- **Recommended fix:** “PNG bytes (processed inventory images)”; mention Woo accepts image/*; keep alpha.

#### W5. CONTENT-WOO tag auto-assign still says `[character]` / optional `[species]` tags
- **Where:** `docs/CONTENT-WOO.md` §2.3 (~L81–83) vs DATA-MODEL / PRD D8: **`fig-*` + `feat-*`** only; Call 1 maps observations → feat-*
- **What agents might do wrong:** Create/assign non-fig/feat Woo tags named after character strings; ignore feat-* mapping.
- **Recommended fix:** Rewrite §2.3 to match DATA-MODEL: fig-* (1+) + feat-* (0+ from Call 1 mapping); no generic character/species tag invent.

#### W6. PRD FR17 vs D8 / DATA-MODEL on tags
- **Where:** PRD **FR17** “Tags: **fig-* only**, 1+ required” vs Decisions log #8 + DATA-MODEL `fig_tag_ids` + `feat_tag_ids`
- **What agents might do wrong:** Drop feat-* from schema/UI/publish payload.
- **Recommended fix:** FR17 → fig-* (1+) and feat-* (0+); cite DATA-MODEL.

#### W7. PRD FR19 + pricing schema still “species **and wood category**”
- **Where:** PRD FR19 (~L134); PRD pricing schema `wood_category: string` (~L241); vs TECH-SPEC §6 / DATA-MODEL `pricing_rules` = **species only** flat $/bdft; AGENTS kills figure-/category-weighted pricing for v1
- **What agents might do wrong:** Build wood-category pricing tiers or composite keys.
- **Recommended fix:** FR19 + schema → species-only; wood-category pricing = deferred/v1.5.

#### W8. PRD FR40 + NFR still “server-side processing” / “server normalization”
- **Where:** PRD FR40 (~L190); NFR Performance (~L200–201)
- **What agents might do wrong:** Put measure/crop on publish path server-side; budget 3–5s server normalization as a feature.
- **Recommended fix:** FR40 = Woo sync + status/log only (client already did processing). NFR = client local processing + optional U2Net latency; drop “server normalization” phrase.

#### W9. DEPLOYMENT §9 / Risks still RemBG, ruler, `output_px` drop to 1000
- **Where:** `docs/DEPLOYMENT.md` §9 (~L161) RemBG/GPU on .201; `docs/IMPL-PLAN.md` Risks (~L201–202) ruler + `output_px` can drop to 1000
- **What agents might do wrong:** Add RemBG server path; lower OUTPUT_PX_MIN below 1600 (violates TECH-SPEC TV-7 / no inventing pixels — undersized → retake, not lower min).
- **Recommended fix:** Risks: delete ruler row for POC or mark deferred; U2Net-on-demand only (not RemBG as SoT); never drop below 1600 — retake.

#### W10. Caddy fragment shape is foot-gunny
- **Where:** `docs/DEPLOYMENT.md` §4 — site-level `reverse_proxy frontend:80` **plus** `handle /api/* { reverse_proxy fastapi:8000 }`
- **What agents might do wrong:** Ship as-written; `/api/*` may never reach fastapi depending on Caddy directive order; health smoke fails.
- **Recommended fix:** Use explicit `handle /api/*` → fastapi and `handle { reverse_proxy frontend }` (or `handle_path`) so API wins; keep service name `fastapi` consistent with compose.

#### W11. Calibration-photo language leftovers in CONTENT-WOO
- **Where:** CONTENT-WOO §2.4 (~L116–117) “Calibration photos are excluded (FR2)” — PRD D1 says **no calibration photos exist**
- **What agents might do wrong:** Invent `kind=calibration` in upload meta / schema (OPENAPI/DATA-MODEL correctly only `inventory`).
- **Recommended fix:** Delete sentence; say “only inventory photos (kind=inventory).”

---

### NIT

#### N1. DATA-MODEL / OPENAPI still say “PWA”
- **Where:** DATA-MODEL L7 “so the **PWA** can reference…”; OPENAPI Versioning L301 “The **PWA** pins…”
- **Risk:** Agents scaffold Workbox “because the contract says PWA.”
- **Fix:** “client” / “SvelteKit app”; offline PWA deferred.

#### N2. PRD section header still “Client (mobile web / PWA)”
- **Where:** PRD Architecture (~L210) — body correctly says offline deferred, but header says PWA.
- **Fix:** “Client (mobile web / SvelteKit)”.

#### N3. ARCHITECTURE status line “Remaining sections TBD”
- **Where:** ARCHITECTURE L4 — topology is locked; stale “TBD” undercuts confidence.
- **Fix:** “Hybrid topology locked Gate A; remaining ops sections TBD.”

#### N4. TECH-SPEC status date still 2026-08-27; AGENTS Gate A 2026-08-31
- **Nit only** — content matches. Optional status bump.

#### N5. Review package Appendix C checklist items 1–7 largely done in-repo; item 0 (env-agnostic) **not** done
- Package preamble still reads like pre-Gate-A in places (“AGENTS referenced, file missing”) — workspace draft drift vs `457711b`/`4ec478f`. Mark appendix C items 1–7 done; keep item 0 open.

#### N6. DEPLOYMENT Gate A banner line-break glitch
- **Where:** `docs/DEPLOYMENT.md` L4–8 — “LAN/Tailscale” sentence split across Gate A callout (“only — Decision”). Readable but ugly; fix when env-agnostic rewrite lands.

---

## 4. Env-agnostic gap (workspace drafts vs repo still saying .201)

| Artifact | Role | Normative host? |
|---|---|---|
| **Repo** `AGENTS.md` §9, `docs/DEPLOYMENT.md`, `README.md`, `IMPL-PLAN.md` Gate B/Phase 6/DoD, PRD FR42 | Current SoT agents will read | **Yes — hard-codes `.201` / TyUBUMini / `slab.tyubumini.local` / `192.168.1.201`** |
| **Workspace-only** `/workspace/slabuploader-poc-review-package.md` §3 | Proposed SoT for deploy; **not in repo** | **No** — `APP_HOST` / `APP_HOSTNAME` / inventory worksheet; lab example non-normative |
| **Workspace-only** `/workspace/slabuploader-env-agnostic-doc-outline.md` | Patch outline for CoS-signed amend | Same |

**Explicit:** these two markdown files are **workspace drafts, not SoT yet**. Agents must not treat `/workspace/*.md` as repo authority. Until the env-agnostic amend lands under CoS HOLD lift, Gate B inventory step is blocked if agents assume `.201` is mandatory — and equally blocked if they invent a different host without inventory.

Product locks (hybrid, bdft, Woo firebreak) are **independent** of this gap and already in-repo.

---

## 5. Recommended next doc patches when CoS lifts HOLD (ordered, small)

Docs-only. No scaffold/code. No reopen of hybrid/Woo/bdft locks.

1. **Env-agnostic deploy cut (Gate B unblocker)** — per `/workspace/slabuploader-env-agnostic-doc-outline.md`:
   - `AGENTS.md` §9 → inventory-first + `https://${APP_HOSTNAME}/api/health`; lab example callout only
   - `docs/DEPLOYMENT.md` title/target/§1→`deploy/INVENTORY.md` worksheet; Caddy `${APP_HOSTNAME}`; fix handle order (W10); drop RemBG SoT smell (W9)
   - `README.md` deploy line; PRD FR42 / deploy bullets; `IMPL-PLAN` Gate B / Phase 6 / Risks / DoD host wording
2. **OPENAPI one-liners (B1, W1)** — PUT does not recompute SoT; POST returns `calibrated`
3. **AGENTS TV-10 (W2)** — require TV-1…TV-10
4. **IMPL-PLAN Phase 1 (B2)** — kill `processing→ready`; hybrid CRUD/store language
5. **IMPL-PLAN Phase 2 (B3)** — replace body with deferred stub (keep banner or delete section content)
6. **IMPL-PLAN Phase 6 + Risks (B4, W9)** — online UAT only; no OCR/offline/server-normalization budgets; no `output_px`→1000
7. **CONTENT-WOO (W4, W5, W11)** — PNG media; fig-*/feat-* assign; no calibration photos
8. **DATA-MODEL / OPENAPI settings (W3, N1)** — drop server sheet prefs (or defer); “client” not “PWA”
9. **PRD leftovers (W6–W8, N2)** — FR17 feat-*; FR19 species-only; FR40/NFR hybrid wording; pricing schema
10. **Refresh workspace review package** — mark Appendix C items 1–7 done; keep item 0 + sign-off for env-agnostic only (avoid agents re-doing Gate A)

**After patches:** single docs commit on gitea-atd; report SHA to CoS; **then** Gate B inventory on designated host — still no silent `.201` assumption.

---

### Audit verdict (blunt)

Gate A **did** land the critical product locks (hybrid, bdft, AES, Woo draft/`SLAB-UAT-*`, Phase 0 rewrite, AGENTS precedence). Scaffolding Gate B **math/AES/health** is safe if agents obey AGENTS + TECH-SPEC + Phase 0.

Gate B **deploy** and any agent that reads **IMPL Phase 1/2/6, OPENAPI PUT, or PRD FR40/NFR** without the precedence discipline will still ship wrong architecture (server recompute, `processing` status, offline/OCR/ruler, JPEG-without-alpha, hard-coded `.201`).

Highest-ROI doc fixes when HOLD lifts: **(1) env-agnostic deploy**, **(2) OPENAPI “re-runs derived math”**, **(3) gut IMPL Phase 2/6 stale bodies**, **(4) Phase 1 status machine**.

