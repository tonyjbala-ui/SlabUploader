# UAT Practice Walk: one `SLAB-UAT-*` listing

Status: WALK · for Ty to run · SlabUploader

This is the walkable practice plan. It proves one listing end to end without touching a live product.
Follow the sections in order. Each one names what you do, what you should see, and where the rule
lives.

**Inference is OFF for this walk.** The optional ON path is only valid after Gate C is green and
the inference endpoint is already configured. Do not turn it on here.

---

## 1. Host and deploy preconditions

Before this walk, the app must already be on the inventoried host. This section only checks that.
Do not invent host IPs or hostnames. Read them from `deploy/INVENTORY.md`.

1. **Inventory is filled.** `deploy/INVENTORY.md` has `APP_HOST`, `APP_HOSTNAME`, ports, Caddy
   location, and the smoke results. It is the only source for what runs where on this host.
   See `docs/DEPLOYMENT.md` §1 for the worksheet rules.
2. **Reachable over LAN/Tailscale.** Your phone reaches `https://${APP_HOSTNAME}` on the same
   network (LAN or Tailscale). No public exposure. Verify with a browser, not `curl`.
3. **HTTPS only.** The URL is `https://`. The browser shows a valid certificate. If the phone
   warns, the Caddy TLS trust is not set up yet. That is a deploy problem, not a listing problem.
4. **Health passes.** In a browser on the phone, open `https://${APP_HOSTNAME}/api/health`.
   You should see an ok response. This is the same check in `docs/DEPLOYMENT.md` §8 step 1.
5. **Store URL is set.** `WOO_BASE_URL` is in the host `.env` and points at the store over
   `https://`. It is not something you type in the app. See `docs/DEPLOYMENT.md` §3 and §5.

If any of these fail, fix the deploy before continuing. This walk does not cover Gate B host work.
It assumes the app is up and reachable.

---

## 2. WordPress Application Password setup

You do this once per store, in the store's WordPress admin. Do it before you open the app's
Settings.

1. **Store is on HTTPS.** WordPress only offers Application Passwords over HTTPS. The store must
   already be on TLS. If it is not, stop and fix the store first.
2. **Dedicated low-privilege user.** Create or use a WordPress user that can create and edit
   products and upload media. Do not reuse the store admin login. A shop manager role or a custom
   role with product create/edit plus media upload is enough.
3. **Generate the password.** Sign in as that user. Go to **Users → Profile → Application
   Passwords**. Generate a password and label it "SlabUploader". Copy the password. WordPress
   shows it once.
4. **Enter it in the app.** Open the app's Settings on the phone. Enter the WordPress username and
   the application password. The server stores them encrypted. The browser does not keep them.
5. **Run `test-woo`.** In Settings, tap the test. It should report ok. This also resyncs the
   store's species, categories, tags, and attributes into the app. If it fails, the username or
   password is wrong, or the store is unreachable.

Rules: this is a WordPress Application Password, not WooCommerce consumer keys (`ck_`/`cs_`).
The app never calls the store from the browser. FastAPI is the only caller. Rotate by revoking
the old password in the WP profile and entering a new one in Settings, then re-running
`test-woo`. Full lock: `AGENTS.md` §4 and §5, `docs/DEPLOYMENT.md` §5.

---

## 3. Practice build rules

These rules keep practice runs invisible to customers. They are locked. Do not change them for
the walk.

- **SKU prefix `SLAB-UAT-*`.** Every practice listing uses a SKU that starts with `SLAB-UAT-`.
  Pick a unique one each time, for example `SLAB-UAT-001`.
- **Always a Woo draft.** A `SLAB-UAT-*` SKU creates a WooCommerce draft even if Settings say
  publish. Customers cannot open it. This is hard rule in `AGENTS.md` §5.
- **`woo_create_status` defaults to draft.** The Settings field that controls create status
  defaults to `draft`. For practice you do not need to change it. If it is `publish`, the
  `SLAB-UAT-*` rule still forces a draft.
