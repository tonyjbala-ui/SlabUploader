# SlabUploader docs refactor: interrogate verdict

Status: ADVERSARIAL REVIEW complete. No repo files changed.
SoT repo: Gitea `Ty_Tech/SlabUploader` on gitea-atd (not TrueNAS/GitHub mirrors).
Artifact reviewed: `/workspace/slabuploader-docs-refactor-proposal.md`
Date: 2026-09-01.
Process: pstack interrogate skill by the book (intent → one reviewer per configured model → lead judgment → no auto-apply).

---

## Intent

> Propose a deletion-first docs cleanup for SlabUploader so each file has one Diataxis mode and each locked product decision has one home, without changing product locks (hybrid client math, bdft formula, server secrets, Woo draft SLAB-UAT-* safety, inference off until first draft listing, gates A/B/C, env-agnostic deploy). The prior single-model pass wrote only this proposal outside the repo. We need adversarial multi-model review before Ty signs off.

Reviewers challenged execution against the live evidence base. They did not reopen product locks.

---

## Reviewers (configured panel; all four ran)

Source of model list: `~/.grok/rules/pstack-models.md` line `interrogate reviewers`.

| Label | Model slug (as spawned) | Status | Findings (author count) |
|---|---|---|---|
| Reviewer A | `composer-2.5` | completed | 6 critical, 12 warning, 2 nit |
| Reviewer B | `DpBlu-Qwen3.6-27b` | completed | 3 critical, 5 warning, 2 nit |
| Reviewer C | `UbuDual-Qwen3.8-27b` | completed | 3 critical, 5 warning, 2 nit |
| Reviewer D | `grok-composer-2.5-fast` | completed | 6 critical, 8 warning, 2 nit |

No subagent failures. No silent single-model fallback. Panel is complete.

Skill references used: `interrogate/SKILL.md`, `references/reviewer-prompt.md`, `references/rubric.md`, `references/code-quality-review.md`, `references/lead-judgment.md`.

---

## Lead judgment summary

**Block Ty sign-off on the original proposal as written.**

The deletion-first direction is right. The B1–B5 factual claims largely match live docs. The failure is execution design: over-slimming AGENTS, dual Woo SoT, secrets SoT mis-home, PRD archive without reference rewrite, Phase 2 delete without a Gate C capture home, and no docs-refactor acceptance checks.

A revised proposal is required before execution. See `/workspace/slabuploader-docs-refactor-proposal-v2.md`.

Principles that drove this judgment (poteto-mode):

- **Subtract Before You Add / Laziness Protocol.** Keep deletion of stale IMPL bodies and PM reconciliation. Do not delete AGENTS hard-rule text that agents need in one place.
- **Encode Lessons in Structure.** Replace “trust the migration order” with greppable docs DoD before PM-DESIGN delete.
- **Minimize Reader Load.** AGENTS stays the single working contract with verbatim locks; specs own depth.
- **Prove It Works.** Lead verified contested claims against live files before categorizing.

---

## Act On

Findings that would block a real docs PR / Ty sign-off. Address these in proposal v2 before any repo rewrite.

### A1. Keep AGENTS hard rules verbatim; do not slim to pointers only
**Models:** A, B, C, D (4/4) · **Agreement: multi-model**
**Why it matters.** Proposal §4.1 keeps only Woo-safety and inference-sequencing verbatim and turns hybrid, bdft (no `/12`), secrets never-browser, no-upscale, and status machine into pointers. AGENTS is the file agents read first. Pointers they skip are lost locks. That fights the intent to preserve product locks for implementers.
**Lead fix.** AGENTS keeps a compact verbatim hard-rules block for every lock. Each section may add one pointer to the depth spec. Do not replace lock sentences with links.

### A2. Resolve Woo-safety dual-SoT (AGENTS vs CONTENT-WOO)
**Models:** A, B, C, D (4/4) · **Agreement: multi-model**
**Why it matters.** §3.3 makes CONTENT-WOO the sole Woo-safety SoT while §4.1 also keeps Woo-safety verbatim in AGENTS. That recreates two normative copies after the ladder is shortened. Drift becomes unarbitrated.
**Lead fix.** Named hierarchy: AGENTS owns the agent-facing safety hard rule (normative). CONTENT-WOO owns payload/sequence detail and cites AGENTS for force-draft / `SLAB-UAT-*`. DATA-MODEL owns the `woo_create_status` key only. One policy home, one payload home.

