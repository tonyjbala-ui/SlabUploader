# Technical Spec: Deterministic Image Pipeline & Area → Bdft

Status: SPEC · 2026-08-27 · Gate A freeze 2026-08-31 · TyTech / SlabUploader
Scope: algorithms and test vectors for the deterministic core (client-authoritative).
No inference, no LLM. Everything here is a pure function of (pixels, user inputs) → outputs.
Inference, Woo payload, API, and schema live in other docs.

---

## 1. Invariants

1. **Determinism** — same inputs → bit-identical outputs. No randomness, no timestamps in math, no network calls for the math.
2. **Manual entry is authoritative** — user-entered length, thickness, SKU, and price always win over any computed value.
3. **Fallback chain is explicit** — every computed value has a defined fallback; the system never silently guesses.
   - BG removal: chroma-key / threshold → user slider / sheet toggle → U2Net → retake.
   - Length axis: min-area bounding rect → user rotate/confirm → retake if the photo is unusable.
   - Area: requires a single contiguous slab mask; broken mask → flag and retake.
4. **Units** — inches in 1/8" steps; sqft and bdft to 2 decimals; price half-up to 2 decimals. Those rounded values are what get stored. No sqin in the UI, tests, or product copy.
5. **Client is authoritative** — all deterministic processing runs in the browser. The server stores the numbers and files the client sends, and handles Woo sync.

## 2. Units and rounding

| Quantity | Source | Stored / displayed |
|---|---|---|
| Length | user, 1/8" steps | nearest 1/8" |
| Thickness | user pick, 1/8" steps | that pick (used in math and copy) |
| Thickness Woo attribute | same pick, rounded **up** into a Woo range | Woo term, not the 1/8" value |
| sqft | computed from mask | 2 decimals |
| bdft | sqft × thickness (inches) | 2 decimals |
| Price | species $/bdft × bdft, or override | 2 decimals, half-up |

- bdft is never rounded up to whole board feet.
- Pixel→inch scale is an implementation detail. Users never see pixels.

## 3. Background removal

The user must see where the cut will land and be able to fix it. Edge quality is the foundation of sqft and bdft.

### 3.1 Auto-detect sheet
1. Sample a 2–5% strip on all four borders.
2. Average HSV per side.
3. Hue in [35, 85] and saturation ≥ 40 → green.
4. Else value ≤ 30 and saturation ≤ 20 → black.
5. Else prompt: pick green or black.

### 3.2 Visual feedback (required)
- Overlay the mask on the photo (what will be removed vs kept).
- Show the slab edge clearly — that edge is the measurement boundary.
- User confirms the edge before length / area run.

### 3.3 Persisted settings (reset-to-default available)
Factory values live in code. If the user changes them, the new values persist until reset.

1. **Sheet** — auto / green / black.
2. **Sensitivity** — one slider; tighter vs looser detection (green: HSV range width; black: brightness cutoff).
3. **Edge offset** — pull the mask in or out a few pixels so the cut sits on the wood, not in the sheet or into the grain.
4. **Feather** — hard cut vs a couple of pixels of alpha blend.

### 3.4 Algorithms
- **Green:** chroma-key in HSV. Border flood-fill so only sheet pixels connected to the image edge are removed (protects green-ish grain inside the slab).
- **Black:** grayscale threshold. Same flood-fill (protects dark grain).
- **Fallback:** if the edge is still wrong after adjustment, U2Net matting. Last resort.
- Morphological close, then feather per the setting.

### 3.5 Edge quality
- The mask must be one contiguous slab contour.
- If the user cannot get a clean edge, retake is the resolution.

## 4. Length axis, widths, sqft, bdft

### 4.1 Contour and length axis
1. Binary mask M from §3.
2. Largest contour → convex hull.
3. Minimum-area bounding rectangle on the hull.
4. Long side = length axis; short side = width axis.
   This follows the **prevailing** length, not a diagonal cut on one end.

### 4.2 Visual feedback (required)
- Overlay the bounding rectangle and the length axis.
- Width sample lines drawn perpendicular to that axis.
- User confirms the axis matches the slab’s prevailing length.
- **Rotate axis** if it is skewed; samples and sqft scale update live.
- Nearly square slabs: user says which axis is length.

