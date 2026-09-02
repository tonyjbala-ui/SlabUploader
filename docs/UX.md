# How the phone app should feel

This is the screen-by-screen description testers and builders use. It is not pixel mockups. Numbers and math live in `docs/TECH-SPEC-PIPELINE.md`. Hard product rules live in `AGENTS.md`. This file is what the mill owner sees.

A suggestion from the vision model never beats a typed value. Empty is better than a confident-looking wrong species.

## Before you can list

You cannot mark a slab ready until all of these are set:

- exactly one species
- at least one wood category
- at least one figure (the store's figure list, including `fig-*` tags)

The missing field is marked on the control itself, not only after you tap continue.

## First time you open the camera

A short overlay, once. You can dismiss it and "Don't show again." Settings can bring it back.

1. Lay the slab on a green or black sheet.
2. Shoot from above, lens parallel to the broad face.
3. Put a tape along the long grain so *you* can type length in inches. The app does not read the tape.
4. Take one to five photos. Look at the overlay and confirm when the cut sits on the wood.

This is photography advice, not computer vision of a ruler.

## Capture: the mask is the measurement

The cut around the wood is the footprint. Length, the 6" width samples, square feet, and board feet all sit on that mask. A fat or clipped cut quietly moves every number. Your eye on the overlay is the check. There is no quality score and no copy that tells you the cut is "broken."

### One screen

The photo fills the screen. The mask overlay sits on the original photo (kept vs dropped), not only on a cropped PNG.

Four knobs sit next to the preview. You do not leave this screen for Settings to tune the cut:

- Sheet: auto, green, or black
- Sensitivity
- Edge offset
- Feather

If auto sheet does not land, set Sheet to green or black with that knob. That is the same control, not a second prompt on the photo.

Confirm when the overlay looks right. Then confirm the length axis (rotate if it is skewed). Then type length, thickness, and SKU.

If the overlay still looks wrong after the knobs, retake. This first listing does not show a "Try harder" server matting button. Keep that path in the architecture docs; do not ship it here.

### Live re-run

Move a knob and the overlay updates on this photo immediately. No save. No trip to the server for mask tuning.

Knob values stay on the phone (reset in Settings). They are not store secrets.

Crop size and listing PNG rules live in `docs/TECH-SPEC-PIPELINE.md`. They are not messages painted on the photo.

## Review

After the draft is uploaded. If vision is on, a species pass may have run.

### How fields fill

The default bar is 0.7. There is no slider for it in this app.

If the model is at least that sure, it fills species, wood categories, edge, figure, grade, and feature tags. Every filled value is still editable. A quiet "suggested" mark is enough. Do not lock the field.

If it is less sure, leave those fields empty. Do not hide the guess in a secret field.

If vision is off, the fields start empty. Same required set. You fill them by hand.

Species, wood category, and figure lists are only what we last pulled from the store. No "other." No mill list baked into the app. A species added in WooCommerce after the last sync does not appear until the next successful sync.

Price: if this species has a $/board-foot rate, show `rate × board feet`. You can always override. If there is no rate, leave price empty.

Title and description start empty until you type or tap Generate text. Generate text never runs on its own.

### Nudges on the field

Empty required fields show a line under the control as soon as the screen opens:

- Species: "Pick the species from the store list."
- Wood category: "Pick at least one wood category."
- Figure: "Pick at least one figure."

The line goes away when the field is valid. Continue stays off while any of the three is empty. You should not have to tap continue to find out which one.

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

1. First-run overlay shows once. Skip stays skipped.
2. Capture knobs are on the photo. Each slider redraws the overlay on that photo.
3. Confirm and retake are available. Confirm is the mill owner's call on the overlay, not a software verdict.
4. Vision on and sure: fields filled, still editable.
5. Vision unsure: species, wood category, and figure empty, with lines under them. Cannot mark ready until all three are set.
6. Species list is only synced names. You cannot type a name that is not there.
7. Duplicate SKU: message under SKU, two actions, no status number.
8. Stale category: message under that field, current options.

## Not this pass

Brand colors and type. Server "Try harder" matting. A slider for the 0.7 bar. Airplane-mode capture. Banners or scores on the photo about mask quality.