### A3. Secrets policy is not DATA-MODEL’s job
**Models:** A, D (2/4; C related via AGENTS slim) · **Agreement: multi-model**
**Why it matters.** DATA-MODEL lists encrypted keys and blob layout. It does not state “never in browser / JS bundles.” Calling DATA-MODEL the secrets SoT is a reachable path to a Settings UI that treats secrets like prefs.
**Lead fix.** Split SoT: AGENTS = never-browser hard rule (verbatim); ARCHITECTURE = why/flow; DATA-MODEL = ciphertext key inventory only.

### A4. PRD archive must rewrite live references in the same step
**Models:** A, B, C, D (4/4) · **Agreement: multi-model**
**Why it matters.** Live pointers: AGENTS §0 rank 6 + known-stale FR cites, README docs table, ARCHITECTURE “Companion: PRD (root)”, TECH-SPEC scope line, IMPL “PRD acceptance”, CONTENT-WOO FR cites. Moving the file without edits leaves dangling paths and mixed “read / don’t read” instructions.
**Lead fix.** Archive commit includes path updates, AGENTS ladder rewrite (archive path or drop rank-6), and “frozen archive only” language in README/AGENTS.

### A5. Do not claim W6–W8 applied if PRD is archived unedited
**Models:** A, B, D (3/4) · **Agreement: multi-model**
**Why it matters.** W6 (tags), W7 (species+category pricing), W8 (server-side processing / NFR normalization) live in the PRD. Archive-unedited + delete PM-DESIGN removes the map that says those lines are wrong while leaving the wrong text in-tree under `docs/archive/`.
**Lead fix.** Archive header must list superseded FR/NFR ids as non-authoritative, **or** fix those lines before freeze. Do not delete PM-DESIGN until remaining open items are relocated to AGENTS “open doc defects” or a freeze-provenance note.

### A6. Gate C / hybrid capture needs an IMPL home before Phase 2 body delete
**Models:** A, D (2/4) · **Agreement: multi-model**
**Why it matters.** Phase 2 is the only capture-UX phase body. Banner says capture moves to early Phase 1 / Gate C. Phase 1 deliverables stay API-only. Phase 4 owns real Woo. Deleting Phase 2 without writing the hybrid Gate C slice leaves first-draft-listing with no phase that owns phone capture → mask → numbers → draft listing.
**Lead fix.** Rewrite early Phase 1 / Gate C slice first: online hybrid capture + client TECH-SPEC UX + calibrated upload + Woo draft path (inference OFF). Then stub Phase 2 as deferred offline/OCR/ruler.

### A7. Keep a guard for unrewritten IMPL Phases 3–5 (or rewrite them)
**Models:** A, D (2/4; C/B support incomplete rewrite diagnosis) · **Agreement: multi-model**
**Why it matters.** Proposal only guts Phase 1 `processing`, Phase 2 offline, Phase 6 offline UAT. Phase 3/5 still carry old-pipeline flavor (top-down-only vision vs locked all-photos@1024, offline-era assumptions). Shortening AGENTS §0 after partial cleanup makes 3–5 look implementable.
**Lead fix.** Same pass: hybrid-align Phases 3–5 and Risks at least enough to remove wrong-code paths, **or** keep explicit AGENTS hard rule “IMPL Phases 1+ hybrid rewrite incomplete; implement only Phase 0 + explicitly rewritten sections” until done. Do not claim “no superseded text left.”

### A8. Schedule W2 (TV-1…TV-10) as a must-fix
**Models:** A, B, C, D (4/4) · **Agreement: multi-model**
**Why it matters.** TECH-SPEC already defines TV-10 Rounding. AGENTS still says “TV-10 only after TECH-SPEC defines it.” IMPL Phase 0 acceptance still TV-1…TV-9. Target design left this as a parenthetical “confirm,” not a scheduled edit. Agents can skip rounding tests after “cleanup.”
**Lead fix.** AGENTS §3 and IMPL Phase 0 acceptance: port TV-1 through TV-10. Mandatory in first or second docs commit.

