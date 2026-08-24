# Technical Spec: Deterministic Image Pipeline & Ruler→Inch Math

Status: SPEC (pre-implementation) · 2026-08-24 · TyTech / SlabUploader
Scope: PRD deliverable #1 — algorithms and test vectors for the deterministic core.
No inference, no LLM. Everything here is pure functions of (pixels, inputs) → outputs.
Every threshold/constant lives in §8 (single source of truth) and is unit-tested.

---

## 1. Invariants

1. **Determinism** — same inputs → bit-identical outputs. No randomness, no timestamps in math, no network calls.
2. **Manual entry is authoritative** — a user-entered value (length, width, thickness, SKU, price) always wins over any computed value.
3. **Fallback chain is explicit** — every computed value has a defined fallback; the system never silently guesses.
4. **All math in inches and board feet** — stored as float64; display rounding per §2.
5. **Client vs server split** — client runs the *light* pass (preview, OCR, quick ruler check) for feedback; server runs the *authoritative* pass. Server values are what get stored and published. Client results are hints only.

## 2. Units & rounding

| Quantity | Internal | Display | Stored |
|---|---|---|---|
| Length, widths | float64 inches | 1 decimal | full precision |
| Thickness | float64 inches (manual) | 2 decimals (eighths OK in UI) | full precision |
| sqft | float64 | 1 decimal | full precision |
| bdft | float64 | 1 decimal | full precision |
| Price | float64 USD | 2 decimals | 2 decimals (round half-up) |

- bdft is **never rounded up to whole units** (ASSUMPTION — flag to Ty: lumber-trade practice sometimes rounds up; v1 does not).
- Price computed from unrounded bdft, then rounded half-up to cents.
- Pixel→inch scale is float64 px/inch, never pre-rounded.

## 3. Ruler → inch scale

### 3.1 Inputs
- `ruler.png` — calibration photo: a standard **12-inch ruler** (Decision 3: always inches), placed flat and parallel to the slab's long axis on the green sheet.
- Known: `RULER_INCHES = 12.0` (§8).

### 3.2 Server algorithm (authoritative)
```
1. Grayscale, GaussianBlur (k=5, σ=1.0)
2. Detect the ruler:
   a. Canny (40, 120) → contours → candidate quads (4 corners, area > 5% of frame)
   b. Score candidates: high straight-line edge density (Hough, minLineLength=10% of ruler width),
      regular tick spacing (see 3.3), aspect ratio within 12:0.5..12:2 band
   c. Take highest score; none above TICK_SPACING_TOL → RULER_FAIL
3. Perspective-correct the ruler to a top-down rect using its 4 corners
   → rect of W_r × H_r px, long axis horizontal
4. Tick detection on the corrected rect:
   a. Column-wise dark-pixel projection over the central 60% band of the rect
   b. Local minima with prominence > MIN_TICK_PROMINENCE → tick x-positions
   c. Cluster ticks; compute gaps; identify the modal gap g_mode
   d. Tick labels: integer inches where cumulative distance from the first
      labeled tick ≈ k × g_mode for k = 1..12
   e. Scale candidate: s = (x_{12th tick} − x_{1st tick}) / 11.0   [px per inch]
      (11 gaps between tick 1 and tick 12)
   f. Validation: |g_mode − (s/1)| < TICK_SPACING_TOL and tick count ≥ 12
5. Cross-check with the ruler rect edges: s_edge = (W_r − 2·margin) / 12.0
   where margin is the detected pre-"1" and post-"12" padding (mode tick gap).
   If |s − s_edge| / s < RULER_CROSS_CHECK_TOL → use s.
   Else → prefer s (tick-based), log warning.
6. Emit: scale_px_per_inch = s, ruler_confidence = f(tick_count, tol residuals)
```
`RULER_FAIL` → the pipeline proceeds via the manual-length path (§5.3).

### 3.3 Client light pass (OpenCV.js, preview only)
Canny + largest 4-point contour + tick projection. Emits a *hint* scale for live
feedback ("~201 px/in — looks right"). Never stored. If it fails, UI says
"ruler unclear — you can enter length manually."

