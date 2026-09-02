# Phone flow

What the mill owner does on the phone, from first photo to a store listing. Math and constants live in `docs/TECH-SPEC-PIPELINE.md`. Field names and the ready set live in `docs/DATA-MODEL.md`. Store payload and create steps live in `docs/CONTENT-WOO.md`.

Values you type are kept as-is. Vision fills store fields only when it is at least 0.7 confident; everything else you fill in yourself.

---

## Main path

### Settings once

The store URL shows read-only from the deploy (`WOO_BASE_URL`). It is not an input field. You always know which store this phone talks to.

Enter the WordPress username and application password for the low-privilege store user, under Users → Profile in WordPress. The password is write-only: you type it once, and it never comes back on load. To rotate, revoke the old one in WordPress and enter a new one here.

On the same screen: species $/bdft rates, vision on/off with endpoint and key, draft vs publish for new listings (default draft), reset capture knobs to factory, and an optional refresh of the store lists. **Test connection** always pulls fresh species, attributes, and tags from the store when it succeeds.

### First run on the floor

One short card, then dismiss. Lay a green or black sheet under the slab. Shoot from above with the lens parallel to the face. Put a tape measure in the shot so you can **type** the length later. The app does not read the tape and has no ruler detector; your typed number is what it measures against.

### Capture

Take 1 to 5 inventory photos.

The source photo stays on screen, and the mask draws over that original: kept wood versus dropped sheet. Four knobs sit next to the overlay, not in Settings:

1. Sheet — auto, green, or black
2. Sensitivity
3. Edge offset
4. Feather

Move a knob and background removal re-runs on this photo; the overlay refreshes immediately. Nothing round-trips to the server for mask tuning. The knobs stick in local storage until you reset them to factory.

Your eye is the only check on the mask: there is no confidence score, no quality gate, and no image-quality classifier. If the cut sits on the wood edge, confirm it. If it clips grain or still holds sheet after you tune, retake the photo. The one-photo server U2Net path stays in the architecture for post-POC; it has no control in this POC.

### Length axis

The bounding rectangle and length axis draw over the confirmed mask, with width sample lines every 6 inches along that axis. Rotate until the axis matches the slab's prevailing length, then confirm. On a nearly square piece you pick which side is length.

### Type length, thickness, SKU

Manual values win. The phone computes square feet, board feet (`bdft = sqft × thickness_in`, no `/12`), and width min / max / avg from the mask and your typed length.

It builds 3:4 transparent PNG inventory images at 80% fill on the extremes. After that crop, if the source does not have enough pixels for a shorter side of 1600 px, that photo is not publishable until you retake it. No fake upscale. The floor and the math are in `docs/TECH-SPEC-PIPELINE.md` (constants and TV-7); they are not painted on the camera screen.

### Draft upload (calibrated)

When mask, axis, length, thickness, and SKU are set and the numbers and PNGs are ready, the phone uploads originals + processed PNGs + length / thickness / SKU / sqft / bdft / widths. App status becomes **calibrated**.

### Review (store fields)

Everything the listing needs lands here. A required control that is still empty shows an inline empty state as you work, not only at submit.

**Always on the form from capture and defaults**

- Inventory photos as processed transparent PNGs (at least one)
- SKU, length, thickness
- Computed sqft, bdft, width min / max / avg
- Thickness store band from your typed thickness, rounded **up** into the synced Woo thickness range
- Moisture starts at **kiln-dried**. Vision does not set moisture. Change it if the slab is not KD.
- Price: species $/bdft × bdft prefills when a rate exists for that species. If there is no rate, the field starts empty and you type the price. Override anytime; your override sticks for this slab.

**Species and store taxonomy**

Pickers and any vision lists are exactly the last pull from the store. No hardcoded species list. A new Woo species becomes selectable only after a sync lands it in the cache.

If vision is on and confidence is at least 0.7, it may pre-fill species, wood categories, edge type, figure, grade, and feature (`feat-*`) tags. Every pre-fill is editable; typed values win. If vision is off or confidence is under 0.7, those fields start empty and you fill them by hand. A low-confidence guess never shows as a default.

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

Type them, or tap **Generate text**. Generate text never runs on its own and is off unless content generation is enabled in Settings. If the text service is down, the button is disabled; templates still work and publish is not blocked. The model writes prose only — character, color, grain, uses. Measured length, width, thickness, square feet, and board feet are facts it receives, never numbers it invents.

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

**Mask clips wood or still holds sheet.** Turn the four knobs; confirm by eye. If it is still wrong, retake. A bad edge silently shifts square feet and widths; there is no later numeric check that catches it.

**Axis skewed or on the wrong length side.** Rotate the axis, or retake. Widths and sqft follow whatever axis you confirm.

**Source too small after the 3:4 / 80% crop.** The app warns and asks for a retake of that photo. No invented pixels; see `docs/TECH-SPEC-PIPELINE.md` TV-7.

**Required store field still empty.** Inline empty state on that control. Publish stays blocked until the full ready set in Main path is filled.

**SKU already exists in the store under any status** (draft, private, publish, and the rest). The message sits on the SKU field: it already exists in the store. Actions there: edit the SKU, or open the existing listing when a link is available. This version does not edit the other product in place. No raw status codes on screen.

**Category, attribute, tag, or price no longer valid after a list refresh.** The message sits on that field: the value is no longer valid; pick from the current list, and the current options come with it. Your draft stays on the phone.

**Rules copy on the phone went stale at submit.** Brief "Updating rules." The phone refetches the shared rules, checks again, and retries. That is not a duplicate-SKU conflict, and no raw status code shows.

**Store unreachable, auth failure, or other hard Woo failure.** Plain failure message, no stack traces. The slab can move to failed with detail; draft and photos stay so you can retry.

**Vision off or under 0.7.** The taxonomy fields vision would have filled start empty; fill the required set by hand. Moisture still starts kiln-dried, and the thickness band still comes from your typed thickness. Inference never blocks publish and never publishes on its own.

**Generate text unavailable.** Button disabled. Type copy or let templates write at publish.

Leaving a field: empty optional is fine; typed junk is not. SKU is `A-Z`, `0-9`, and hyphen, length 3–24. Title, short title, and description cannot type past the store max length.

---

## Out of scope for this POC UI

Server U2Net "Try harder" on capture (kept in architecture for later; not a control here). A user slider for the 0.7 vision threshold. Offline / airplane capture. Any image-quality classifier or score. Strings painted on the live photo about lighting, steadiness, mask confidence, or a pixel requirement.
