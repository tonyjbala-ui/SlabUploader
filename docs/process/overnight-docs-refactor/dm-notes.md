# Morning notes for Ty — docs refactor v2 (Dev Manager)

Date: 2026-09-01 (before morning PT)  
Read: `/workspace/slabuploader-docs-refactor-proposal-v2.md` + `/workspace/slabuploader-docs-refactor-interrogate.md`  
Branch check: `docs/refactor-v2` tip = `main` @ `e1e087b` (PM-DESIGN unslop only). **v2 commits 1–4 are not on the branch yet** — these notes judge the *proposal*, not a landed stack.  
Constraints honored: no Gate B / host inventory; main not touched by this pass.

---

## 1. Are Gate C slice + env-agnostic deploy + OPENAPI B1/W1 enough?

**Short answer: almost — for architecture. Not for a green “hand to coding agents” flag.**

| After… | Agents stop shipping wrong *architecture*? | Still broken if they follow leftover text |
|---|---|---|
| **Commit 1 only** (B1/W1 + Gate C slice + kill `processing` + Phase 2 stub + Phase 6 offline strip + TV-10 + AGENTS known-stale rewrite) | **Mostly yes**, *if* AGENTS keeps the “IMPL 1+ incomplete — implement only Phase 0 + rewritten sections” guard until Phases 3–5 are cleaned | CONTENT-WOO JPEG→lose alpha; PRD FR19 category pricing / FR40 server processing if still live; Phase 3–5 top-down vision / offline flavor; `.201` hard-coding (deploy, not architecture) |
| **+ Commit 2** (env-agnostic + `deploy/INVENTORY.md` + Caddy handle order) | Architecture same; **Gate B framing** becomes safe | Same feature landmines as above |
| **+ Commit 3** (CONTENT-WOO / DATA-MODEL / ARCHITECTURE / IMPL 3–5) | **Yes — this is the real agent-safe checkpoint** | Nits / archive hygiene |
| **+ Commit 4** (de-dupe, PRD archive, PM-DESIGN delete after DoD) | Hygiene / reader load; not required to unblock scaffold | — |

**Recommendation:** Do not unleash coding agents on Gate B scaffold until **commit 1 is on the branch and grepped**. Do not unleash feature agents (capture/Woo/inference UI) until **through commit 3**. Env-agnostic (commit 2) can land with or right after commit 1; it does not by itself stop wrong architecture.

Gate C slice **before** Phase 2 delete is non-negotiable (interrogate A6). v2 has that right. B1 alone without Gate C still leaves capture homeless.

---

## 2. Deploy / IMPL landmines v2 still misses or underweights

v2 covers the big ones (B1, processing, Phase 2/6, env-agnostic, Caddy order, RemBG/1000px, TV-10, Gate C home). Add or keep visible:

1. **OPENAPI dedupe language** — “SKU already **published**” should mean “SKU already **exists in Woo** (any status).” Else agents skip draft collisions.
2. **Confidence 0.7 (FR22a)** — v2 folds into Phase 5/PROMPTS; make that an explicit commit-3 checklist line so it does not die with PRD archive.
3. **IMPL Phase 1 remainder** — after Gate C slice, leftover “sandbox Woo / pending-era” sentences in Phase 1 body still need a one-pass scrub or they reintroduce wrong publish defaults next to the new slice.
4. **Compose↔Caddy service names** — fragment must match compose service name (`fastapi`) *and* sit on the same Docker network; design text should say that in commit 2, not only handle order.
5. **Partial Woo failure / orphan media** — ops note, not architecture; keep in CONTENT-WOO/IMPL Risks so agents do not invent auto-delete of Woo media.
6. **Do not treat workspace `/workspace/*.md` as SoT** — already true; worth one AGENTS line when env-agnostic lands so agents do not read proposal files as repo authority.

Nothing here reopens product locks.

---

## 3. Commit staging feedback (v2 commits 1–4)

**Order is correct.** Wrong-code-first → env-agnostic → factual → de-dupe/archive matches how agents fail. Keep it.

| Commit | Staging feedback |
|---|---|
| **1** | Keep **atomic**: OPENAPI B1+W1 **including examples**, Gate C slice, Phase 2 stub, `processing` gone, Phase 6 offline strip, TV-10, AGENTS stale-list rewrite. Do **not** ship a HEAD where Phase 2 body is deleted without Gate C written. Prefer one commit; if split, Gate C + Phase 2 stub must move together. |
| **2** | Fine as second. Unblocks Gate B *framing* only — still no inventory/SSH until you open Gate B. Include corrected Caddy fragment + empty `deploy/INVENTORY.md` template in the same commit DEPLOYMENT claims them. |
| **3** | Highest ROI after 1 for “agents won’t follow stale Phase 5.” Prefer full hybrid-align of Phases 3–5 here (agree with PPM) over a long incomplete-rewrite guard. |
| **4** | Last. PRD archive + reference rewrite same commit. PM-DESIGN delete **only** after DoD greps green + Gate table + freeze provenance in AGENTS. |

**Agent-safe checkpoints (for CoS/you):** after 1 (docs contract); after 3 (feature docs); after 4 (cleanup done). Do not hand implementers a mid-commit-4 tree.

**Branch reality check:** overnight commits 1–4 are **not** on `docs/refactor-v2` yet (tip = `e1e087b`). Morning decision is “sign v2 proposal / open execution on that branch,” not “review four landed commits.”

---

## Bottom line for Ty

1. **Sign v2 direction** (not v1). Product locks stay put.  
2. **Execute commit 1 first** on `docs/refactor-v2` — that is what stops the worst wrong architecture.  
3. **Coding agents:** after commit 1 for Phase 0/contract only; after commit 3 for capture/Woo/inference work. **Still no Gate B host work** until you explicitly open it.  
4. Open Qs: I align with PPM — archive PRD with superseded header; delete PM-DESIGN after DoD; hybrid-align IMPL 3–5 in commit 3.

Dev Manager standing by under HOLD for Gate B / unrelated main writes.