### A9. Migration order: contract fixes before or with body deletes; B1 first among wrong-code lines
**Models:** A, B, C (3/4) · **Agreement: multi-model**
**Why it matters.** Exec summary overclaims “deletion-first prevents mid-migration misreads.” Step 1 can ship while OPENAPI still says server re-runs derived math (B1). Independently shippable steps ≠ agent-safe intermediate HEADs. Steps 2–3 are additive rewrites, so “deletion-first” is partly marketing.
**Lead fix.** Commit 1: OPENAPI B1+W1 (endpoint + examples) + IMPL stale body deletes / Gate C slice + W2. Then env-agnostic deploy. Then factual CONTENT-WOO/DATA-MODEL fixes. Then pointer/de-dupe. AGENTS slim only in the sense of adding pointers beside verbatim rules, never instead. State safe checkpoints for agent work.

### A10. Gate A/B/C human table must move before PM-DESIGN delete
**Models:** A, C (2/4) · **Agreement: multi-model**
**Why it matters.** The only clear Gate A = docs freeze / Gate B = run-host / Gate C = first draft listing table is in PM-DESIGN §9. AGENTS has a one-liner. Deleting PM-DESIGN orphans the durable gate definitions the proposal claims AGENTS owns.
**Lead fix.** Copy the Gate A/B/C table verbatim into AGENTS (hard rules) before delete. One place only.

### A11. Add docs-refactor acceptance checks (DoD)
**Models:** A, D (2/4) · **Agreement: multi-model**
**Why it matters.** No greps, no lock-presence list, no “when is PM-DESIGN allowed to die.” Ty cannot falsify “locks preserved.”
**Lead fix.** Add DoD: zero `re-runs derived math`; POST/examples `calibrated` where required; zero normative airplane-mode Phase 2 acceptance; AGENTS still contains bdft no `/12`, never-browser, SLAB-UAT force-draft, inference OFF until Gate C, Gate table; no active processed-output JPEG as SoT; deploy host variables not sole `.201` norm; remaining open defects listed or closed.

### A12. Fix the file-count claim; place `deploy/INVENTORY.md`
**Models:** A, D (2/4; C as nit on count) · **Agreement: multi-model**
**Why it matters.** §4.1 table is 10 active files (README, AGENTS, 8 docs under docs/), prose says 9. Env outline adds `deploy/INVENTORY.md`. “12→9” is wrong and hides an ops artifact.
**Lead fix.** Target count: 10 active root/docs files + optional inventory worksheet owned by DEPLOYMENT (in file map). Stop using “9” as the success metric.

### A13. Rewrite AGENTS §0 known-stale list against live files
**Models:** D (1/4) on the FR4-false claim; lead elevates because verified · **Agreement: lone-model finding, lead-verified → Act on**
**Why it matters.** Live PRD FR4 already states correct `bdft = sqft * thickness_in` and rejects `/12`. AGENTS still warns as if FR4 is wrong. That is a false landmine in the first file agents read.
**Lead fix.** Any AGENTS edit rewrites known-stale to match HEAD (drop fixed entries; add still-true ones like FR40/W8 if PRD remains readable).

---

## Consider

Legitimate. Worth Ty’s attention. Not automatic blockers if A1–A13 are handled.

### C1. Prefer trimmed PM-DESIGN until Gate C, or extract freeze provenance
**Models:** B, C, D (3/4) · **Agreement: multi-model**
SHA-to-lock table and B/W index have process value through Gate B/C. Delete-after-fixes is fine only if provenance and residual open items move first. Lead leans: extract freeze provenance + open defects into AGENTS; then delete reconciliation body. Keeping a trimmed tracker until Gate C is an acceptable alternate.

### C2. ARCHITECTURE stays normative for topology / what-runs-where
**Models:** A, D (2/4) · **Agreement: multi-model**
Pure “explanation” Diataxis fights AGENTS precedence (ARCHITECTURE rank 2). Keep swimlane + what-runs-where + secrets-why as normative. DATA-MODEL keeps column enums. Do not essay-ify ARCHITECTURE.

### C3. W1 fix must include examples, not only the endpoint line
**Models:** A (1/4) · **Agreement: lone-model**
OPENAPI examples still show `"status":"draft"` for calibrated create/poll. Partial edit recreates in-file contradiction. Include in B1/W1 atomic edit (ties to A9).

