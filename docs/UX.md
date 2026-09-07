# Mill-owner UX — phone and PC browsers

Status: SIGNED · 2026-09-06 PT · Ty approved with PC browsers in the compatibility matrix · SlabUploader

This is the presentation spec for the mill-owner flow. It says what a mill owner sees and does, in the
order they do it. The rules behind each screen live elsewhere: `AGENTS.md` locks the product
decisions, `docs/TECH-SPEC-PIPELINE.md` owns the math and image prep, `docs/DATA-MODEL.md` owns
the store row and its statuses, `docs/CONTENT-WOO.md` owns listing copy and the Woo payload,
and `docs/OPENAPI.md` owns the wire. This file names what shows up on screen; it does not restate
those rules.

The reader is a mill owner photographing one slab at a time, online, from a supported browser on a
phone or a PC. The app is a single column of screens, top to bottom: capture, then review, then
publish. There is no dashboard and no batch view in this version. Capture often starts on a phone
camera; the same flow must also run on a PC browser.

## Jobs

Five jobs cover the whole flow. Each section below names what the owner does, what they see, and
the lock that governs it.

1. **Phone photo to a store listing.** Photograph the slab, confirm the cut and the numbers on
   the browser, review the listing, create the WooCommerce product. The happy path stays in the
   browser until the owner confirms the mask and the numbers.
2. **Practice drafts customers never see.** A practice run creates a WooCommerce draft with an SKU
   that starts `SLAB-UAT-`. Customers cannot open it. It is always a draft, even when Settings say
   publish.
3. **Retake when the overlay cut looks wrong.** The mask overlay on the source photo is the only
   quality check. If the edge is off after tuning the four knobs, the owner retakes the photo.
4. **Fill or override store fields.** On review, the owner fills every required field by hand, or
   keeps what vision filled when it was confident enough. Typed values always win.
5. **Publish.** The owner taps publish. The server creates the product in the store and reports the
   result back on the same screen.

## Capture: photo to numbers

The capture flow is one continuous screen with a few confirmations, not separate pages. The owner
stays on it from first photo through confirmed mask and axis.

### Photos

The owner takes 1 to 5 inventory photos of the slab. The first should be top-down, lens parallel
to the broad face; a tilted shot makes square feet and board feet wrong, and retake is the fix.
There are no calibration photos in this design. Only inventory photos exist.

### Mask overlay and four knobs

The app removes the background sheet and draws the mask as an overlay on the source photo, showing
which pixels count as slab and which do not. The owner looks at that edge against the real wood.
This is the only quality check in the pipeline. There is no confidence score, no auto-gate, and no
photo-quality checker. A clipped or over-inclusive mask shifts every downstream number with nothing
later to catch it, so the eye on the overlay is what stands behind the measurement.

Four knobs sit on this same screen, next to the overlay:

- **Sheet** — auto, green, or black. Auto samples the borders and picks; the owner overrides when
  the sheet is an odd color.
- **Sensitivity** — one slider from tighter to looser detection.
- **Edge offset** — pulls the cut in or out a few pixels so it sits on the wood, not in the sheet
  or into the grain.
- **Feather** — hard edge versus a couple of pixels of blend.

Changing any knob re-runs background removal immediately and refreshes the overlay. There is no
apply step and no server round trip for mask tuning in this version. The four values persist on the
browser until reset to default; they are not Settings fields.

If the edge still looks wrong after tuning, the owner retakes the photo. That is the resolution in
this version. A server-side matting path exists in the architecture for awkward backgrounds later,
but it is deferred and has no control here.

### Length axis

After the mask is confirmed, the app draws the bounding rectangle and the length axis over the slab,
with width sample lines perpendicular to that axis. The owner confirms the axis follows the
slab's prevailing length. If it is skewed, they rotate it; samples and square feet update live. On a
nearly square slab the owner says which way is length.

### Numbers

The owner enters length (in 1/8" steps), thickness (a 1/8" pick), and the SKU by hand. The browser
then computes square feet, board feet, and width samples from the confirmed mask and axis:

- Board feet = square feet × thickness in inches. One square foot at one inch thick is one board
  foot. There is no divide-by-12.
- Widths are sampled every 6" along the length axis; the listing carries min, max, and average.
- Square feet and board feet show to two decimals.

These numbers are computed in the browser and stored as sent. The server does not recompute them.

### Photo prep

Each inventory photo is cropped to a 3:4 portrait frame with the slab centered at 80% fill, saved as
a transparent PNG. If the source has enough pixels, the shorter side lands at 1600 or more after
crop. If it cannot reach that, the app warns and asks for a retake; it does not invent pixels. The
owner sees the processed result alongside the original while the draft is retained.

### Continue

When the mask, axis, length, thickness, and SKU are set, the owner continues. That uploads the
originals plus the processed PNGs plus the numbers to the server as a calibrated draft, and moves to
review. The slab status becomes `calibrated`.

## Review: fill or override store fields

Review is where the listing row gets filled. Every field below maps to a column in the `slabs` table
in `docs/DATA-MODEL.md`. The owner can type any of them; vision may have pre-filled some, but typed
values always win and every value stays editable.

### What vision fills, and when

When inference is on, Call 1 runs after the calibrated draft uploads. It sends all inventory photos
downscaled to 1024 plus the store's synced species and attribute lists, and returns a guess
with a confidence per field. The threshold is 0.7 by default:

- A field at or above 0.7 pre-fills on review. It stays editable; the owner can change or clear it.
- A field below 0.7 starts empty. The app does not show the model's low-confidence guess as a
  default, and an empty start is not the same as a finished listing.

With inference off, every field starts empty and the owner fills all of them by hand. Inference
never blocks publish and never auto-publishes. Call 2 (Generate text) does not run on its own; it
fires only when the owner taps it.

