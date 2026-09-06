# Phone flow

What the mill owner does on the phone, from first photo to a store listing. Math and constants live in `docs/TECH-SPEC-PIPELINE.md`. Field names and the ready set live in `docs/DATA-MODEL.md`. Store payload and create steps live in `docs/CONTENT-WOO.md`. Wireframes and interaction patterns: `docs/UX-DESIGN.md`.

Values you type are kept as-is. Vision fills store fields per the confidence gating rules in `AGENTS.md` §6.

---

## Main path

### Settings once

The store URL shows read-only from the deploy (`WOO_BASE_URL`). You always know which store this phone talks to.

Enter the WordPress username and application password for the low-privilege store user, under Users → Profile in WordPress. The password is write-only: you type it once. To rotate, revoke the old one in WordPress and enter a new one here.

On the same screen: species $/bdft rates, vision on/off with endpoint and key, draft vs publish for new listings (default draft), reset capture knobs to factory, and an optional refresh of the store lists. **Test connection** always pulls fresh species, attributes, and tags from the store when it succeeds.

### First run on the floor

One short card, then dismiss. Lay a green or black sheet under the slab. Shoot from above with the lens parallel to the face. Put a tape measure in the shot so you can **type** the length later. Your typed number is what the app measures against.

### Capture

Take 1 to 5 inventory photos.

The source photo stays on screen, and the mask draws over that original: kept wood versus dropped sheet. Four knobs sit next to the overlay:

1. Sheet — auto, green, or black
2. Sensitivity
3. Edge offset
4. Feather

Move a knob and background removal re-runs on this photo; the overlay refreshes immediately. Nothing round-trips to the server for mask tuning. The knobs stick in local storage until you reset them to factory.

Confirm the mask edge by eye. If the cut sits on the wood edge, confirm it. If it clips grain or still holds sheet after you tune, retake the photo. The one-photo server U2Net path stays in the architecture for post-POC; it is deferred from POC.

### Length axis

The bounding rectangle and length axis draw over the confirmed mask, with width sample lines every 6 inches along that axis. Rotate until the axis matches the slab's prevailing length, then confirm. On a nearly square piece you pick which side is length.

### Type length, thickness, SKU

Manual values win. The phone computes square feet, board feet (`bdft = sqft × thickness_in`, no `/12`), and width min / max / avg from the mask and your typed length.

It builds 3:4 transparent PNG inventory images at 80% fill on the extremes. After that crop, if the source does not have enough pixels for a shorter side of 1600 px, that photo is not publishable until you retake it. The floor and the math are in `docs/TECH-SPEC-PIPELINE.md` (constants and TV-7).

### Draft upload (calibrated)

When mask, axis, length, thickness, and SKU are set and the numbers and PNGs are ready, the phone uploads originals + processed PNGs + length / thickness / SKU / sqft / bdft / widths. App status becomes **calibrated**.

### Review (store fields)

Everything the listing needs lands here. A required control that is still empty shows an inline empty state as you work.

**Always on the form from capture and defaults**

- Inventory photos as processed transparent PNGs (at least one)
- SKU, length, thickness
- Computed sqft, bdft, width min / max / avg
- Thickness store band from your typed thickness, rounded **up** into the synced Woo thickness range
- Moisture starts at **kiln-dried**. Vision does not set moisture. Change it for green or air-dried slabs.
- Price: species $/bdft × bdft prefills when a rate exists for that species. If there is no rate, the field starts empty and you type the price. Override anytime; your override sticks for this slab.

**Species and store taxonomy**

Pickers and any vision lists are exactly the last pull from the store. A new Woo species becomes selectable only after a sync lands it in the cache.

Call 1 prefill behavior: see CONTENT-WOO §2.3. Every pre-fill is editable. Typed values win.

**Required before the slab is ready to list**

- Exactly one species
- At least one wood category
- One edge type
- At least one figure term
- At least one `fig-*` tag
- At least one grade
- Thickness band (the round-up above)
- Moisture (kiln-dried unless you changed it)
- Price
- SKU, length, thickness, client sqft / bdft / widths, at least one inventory PNG

Feature (`feat-*`) tags are optional; zero is fine.

### Title, short title, description

Type them, or tap **Generate text**. Generate text is off unless content generation is enabled in Settings. Templates still work when the text service is down. The model writes prose only. Templates inject the measured values into the final text.

If title, short title, or description are still blank at publish, templates fill them from the measured facts (species, lengths, widths, thickness, bdft). You can edit any of it afterward.

### Publish

When the ready set above is complete, tap publish. App status moves through **publishing** while you wait for the result.

Create status comes from Settings (`draft` or `publish`, default `draft`). SKUs that match `SLAB-UAT-*` always create as Woo **draft**, even when Settings say publish. Practice listings stay draft so customers do not see them.

On success the server deletes originals and processed images. A slab marked published in the app means the store create succeeded; that is not the same word as WooCommerce "publish."

---

## Practice path (UAT)

Same capture and review as production, with a `SLAB-UAT-*` SKU. The listing is forced to Woo draft regardless of the draft/publish setting. Change the SKU when you are ready for a real listing.

---

## Usual failures

**Mask clips wood or still holds sheet.** Turn the four knobs; confirm by eye. If it is still wrong, retake. A bad edge shifts square feet and widths without a later numeric check.

**Axis skewed or on the wrong length side.** Rotate the axis, or retake. Widths and sqft follow whatever axis you confirm.

**Source too small after the 3:4 / 80% crop.** The app warns and asks for a retake of that photo. See `docs/TECH-SPEC-PIPELINE.md` TV-7.

**Required store field still empty.** Inline empty state on that control. Publish stays blocked until the full ready set in Main path is filled.

**SKU already exists in the store under any status** (draft, private, publish, and the rest). The message sits on the SKU field: it already exists in the store. Actions there: edit the SKU, or open the existing listing when a link is available. This version does not edit the other product in place. Raw status codes do not appear on screen.

**Category, attribute, tag, or price no longer valid after a list refresh.** The message sits on that field: the value is no longer valid; pick from the current list, and the current options come with it. Your draft stays on the phone.

**Rules copy on the phone went stale at submit.** Brief "Updating rules." The phone refetches the shared rules, checks again, and retries.

**Store unreachable, auth failure, or other hard Woo failure.** Plain failure message. The slab can move to failed with detail. Draft and photos stay so you can retry.

**Vision off or below threshold.** Fill the required set by hand. Moisture starts kiln-dried, and the thickness band comes from your typed thickness. Inference is assist-only.

**Generate text unavailable.** Button disabled. Type copy or let templates write at publish.

Leaving a field: SKU is `A-Z`, `0-9`, and hyphen, length 3–24. Title, short title, and description cannot exceed the store max length.

## Browser compatibility

The app requires **iOS Safari 17** or **Android Chrome 110** (or newer). These versions provide the APIs the image pipeline depends on: OffscreenCanvas, MediaDevices, Web Workers, File System Access, and structuredClone.

When an older browser loads the app, the landing page shows:

> This app requires a recent browser. Please update Safari or Chrome, then try again.

The message includes a link to the browser's update page..

---

## Out of scope for this POC UI

Server U2Net "Try harder" on capture (deferred from POC). A user slider for the 0.7 vision threshold. Offline / airplane capture. Any image-quality classifier or score. Strings painted on the live photo about lighting, steadiness, mask confidence, or a pixel requirement.
