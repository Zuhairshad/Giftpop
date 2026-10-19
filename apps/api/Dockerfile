# syntax=docker/dockerfile:1.7
#
# The Giftpop API. Build from the repository root:
#
#   docker build -f apps/api/Dockerfile -t giftpop-api .
#
# Stages:
#   base     Node 22 (Debian bookworm, glibc) with the pnpm version pinned in the root package.json.
#   build    Installs the API and its workspace packages with the lockfile frozen, bundles with
#            tsup (internal @giftpop/* packages are bundled in), then `pnpm deploy --prod` writes
#            a folder holding only the production dependencies the bundle leaves external.
#   runtime  Node 22 slim, non-root, the bundle plus those dependencies. No pnpm, no dev
#            dependencies, no sources, no tests, no .env.

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    CI=true \
    npm_config_store_dir=/pnpm/store
# Corepack reads "packageManager" (pnpm@x.y.z) from the root package.json copied below.
RUN corepack enable
WORKDIR /repo

FROM base AS build
# 1. Manifests only, so the install layer is cached until a dependency changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY packages/renderer/package.json packages/renderer/
# The other workspace projects (web, admin, seed) are absent on purpose: the filter below
# installs only the API and the workspace packages it depends on (`...`).
RUN --mount=type=cache,id=giftpop-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@giftpop/api..."

# 2. Sources, then bundle.
COPY packages packages
COPY apps/api apps/api
RUN pnpm --filter @giftpop/api build

# 3. Production-only dependency tree. `inject-workspace-packages` is what lets pnpm 10 deploy
#    from the lockfile (without it pnpm asks for --legacy, which re-resolves and ignores it).
RUN --mount=type=cache,id=giftpop-pnpm-store,target=/pnpm/store \
    pnpm --config.inject-workspace-packages=true --filter @giftpop/api deploy --prod /out

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=4000 \
    UPLOAD_DIR=/data/uploads
WORKDIR /app

# package.json carries "type": "module", which Node needs to load dist/server.js as ESM.
COPY --from=build --chown=node:node /out/package.json ./package.json
COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /out/dist ./dist

# Local storage driver only (STORAGE_DRIVER=local), which the API refuses in production.
# Production uses Cloudflare R2, so nothing is written here. Mount a volume for local
# docker runs; it is not needed in production.
RUN mkdir -p /data/uploads && chown -R node:node /data
VOLUME ["/data/uploads"]

USER node
EXPOSE 4000

# Liveness of the process plus MongoDB: /ready answers 503 while the database is unreachable.
# Node's own fetch is used because the slim image has no curl. A long start period covers the
# first MongoDB connection, which retries (DB_CONNECT_MAX_ATTEMPTS).
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/ready',{signal:AbortSignal.timeout(4000)}).then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]

# Exec form: node is PID 1 and receives SIGTERM directly. server.ts registers SIGTERM and
# SIGINT handlers (stop the worker, close the HTTP server, close MongoDB, exit), and a PID 1
# process only skips signals that have no handler, so no init wrapper is needed. The API
# spawns no child processes, so there is nothing to reap. `docker run --init` also works.
STOPSIGNAL SIGTERM
CMD ["node", "dist/server.js"]
