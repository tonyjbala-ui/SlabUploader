# SlabUploader UX — POC interaction spec

Status: SPEC · 2026-09-01 · issue #10 (presentation) · functional rules in #9 / AGENTS  
This is the UAT-facing interface contract. Wireframes are described as screens and states, not pixels. Implementers and testers use this file plus `AGENTS.md` and `docs/TECH-SPEC-PIPELINE.md`.

Functional numbers (0.7 threshold, empty vs prefill) live in AGENTS §6. This file only says how those rules look and feel.

---

## 0. Principles

- One-handed phone, outdoor or mill-floor lighting, thumb reach.
- The user always sees what is missing **on the field**, not only after Submit.
- Manual values always beat inference. Empty is honest; fake prefill is not.
- No raw HTTP codes or stack traces. Recovery stays on the same screen as the field.

Mandatory before **ready** (continue to publishable):

- exactly **one species**
- **at least one wood category**
- **at least one figure** (`fig-*` or the Figure attribute — same locked set as DATA-MODEL)

Issue #9 named species + ≥1 figure as the confidence-gate floor. Wood category is also required to list (original product). Presentation treats all three as mandatory with inline nudges (#10).

---

## 1. First-run (calibration trick)

Not OpenCV ruler detection (that path is deferred). First launch of capture shows a short overlay, dismissible, remembered in localStorage:

1. Lay the slab on a **green or black sheet**.
2. Shoot **top-down**, lens parallel to the broad face.
3. Put a tape or known length along the prevailing grain so *you* can type length in inches. The app does not read the tape.
4. Take 1–5 photos. Confirm the mask before trusting numbers.

Skip control: “Don’t show again.” Reset lives in Settings, not on the capture chrome.

---

## 2. Capture — mask is the load-bearing step

Background removal defines the pixel footprint. Length, widths, sqft, and bdft all sit on that mask. A clipped or fat mask silently moves the bounding rectangle and the 6" width samples.

### Layout (one screen)

- Full-bleed photo with **mask overlay** on the original (included vs excluded), not only the cropped PNG.
- Four knobs **on this screen**, next to the preview — never a trip to Settings:
  - Sheet: auto / green / black
  - Sensitivity
  - Edge offset
  - Feather
- Confirm edge. Then length-axis overlay (rotate / confirm). Then length, thickness, SKU.
- Retake photo. POC does **not** show “Try harder” (server U2Net). That control is deferred, not deleted — do not remove it from architecture docs.

### Live re-run

Changing any knob re-runs client background removal on the current photo and refreshes the overlay immediately. No save button for knobs. No server round trip for mask tuning in POC.

### Empty / error states (capture)

| Situation | What the user sees |
|---|---|
| Sheet color not auto-detected | Prompt: pick green or black. Stay on this screen. |
| Mask not one contiguous slab | Banner on the photo: “Cut is broken — retake or tighten the sliders.” Confirm stays disabled. |
| Axis looks wrong | Rotate control; if still wrong, retake. |
| After crop, shorter side would be &lt; 1600px | Warn: this photo cannot list until retake. No fake upscale. |
| User tries to continue without confirming mask | Confirm is the gate; Continue is disabled until confirm. |

Knobs persist in localStorage (reset-to-default in Settings). They are not server secrets.

---

## 3. Review screen

After calibrated upload (and Call 1 if inference is on).

### Field rendering

| Call 1 confidence | Species, wood categories, edge, figure, grade, feat-* |
|---|---|
| **≥ 0.7** (default; configurable in server settings later, not a POC slider) | Prefill from Call 1. Every value is editable. Show a quiet “suggested” affordance, not a lock. |
| **&lt; 0.7** | Leave **empty**. Do not stash the low-confidence guess in a hidden field. |
| Inference OFF | Empty; user fills by hand. Same mandatory set. |

Pickers for species, wood category, and figure list **only** Woo-synced leaves. No “other”, no hardcoded mill list. A species that appeared in Woo after last sync is invisible until the next successful sync.

Price: recommendation from species $/bdft × bdft when a rate exists; otherwise empty. Override always allowed.

Title / description: empty until the user taps **Generate text** (Call 2) or types. Call 2 never auto-runs.

### Per-field nudges (not submit-only)

While a mandatory field is empty, that control shows an inline state (mark + short line under the field):

- Species: “Pick the species from the store list.”
- Wood category: “Pick at least one wood category.”
- Figure: “Pick at least one figure.”

Nudges appear as soon as the screen loads with empties, and clear when the field is valid. Submit/Continue to ready stays disabled while any of the three is empty — **and** the user can still see which one without scrolling to a toast after tap.

Do not use a single post-submit modal as the only signal.

### Overrides

Changing a prefilled species/figure is a normal edit. No confirm dialog. Manual value is what publishes.

---

## 4. Settings (relevant bits)

- **Store URL**: read-only text from `WOO_BASE_URL` (compose). Not an input.
- Woo username + application password: inputs. Password never round-trips on GET.
- Inference endpoint + key + model; enable flags.
- Species $/bdft table (seeded from synced species only).
- `woo_create_status` draft | publish.
- Reset capture knobs to factory.
- Manual “Refresh taxonomy” is optional for POC; test-connection always syncs.

---

## 5. Validation (field exit and submit)

Shared module on FastAPI (`docs/OPENAPI.md`). Client caches it; hash checked **on submit**, not on every blur.

- Blur: local check with cached rules. Required fields block; optional empty is valid; optional with content must pass.
- Length: hard cap at the Woo limit (cannot type past it).
- Character set: invalid characters rejected on exit.
- Submit: full pass + hash check. Mismatch → “Updating rules” → re-validate → retry. No data loss.

Presentation: errors sit under the field. No top-of-screen dump for field problems.

---

## 6. Publish errors (after commit)

Draft stays on the phone.

**409 duplicate SKU** — inline on SKU:

- “This SKU already exists in the store (any status).”
- Actions: **Edit SKU** (focus the field) · **Open existing listing** (admin URL if the server returned it; otherwise copy SKU and a one-line “look this SKU up in Woo admin”).
- Never show `409` as the message.

**422 stale value** — inline on the field Woo rejected (category, attribute, price, …):

- “This value is no longer valid. Pick from the current list.”
- Options from the synced cache after the submission-time refresh.
- Never show `422` as the message.

Server 5xx / timeout / auth: one recoverable banner (“Couldn’t reach the store — try again”), draft intact. Not a field nudge.

---

## 7. UAT can write cases against

1. First-run overlay appears once; skip persists.
2. Knobs on capture; each slider live-reruns mask overlay on the source photo.
3. Confirm disabled until mask is contiguous.
4. Review with inference ON and confidence ≥ 0.7: fields filled, editable.
5. Review with confidence &lt; 0.7: species/wood category/figure empty; inline nudges; cannot mark ready until all three satisfied.
6. Species picker contains only synced names; typing a non-synced name is impossible.
7. Duplicate SKU: inline SKU recovery, two actions, no raw code.
8. Stale category after sync: 422 copy on that field with current options.

---

## 8. Non-goals (this spec)

- Visual branding, type scale, color tokens.
- Server U2Net “Try harder” control (deferred).
- Configurable 0.7 slider in the UI.
- Offline / airplane-mode chrome.