### 4.3 Scale
User length L (inches, 1/8") is authoritative.

```
scale = longest_axis_px / L
```

### 4.4 Widths (listing only, not bdft)
- Sample every **6"** along the confirmed length axis, perpendicular to it.
- Report min, max, and average width for the description.
- Auto-dimension overlay on the photo is **v1.5**, out of this spec.

### 4.5 sqft
Projected top-down area of the mask. Live-edge thickness and the underside are not in the area.

```
sqft = (mask_pixel_count / scale²) / 144
```

Round to 2 decimals.

### 4.6 bdft

```
bdft = sqft × thickness_in
```

Round to 2 decimals. Identity: 1 sqft at 1" thick = 1 bdft.

## 5. Photo normalization

Applies to every inventory photo of the slab (first photo and the rest).

- Crop aspect: **3:4 portrait** (default; matches the WooCommerce template;
  configurable in settings).
- Transparent **PNG only**.
- Slab centered. **80% fill at the extremes** (widest and tallest points of the slab). Extra margin where the slab is narrower.
- After crop, if the source has enough pixels, shorter side ≥ **1600 px**. If it cannot, warn and ask for a retake — do not invent pixels.
- Original + processed kept while draft/retry; both purged after successful publish (server storage; see Data Model).

## 6. Pricing

- Settings: sync **species** from Woo; user sets **$/bdft per species**.
- Capture: `recommendation = bdft × species.price_per_bdft`, pre-fills price.
- User may override. Override sticks for that slab.
- No rule for that species → empty price; user types it. Publish still allowed.
- Stored price: half-up to 2 decimals.
- Figure- or category-weighted price is **v1.5**.

## 7. Constants

### 7.1 Code (not in Settings)
```
FILL_TARGET      = 0.80
ASPECT_W, ASPECT_H = 3, 4
OUTPUT_PX_MIN    = 1600
WIDTH_SAMPLE_IN  = 6
INCH_STEP        = 0.125
AREA_DECIMALS    = 2
BDFT_DECIMALS    = 2
PRICE_DECIMALS   = 2
```

### 7.2 Factory defaults for persisted BG settings
```
SHEET            = auto
GREEN_HUE_LO/HI  = 35, 85
GREEN_SAT_MIN    = 40
GREEN_VAL_MIN    = 40
BLACK_THRESH     = 30
```
Sensitivity, edge offset, and feather map onto these at runtime. Users do not edit the raw HSV numbers.

## 8. Test vectors

Users think in inches, sqft, and bdft. Pixels are only how the computer gets there.

### TV-1 Green sheet
Synthetic: green border, wood in the center. Interior green-ish patch that does not touch the border stays. Coverage enough that U2Net does not run.

### TV-2 Black sheet
Same layout, black border, mid-tone wood. Dark interior wood that does not touch the border stays.

### TV-3 Scale, sqft, bdft
Slab **96" long**, **1.5" thick**. Mask measures **0.64 sqft**.  
bdft = 0.64 × 1.5 = **0.96**.

### TV-4 Width samples
96" length axis, stations every 6". Widths perpendicular to the confirmed axis. Listing gets min, max, avg.

### TV-5 Angled end
One square end, one 45° cut. Length axis follows prevailing length, not the diagonal. Widths stay perpendicular after user confirm.

### TV-6 3:4 crop, 80% at extremes
Slab centered in a 3:4 frame. At the widest and tallest points, fill = 0.80. PNG with alpha. Shorter side ≥ 1600 when the source allows.

### TV-7 Too-small source
After 80% crop, shorter side would be below 1600 and the source cannot supply it. Warn. Do not upscale from nothing. That photo is not publishable until retake.

### TV-8 Pricing
bdft 0.96, species $12.50/bdft → rec **12.00**.  
Override **150.00** stored as 150.00.  
No rule → rec empty; manual 99.99 stored as 99.99.

### TV-9 Thickness → Woo range
User pick **1"** stored as 1". Attribute bucket is the Woo range that 1" rounds **up** into (e.g. `1"–1 1/2"`). Exact range labels come from the synced Woo attribute, not this file.

### TV-10 Rounding
Length 96.04" → **96"** (nearest 1/8").  
sqft 0.641 → **0.64**.  
bdft 11.525 → **11.53**.  
Price 12.345 → **12.35**.

## 9. Assumptions

1. The first photo is top-down, lens parallel to the broad face. Tilted shots make sqft/bdft wrong; retake is the fix.
2. User length is the prevailing length of that face, in 1/8". The bounding-box axis is confirmed in the UI.
3. Thickness is the declared 1/8" pick, not measured from any photo.
4. sqft is the projected top-down area of the mask. Live-edge thickness and underside are not in the area.
5. bdft = sqft × thickness (inches). Not rounded up to whole board feet.
6. Sheet is uniform green or black. Odd colors → user picks sheet mode or retakes.
7. 3:4 portrait is the PIP crop, configurable in settings.
8. Client does all of this math. Server stores the numbers the client sends.

## 10. Out of scope here (covered in other docs)

| Topic | Doc |
|---|---|
| Call 1 / Call 2 prompts, taxonomy mapping | Content / Woo |
| Woo payload, publish, duplicate SKU | Content / Woo, OpenAPI |
| SQLite tables, status machine | Data Model |
| HTTP contract | OpenAPI |
| Client vs server topology | Architecture |
| Auto-dimension overlay, figure-weighted price | Impl plan (v1.5) |
| Offline capture | non-goal (online-only POC; see AGENTS) |
