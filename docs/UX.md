# How the phone app should feel

This is the screen-by-screen description testers and builders use. It is not pixel mockups. Numbers and math live in `docs/TECH-SPEC-PIPELINE.md`. Hard product rules live in `AGENTS.md`. This file is what the mill owner sees.

A suggestion from the vision model never beats a typed value. Empty is better than a confident-looking wrong species.

## Before you can list

A listing is ready when the store row is complete. Species plus one figure is not enough.

### Capture (calibrated)

These are already done before review. You cannot list without them.

- Cut around the wood confirmed by eye (the overlay sits on the photo; no checker banner)
- Length axis confirmed by eye
- Length in inches
- Thickness in inches
- SKU
- Square feet, board feet, and min / max / average width (computed from the cut and the length you typed; shown, not guessed)
- At least one listing PNG (the cropped inventory photo)

### Review / submit

These are required to mark the slab ready and send it to the store. Mill-owner names; the column names live in `docs/DATA-MODEL.md`.

- SKU (already typed in capture; still required)
- Length and thickness in inches (already typed; still required)
- Price
- Species — exactly one, from the store list
- Wood category — at least one
- Edge type
- Figure — at least one from the store figure list (the figure attribute)
- Grade — at least one
- Thickness class — the store thickness band, rounded up from the thickness you typed
- Moisture — required. Starts as kiln-dried. You can change it. Vision does not pick this.
- Figure tags (`fig-*`) — at least one
- Feature tags (`feat-*`) — optional (zero or more)
- Listing photos — the inventory PNG(s) from capture

The store product also needs a name (title), categories, tags, images, SKU, and price. Categories, tags, images, SKU, and price are the fields above. Title can be typed or written with Generate text. If it is still empty when you list, the templates write the name. Generate text never runs on its own.

Continue stays off until every required field in this list is set. Feature tags may stay empty.

### When vision is unsure

The 0.7 bar is only about whether the model may fill a guess. It is not a shorter submit list.

If vision is off, or on but under 0.7, these start empty: species, wood category, figure, edge, grade, and feature tags. You pick them. Empty is better than a confident-looking wrong species.

Moisture still starts kiln-dried. Thickness class still comes from the thickness you typed. SKU, length, thickness, photos, and price do not wait on the model.

You still cannot list until the full review / submit list is filled — not only species and figure.

Any required field that is still empty is marked on that control. You should not have to tap continue to find out which one.

## First time you open the camera

A short overlay, once. You can dismiss it and "Don't show again." Settings can bring it back.

1. Lay the slab on a green or black sheet.
2. Shoot from above, lens parallel to the broad face.
3. Put a tape along the long grain so *you* can type length in inches. The app does not read the tape.
4. Take one to five photos. Look at the overlay and confirm when the cut sits on the wood.

This is photography advice, not computer vision of a ruler.

## Capture: the mask is the measurement

The cut around the wood is the footprint. Length, the 6" width samples, square feet, and board feet all sit on that mask. A fat or clipped cut quietly moves every number.

Your eye on the overlay is the only check. Look at the photo with the cut drawn on it. If the edge sits on the wood, confirm. If it does not, move the knobs or retake. There is no quality score, no auto-gate on the mask, and no sentence the app invents about the cut being "broken" or the sheet being wrong. The image looks right or it does not.

### One screen

The photo fills the screen. The mask overlay sits on the original photo (kept vs dropped), not only on a cropped PNG.

Four knobs sit next to the preview. You do not leave this screen for Settings to tune the cut:

- Sheet: auto, green, or black
- Sensitivity
- Edge offset
- Feather

**Sheet knob.** Auto may miss (odd lighting, mixed border). Flip Sheet to green or black yourself. That is how you pick the background — the same four knobs, live on this screen. No detector toast. No banner painted on the photo.

**Confirm the cut.** When the overlay looks right to you, confirm. Confirm stays available; it is your call, not a software verdict that the mask is one piece.

**Length axis.** After the cut, a length-axis overlay appears on the photo. Rotate it until the long grain looks right. Confirm by eye. If rotation cannot fix a bad shot, retake. The app does not announce "axis misaligned" in copy; the overlay is the feedback.

Then type length, thickness, and SKU.

If the overlay still looks wrong after the knobs, retake. This first listing does not show a "Try harder" server matting button. Keep that path in the architecture docs; do not ship it here.

### Live re-run

Move a knob and the overlay updates on this photo immediately. No save. No trip to the server for mask tuning.

Knob values stay on the phone (reset in Settings). They are not store secrets.

### After crop: photo too small

Once the cut and axis are confirmed, the app builds the listing PNG (3:4, about 80% fill). Pixel math and the minimum short-side size live in `docs/TECH-SPEC-PIPELINE.md` (1600 when the source can supply it).

That check is on the finished crop size, not a vision pass on the photo. If the short side would land under that minimum, the photo is too small after crop — retake a closer top-down shot. The app will not invent pixels or fake an upscale. This is not mask-quality copy and not a fail table on the capture screen.

