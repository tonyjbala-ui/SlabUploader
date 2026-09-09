# UX Design — wireframes (non-normative)

Status: DESIGN · non-normative · 2026-09-03 · SlabUploader

**Not normative.** Signed presentation SoT is `docs/UX.md` (phone and PC browsers). If a wireframe here disagrees with `docs/UX.md`, AGENTS, or TECH-SPEC, follow those and ignore the wireframe. These ASCII screens are layout sketches for discussion, drawn at a 375px phone width; they do not lock mobile-only or override the phone+PC matrix.

Functional rules live in `docs/UX.md`. Confidence gating: `AGENTS.md` §6.
Data model and status machine: `docs/DATA-MODEL.md`.

---

## Screen inventory

1. Settings (once)
2. First-run guidance (once per device)
3. Capture
4. Length axis
5. Type values
6. Review
7. Title / Description
8. Publish
9. Error states

---

## 1. Settings

One-time setup. All screen. Back to home after save.

```
┌─────────────────────────────────────┐
│ Settings                           │
├─────────────────────────────────────┤
│ Store URL                          │
│ https://www.whidbeywoodstore.com   │
│                                    │
│ WP Username                        │
│ [ slab-uploader          ]         │
│ Application Password               │
│ [ ••••••••••••••••••••  ]           │
│ [ Test Connection ]                │
│                                    │
│ Inference                          │
│ Endpoint: [ http://192.168.x.x:v1 ]│
│ API Key:  [ ••••••••••••••••••••  ]│
│ [ Test Connection ]                │
│ [ Enable Vision  ]                 │
│ [ Enable Content ]                │
│                                    │
│ Pricing Rules                      │
│ [+ Add Rule] [Edit]               │
│                                    │
│ Publish Status: [ Draft ▼ ]        │
│ Brand Voice: [ Premium lumber... ]│
│ GEO Context: [ Locally milled... ]│
│                                    │
│ [ Reset Capture Knobs ]           │
│ [ Refresh Store Lists ]          │
└─────────────────────────────────────┘
```

Interaction:
- Test Connection (WP): attempts REST v3 auth, shows green check or red error. Always pulls fresh taxonomy on success.
- Test Connection (Inference): two-turn probe. Shows stateful/stateless/fail.
- Enable Vision: feature flag for Call 1. Defaults off.
- Enable Content: feature flag for Call 2. Defaults off.
- Publish Status: dropdown, default Draft.

---

## 2. First-run guidance

One short card shown on first launch. Dismissed via swipe or tap.

```
┌─────────────────────────────────────┐
│                                    │
│  First run on the floor             │
│                                    │
│  Lay a green or black sheet         │
│  under the slab.                    │
│                                    │
│  Shoot from above with the lens     │
│  parallel to the face.              │
│                                    │
│  Put a tape measure in the shot     │
│  so you can type the length later.  │
│                                    │
│  ──────────────────────────────────  │
│  [ Got it ]                        │
│                                    │
└─────────────────────────────────────┘
```

---

## 3. Capture

Camera view. Source photo on screen. Mask overlay draws on the source.
Four knobs sit next to the overlay.

```
┌─────────────────────────────────────┐
│ Capture                        [R]  │
│ ┌─────────────────────────────────┐ │
│ │                                │ │
│ │        [ SOURCE PHOTO ]        │ │
│ │                                │ │
│ │       ~ mask overlay ~         │ │
│ │                                │ │
│ └─────────────────────────────────┘ │
│                                    │
│ Sheet: [ Auto ▼ ]                 │
│ Sensitivity: [◄─────●───►]        │
│ Edge Offset: [◄───●───►]          │
│ Feather:     [◄─────●───►]        │
│                                    │
│ [ Retake ]              [ Confirm ] │
└─────────────────────────────────────┘

R = retake current photo (new shot, same knobs)
```

