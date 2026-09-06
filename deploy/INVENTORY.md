# Deploy inventory worksheet

Fill this at **Gate B** on the designated host before any port bind or Caddy merge.
Do not assume a prior lab IP or hostname. See `docs/DEPLOYMENT.md`.

## Host

| Field | Value |
|---|---|
| Inventory date | 2026-09-06 PT |
| Operator | Ty / Main Cut (SSH from cursor Tailscale node) |
| Machine name / role | ubuDual5060 — practice / UAT app host (locked) |
| `APP_HOST` (LAN or Tailscale IP/name used in DNS) | Tailscale preferred: `100.64.0.9` (`ubudual5060`). LAN also: `192.168.1.202` |
| `APP_HOSTNAME` (HTTPS site name, e.g. `slab.example.local`) | `slab.local` (LAN-first; Pi-hole or hosts → `192.168.1.202`) |
| OS / Docker version | Ubuntu 26.04.1 LTS; Docker 29.8.0; Compose v5.5.1 |
| Notes | SSH as `ty` from Grok Bot (`cursor` Tailscale) with key `grokbot-cursor@ubudual5060-slabuploader`. User `ty` is in `docker` group. Disk ~15G free of 172G (92% used) — watch volume growth. Gitea is code SoT only; runtime is this host. |
| `WOO_BASE_URL` (`https://` store; not editable in app) | **TBD — Ty to provide** (`https://` only) |

## Ports and collisions

| Check | Result |
|---|---|
| `docker ps` summary (names + published ports) | Running: `whisperx-stt` `0.0.0.0:9000->9000`. Host also has `llama-server` on `0.0.0.0:8082`. Firecrawl stack present but exited. |
| Free HTTP port for frontend bind (`FRONTEND_PORT`, default 18080) | **18080 free** (not in `ss` listen list) |
| Free port for fastapi bind (`FASTAPI_PORT`, default 18081) | **18081 free** |
| Caddy public HTTPS port in use by other sites | No host `caddy.service`. No Caddy container found. HTTPS front still to be added. |
| Co-resident apps that own ports (example: bolt.diy on 8443-class) | 9000 (whisperx-stt), 8082 (llama-server), 22 (sshd). Avoid those. |

## Caddy

| Field | Value |
|---|---|
| Caddy config path (host file or container) | **Not installed yet** — choose host install vs compose sidecar at Gate B execute |
| Existing site blocks that share this host | none found |
| TLS mode (`internal` CA vs other) | TBD (Tailscale HTTPS / Caddy `internal` / existing lab CA) |
| Phone CA trust verified? (yes/no + how) | no — not deployed yet |

## DNS / reachability

| Field | Value |
|---|---|
| DNS source (Pi-hole / AdGuard / MagicDNS / hosts) | LAN-first: Pi-hole or hosts for `slab.local` → `192.168.1.202`. Tailscale MagicDNS remains for SSH (`ubudual5060`). |
| A record: `APP_HOSTNAME` → `APP_HOST` | `slab.local` → `192.168.1.202` (LAN). Optional Tailscale alias later. |
| Reachable from phone on LAN? | TBD after deploy |
| Reachable from phone on Tailscale? | TBD after deploy (path intended) |

## Volumes and backup

| Field | Value |
|---|---|
| Docker volume dir convention | TBD on first compose up (prefer under a dedicated path; disk pressure noted) |
| Backup target path (local) | TBD |
| Off-box mirror (if any) | TBD |

## Smoke after first up

| Check | Pass? |
|---|---|
| `curl -k https://${APP_HOSTNAME}/api/health` | not run |
| Compose `frontend` + `fastapi` healthy | not run |
| Caddy `/api/*` reaches fastapi (not frontend) | not run |

## Sign-off

| Role | Name | Date |
|---|---|---|
| Inventory draft (SSH + ports) | Main Cut | 2026-09-06 PT |
| Inventory complete | | |
| Ty Gate B (optional) | | |
