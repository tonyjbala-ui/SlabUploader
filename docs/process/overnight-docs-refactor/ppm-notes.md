# Morning notes for Ty — docs refactor v2 (Principal PM)

Date: 2026-09-01 (before morning PT)  
Read: `/workspace/slabuploader-docs-refactor-proposal-v2.md` + `/workspace/slabuploader-docs-refactor-interrogate.md`  
Repo: untouched; branch work is CoS overnight on `docs/refactor-v2` — these notes are product alignment only.

---

## 1. Product-lock risk if we execute v2 as written

**Low, if they follow v2 literally.** Interrogate blocked v1 for *execution* bugs (over-slim AGENTS, dual Woo homes, deleting Phase 2 before Gate C has a home). v2 fixes those. Nothing in v2 asks to reopen hybrid client math, board-feet formula, server-only secrets, Woo draft + `SLAB-UAT-*`, inference off until the first claimable draft listing, or what Gates A/B/C mean.

**Watch during execution (not reasons to reject v2):**
- Anyone “simplifying” AGENTS into pointers only would quietly drop locks. v2 forbids that — keep an eye on the PR diff.
- Phases 3–5 rewrite must not invent a new vision contract (e.g. top-down-only again). v2 already says all photos @1024 and inference after Gate C.
- Archiving the PRD without the superseded-FR header would leave wrong FR17/FR19/FR40 language looking live under `docs/archive/`. v2 requires the header (or fix-then-archive).

No product renegotiation hiding in the file list or commit order.

---

## 2. Confirm: Woo safety / gates / hybrid stay locked

| Lock | Still locked in v2? |
|---|---|
| Hybrid: phone owns happy-path measure/crop; server stores / Woo / inference proxy / on-demand harder cut | Yes (§7 + AGENTS verbatim block) |
| `bdft = sqft × thickness` (no `/12`) | Yes |
| Secrets never in the browser; AES on server | Yes (AGENTS owns policy) |
| Woo UAT: create as **draft**, `SLAB-UAT-*` always draft, real live publish only after your review | Yes (AGENTS owns safety policy; CONTENT-WOO cites it for payload) |
| Inference off for first claimable listing; Call 1/2 after that, still in POC | Yes |
| Gate A = docs freeze · Gate B = run-host · Gate C = first draft listing on phone path | Yes (table must live in AGENTS before PM-DESIGN dies) |
| Env-agnostic deploy (host not hard-coded to .201) | Yes (direction unchanged) |
| Online-only POC | Yes |

Woo “firebreak” in plain English: test listings go to the real store but stay **draft** and use obvious `SLAB-UAT-*` SKUs so shoppers never see them; only a real SKU you approve goes live.

---

## 3. Open questions — my recommendations

I agree with the CoS defaults in the overnight brief:

1. **PRD** — **Archive** to `docs/archive/` with a strong superseded header listing non-authoritative FRs (FR17 tags, FR19 category pricing, FR40/NFR server processing, FR42 .201 host). Same commit rewrites live links. Fixing every FR in place first is extra churn for a frozen record.

2. **PM-DESIGN-ALIGNMENT** — **Delete after the greppable DoD is green**, with Gate table + freeze SHA provenance lifted into AGENTS. Keeping a trimmed tracker until Gate C is optional insurance; I’d rather not maintain two open-defects homes. Do not delete on hope.

3. **IMPL Phases 3–5** — **Hybrid-align in the same docs stack** as Phase 2/6 cleanup (v2 commit 3). Leaving a long “incomplete rewrite” guard invites agents to implement stale Phase 5. Same stack costs more editing now and less wrong code later.

---

## Bottom line for Ty

Sign **v2 direction** when you’re ready. Do not sign old v1. Product locks are preserved by design; the overnight work is docs hygiene so coding agents cannot rebuild the wrong app from leftover sentences. HOLD on unrelated writes until you say otherwise.
