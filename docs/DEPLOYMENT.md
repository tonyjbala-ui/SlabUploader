# Deployment Playbook (.201, Docker Compose + Caddy)

Status: SPEC (deliverable #4) · 2026-08-24 · SlabUploader
Target: TyUBUMini at 192.168.1.201. Domain: `slab.tyubumini.local` (LAN/Tailscale

> Gate A freeze (2026-08-31): hybrid client owns measure/crop SoT. Do not scaffold a server ruler/pipeline as authoritative. Woo UAT = draft + SLAB-UAT-* on PROD.
only — Decision). Inference is NOT on .201; it's a remote configurable endpoint
(.202 or elsewhere).

> Note: exact Caddyfile/ports to be verified against the live .201 Caddy setup at
> implementation time (bolt.diy already runs Caddy TLS on tyubumini.local:8443).
> This playbook is the plan; the first implementation task is a .201 inventory pass.

## 1. Host inventory (do first — do not assume)

Before deploying, record the current state (HARD RULE: inventory before execute):
1. `docker ps` — existing containers, published ports (avoid collisions; bolt.diy
   owns 8443/8444-class ports).
2. Caddy config location (host file or container) and existing `tyubumini.local`
   site blocks.
3. Free port choice for the compose stack (proposal: `18080` http, `18443` https —
   verify free).
4. Docker volume dir convention on the host.
5. Tailscale: confirm `slab.tyubumini.local` is reachable from the phone's network
   (same LAN or Tailscale). If the domain isn't in DNS yet, add it (Pi-hole/AdGuard
   or Tailscale MagicDNS) — one record, A → 192.168.1.201 (LAN) + Tailscale name.

## 2. Repository layout (at scaffold)

```
SlabUploader/
├── AGENTS.md
├── README.md
├── docs/                          # this plan set
├── deploy/
│   ├── docker-compose.yml
│   ├── Caddyfile.fragment         # slab site block (merged into host Caddy)
│   ├── .env.example               # SLAB_AES_KEY, port vars (no real secrets)
│   └── backup.sh                  # sqlite .backup + images tar, with retention
├── frontend/                      # SvelteKit app (Phase 1)
└── backend/                       # FastAPI app (Phase 0)
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

```caddyfile
slab.tyubumini.local {
    tls internal            # Caddy internal CA (matches bolt.diy pattern)
    reverse_proxy frontend:80 {
        header_up X-Real-IP {remote_host}
    }
    handle /api/* {
        reverse_proxy fastapi:8000
    }
}
```
- HTTPS enforced (http→https redirect automatic).
- If the host Caddy already serves `*.tyubumini.local`, add this as a site block;
  verify the internal CA cert is trusted on the phone (same flow as bolt.diy).
- LAN/Tailscale only — no public exposure.

## 5. Secrets

| Secret | Where | Notes |
|---|---|---|
| `SLAB_AES_KEY` | `.env` on host (mode 600) → compose env | 32-byte base64; NEVER in the repo |
| Woo consumer key/secret | SQLite `settings` (AES-GCM) via Settings UI | rotate in Woo → re-enter in UI |
| Inference API key | SQLite `settings` (AES-GCM) via Settings UI | usually empty for local llama.cpp |
| `.env.example` | repo | placeholders only, committed |

Key rotation (AES): `SLAB_AES_KEY` change requires re-encrypting settings —
provide `python -m app.security.rekey NEW_KEY` (reads old key from env
`SLAB_AES_KEY_OLD`, decrypts, re-encrypts, updates). Documented in playbook §7.

## 6. Backup & restore

`deploy/backup.sh` (run via cron on .201, e.g. daily 03:00):
```
1. sqlite3 /data/slab.db ".backup /backups/slab-YYYYMMDD.db"   # WAL-safe
2. tar czf /backups/slab-images-YYYYMMDD.tgz -C /images .
3. cp -r /backups/prompts-YYYYMMDD.tar.gz prompts/              # prompt files
4. retain: 7 daily + 4 weekly; prune older
5. log result to /var/log/slab-backup.log; alert (Hermes) on failure
```
- Backup target: local dir first; mirror to TrueNAS SMB share
  (`\\truenas.local\…\backups\slab`) for off-box safety (same pattern as other stacks).
- **Restore**: stop compose → restore DB file + untar images → start compose.
  Tested at least once during Phase 6 (UAT) before declaring backup done.

## 7. Operations runbook

| Task | Command / how |
|---|---|
| Deploy (first) | inventory §1 → `docker compose -f deploy/docker-compose.yml build` → `up -d` → Caddy reload → smoke §8 |
| Update | `git pull` → `docker compose build fastapi frontend` → `up -d` (DB migrations run on start via alembic) |
| Logs | `docker compose logs -f fastapi` / `frontend` |
| Health | `curl -k https://slab.tyubumini.local/api/health` |
| Rekey AES | §5 |
| Rotate Woo creds | Woo UI → new consumer key/secret → Settings UI → `POST /api/settings/test-woo` |
| Rotate inference key | Settings UI (if external) |
| Edit a prompt | Edit the text file on host, no restart needed (read fresh each time) |
| Rollback image | `git checkout <tag>` → rebuild → up -d; DB down-migrations provided for schema changes |
| Reset one slab | delete its photos dir + `UPDATE slabs SET status='draft'` (admin script) |

## 8. Smoke test (after every deploy)
1. `GET /api/health` → ok (from phone over HTTPS once CA trust is proven)
2. Settings: Woo creds + `test-woo` ok; `woo_create_status=draft`; inference OFF for early gates
3. Create a slab → upload test photos (fixture set) → poll to `ready`
4. Verify bdft/price match the fixture's expected values (golden test; bdft = sqft × thickness)
5. Publish test slab with SKU `SLAB-UAT-…` → slab may show local `published`; Woo product must be **draft**
6. Leave or delete the Woo draft UAT product (never customer-visible). Final live publish is a non-UAT SKU after Ty review.

## 9. Scaling path (not v1)
- Postgres when SQLite write contention appears (schema already portable).
- Redis+arq when in-process queue shows lag.
- GPU on .201 only if RemBG latency becomes a bottleneck — otherwise keep it CPU
  (normalization budget is 3–5s per PRD; U²Net on modern CPU meets that).
