# Release and Deploy Process

Status: SPEC · SlabUploader · 2026-09-09

Follows GitHub release management conventions adapted for Gitea. See `docs/Build-release-standard.md`.

---

## 1. Build surfaces

Three build surfaces serve different consumers. Each one has its own rules.

### Dev/test builds

Run on this machine. No Gitea release, no tag. The build is whatever main currently is.

- **Frontend:** `npm run dev --host 0.0.0.0 --port 3000`
- **Backend:** `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- **Woo store:** Whidbey Wood Store, all submissions draft
- **Inference:** OFF
- **Reachability:** `184.193.214.118:3000` (frontend), `184.193.214.118:8000` (API)
- **Camera:** does not work (no HTTPS). Camera features must be tested on the UAT build.
- **Lifecycle:** manual start and stop. Bots start the build, Ty tests, bots stop it.

### UAT builds

Deploy to ubuDual5060 via Docker Compose + Caddy. Requires a Gitea release tag. This is the only surface that serves HTTPS and supports camera capture.

- **Hostname:** `slab.local`
- **Ports:** 18080 (frontend), 18081 (API)
- **Store:** Whidbey Wood Store, all submissions draft
- **Inference:** OFF by default, toggleable when configured

### Debug builds

Run on this machine for bots debugging live issues. Same services as dev but with debug flags. No Caddy, no HTTPS, no TLS.

- **Frontend:** `npm run dev --host 0.0.0.0 --port 3000`
- **Backend:** `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level debug`
- **Store:** Whidbey Wood Store, all submissions draft
- **Lifecycle:** bots start and stop as needed.

---

## 2. Gitea release workflow

UAT promotion uses Gitea releases. The release is the artifact that gets deployed.

### 2.1 Create a UAT release

1. Ensure all intended changes are merged to main.
2. On the Gitea releases page for `Ty_Tech/SlabUploader`, click **Draft a new release**.
3. Choose the tag format. Use semver with pre-release identifier. Examples: `v0.1.0-alpha.1`, `v0.1.0-beta.1`, `v0.1.0-rc.1`.
4. Select target branch as `main`.
5. Select the previous tag if one exists.
6. Write release notes in the description. Summarize what changed since the previous release.
7. Select **This is a pre-release** to mark it as not production-ready.
8. Do not select **Set as latest release** unless this is the definitive current build.
9. Publish the release.

### 2.2 Deploy from the release

1. On ubuDual5060, run the deploy script with the release tag.
2. The script checks out the tag, builds compose, and runs smoke tests.
3. Verify health: `curl -k https://slab.local/api/health`.
4. Verify Woo: Settings → test-woo → ok with species populated.
5. Run the UAT practice walk from `docs/UAT-PRACTICE.md`.

### 2.3 Release notes format

Follow GitHub release notes conventions:

- Title line with the tag name.
- Summary paragraph: what this release contains.
- Bullet list of changes by category (Features, Fixes, Infrastructure).
- Note what is not included or deferred.
- Gate status: which gates are green and which remain.

Example:

```
# v0.1.0-alpha.1

UAT build for Gate C claimable path. Inference OFF.

Features:
- Online capture with four inline knobs and live mask overlay
- Length axis confirm
- Client-computed sqft/bdft/widths
- Calibrated draft upload to FastAPI
- Woo draft create with SLAB-UAT-* SKU

Fixes:
- None

Infrastructure:
- Docker Compose dual-stack on ubuDual5060
- Caddy reverse proxy with internal TLS

Not included:
- Call 1/Call 2 inference (Phase 5)
- Full review UI (Phase 3)
- Production publish path (Phase 6)

Gates: A green, B green, C in progress.
```

---

## 3. Naming conventions

### Release tags

Format: `vMAJOR.MINOR.PATCH[-PRERELEASE]`

- MAJOR: breaking change to the app architecture (0 for POC)
- MINOR: new feature set (1 for first UAT release)
- PATCH: fix to an existing feature set
- PRERELEASE: alpha, beta, rc, with optional numeric suffix

Examples:
- First UAT release: `v0.1.0-alpha.1`
- Second UAT iteration: `v0.1.0-alpha.2`
- Beta release: `v0.1.0-beta.1`
- Release candidate: `v0.2.0-rc.1`

### Dev build identification

No tag. Identify by commit SHA and timestamp.

```
dev-build-<SHORT_SHA>-<YYYYMMDD>
```

Example: `dev-build-5c1da50-20260909`

Use this label in chat or logs when referencing a dev build, but do not create a git tag for it.

---

## 4. Promoting from dev to UAT

1. Feature set is stable on the dev build. Ty confirms it works.
2. Create a Gitea release on main with a semver tag and pre-release flag.
3. Deploy the release tag to ubuDual5060.
4. Run smoke tests and the UAT practice walk.
5. If the UAT build passes, the release is accepted. If it fails, fix on main, increment the alpha patch, and create a new release.

Never deploy main HEAD to the UAT stack. Only tagged releases.

---

## 5. Rollback

To rollback a UAT deployment, deploy the previous release tag.

1. List releases: check Gitea for the previous tag.
2. Deploy the previous tag: same deploy script with the old tag.
3. Verify health: `curl -k https://slab.local/api/health`.

Do not delete a release tag that was successfully deployed. Tags are immutable artifacts. If the tag is wrong, create a new one and deploy that instead.