- **Customers never see practice listings.** A Woo draft is hidden from the storefront. If you
  can see the product on the live store, something is wrong.

If a practice SKU is not `SLAB-UAT-*`, it is not a practice run. Do not publish a real SKU in
this walk.

---

## 4. Prove one listing end to end

This is the main walk. Run it on a phone browser first, then repeat on a PC browser. Both are in
the signed compatibility matrix (`docs/UX.md`, signed 2026-09-06).

Supported browsers: iOS Safari, Android Chrome on phones; desktop Chrome, Edge, Firefox on PC.
Exact version pins are tracked under issue #4. If the browser is not supported, the app shows a
hard stop. Switch to a supported browser.

### 4.1 Capture

1. Open the app on the phone. Start a new slab.
2. Take 1 to 5 photos of the slab. The first should be top-down, lens parallel to the broad
   face. A tilted shot makes the numbers wrong. Retake if it is tilted.
3. **Mask overlay and four knobs.** The app draws a mask over the photo. You see which pixels are
   slab and which are not. Tune the four knobs: **Sheet** (auto/green/black), **Sensitivity**,
   **Edge offset**, **Feather**. Each change re-runs the mask immediately. Look at the edge
   against the real wood. If it is still off, retake the photo.
4. **Confirm the mask.** Tap confirm.
5. **Length axis.** The app draws the bounding rectangle and the length axis. Confirm it follows
   the slab's long direction. Rotate if it is skewed. On a nearly square slab, you say which way
   is length.
6. **Enter numbers by hand.** Length in 1/8" steps. Thickness as a 1/8" pick. SKU: type
   `SLAB-UAT-001` (or your chosen practice SKU).
7. **Check the computed numbers.** The browser shows square feet, board feet, and width samples.
   Board feet = square feet × thickness in inches. No divide-by-12. If the numbers look wrong,
   go back and fix the mask or the length.
8. **Continue.** This uploads the originals, the processed PNGs, and the numbers to the server.
   The slab status becomes `calibrated`.

### 4.2 Review

1. You are on the review screen. Fill every required field. Inference is OFF, so everything starts
   empty.
2. **Species.** Pick exactly one from the synced store list. The list came from `test-woo`.
   Do not type a species that is not in the list.
3. **Wood categories.** Pick at least one from the synced list.
4. **Edge type, figure, grade.** Pick from the synced lists. At least one figure, at least one
   grade.
5. **Thickness band.** Pick the Woo band that the measured thickness rounds up into.
6. **Moisture.** Keep the default (kiln-dried) or change it.
7. **fig-* tags.** Pick at least one.
8. **feat-* tags.** Zero or more. Only pick existing `feat-*` tags.
9. **Price.** A recommendation fills from the species $/bdft rule times board feet. You can
   override it. If there is no rule for the species, the price starts empty. Type it. Publish
   is still allowed with a manual price.
10. **Title and description.** You can type them, or leave them for templates at publish.
    Templates inject the deterministic numbers. Generate text is OFF for this walk.

Every empty required field shows an inline nudge where it sits. The slab cannot reach `ready`
until the full set is filled.

### 4.3 Publish

1. Tap **Publish**.
2. The server checks the SKU against the store. If `SLAB-UAT-001` is new, it creates the
   product.
3. **What you should see:** a success message on the screen. The local draft and its photos are
   gone from the app. The slab status in the app is `published`.
4. **What that does NOT mean:** the product is not live in the store. It is a WooCommerce draft.
   The app's "published" means the store create succeeded and the local row was cleaned up.

### 4.4 Confirm in the store

1. Open the store's WooCommerce admin.
2. Find the product by SKU `SLAB-UAT-001`.
3. **It must be a draft.** Status is draft, not published.
4. **Check the fields:** SKU, price, category (species), tags (fig-*, feat-*), attributes
   (Edge Type, Figure, Grade, Thickness, Moisture), and images (the processed transparent PNGs).