## Review

After the draft is uploaded. If vision is on, a species pass may have run.

### How fields fill

The default bar is 0.7. There is no slider for it in this app.

If the model is at least that sure, it fills species, wood categories, edge, figure, grade, and feature tags. Every filled value is still editable. A quiet "suggested" mark is enough. Do not lock the field.

If it is less sure, leave those fields empty. Do not hide the guess in a secret field.

If vision is off, those store fields start empty. You fill the listing by hand. Measurements and SKU are already there from capture.

Species, wood category, and figure lists are only what we last pulled from the store. No "other." No mill list baked into the app. A species added in WooCommerce after the last sync does not appear until the next successful sync.

Price: if this species has a $/board-foot rate, show `rate × board feet`. You can always override. If there is no rate, leave price empty.

Title and description start empty until you type or tap Generate text. Generate text never runs on its own.

### Nudges on the field

Every required control that is empty gets a line under it when the screen opens — not only species, wood category, and figure. The line goes away when that field is valid. Continue stays off while any required field is empty.

- SKU: "Enter a SKU."
- Length: "Enter the length in inches."
- Thickness: "Enter the thickness in inches."
- Price: "Enter a price."
- Species: "Pick the species from the store list."
- Wood category: "Pick at least one wood category."
- Edge type: "Pick an edge type."
- Figure: "Pick at least one figure."
- Grade: "Pick at least one grade."
- Thickness class: "Confirm the store thickness band." (filled from the thickness you typed; mark it if it is missing)
- Moisture: "Pick moisture." (starts kiln-dried; only marks if you clear it)
- Figure tags: "Pick at least one figure tag."
- Photos: "Add a listing photo." (already true after a good capture)

Feature tags have no missing mark. Title and description have no missing mark; templates write a name if you leave them blank.

### Overrides

Change a suggested species or figure like any other edit. No extra confirm. What you leave in the field is what goes to the store.

## Settings (what the mill owner touches)

- Store URL: text only, from deploy. Not an input.
- WordPress username and application password. The password never comes back on load.
- Vision endpoint, key, model, on/off.
- Species $/board-foot table, filled from synced species only.
- New listings: draft or published. Default draft.
- Reset capture knobs to factory.
- Refresh store lists is optional. Testing the store connection always refreshes them.

## Typing checks

Rules live on the server. The phone keeps a copy. The copy is checked when you submit, not on every tap.

Leaving a field: the phone checks the copy. Required empty fields block. Optional empty is fine. Optional with text must pass.

Length: you cannot type past the store's max.

SKU: letters A-Z, digits, hyphen, 3 to 24 characters. Title and description: normal text, store length limits. Bad characters fail when you leave the field.

Submit: full check plus "is my copy of the rules still current?" If not, the phone shows "Updating rules," fetches the new copy, checks again, and retries. You do not lose the form. Do not show a status number.

Errors sit under the field. Not a pile at the top of the screen.

## After you tap publish

The form stays on the phone. The server marks the slab failed so you can try again. Nothing is stored in a special offline database.

**This SKU already exists** (any status in the store). Message under SKU: "This SKU already exists in the store (any status)." Two actions: Edit SKU (focus the field), and Open existing listing. If we have the admin link, use it. If not, keep the button and tell them to look the SKU up in store admin. Never print "409".

**This value is no longer valid** (category, attribute, price, and the like). Message under that field: "This value is no longer valid. Pick from the current list." Show the current store options after the submit-time refresh. Never print "422".

If the store is down, times out, or auth fails: one banner, "Couldn't reach the store. Try again." Form intact. Not a field nudge.

## Checks a tester can run

1. First-run overlay shows once. Skip stays skipped. Ruler text is photography advice only; the app does not read the tape.
2. Capture knobs are on the photo (sheet, sensitivity, edge offset, feather). Each slider redraws the overlay on that photo. No Settings detour for the cut.
3. Confirm and retake are available. Confirm is the mill owner's call on the overlay, not a software verdict and not a generated mask-quality message.
4. Length axis: rotate and confirm by eye; retake if the shot is still wrong.
5. Optional size gate: after crop, if the short side is under the tech-spec minimum, that photo cannot list until retake. No invented pixels.
6. Vision on and sure: fields filled, still editable.
7. Vision unsure: species, wood category, figure, edge, grade, and feature tags empty, with lines under every still-required control (including price, moisture if cleared, figure tags). Continue stays off until the full submit list is filled, not only species and figure.
8. Species list is only synced names. You cannot type a name that is not there.
9. Duplicate SKU: message under SKU, two actions, no status number.
10. Stale category: message under that field, current options.

## Not this pass

Brand colors and type. Server "Try harder" matting. A slider for the 0.7 bar. Airplane-mode capture. Checker-generated capture strings, mask-quality banners, or a fail table on the photo.