### 3.4 SKU OCR (client, Tesseract.js)
- Preprocess: grayscale → contrast stretch → upscale ×2 if ruler-width < 800 px → binarize (Otsu)
- PSM: 7 (single line), character whitelist: `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-`
- Accept if: confidence ≥ OCR_CONF_MIN AND regex `^[A-Z0-9-]{3,24}$`
- Else → manual SKU entry (FR3). Server re-runs OCR on upload as a secondary check; mismatch → surface both, user picks.

## 4. Top-down photo → pixel geometry

The inventory photo used for width sampling must be **top-down** (slab flat on the
green sheet, camera above). Selection rule: the first inventory photo whose slab
contour aspect ratio matches (L_px : w_px ≈ reported L : expected w) — else the
user picks which photo is top-down in the review UI (FR23).

```
1. Green-sheet removal (see §7.1) → slab mask M
2. Contour of M → C (largest contour)
3. Rotate C so its principal axis is horizontal (PCA)
4. Length in px: L_px = max extent along the axis
5. If ruler scale available: L_in = L_px / s.  Cross-check vs any user-entered
   length (manual is authoritative; if |L_in − L_manual| / L_manual > LEN_MISMATCH_TOL
   → warn in UI, use manual).
6. Edge profiles: for x ∈ [0, L_px], y_top(x), y_bot(x) from C.
   Width profile: w(x) = y_bot(x) − y_top(x)
```

## 5. Dimensions → sqft → bdft

### 5.1 Width sampling at peaks & troughs (Decision 1)
```
1. Smooth w(x) with a moving average (window = L_px / 50)
2. Find local maxima (peaks) and minima (troughs) of w(x) with
   prominence > WIDTH_FEATURE_PROM
3. Candidate sample x-positions:
   - x = 0.05·L_px  and  x = 0.95·L_px  (near both ends, always)
   - all peak/trough x-positions (trimmed to interior)
4. Select 3–5 points (WIDTH_SAMPLES_MIN..MAX):
   always keep the two end points; add interior points ranked by prominence
   until 5, or stop at 3 if fewer interior features exist.
5. w_i = w(x_i) in px → inches via scale (or via manual length, §5.3)
6. w_avg = (Σ w_i) / n        (Decision 18)
```

### 5.2 Core math
```
sqft = (L_in × w_avg_in) / 144
bdft = (L_in × w_avg_in × t_in) / 12        (Decision 18)
```

### 5.3 Fallbacks (Decisions 2, 19)
| Available | Scale source | Length | Widths |
|---|---|---|---|
| Ruler OK | ruler px/in | computed (cross-checked vs manual) | sampled from top-down photo |
| Ruler FAIL, manual L, top-down photo OK | L_manual / L_px | manual (authoritative) | sampled from photo via derived scale |
| Ruler FAIL, manual L, NO usable top-down photo | — | manual | **manual width entry** (Decision 19; single width = w_avg) |
| No length at all (no ruler, user declines) | — | BLOCK publish — length is required | — |

## 6. Pricing (Decisions 4, 5, 13)
```
rule = pricing_rules[species, character]        (seeded from synced Woo categories)
recommendation = bdft × rule.price_per_bdft     (unrounded bdft)
final_price = user override if edited, else recommendation
stored_price = round_half_up(final_price, 2)
```
- No rule for (species, character) → recommendation = null, UI shows "no pricing rule — set price manually". Publish still allowed with a manual price.

## 7. Photo normalization (Decisions 8, 20)

### 7.1 Green-sheet background removal (deterministic first)
The sheet is a uniform green; chroma-key beats a general matting model here:
```
1. Convert to HSV (OpenCV 8-bit: H 0–179)
2. Sheet mask: H ∈ [GREEN_HUE_LO, GREEN_HUE_HI] AND S ≥ GREEN_SAT_MIN AND V ≥ GREEN_VAL_MIN
3. Border flood-fill: keep only sheet pixels connected to the image border
   (protects greenish wood tones inside the slab)
4. Morphological close (kernel 9) then 1–2px feather on the alpha edge
5. Fallback: if sheet coverage < SHEET_COV_MIN of frame (wrong background),
   escalate to U²Net matting for that photo and flag it in the log
```