### C4. CONTENT-WOO §2.3 attributes still wrong (unlisted landmine)
**Models:** A (1/4) · **Agreement: lone-model; lead-verified true**
Attributes bullet still says assign “species/character/length/thickness as product attributes.” Locked model is categories + five attributes (Edge Type, Figure, Grade, Thickness, Moisture) + fig/feat tags. Add to CONTENT-WOO fix list with W4/W5/W11.

### C5. Ship corrected Caddy fragment in the design, not only “fix order”
**Models:** B (1/4) · **Agreement: lone-model; lead-verified foot-gun exists**
Live DEPLOYMENT puts bare `reverse_proxy frontend` before `handle /api/*`. Corrected `handle /api/*` then `handle` frontend should appear in env-agnostic target text so implementers do not guess.

### C6. Env-agnostic vs PRD FR42 conflict needs an explicit decision
**Models:** A, D (2/4) · **Agreement: multi-model**
Outline wants FR42 env-agnostic. Archive wants no PRD edits. Pick one: edit FR42 before freeze, or stamp archive header that FR42 host binding is superseded by DEPLOYMENT.

### C7. Relocate PRD-only locks before archive (e.g. Call 1 confidence 0.7)
**Models:** D (1/4) · **Agreement: lone-model**
FR22a / IMPL Phase 5 threshold 0.7 is not in AGENTS/ARCHITECTURE/TECH-SPEC. If PRD becomes non-source, IMPL or PROMPTS must own it deliberately.

### C8. Split migration step 4 (kitchen-sink de-dupe)
**Models:** A (1/4) · **Agreement: lone-model**
Agree with staging: contract → IMPL hybrid → CONTENT-WOO/DATA-MODEL facts → pointer pass. Matches Open Q3 staged recommendation.

### C9. N5 is workspace-only; do not lump into repo nit pass
**Models:** A (1/4) · **Agreement: lone-model**
N5 is `/workspace` review-package hygiene. Split from N1–N4, N6.

---

## Noted

Valid, low urgency if Act-on lands.

### N1. Diataxis purity on PROMPTS tuning / CONTENT-WOO short sequence is low value for POC
**Models:** A · Leave short lists in place. Do not spend design capital on mode splits.

### N2. “Banners are the root cause” underplays unfinished Phase 1+ rewrite
**Models:** A · Reframe: stale normative bodies are the disease; ladder/banners are temporary PPE. Covered by A7.

### N3. N3 ARCHITECTURE “Remaining sections TBD”
**Models:** B · Already in original proposal target row. Keep in same ARCHITECTURE cleanup pass.

### N4. W2 mislabel “AGENTS W2”
**Models:** C, D · Cite as PM-audit W2. Cosmetic.

### N5. File-count vanity metric
**Models:** C · Covered by A12.

### N6. DATA-MODEL orphaned user-pref rows on deployed hosts
**Models:** B · Docs-only POC; no evidence of deployed settings rows yet. Mention as future migration note only if schema already shipped.

---

## Dismissed

### D1. “Single commit only” as the only safe migration shape
**Models:** B (partial) · Staged commits are fine if each checkpoint is monotonically safer and DoD greps gate PM delete. Forbidding stages fights reviewability (Open Q3). Rejected as absolute requirement; accepted as “no unsafe intermediate for agents without a checkpoint label.”

### D2. Delete PRD outright instead of archive (as mandatory)
**Models:** C preference · Archive is fine **if** A4/A5/C6/C7 land. Deletion is optional preference, not required for correctness once references and superseded headers are fixed. Original Q1 archive recommendation stands with stronger exit criteria.

### D3. Suggesting product-lock changes (none serious)
No reviewer asked to reopen hybrid, bdft, AES-GCM, SLAB-UAT, inference-off-until-Gate-C, or gate map meaning. Out of scope by intent. Nothing to dismiss on locks themselves.

### D4. Praise-shaped “the ladder can disappear entirely on day one”
Implied by original proposal §3.5 · Multiple models correctly rejected full ladder removal while copies remain. Lead dismisses the original overclaim, not the reviewers.

---

## Agreement map