Interaction:
- Moving any knob immediately re-runs background removal on the current photo.
- The overlay refreshes on the source image. No apply/save step. No server round-trip.
- Confirm moves to length axis. Retake takes a new photo.
- Knobs persist in localStorage until reset-to-default in Settings.

---

## 4. Length axis

Bounding rectangle and length axis drawn over the confirmed mask.
Width sample lines every 6 inches.

```
┌─────────────────────────────────────┐
│ Length Axis                        │
│ ┌─────────────────────────────────┐ │
│ │                                │ │
│ │       ┌───────────────┐       │ │
│ │       │   SLAB MASK   │       │ │
│ │       │  ──── AXIS ── │       │ │
│ │       │  ┌──┐ ┌──┐ ┌──┐       │ │
│ │       │  │ 6"│ │6"│ │6"│       │ │
│ │       └───────────────┘       │ │
│ │                                │ │
│ └─────────────────────────────────┘ │
│                                    │
│ [ Rotate ↻ ]        [ Confirm ]    │
└─────────────────────────────────────┘
```

Interaction:
- Rotate adjusts the axis. Width samples and sqft update live.
- On nearly square slabs, user picks which side is length.
- Confirm moves to type values.

---

## 5. Type values

Manual values win. Phone computes sqft, bdft, widths.

```
┌─────────────────────────────────────┐
│ Type Values                        │
│                                    │
│ SKU                                │
│ [ BW-0042            ]             │
│                                    │
│ Length (inches)                    │
│ [ 96.0             ]             │
│                                    │
│ Thickness (inches)                 │
│ [ 1.5              ]             │
│                                    │
│ Computed (read-only)               │
│ sqft: 0.64   bdft: 0.96           │
│ widths: 14.0 — 22.0 (avg 18.2)    │
│                                    │
│ [ Done ]                          │
└─────────────────────────────────────┘
```

Interaction:
- SKU: `[A-Z0-9-]{3,24}`. Field-exit check against validation rules.
- Length: 1/8" step. Typing recalculates widths/sqft/bdft live.
- Thickness: 1/8" step pick.
- Done moves to review screen. Draft uploads, status → calibrated.

---

## 6. Review

All store fields. Per-field nudges for missing mandatory fields.
Vision pre-populates when confidence ≥ 0.7. Empty when below.

```
┌─────────────────────────────────────┐
│ Review                           [X]│
│ ──────────────────────────────────  │
│ Photos                             │
│ [ ▢ ] [ ▢ ] [ ▢ ] [ ▢ ] [ ▢ ]     │
│ (processed PNG thumbnails)          │
│ ──────────────────────────────────  │
│ SKU: BW-0042                       │
│ Length: 96.0"  Thickness: 1.5"     │
│ sqft: 0.64   bdft: 0.96            │
│ Widths: 14.0 — 22.0 (avg 18.2)     │
│ ──────────────────────────────────  │
│ Species  [ Black Walnut ▼ ]        │
│ Wood Cat [ Live edge ▼ ]          │
│ Edge Type [ Live Edge ▼ ]         │
│ Figure   [ Cathedral ▼ ]          │
│ Grade    [ Premium ▼ ]           │
│ Fig Tags [ Cathedral ▼ ]          │
│ Feat Tags [ None ▼ ]             │
│ ──────────────────────────────────  │
│ Thickness Band: [ 1"–1 1/2" ▼ ]    │
│ Moisture:     [ Kiln-dried ▼ ]     │
│ ──────────────────────────────────  │
│ Price: [ $12.00 ] (rec $12.00)    │
│ ──────────────────────────────────  │
│ [ Review Title / Desc ]  [ Publish ]│
└─────────────────────────────────────┘

X = exit review, returns to calibrated draft
```

Per-field gating:
- Each missing mandatory field shows an inline empty state as the user works.
- Below-threshold Call 1 leaves taxonomy fields empty. The user sees the empty
  field with a nudge: "Select species" or "Select a figure type".
- Below-threshold leaves taxonomy fields empty. The user must manually fill species, wood
  category, edge type, figure, grade, fig-* tags, and grade to reach ready.