### 7.2 Boundary detection & 1:1 crop (FR20)
```
1. Slab bbox from mask M (after removal)
2. Target: slab occupies FILL_TARGET of the final 1:1 frame
   → frame side (px) = min(bbox_w, bbox_h) / FILL_TARGET
3. Crop window: square of that side, centered on the bbox center
   (clamped to source bounds; if clamped, re-center on the clamp-constrained side)
4. Upscale/crop to 1600×1600 (Decision 20; 1000×1000 is the hard minimum —
   if source can't supply 1000 px of slab in the short dimension, keep source
   resolution, flag "low-res" in the review UI)
5. Output: 1600×1600 PNG (transparency preserved), plus a JPEG (q=85) copy
   for the WooCommerce upload
```

### 7.3 Merchandising filter (FR22, optional, per-slab toggle)
Deterministic LUT: contrast +12% (linear stretch), warmth +8 (R/B channel shift
toward warm), grain = unsharp mask (radius 2, amount 0.4). Fixed constants in §8 —
no per-photo tuning. Applied after §7.2, before encode.

### 7.4 What gets stored (Decision 12)
- While draft / retry: original + normalized, both on disk (Docker volume)
- After successful publish: both purged (SQLite rows keep metadata only)

## 8. Deterministic constants (single source of truth)

```python
RULER_INCHES          = 12.0     # known physical ruler length
CANNY_LO, CANNY_HI    = 40, 120
MIN_TICK_PROMINENCE   = 0.15     # of projection peak amplitude
TICK_SPACING_TOL      = 0.05     # 5%
RULER_CROSS_CHECK_TOL = 0.03     # 3%
OCR_CONF_MIN          = 70       # Tesseract 0–100
LEN_MISMATCH_TOL      = 0.05     # 5%
WIDTH_FEATURE_PROM    = 0.02     # 2% of L_px, in width-profile prominence
WIDTH_SAMPLES_MIN, WIDTH_SAMPLES_MAX = 3, 5
END_TRIM              = 0.05     # sample at 5% and 95% of length
GREEN_HUE_LO, GREEN_HUE_HI = 35, 85
GREEN_SAT_MIN         = 40
GREEN_VAL_MIN         = 40
SHEET_COV_MIN         = 0.25     # sheet must cover ≥25% of frame
FILL_TARGET           = 0.80     # slab fill of final frame
OUTPUT_PX             = 1600     # 1:1 output size (Decision 20)
OUTPUT_PX_MIN         = 1000     # hard minimum
JPEG_QUALITY          = 85
FILTER_CONTRAST       = 0.12
FILTER_WARMTH         = 8
FILTER_GRAIN_RADIUS   = 2
FILTER_GRAIN_AMOUNT   = 0.4
```
All of these are importable module-level constants (`pipeline/constants.py` when
implemented) and each test vector in §9 pins at least one of them.

## 9. Test vectors

### TV-1: Ruler scale (pure math)
Ruler rect corrected; ticks detected at px [100, 300, 500, …, 2300] (12 ticks, 200 px apart).
- scale = (2300 − 100) / 11 = **200.0 px/in**
- s_edge with margin 100 px each side, W_r = 2500: (2500 − 200) / 12 = 191.67 → Δ = 4.2% > 3% → use tick scale, log warning. ✔ expected branch.

### TV-2: Full happy path
- scale = 200 px/in (from TV-1)
- L_px = 19,200 → L = 96.0 in
- widths (px) at x = 960, 4800, 9600, 14400, 18240: [3500, 3640, 3800, 3560, 3700]
  → inches: [17.5, 18.2, 19.0, 17.8, 18.5] → w_avg = **18.2 in**
