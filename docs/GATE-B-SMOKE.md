# Gate B smoke — Anthony PC (LOCAL DEV only)

**Host:** Anthony `DESKTOP-81CBTV2` (Windows) — **not** Ty production (`ubuDual5060`).  
**Repo:** `C:\Users\fight\Downloads\SlabUploader`  
**Branch:** `phase0-local`  
**Date:** 2026-09-12 PT  
**Operator lane:** Lane B (API) + Gate B smoke helper  

`deploy/INVENTORY.md` remains the production-host worksheet; this file is PC smoke only.

## Results summary

| Check | Result |
|---|---|
| `backend` pytest | **8 passed** |
| `backend/Dockerfile` | Present / OK |
| `frontend/Dockerfile` + `nginx.conf` | Present (Lane C) |
| Docker Desktop | Started from `%LOCALAPPDATA%\Programs\DockerDesktop` |
| Local uvicorn `127.0.0.1:8000` | **OK** |
| Compose `up -d --build` | **OK** after root `.dockerignore` (see blocker note) |
| Compose health `127.0.0.1:18081/api/health` | **200** |
| Compose draft POST `:18081` | **201** |
| Frontend `:18080` + `/api/health` proxy | **200** |
| Settings AES round-trip (local uvicorn) | **200** secret masked |
| Fixtures `docs/fixtures/gate-b/` | Present |
| `deploy/.env` | Created from `.env.example`; **gitignored** |

## Pytest

```
........                                                                 [100%]
8 passed in 0.25s
```

## Local uvicorn smoke (no Docker required)

### GET /api/health

```
{"status":"ok","version":"0.0.1-phase0-pc-smoke","woo_reachable":false}
HTTP:200
```

### POST /api/v1/slabs (multipart + `docs/fixtures/gate-b/tiny-smoke.png`)

```
{"id":"91906834-bcab-4378-8f94-b4857a4b5f13","sku":"SMK-8126","status":"calibrated","length_in":96.0,"thickness_in":1.5,"sqft":0.64,"bdft":9.99,...,"client_rev":1,"server_rev":1,"photos":[{"kind":"inventory","role":"topdown","seq":1,...}]}
HTTP:201
```

### Settings AES round-trip

PUT/GET `/api/v1/settings`: `woo_credentials_configured=true`; `woo_app_password` absent from body.

## Docker compose smoke

Command:

```
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
```

Containers: `deploy-fastapi-1` `127.0.0.1:18081->8000`, `deploy-frontend-1` `127.0.0.1:18080->80`.

### Compose GET /api/health :18081

```
{"status":"ok","version":"0.0.1-phase0","woo_reachable":false}
HTTP:200
```

### Compose POST /api/v1/slabs :18081

```
{"id":"d2f4323e-d4d1-4fd4-b3af-3f708ff2f28a","sku":"SMK-2622","status":"calibrated","bdft":9.99,...,"server_rev":1,"photos":[...]}
HTTP:201
```

### Frontend proxy

- `GET http://127.0.0.1:18080/` → HTTP 200  
- `GET http://127.0.0.1:18080/api/health` → same health JSON, HTTP 200  

## Fixtures

`docs/fixtures/gate-b/`: green-sheet + black-sheet topdown/extra PNGs + `tiny-smoke.png` + README.

## Blockers / notes (resolved or residual)

1. **First compose attempt failed** (`node.exe: not found`) because `COPY frontend/ ./` after `npm ci` pulled host Windows `node_modules`. Fixed for PC smoke by adding root `.dockerignore` excluding `**/node_modules` (and local venv/db). Lane C may want Dockerfile/`npm ci` ordering hardened similarly.
2. Docker Desktop was initially not running; CLI lived under AppData `DockerDesktop`; launched successfully for compose.
3. No git commit/push. Did not rewrite `deploy/docker-compose.yml`, `Caddyfile.fragment`, or `.env.example` content. Did not invent Ty production inventory in `deploy/INVENTORY.md`.

## Left running on this PC

- Local uvicorn on `127.0.0.1:8000` (optional UI follow-up)
- Compose stack on `18080` / `18081`