- Submit-time validation only fires after all fields are filled.

Pre-populated field appearance:
- Filled by Call 1: field shows the value with a small "AI" badge. User can
  tap to change. Badge disappears on edit.
- User-filled: no badge.

Gating details:
- Mandatory: exactly one species, ≥1 wood category, 1 edge type, ≥1 figure,
  ≥1 fig-* tag, ≥1 grade, thickness band, moisture, price, SKU, length,
  thickness, sqft/bdft/widths, ≥1 inventory PNG.
- Optional: feat-* tags (zero is fine).
- Publish button is disabled until all mandatory fields are filled.

---

## 7. Title / Description

Type or generate. Generate text is user-initiated.

```
┌─────────────────────────────────────┐
│ Title & Description                │
│ ──────────────────────────────────  │
│ Title                              │
│ [ Black Walnut 8ft × 18.2in Slab... │
│ ──────────────────────────────────  │
│ Short Title                        │
│ [ Black Walnut Slab — Cathedral ]  │
│ ──────────────────────────────────  │
│ Description                        │
│ [ A one-of-a-one cathedral black... │
│ ──────────────────────────────────  │
│ [ Generate Text ]  [ Done ]        │
└─────────────────────────────────────┘
```

Interaction:
- Generate Text: triggers Call 2. Button disabled if content LLM is off or
  inference endpoint unreachable. LLM writes prose only. Templates inject
  deterministic numbers. User can always edit the result.
- Done: returns to review. Title/description stored on the slab.

---

## 8. Publish

Status polling. Result shown inline.

```
┌─────────────────────────────────────┐
│ Publishing...                      │
│                                    │
│  ──────── ● ────────               │
│                                    │
│  Creating store listing...         │
│  Please wait.                      │
│                                    │
└─────────────────────────────────────┘
```

Success:
```
┌─────────────────────────────────────┐
│ Published!                         │
│                                    │
│  Listing created as draft.         │
│  SKU: BW-0042                      │
│  Store product ID: 1042            │
│                                    │
│  [ Open in Store ]  [ Done ]       │
└─────────────────────────────────────┘
```

Failed:
```
┌─────────────────────────────────────┐
│ Publish Failed                     │
│                                    │
│  The store rejected the listing.   │
│  Error shown inline on the field.   │
│                                    │
│  [ Retry ]  [ Back to Review ]      │
└─────────────────────────────────────┘
```

---

## 9. Error and empty states

### 9.1 Mask failure
```
┌─────────────────────────────────────┐
│ Mask Quality                        │
│ ──────────────────────────────────  │
│ Cannot isolate the slab edge.       │
│ Adjust the knobs or retake.         │
│ ──────────────────────────────────  │
│ [ Retake ]                        │
└─────────────────────────────────────┘
```

### 9.2 Axis misalignment
```
┌─────────────────────────────────────┐
│ Axis Check                          │
│ ──────────────────────────────────  │
│ Rotate the axis to match the        │
│ prevailing length of the slab.      │
│ ──────────────────────────────────  │
│ [ Rotate ↻ ]                      │
└─────────────────────────────────────┘
```

### 9.3 Source too small after crop
```
┌─────────────────────────────────────┐
│ Photo Quality                       │
│ ──────────────────────────────────  │
│ Photo will be too small after       │
│ cropping. Please retake with a      │
│ closer shot.                        │
│ ──────────────────────────────────  │
│ [ Retake ]                        │
└─────────────────────────────────────┘
```

### 9.4 SKU duplicate
```
┌─────────────────────────────────────┐
│ SKU Check                           │
│ ──────────────────────────────────  │
│ This SKU already exists in the      │
│ store (any status).                 │
│ ──────────────────────────────────  │
│ [ Edit SKU ]  [ Open Existing ]     │
└─────────────────────────────────────┘
```

