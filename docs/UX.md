# Phone flow

What the mill owner does. Math is in `docs/TECH-SPEC-PIPELINE.md`. Field names are in `docs/DATA-MODEL.md`.

Typed values always win. If the model is unsure, leave the guess out.

## Happy path

### First launch

One short card: green or black sheet, shoot from above, tape in the shot so you can type length, 1–5 photos. Dismiss. "Don't show again" sticks until Settings.

The app does not read the tape.

### Capture

Photo on screen. Cut drawn on the original (kept vs dropped). Four knobs next to it: sheet (auto / green / black), sensitivity, edge offset, feather. Move a knob, the overlay updates on this photo. No save. No server round trip. Knobs remember until you reset them in Settings.

Look at the overlay. If the cut sits on the wood, confirm. Then the length axis. Rotate until the long grain looks right, confirm. Type length, thickness, SKU. App computes square feet, board feet, and the 6" widths and builds the 3:4 listing PNG.

Then review.

### Review

Vision on and ≥ 0.7: it may fill species, wood category, edge, figure, grade, and feature tags. You can change any of them.

Price: species $/bf × board feet if that rate exists, else blank. Override anytime.

Title and description: type them or tap Generate text. Generate text never runs by itself. Templates can write a name if you leave title blank.

Lists (species, wood category, figure, and the rest) are whatever we last pulled from the store.

### Publish

Tap publish. Practice SKUs `SLAB-UAT-*` land as drafts. A real SKU follows Settings (default draft).

### Settings

Store URL is text from deploy, not an input. WordPress username and application password (password never comes back on load). Vision endpoint, key, model, on/off. Species $/bf table. Draft vs published for new listings. Reset knobs. Refresh store lists is optional; testing the connection always refreshes them.

## When it isn't that clean

**Overlay looks wrong.** Turn knobs. If it still looks wrong, retake. No "Try harder" button in this first listing.

**Sheet auto missed.** Set Sheet to green or black. Same knobs.

**Shot is skewed.** Rotate the length axis. If that cannot save it, retake.

**PNG too small after crop.** Retake closer. Rules in the tech spec. No fake upscale.

**Vision off or under 0.7.** Species, wood category, edge, figure, grade, and feature tags start empty. Pick them. Moisture still starts kiln-dried. Thickness band still comes from the thickness you typed. SKU and measures are already there.

**A required field is empty.** Line under that control. Continue stays off until the listing is complete:

SKU, length, thickness, price, one species, at least one wood category, edge type, at least one figure, grade, thickness band, moisture, at least one figure tag, at least one listing photo. Feature tags can stay empty.

**SKU already in the store (any status).** Under SKU: "This SKU already exists in the store (any status)." Edit SKU, or open the existing listing. Do not print 409.

**Store no longer accepts a value.** Under that field: "This value is no longer valid. Pick from the current list." Show current options. Do not print 422.

**Store unreachable.** "Couldn't reach the store. Try again." Form stays.

**Rules copy went stale on submit.** "Updating rules," refetch, check again, retry. Form stays.

Leaving a field: empty optional is fine; typed junk is not. SKU is A–Z, 0–9, hyphen, 3–24 characters. You cannot type past the store's max length.

## Out of scope

Brand polish. Server matting. A slider for 0.7. Airplane mode. Copy on the photo about mask quality.