### Strong consensus (3–4 models)
| Theme | Models | Lead bucket |
|---|---|---|
| Do not slim AGENTS locks to pointers | A B C D | Act on A1 |
| Woo dual-SoT must be resolved | A B C D | Act on A2 |
| PRD archive needs reference rewrite | A B C D | Act on A4 |
| W2 TV-10 must be scheduled | A B C D | Act on A8 |
| W6–W8 / unedited archive + PM delete unsafe | A B D | Act on A5 |
| Migration order / deletion-first overclaim | A B C | Act on A9 |
| PM-DESIGN still has process value / provenance | B C D | Consider C1 |
| Secrets SoT ≠ DATA-MODEL alone | A D (+C via slim) | Act on A3 |

### Pair consensus (2 models)
| Theme | Models | Lead bucket |
|---|---|---|
| Gate C capture home before Phase 2 delete | A D | Act on A6 |
| Phases 3–5 still stale / guard required | A D | Act on A7 |
| File count / INVENTORY wrong | A D | Act on A12 |
| Docs refactor DoD missing | A D | Act on A11 |
| Gate table must move before PM delete | A C | Act on A10 |
| ARCHITECTURE must stay normative topology | A D | Consider C2 |
| Env-agnostic vs FR42 archive tension | A D | Consider C6 |

### Lone-model (still read; lead filtered)
| Theme | Model | Lead bucket |
|---|---|---|
| W1 examples must update with endpoint | A | Consider C3 (fold into A9) |
| CONTENT-WOO attributes §2.3 unlisted | A | Consider C4 |
| Full corrected Caddy fragment in design | B | Consider C5 |
| AGENTS known-stale FR4 already false | D | Act on A13 (lead-verified) |
| Call 1 confidence 0.7 PRD-only | D | Consider C7 |
| Kitchen-sink step 4 | A | Consider C8 |
| N5 workspace-only | A | Consider C9 |
| Prefer delete PRD over archive | C | Dismissed D2 as mandatory |
| Deployed settings migration for prefs | B | Noted N6 |
| Single-commit-only safety | B | Dismissed D1 as absolute |

### Pattern
All four models independently attacked **AGENTS over-slim** and **Woo dual-SoT**. That is the highest-confidence signal in the panel. Capture-phase hole and IMPL 3–5 incompleteness are the next structural risks. Arithmetic/file-count and W2 are cheap factual fixes the original pass should not have missed.

No model defended “slim AGENTS to pointers only” or “CONTENT-WOO sole Woo-safety SoT while AGENTS keeps full copy.”

---

## What the original proposal got right (lead)

- Deletion-first intent for stale IMPL Phase 2/6 bodies and `processing` status.
- B1 OPENAPI PUT recompute and B5 env-agnostic deploy are real and correctly prioritized in spirit.
- TECH-SPEC and DATA-MODEL structure should not be churned.
- Product locks listed in §4.5 must not reopen.
- HOLD: proposal outside repo; no commit/push. Correct.
- PM-DESIGN as long-term reconciliation artifact should die once contradictions are gone (with provenance handled).
- Staged commits (Open Q3) remain the right delivery shape once ordering is fixed.

---

## Sign-off recommendation

| Question | Answer |
|---|---|
| Sign off original proposal as written? | **No** |
| Sign off direction (deletion-first, single home per decision, locks unchanged)? | **Yes, with v2 constraints** |
| Execute repo docs rewrite now? | **No. HOLD until Ty signs v2** |
| v2 written? | **Yes:** `/workspace/slabuploader-docs-refactor-proposal-v2.md` |

---

## Artifacts

| Path | Role |
|---|---|
| `/workspace/slabuploader-docs-refactor-proposal.md` | Original proposal (unchanged) |
| `/workspace/slabuploader-docs-refactor-interrogate.md` | This verdict |
| `/workspace/slabuploader-docs-refactor-proposal-v2.md` | Revised proposal incorporating Act-on |
| `/workspace/gitea-atd/Ty_Tech/SlabUploader/` | Repo tree **untouched** |

---

## HOLD confirmation

No files under `/workspace/gitea-atd/Ty_Tech/SlabUploader/` were created, modified, or deleted by this interrogate pass. No git commit. No push. Verdict and v2 live only under `/workspace/`.