### 9.5 Stale taxonomy value
```
┌─────────────────────────────────────┐
│ Field Check                         │
│ ──────────────────────────────────  │
│ This value is no longer valid.      │
│ Pick from the current list.         │
│ ──────────────────────────────────  │
│ [ Refresh Store Lists ]           │
└─────────────────────────────────────┘
```

### 9.6 Store unreachable
```
┌─────────────────────────────────────┐
│ Connection                          │
│ ──────────────────────────────────  │
│ Cannot reach the store. Check your  │
│ connection and settings.            │
│ ──────────────────────────────────  │
│ [ Retry ]  [ Open Settings ]       │
└─────────────────────────────────────┘
```

### 9.7 Vision off or below threshold
```
┌─────────────────────────────────────┐
│ Review (vision off)                │
│ ──────────────────────────────────  │
│ Species  [ Select ▼ ]  ◉ Select species
│ Wood Cat [ Select ▼ ]  ◉ Select category
│ Edge Type [ Select ▼ ]  ◉ Select edge
│ Figure   [ Select ▼ ]  ◉ Select figure
│ ──────────────────────────────────  │
└─────────────────────────────────────┘

◉ = inline nudge (per-field)
```

---

## Interaction patterns

### Per-field gating (review screen)
- Each mandatory field that is empty shows an inline nudge as the user works.
- The nudge is a small text hint to the right of the field.
- Below-threshold Call 1 leaves fields empty with nudges visible.
- Fill the field to dismiss the nudge.
- Publish button stays disabled until all mandatory fields are filled.

### Pre-populated field state
- Fields filled by Call 1 show the value with an "AI" badge.
- User can tap the field to change it. The badge disappears on edit.
- User-filled fields have no badge.

### Knob interaction (capture screen)
- All four knobs are on the capture screen next to the overlay.
- Moving a knob immediately re-runs background removal.
- No apply/save step. No server round-trip for mask tuning.

### Axis rotation
- Drag or tap to rotate the axis. Width samples and sqft update live.
- Confirm locks the axis for measurement.

### Generate text
- Button only appears if content LLM is enabled and inference is reachable.
- Disabled if the text service is down.
- Never runs automatically. User taps it.

### Publish flow
- Tap Publish. Status moves to publishing. Poll for result.
- Success: show result, offer to open in store.
- Failed: show error detail, keep draft and photos, allow retry.
- SLAB-UAT-* SKUs always create as Woo draft regardless of settings.

---

## Browser compatibility gate

Shown on load if browser lacks required APIs.

```
┌─────────────────────────────────────┐
│ Browser Update                      │
│ ──────────────────────────────────  │
│ This app requires a recent browser. │
│ Please update Safari or Chrome,     │
│ then try again.                     │
│ ──────────────────────────────────  │
│ [ Update Browser ]                  │
└─────────────────────────────────────┘
```

---

## UAT test cases (derived from wireframes)

1. **Settings once**: enter WP credentials, test connection, taxonomy syncs.
2. **First-run guidance**: card shows and dismisses.
3. **Capture**: take photo, mask overlays, adjust knob, overlay refreshes live, confirm.
4. **Length axis**: bounding rect draws, rotate axis, confirm, widths update.
5. **Type values**: enter SKU/length/thickness, computed values appear, done.
6. **Review — vision on, ≥ 0.7**: taxonomy fields pre-filled with AI badge, editable.
7. **Review — vision on, < 0.7**: taxonomy fields empty, per-field nudges visible, user fills manually.
8. **Review — vision off**: all taxonomy fields empty, per-field nudges visible, user fills manually.
9. **Publish — success**: draft created, product ID stored, images purged.
10. **Publish — duplicate SKU**: error on SKU field, edit SKU or open existing.
11. **Publish — stale taxonomy**: error on field, refresh store lists, pick current option.
12. **Publish — SLAB-UAT-***: always creates as draft regardless of settings.
13. **Generate text**: button visible when enabled, disabled when service down, LLM prose injected.
14. **Retake paths**: mask failure → retake, source too small → retake.
