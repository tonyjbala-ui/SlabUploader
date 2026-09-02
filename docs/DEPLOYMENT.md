# Deployment Playbook (Docker Compose + Caddy)

Status: SPEC · env-agnostic · 2026-09-01 · SlabUploader

**Target:** any inventoried Docker host. Fill `deploy/INVENTORY.md` before bind.
Variables: `APP_HOST`, `APP_HOSTNAME`, `FRONTEND_PORT`, `FASTAPI_PORT`.
Health URL: `https://${APP_HOSTNAME}/api/health`.

> Gate A freeze (2026-08-31): hybrid client owns measure/crop SoT. Do not scaffold a
> server ruler/pipeline as authoritative. Woo UAT = draft + `SLAB-UAT-*` on PROD.
> Inference is **not** on the app host by default. It is a remote configurable endpoint.

**Historical lab example (non-normative):** TyUBUMini at `192.168.1.201` with hostname
`slab.tyubumini.local` was one early candidate. Do not treat that IP or name as SoT.
Use the inventory worksheet.

## 1. Host inventory (do first — do not assume)

Before deploying, fill `deploy/INVENTORY.md` (hard rule: inventory before execute):

1. `docker ps` — existing containers, published ports (avoid collisions with
   co-resident apps; bolt.diy is one known example of 8443-class port use).
2. Caddy config location (host file or container) and existing site blocks.
3. Free port choice for the compose stack (proposal: `18080` http, `18443` https —
   verify free on **this** host).
4. Docker volume dir convention on the host.
5. Reachability: confirm `${APP_HOSTNAME}` is reachable from the phone network
   (same LAN or Tailscale). Add DNS (Pi-hole/AdGuard or Tailscale MagicDNS) if needed:
   one A record → `${APP_HOST}` (LAN and/or Tailscale name).

Write the chosen values into `deploy/INVENTORY.md` and the host `.env` before compose up.

## 2. Repository layout (at scaffold)

```
SlabUploader/
├── AGENTS.md
├── README.md
├── docs/                          # this plan set
├── deploy/
│   ├── docker-compose.yml
│   ├── Caddyfile.fragment         # slab site block (merged into host Caddy)
│   ├── INVENTORY.md               # filled at Gate B on the designated host
│   ├── .env.example               # SLAB_AES_KEY, APP_*, port vars (no real secrets)
│   └── backup.sh                  # sqlite .backup + images tar, with retention
├── frontend/                      # SvelteKit app
└── backend/                       # FastAPI app
    ├── app/
    │   ├── main.py
    │   ├── (no happy-path pipeline SoT here)  # hybrid: TECH-SPEC modules live in frontend/ or shared pure TS; backend = store/Woo/inference/U2Net stub
    │   ├── woo/                   # Woo client, taxonomy, publish
    │   ├── inference/             # vision + content wrappers (toggleable)
    │   ├── prompts/               # call1.txt, call2.txt (shipped defaults)
    │   ├── api/                   # routers (slabs, photos, pricing, taxonomy, settings)
    │   ├── db/                    # schema.sql, models, migrations (alembic)
    │   └── security/              # AES-GCM settings encryption
    ├── tests/                     # pytest — unit (deterministic) + integration (woo)
    └── Dockerfile
```

## 3. docker-compose.yml (target shape)

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["127.0.0.1:${FRONTEND_PORT:-18080}:80"]   # Caddy-only; not public
    depends_on: [fastapi]
    restart: unless-stopped

  fastapi:
    build: ./backend
    environment:
      SLAB_AES_KEY: ${SLAB_AES_KEY}        # from .env (32-byte base64)
      # no Woo/inference keys here — they live encrypted in SQLite (Settings UI)
    volumes:
      - slab_db:/data
      - slab_images:/images
      - ./prompts:/app/prompts:ro       # prompt files, read-only mount
    ports: ["127.0.0.1:${FASTAPI_PORT:-18081}:8000"]  # Caddy-only
    mem_limit: 2g                            # env convention: mem_limit preferred
    restart: unless-stopped

volumes:
  slab_db:
  slab_images:
```

Conventions (house rules):

- `mem_limit` on services (not host-level tuning).
- Services bind to 127.0.0.1 only; Caddy is the only public surface.
- No `latest` tags on base images — pin versions.
- `restart: unless-stopped`; compose is the supervisor (no systemd units).

## 4. Caddy (fragment)

API must win over the frontend catch-all. Put `handle /api/*` **before** the frontend
`handle` block:

```caddyfile
{$APP_HOSTNAME} {
    tls internal            # Caddy internal CA (or host-appropriate TLS)
    handle /api/* {
        reverse_proxy fastapi:8000
    }
    handle {
        reverse_proxy frontend:80 {
            header_up X-Real-IP {remote_host}
        }
    }
}
```

- HTTPS enforced (http→https redirect automatic when using Caddy TLS).
- If the host Caddy already serves a wildcard for this domain family, add this as a
  site block. Verify the cert is trusted on the phone.
- LAN/Tailscale only — no public exposure for POC.

## 5. Secrets

| Secret | Where | Notes |
|---|---|---|
| `SLAB_AES_KEY` | `.env` on host (mode 600) → compose env | 32-byte base64; NEVER in the repo |
| Woo WP username + application password | SQLite `settings` (AES-GCM) via Settings UI | dedicated low-priv WP user; not consumer keys |
| Inference API key | SQLite `settings` (AES-GCM) via Settings UI | usually empty for local llama.cpp |
| `.env.example` | repo | placeholders only, committed |

**Woo credential setup (once per store):**

1. Store must already be on **HTTPS**. WordPress will not offer Application
   Passwords over plain HTTP.
2. Create a dedicated low-privilege WordPress user (shop manager, or custom role
   with product create/edit + media upload). Do not reuse an admin login.
3. Sign in as that user → **Users → Profile → Application Passwords** → generate
   a password for "SlabUploader".
4. Enter the username + application password in the app Settings UI. FastAPI
   stores them AES-GCM encrypted. Browser never keeps them.
5. Rotate by revoking the old application password in the WP profile and
   re-entering a new one in Settings, then `test-woo`.

Key rotation (AES): `SLAB_AES_KEY` change requires re-encrypting settings —
provide `python -m app.security.rekey NEW_KEY` (reads old key from env
`SLAB_AES_KEY_OLD`, decrypts, re-encrypts, updates). Documented in playbook §7.

## 6. Backup and restore

`deploy/backup.sh` (run via cron on the app host, e.g. daily 03:00):

```
1. sqlite3 /data/slab.db ".backup /backups/slab-YYYYMMDD.db"   # WAL-safe
2. tar czf /backups/slab-images-YYYYMMDD.tgz -C /images .
3. cp -r /backups/prompts-YYYYMMDD.tar.gz prompts/              # prompt files
4. retain: 7 daily + 4 weekly; prune older
5. log result to /var/log/slab-backup.log; alert (Hermes) on failure
```

- Backup target: local dir first; mirror to an off-box share for safety (same pattern
  as other stacks on the host).
- **Restore**: stop compose → restore DB file + untar images → start compose.
  Tested at least once during Phase 6 (UAT) before declaring backup done.

## 7. Operations runbook

| Task | Command / how |
|---|---|
| Deploy (first) | inventory §1 → `docker compose -f deploy/docker-compose.yml build` → `up -d` → Caddy reload → smoke §8 |
| Update | `git pull` → `docker compose build fastapi frontend` → `up -d` (DB migrations run on start via alembic) |
| Logs | `docker compose logs -f fastapi` / `frontend` |
| Health | `curl -k https://${APP_HOSTNAME}/api/health` |
| Rekey AES | §5 |
| Rotate Woo creds | WP user profile → revoke old application password → new one → Settings UI → `POST /api/v1/settings/test-woo` |
| Rotate inference key | Settings UI (if external) |
| Edit a prompt | Edit the text file on host, no restart needed (read fresh each time) |
| Rollback image | `git checkout <tag>` → rebuild → up -d; DB down-migrations provided for schema changes |
| Reset one slab | delete its photos dir + `UPDATE slabs SET status='draft'` (admin script) |

## 8. Smoke test (after every deploy)

1. `GET https://${APP_HOSTNAME}/api/health` → ok (from phone over HTTPS once CA trust is proven)
2. Settings: WP application password + `test-woo` ok; `woo_create_status=draft`; inference OFF for early gates
3. Create a slab → upload test photos (fixture set) → poll to `ready`
4. Verify bdft/price match the fixture's expected values (golden test; bdft = sqft × thickness)
5. Publish test slab with SKU `SLAB-UAT-…` → slab may show local `published`; Woo product must be **draft**
6. Leave or delete the Woo draft UAT product (never customer-visible). Final live publish is a non-UAT SKU after Ty review.

## 9. Scaling path (not v1)

- Postgres when SQLite write contention appears (schema already portable).
- Redis+arq when in-process queue shows lag.
- GPU on the app host only if on-demand U2Net latency becomes a bottleneck. Keep CPU
  first. Never lower `output_px_min` below 1600; undersized source means retake, not a
  smaller min. RemBG is not part of the hybrid happy path.