- t = 1.5 in (manual)
- sqft = (96 × 18.2) / 144 = **12.13**
- bdft = (96 × 18.2 × 1.5) / 12 = **218.40**
- rule: (Black Walnut, Cathedral) = $12.50/bdft
- recommendation = 218.40 × 12.50 = **$2,730.00**

### TV-3: Manual length, derived scale
- RULER_FAIL; manual L = 96.0 in; L_px = 19,200 → scale = 200.0 px/in (derived)
- Same width px as TV-2 → identical downstream results (18.2 in avg, 218.40 bdft).
- Asserts the fallback chain is value-equivalent when inputs match.

### TV-4: No top-down photo (Decision 19)
- Manual L = 96.0, manual width = 18.0, t = 1.5
- w_avg = 18.0 → bdft = (96 × 18 × 1.5) / 12 = **216.00**
- No photo used in math; publish allowed.

### TV-5: Pricing edge cases
- bdft = 218.4, rule $12.34 → rec = 2695.056 → stored **$2,695.06** (half-up)
- bdft = 0 (degenerate) → rec = $0.00, UI blocks publish (slab must have positive dims)
- No rule → rec = null; manual price $999.99 stored as-is.

### TV-6: Normalization geometry
- Source 4000×3000; slab bbox (px): x 400..3600, y 600..2400 → w=3200, h=1800
- frame side = 1800 / 0.80 = 2250
- crop: 2250×2250 centered on (2000, 1500) → x 875..3125, y 275..2525 (in bounds ✔)
- slab fill check: 1800 / 2250 = **0.80** ✔
- Output: 1600×1600. Slab in output: 1800·(1600/2250) = 1280 px → 80% of 1600 ✔
- Clamp case: bbox center (1000, 1000), side 2250 → clamp x to 0..2250, y to 0..2250; re-center rule applies; expected crop x 0..2250, y 0..2250 with slab offset left/up — fill still 0.80.

### TV-7: Green-sheet key
- Synthetic: 1000×1000, H=60 S=120 V=120 background; center 400×200 rect H=20 S=60 V=80 (wood)
- Expected: mask covers background minus the wood rect; border-flood removes any
  interior sheet-colored islands; sheet coverage = 60% ≥ 25% ✔ (no U²Net escalation)
- Wood rect with a green-ish tone (H=45 S=50 V=100) touching no border → NOT removed (border flood) ✔

### TV-8: Width sampler selection
- w(x) profile: ends 100, peak 140 at x=0.3L, trough 90 at x=0.6L, end 105
  (prominences: peak 40 ≥ 2% of L_px-scale ✔, trough 50 ✔)
- Expected sample points: {0.05L, 0.95L, 0.3L(peak), 0.6L(trough)} = 4 points (≤5 ✔)
- n=4 → w_avg = (100+105+140+90)/4 = 108.75 (px) → inches via scale.

### TV-9: OCR acceptance
- "BW-0042" conf 85, regex ✔ → accept
- "BW-004?" conf 78 → regex ✘ → manual entry
- "BW-0042" conf 65 → conf < 70 → manual entry

## 10. Assumptions (flagged for Ty)

1. **bdft not rounded up** to whole units (§2). Say the word and it's a one-line change.
2. **12-inch ruler** with inch ticks is the standard calibration tool (Decision 3 implies; spec assumes a 1-ft rule with ticks at every inch).
3. **Top-down photo selection** = best aspect-ratio match, user-overridable (FR23). No inference used for this.
4. **Ruler parallel to long axis** — if the user places it diagonally, tick scale is still valid (it's a linear scale), only the cross-check margin logic degrades; acceptable for v1.
5. Green sheet is the standard bright craft green. A different sheet color → U²Net fallback path (§7.1 step 5), not a config item in v1.

## 11. Out of scope for this spec (next: OpenAPI contract, deliverable #2)
- Endpoint shapes, request/response schemas, error taxonomy
- SQLite schema beyond the pricing-rule shape (PRD)
- WooCommerce product payload mapping
- Content generation templates (FR16) — deterministic template design is a separate short doc