5. **Open the live storefront.** The product must not appear. A draft is invisible to customers.

### 4.5 Repeat on a PC browser

Repeat 4.1 through 4.4 on a desktop browser (Chrome, Edge, or Firefox). Use a different
practice SKU, for example `SLAB-UAT-002`. The flow must work the same way. This is the signed
PC-browser compatibility check.

---

## 5. Pass and fail checks

You can see all of these without reading code.

| Check | Where | Pass looks like |
|---|---|---|
| Health endpoint | Phone browser, `https://${APP_HOSTNAME}/api/health` | ok response |
| `test-woo` ok | App Settings | ok; species list is populated |
| `woo_create_status` is draft | App Settings | shows `draft` (or `publish`, but `SLAB-UAT-*` forces draft anyway) |
| Slab reaches `calibrated` | App, after capture | status is `calibrated` |
| Slab reaches `ready` | App, after review | no empty required fields; inline nudges gone |
| Publish succeeds | App, after Publish | success message; local draft is gone |
| Woo product exists as draft | Store admin, products | SKU `SLAB-UAT-*`, status draft |
| SKU prefix correct | Store admin | starts with `SLAB-UAT-` |
| Store not live | Live storefront URL | product does not appear |
| Board feet identity | App review screen, or a fixture | bdft = sqft × thickness in inches; no divide-by-12 |
| Images are processed PNGs | Store admin, product images | transparent PNGs, not the original JPEGs |

### Duplicate SKU recovery

If you publish the same SKU twice, the second time the app stops before creating a second product.
Under the SKU field you see: "This SKU already exists in the store (any status)." Two paths:
edit the SKU to a new value, or open the existing listing. The draft stays in the app. Nothing is
lost. This is the expected behavior, not a bug. See `docs/CONTENT-WOO.md` §2.5.

### What a fail looks like

- **No success message after Publish.** The app shows a plain message that the listing could not
  be created. No status number, no stack trace. The server kept a log. You can retry from the
  same screen without re-photographing.
- **A value is no longer valid.** If a category, attribute, or price was removed from the store
  between sync and publish, that field shows "This value is no longer valid. Pick from the
  current list." Re-pick and retry.
- **Store unreachable.** A plain message says the store could not be reached. Check the network
  and retry.

---

## 6. Cleanup

After the walk, decide what to do with the Woo draft UAT product.

- **Leave it or delete it.** Both are fine. It is a draft. Customers cannot see it. If you delete
  it, the store admin is the place to do it. The app does not delete store products.
- **Never customer-visible.** If the product is visible on the live storefront, it is not a
  draft. That is a bug. Stop and report it.

**Real live publish is a separate step.** It is not part of this walk. A real product uses a
non-UAT SKU (no `SLAB-UAT-` prefix) and is published only after you review it. That is a
different decision. Do not run it here. The name of that step is **final POC publish**, and it
is gated on your review of one real listing.

---

## Where each rule lives

| Rule | Source |
|---|---|
| Practice SKU forces draft | `AGENTS.md` §5 |
| `woo_create_status` default draft | `AGENTS.md` §5, `docs/CONTENT-WOO.md` §2.4 |
| App Password setup, not consumer keys | `AGENTS.md` §4, `docs/DEPLOYMENT.md` §5 |
| Host inventory before deploy | `docs/DEPLOYMENT.md` §1, `deploy/INVENTORY.md` |
| Capture → review → publish flow | `docs/UX.md` (SIGNED 2026-09-06) |
| Board feet identity | `docs/TECH-SPEC-PIPELINE.md` |
| Duplicate SKU recovery | `docs/CONTENT-WOO.md` §2.5, `docs/UX.md` Publish |
| PC browser compatibility | `docs/UX.md` Browser compatibility |
| Gate C = early Phase 1 | `docs/IMPL-PLAN.md` Phase 1, `AGENTS.md` §0b |