### The fields

The required set for a list-ready slab is the full store row, not species plus one figure:

- **SKU** — `[A-Z0-9-]{3,24}`. Practice runs use `SLAB-UAT-*`.
- **Length and thickness** — from capture; still editable here.
- **Square feet, board feet, widths** — shown as the client-computed values, with a manual override
  path. The owner's typed number wins over the computed one.
- **Species** — exactly one leaf category from the synced store list. No hardcoded or invented
  species; a new store species appears only after the next sync.
- **Wood categories** — at least one, from the synced list.
- **Edge type** — one term from the synced attributes.
- **Figure** — at least one term.
- **Grade** — at least one term.
- **Thickness band** — the Woo range that the measured thickness rounds up into (for example, a 1"
  pick lands in the `1"–1 1/2"` band). The exact labels come from the synced store attribute.
- **Moisture** — one term, defaulting to kiln-dried. It is never inferred; the owner sets or keeps it.
- **fig-* tags** — at least one.
- **feat-* tags** — zero or more (character, inclusions, voids, checks map to existing `feat-*`
  tags only).
- **Price** — a recommendation pre-fills from the species $/bdft rule times board feet; the owner may
  override and that sticks. With no rule for the species, the price starts empty and the owner types
  it. Publish is still allowed with a manual price.

Title, short title, and description are not required to reach ready. They can be typed by hand,
generated from templates at publish, or written by Generate text (Call 2) when enabled. Templates
always run; they inject the deterministic numbers so the model never touches dimensions.

### How missing fields show up

A field that is still empty and required shows its nudge inline, in place, the moment it is empty.
The owner sees each gap where it sits rather than learning about a problem after scrolling past it.
There is no single submit-time check that lists everything at once; the nudges are per-field as the
owner works. The slab cannot reach `ready` until the full set above is filled, whether by hand or by
a confident Call 1 the owner kept.

### Generate text

When content generation is enabled, a **Generate text** button runs Call 2 and fills title, short
title, and description with model prose plus template numbers. The owner can edit the result freely.
If the endpoint is missing or down, the button is disabled; templates still work and publish is never
blocked by a failed Generate text.

## Publish: create the store listing

The owner taps **Publish** when review is complete. What happens next depends on the SKU and Settings.

### Draft versus live

- A normal SKU publishes according to the `woo_create_status` setting, which defaults to draft.
- Any SKU matching `SLAB-UAT-*` always creates a WooCommerce draft, even if Settings say publish.
  That is how practice runs stay invisible to customers.

The app's "published" means the store create succeeded and the local row plus photos were cleaned up.
That is not the same as the product being live in the store; a draft is created but hidden until Ty
promotes it.

### What the owner sees on each outcome

- **Success.** The screen shows that the listing was created, with the store's product reference when
  available. The local draft and its photos are gone from the app.
- **SKU already exists.** Under the SKU field: "This SKU already exists in the store (any status)."
  Two paths appear: edit the SKU to a new value, or open the existing listing. This version does not
  update the other product in place. The draft stays in the browser; nothing is lost.
- **A value no longer valid.** If a category, attribute, or price was removed from the store between
  sync and publish, that field shows "This value is no longer valid. Pick from the current list," with
  the current options. The owner re-picks and retries.
- **Store unreachable or other failure.** A plain message on the screen says the listing could not be
  created and to try again. No status number, no stack trace, no raw error code reaches the owner.

The server keeps a log of every attempt either way, so a failed publish can be retried from the same
screen without re-photographing.


## Browser compatibility

Ty signed this walk on 2026-09-06 PT with one amendment: the compatibility matrix includes PC
browsers as well as phones. This app is not mobile-only.

Supported families (matrix):

- **Phone:** iOS Safari, Android Chrome
- **PC:** desktop Chrome, desktop Edge, desktop Firefox (Windows and macOS at minimum)

Exact minimum version pins are still tracked under issue #4. The matrix above is the product lock
for which classes of client are in scope.

Unsupported browser behavior: hard stop. Show a clear message that this browser is not supported,
with a link to update or switch to a supported browser. Do not attempt a broken mask. No polyfill
strategy in this version.

Load-bearing client surfaces (do not silently drop): canvas-based mask overlay and live knob re-run,
image crop/prep to 3:4 transparent PNG, file/photo intake for inventory shots, and the online API
calls for draft upload, review, and publish. Depth for APIs stays in `docs/TECH-SPEC-PIPELINE.md`
and `docs/OPENAPI.md`.

## What this version does not show

These are locked out for now; they do not appear on any screen:

- No photo-quality checker and no banner over the photo telling the owner it is bad. The overlay edge
  plus the owner's eye is the only gate.
- No OCR of a printed SKU label. SKU is typed by hand.
- No ruler or scale detection. Length is entered by hand; the browser derives its own pixel-to-inch
  scale from that length and the confirmed axis.
- No server-side measuring or cropping as the source of truth. The browser owns the happy path.
- No U2Net "try harder" control in this version. It stays in the architecture for later.
- No offline capture, no airplane-mode flow. Online only.

## Where each job lives

| Job | Screen(s) | Governing lock |
|---|---|---|
| Photo to listing | Capture through review to publish | AGENTS §1, TECH-SPEC, ARCHITECTURE swimlane |
| Practice drafts (`SLAB-UAT-*`) | Review (SKU field), Publish outcome | AGENTS §5, CONTENT-WOO payload status |
| Retake on bad cut | Capture mask overlay | TECH-SPEC §3.4–3.5, issue #15 |
| Fill or override fields | Review | DATA-MODEL `slabs`, AGENTS §6/7, issue #9 |
| Publish and recovery | Publish outcome states | CONTENT-WOO §2.5–2.6, OPENAPI 409/422, issue #18 |
