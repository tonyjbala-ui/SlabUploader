# Deploy inventory worksheet

Fill this at **Gate B** on the designated host before any port bind or Caddy merge.
Do not assume a prior lab IP or hostname. See `docs/DEPLOYMENT.md`.

## Host

| Field | Value |
|---|---|
| Inventory date | |
| Operator | |
| Machine name / role | |
| `APP_HOST` (LAN or Tailscale IP/name used in DNS) | |
| `APP_HOSTNAME` (HTTPS site name, e.g. `slab.example.local`) | |
| OS / Docker version | |
| Notes | |

## Ports and collisions

| Check | Result |
|---|---|
| `docker ps` summary (names + published ports) | |
| Free HTTP port for frontend bind (`FRONTEND_PORT`, default 18080) | |
| Free port for fastapi bind (`FASTAPI_PORT`, default 18081) | |
| Caddy public HTTPS port in use by other sites | |
| Co-resident apps that own ports (example: bolt.diy on 8443-class) | |

## Caddy

| Field | Value |
|---|---|
| Caddy config path (host file or container) | |
| Existing site blocks that share this host | |
| TLS mode (`internal` CA vs other) | |
| Phone CA trust verified? (yes/no + how) | |

## DNS / reachability

| Field | Value |
|---|---|
| DNS source (Pi-hole / AdGuard / MagicDNS / hosts) | |
| A record: `APP_HOSTNAME` → `APP_HOST` | |
| Reachable from phone on LAN? | |
| Reachable from phone on Tailscale? | |

## Volumes and backup

| Field | Value |
|---|---|
| Docker volume dir convention | |
| Backup target path (local) | |
| Off-box mirror (if any) | |

## Smoke after first up

| Check | Pass? |
|---|---|
| `curl -k https://${APP_HOSTNAME}/api/health` | |
| Compose `frontend` + `fastapi` healthy | |
| Caddy `/api/*` reaches fastapi (not frontend) | |

## Sign-off

| Role | Name | Date |
|---|---|---|
| Inventory complete | | |
| Ty Gate B (optional) | | |
