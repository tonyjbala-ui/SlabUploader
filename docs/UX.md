# Phone flow

What the mill owner does on the phone, from first photo to a store listing.

Pipeline math lives in `docs/TECH-SPEC-PIPELINE.md`. Field names and the ready set live in `docs/DATA-MODEL.md`. Store payload and create steps live in `docs/CONTENT-WOO.md`.

You type a value, the app keeps it. Vision only fills when it is sure enough; a weak guess stays off the form.

---

## Main path

### Settings once

Store URL is deploy text from `WOO_BASE_URL`. It is not an input. Settings shows it read-only so you always know which store this phone is talking to.

Enter the WordPress username and application password for the low-privilege store user. The password is write-only; it never comes back on load. Rotate by revoking it in WordPress Users → Profile and typing a new one here.

Optional on the same screen: species $/bdft table, vision on/off plus endpoint and key, draft vs publish for new listings (default draft), reset capture knobs to factory, optional refresh of store lists. **Test connection** always pulls fresh species, attributes, and tags from the store.

### First run on the floor

One short card, then dismiss. Green or black sheet under the slab. Shoot from above with the lens parallel to the face. Put a tape measure in the shot so you can **type** the length. The app does not read the tape and does not run a ruler detector.

"Don't show again" stays off until you turn the card back on in Settings.

### Capture

Take 1 to 5 inventory photos.

The source photo stays on screen. The mask is drawn on that original: kept wood versus dropped sheet.

Four knobs sit next to the overlay, not in Settings:

1. Sheet — auto, green, or black
2. Sensitivity
3. Edge offset
4. Feather

Move a knob and background removal re-runs on this photo. The overlay refreshes immediately. Nothing saves to the server for mask tuning. Knobs stick in local storage until you reset them.

Your eye is the check. If the cut sits on the wood edge, confirm. If it clips grain or still holds sheet after you tune, retake the photo. This POC has no server "Try harder" control.

### Length axis

Bounding rectangle and length axis draw on the confirmed mask. Width sample lines sit every 6 inches along that axis. Rotate until the axis matches the slab's long grain, then confirm. On a nearly square piece, you pick which side is length.

### Type length, thickness, SKU

Manual values win. The phone computes square feet, board feet (`bdft = sqft × thickness_in`, no `/12`), and width min / max / avg from the mask and your length.

It builds 3:4 transparent PNG inventory images at 80% fill on the extremes. After that crop, if the source does not have enough pixels for a shorter side of 1600 px, that photo is not publishable until you retake it. No fake upscale. The floor and the math are in `docs/TECH-SPEC-PIPELINE.md` (constants and TV-7), not a banner painted on the camera.

### Draft upload (calibrated)

When mask, axis, length, thickness, and SKU are set and the numbers and PNGs are ready, the phone uploads originals + processed PNGs + length / thickness / SKU / sqft / bdft / widths. App status becomes **calibrated**.

### Review (store fields)

Everything the listing needs lands here. Empty required controls show an inline empty state as you work, not only at submit.

**Always on the form from capture / defaults**

- Inventory photos as processed transparent PNGs (at least one)
- SKU, length, thickness
- Computed sqft, bdft, width min / max / avg
- Thickness store band from typed thickness, rounded **up** into the synced Woo thickness range
- Moisture defaults to **kiln-dried**. Vision does not set moisture. Change it if the slab is not KD.
- Price: species $/bdft × bdft when a rate exists, else blank. Override anytime. No rule still allows a typed price.

**Species and store taxonomy**

Pickers and any vision lists are exactly the last pull from the store. No hardcoded species list.

If vision is on and confidence is at least 0.7, it may pre-fill species, wood categories, edge type, figure, grade, and feature (`feat-*`) tags. Every pre-fill is editable. Typed values win.

If vision is off, or confidence is under 0.7, those fields start empty. Fill them by hand. A low-confidence guess is never shown as a default.

**Required before the slab is ready to list**

- Exactly one species
- At least one wood category
- One edge type
- At least one figure term
- At least one `fig-*` tag
- At least one grade
- Thickness band (from the round-up above)
- Moisture (kiln-dried unless you changed it)
- Price
- SKU, length, thickness, client sqft / bdft / widths, at least one inventory PNG

Feature (`feat-*`) tags are optional (zero or more).

Species plus one figure is not enough. Empty vision fields are not the full submit list.

### Title, short title, description

Type them, or tap **Generate text**. Generate text never runs on its own. It is off unless content generation is enabled in Settings. If the text service is down, the button is disabled; templates still work and publish is not blocked.

If title, short title, or description are still blank at publish, templates fill them from measured facts (species, lengths, widths, thickness, bdft). The model does not invent dimensions.

### Publish

When the ready set above is complete, tap publish. App status moves through **publishing**.

Create status comes from Settings (`draft` or `publish`, default `draft`). SKUs that match `SLAB-UAT-*` always create as Woo **draft**, even when Settings say publish. Practice listings stay draft so customers do not see them.

On success the server deletes originals and processed images. A slab marked published in the app means the store create succeeded. That is not the same word as WooCommerce "publish."

---

## Practice path (UAT)

Same capture and review as production. Use a `SLAB-UAT-*` SKU. The listing is forced to Woo draft regardless of the draft/publish setting. Change the SKU when you are ready for a real listing.

---

## Usual failures

**Mask clips wood or still holds sheet.** Turn the four knobs. Confirm by eye. If it is still wrong, retake. Bad edges silently shift square feet and widths; there is no later numeric score that catches a bad cut.

**Axis skewed or wrong length side.** Rotate the axis, or retake.

**Source too small after the 3:4 / 80% crop.** Warn and retake that photo. See `docs/TECH-SPEC-PIPELINE.md` TV-7. No invented pixels.

**Required store field still empty.** Inline empty state on that control. You cannot publish until the full ready set in Main path is filled.

**SKU already exists in the store under any status** (draft, private, publish, and the rest). Message sits on the SKU field: it already exists in the store (any status). Actions: edit the SKU, or open the existing listing when a link is available. This version does not edit the other product in place. Do not show a raw status code.

**Category, attribute, tag, or price no longer valid after a list refresh.** Message on that field: the value is no longer valid; pick from the current list. Current options come with the error. Draft stays on the phone.

**Rules copy on the phone went stale at submit.** Brief "Updating rules." The phone refetches the shared rules, checks again, and retries. That is not a duplicate-SKU conflict. Do not show a raw status code.

**Store unreachable, auth failure, or other hard Woo failure.** Plain failure message. Slab can move to failed with detail. Draft and photos stay so you can retry. No stack traces on the phone.

**Vision off or under 0.7.** Taxonomy fields that vision would have filled start empty. Fill the required set by hand. Moisture still starts kiln-dried. Thickness band still comes from the thickness you typed. Inference never blocks publish and never publishes on its own.

**Generate text unavailable.** Button disabled. Type copy or let templates write at publish.

Leaving a field: empty optional is fine; typed junk is not. SKU is `A-Z`, `0-9`, and hyphen, length 3–24. Title, short title, and description cannot type past the store max length.

---

## Out of scope for this POC UI

Brand polish and marketing chrome. Server U2Net "Try harder" on capture (kept in architecture for later; not a control here). A user slider for the 0.7 vision threshold. Offline / airplane capture. Any image-quality classifier or score. Strings painted on the live photo about lighting, steadiness, mask confidence, or a 1600 px camera requirement.
