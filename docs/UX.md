# Phone flow

What the mill owner does on the phone. Pipeline math is in `docs/TECH-SPEC-PIPELINE.md`. Field names are in `docs/DATA-MODEL.md`.

You type it, we keep it. If the model is unsure, that guess stays off the form.

## Happy path

### First launch

One short card: green or black sheet, shoot from above, tape in the shot so you can type length, 1 to 5 photos. Dismiss it. "Don't show again" stays off until you turn it back on in Settings.

The app does not read the tape.

### Capture

The photo stays on screen. The cut is drawn on that original, kept vs dropped.

Four knobs sit next to it: sheet (auto, green, black), sensitivity, edge offset, feather. Move a knob and the overlay updates on this photo. Nothing saves. Nothing hits the server. Knobs stick until you reset them in Settings.

Look at the overlay. If the cut sits on the wood, confirm. Then the length axis. Rotate until the long grain looks right, confirm.

Type length, thickness, and SKU. The app computes square feet, board feet, and the 6" widths, then builds the 3:4 listing PNG.

Then review.

### Review

If vision is on and confidence is at least 0.7, it may fill species, wood category, edge, figure, grade, and feature tags. Change any of them.

Price is species $/bf times board feet when that rate exists. Otherwise blank. Override anytime.

Type title and description, or tap Generate text. Generate text never runs on its own. Templates can write a name if title is still blank.

Species, wood category, figure, and the rest of the lists are the last pull from the store.

### Publish

Tap publish. SKUs that start with `SLAB-UAT-` land as drafts. Any other SKU follows Settings. Settings default is draft.

### Settings

Store URL is deploy text, not an input. WordPress username and application password. The password never comes back on load. Vision endpoint, key, model, on/off. Species $/bf table. Draft vs published for new listings. Reset knobs. Refresh store lists is optional. Testing the connection always refreshes them.

## Usual failures

**Overlay looks wrong.** Turn knobs. If it still looks wrong, retake. This first listing has no "Try harder" button.

**Sheet auto missed.** Set Sheet to green or black. Same knobs.

**Shot is skewed.** Rotate the length axis. If that cannot save it, retake.

**PNG too small after crop.** Retake closer. The size floor is in the tech spec. No fake upscale.

**Vision off, or confidence under 0.7.** Species, wood category, edge, figure, grade, and feature tags start empty. Pick them. Moisture still starts kiln-dried. Thickness band still comes from the thickness you typed. SKU and measures are already there.

**A required field is empty.** Line under that control. You cannot continue until this set is filled:

SKU, length, thickness, price, one species, at least one wood category, edge type, at least one figure, grade, thickness band, moisture, at least one figure tag, at least one listing photo. Feature tags can stay empty.

**SKU already in the store, any status.** Under SKU: "This SKU already exists in the store (any status)." Edit the SKU, or open the existing listing. Do not print 409.

**Store no longer accepts a value.** Under that field: "This value is no longer valid. Pick from the current list." Show the current options. Do not print 422.

**Store unreachable.** "Couldn't reach the store. Try again." The form stays.

**Rules copy went stale on submit.** "Updating rules." Refetch, check again, retry. The form stays.

Leaving a field: empty optional is fine. Typed junk is not. SKU is A-Z, 0-9, hyphen, 3-24 characters. You cannot type past the store's max length.

## Out of scope

Brand polish. Server matting. A slider for 0.7. Airplane mode. Copy on the photo about mask quality.
