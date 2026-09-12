# frontend image for deploy/docker-compose.yml
# Build from repo root:
#   docker build -f frontend/Dockerfile -t slabuploader-frontend .
# Or via compose:
#   docker compose -f deploy/docker-compose.yml --env-file deploy/.env build frontend
#
# Multi-stage: Node builds SvelteKit (adapter-static) → nginx serves on :80
# and proxies /api → http://fastapi:8000 for local compose without Caddy.

FROM node:22.18.0-alpine AS build
WORKDIR /src

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM nginx:1.27.3-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]