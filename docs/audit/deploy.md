# Deploy audit

Slice: `deploy` (Dockerfile, `.dockerignore`, `docs/deploy.md`, deploy workflows). Nothing was deployed.

## What was and was not verified

**Docker was not run.** The sandbox has no Docker daemon, so `docker build` and the `HEALTHCHECK` instruction itself are unverified. Simulated by hand in a copy of the repository made from `git archive HEAD` (outside the repo, with the same exclusions as `.dockerignore`: no `apps/web`, `apps/admin`, `e2e`, `docs`):

- Every `COPY` source in `apps/api/Dockerfile` exists (`ls` of each path).
- `pnpm install --frozen-lockfile --filter "@giftpop/api..."` succeeds with the other apps absent (623 packages, lockfile untouched).
- `pnpm --filter @giftpop/api build` produces `dist/server.js` (165 KB). Its bare imports are exactly the API's production dependencies (`mongoose`, `argon2`, `sharp`, `express`, `zod`, `pino`, `@aws-sdk/client-s3`, and so on); `@giftpop/*` is bundled.
- `pnpm --config.inject-workspace-packages=true --filter @giftpop/api deploy --prod <dir>` succeeds and uses the lockfile (241 packages). Plain `deploy` without `--legacy` is refused by pnpm 10 unless that setting is on, and `--legacy` re-resolves from the registry and ignores the lockfile, so it was not used.
- A runtime folder holding only `package.json`, `node_modules` and `dist` (what the runtime stage copies) was started with `node dist/server.js` and `NODE_ENV=production`, `STORAGE_DRIVER=r2` (dummy keys), `TRUST_PROXY_HOPS=1`, against the in-memory replica set on `127.0.0.1:27017`, database `giftpop_deploy`, port 4300. Logs showed `MongoDB connected` then `API listening`. The exact health check command from the Dockerfile exited 0, `/ready` returned 200, `GET /v1/countries` returned `[]`. `sharp` encoded a WebP and `argon2` hashed and verified in that folder. `SIGTERM` by PID logged `Shutting down` and the process exited.
- YAML of the three workflows parses; `prettier --check` passes on `docs/deploy.md` and the workflows (`.dockerignore` has no Prettier parser). The env-variable coverage script in `docs/deploy.md` runs and prints `OK: 29 variables documented`.

Not verified and needs a real run:

- The image build itself: Corepack download inside the container, the BuildKit cache mounts, the non-root user's access to `/data/uploads`, the `HEALTHCHECK` under Docker, the `docker stop` exit code. Commands to run, from the repository root:
  ```sh
  docker build -f apps/api/Dockerfile -t giftpop-api .
  docker compose up -d   # local Mongo replica set rs0
  docker run -d --name giftpop-api-check -p 4000:4000 \
    -e NODE_ENV=development -e STORAGE_DRIVER=local \
    -e MONGODB_URI='mongodb://host.docker.internal:27017/giftpop?replicaSet=rs0' \
    --add-host host.docker.internal:host-gateway giftpop-api
  docker ps --filter name=giftpop-api-check   # (healthy) within about 40 seconds
  docker exec giftpop-api-check id            # uid 1000 node
  docker stop giftpop-api-check; docker inspect -f '{{.State.ExitCode}}' giftpop-api-check   # 0
  docker image ls giftpop-api                 # expect roughly 400 to 500 MB
  ```
  The local Mongo advertises `localhost:27017` as its member host (`docker-compose.yml`), so from inside a container the replica set discovery points back at the container itself and the connection can fail. If it does, use `?directConnection=true` instead of `replicaSet=rs0` for this check only.
- `NODE_ENV=production` image on Atlas with R2 (no credentials here).
- Vercel behaviour: that `Set-Cookie` passes through the external rewrite (expected to; not tested here), the body size limit for an 8 MB image upload through the admin rewrite (uploads are capped at 8 MB in the API), and which client IP and `X-Forwarded-For` shape the API sees.
- Latest versions of the Docker actions. GitHub access was not available, so the workflows use the major tags I know exist (`docker/setup-buildx-action@v3`, `docker/login-action@v3`, `docker/metadata-action@v5`, `docker/build-push-action@v6`) and the tags already used by `ci.yml` (`actions/checkout@v7`, `pnpm/action-setup@v6`, `actions/setup-node@v7`). Check for newer majors. The Vercel CLI version is a required repository variable (`VERCEL_CLI_VERSION`) rather than a guess; the workflows fail with a clear message if it is empty.
- R2 bucket CORS (`GET` from the web and admin origins) is a precaution; whether the apps need it was not tested.

## Findings

R2 is **not** a blocker: `apps/api/src/lib/storage/r2.ts` implements `Storage` with the S3 client and `index.ts` selects it with `STORAGE_DRIVER=r2`. There is no deployment BLOCKER found. The items below are ordered by severity.

### Medium

1. **Login rate limit can be bypassed on a public API origin if `TRUST_PROXY_HOPS` is 2 or more** (`apps/api/src/app.ts:25`, key built at `apps/api/src/modules/auth/rate-limit.ts:23`). Browsers reach the API through the Vercel rewrite, so the API needs a hop count that skips Vercel to see the customer. But `api.<tld>` is also reachable by anyone directly. With 2 hops, a direct caller can send their own `X-Forwarded-For` and Express takes that value as the client IP, so a fresh fake IP per request gives a fresh bucket (`ip|email`). With 1 hop that attack fails, but then every store customer shares the Vercel egress address (the decisions.md note about 60 quotes per minute). Proposal for the lead: keep `TRUST_PROXY_HOPS=1` for launch, and have the web and admin proxies add a shared-secret header that the API checks before it trusts `X-Forwarded-For`, or restrict `api.<tld>` to requests that carry that header. Not built here (it spans three apps).
2. **`PUBLIC_ASSET_BASE_URL` is not required when `STORAGE_DRIVER=r2`** (`apps/api/src/env.ts:48`, the R2 checks at `:83`). If it is missing, the default `http://localhost:4000/v1/assets/files` is stored in every uploaded asset and the store shows broken images. Proposal: in the `superRefine`, require it to be set (and `https`) when `NODE_ENV=production`. `docs/deploy.md` lists it as required.
3. **The seed has no owner-only mode** (`scripts/seed/index.ts:34-42`). The only supported way to create the first owner also upserts the demo countries, packagings, items and prices. On a fresh production database that puts demo data live; on a database where staff have edited seeded items it overwrites their edits (the guard `SEED_ALLOW_PRODUCTION=1` only asks for confirmation). Proposal: a `--owner-only` flag (or `SEED_OWNER_ONLY=1`). Until then `docs/deploy.md` says to run it once, on first deploy, and the lead must decide whether the demo catalog is acceptable in production. This is a product decision, not a technical one.
4. **A missing `API_URL` silently becomes `http://localhost:4000` in production** (`apps/web/src/lib/env.ts:3-9`, `apps/admin/src/lib/env.ts:3-6`). The build succeeds, the rewrite is fixed at build time to localhost, and every call fails at runtime. Proposal: in both `parseServerEnv`, refuse the default when `NODE_ENV=production`, so the Vercel build fails instead. Related: `API_URL` is baked into the rewrite at build, so changing it needs a redeploy (documented).
5. **`NOTIFICATIONS_WORKER` defaults to `off`** (`apps/api/src/env.ts:34`). A deployment that forgets it sends no customer messages and nothing fails loudly. Documented as required; proposal: log a warning at boot when it is `off` in production.

### Low

6. **`/ready` does not ping MongoDB** (`apps/api/src/health.ts:14`, `apps/api/src/db.ts:53` reads Mongoose connection state). Already a known follow-up in decisions.md. The Dockerfile `HEALTHCHECK` uses `/ready`; after a silent network partition it may stay healthy. The doc recommends `/health` for host liveness and `/ready` for readiness.
7. **Shutdown force-exit is 10 seconds** (`apps/api/src/server.ts:51-54`), the same as Docker's and many hosts' default stop grace. A slow in-flight request can be killed by `SIGKILL` just before the process exits itself. The doc sets the stop timeout to 20 seconds. Optional: shorten the force-exit to 8 seconds.
8. **All rate limiters are in process memory** (`MemoryStore` in `apps/api/src/modules/*/rate-limit.ts`). A restart or deploy resets every counter, and a second instance doubles every limit. Already in decisions.md; the doc says to run one instance.
9. **During a rolling deploy two API instances overlap**, so the notification worker runs twice briefly and a message can be sent twice (delivery is at least once by design). The doc advises stop-then-start.
10. **`gp_country` cookie has no `Secure` flag** (`apps/web/src/features/country/cookie.ts:31`). It holds only a country code. Cosmetic.
11. **`apps/api/package.json` lists `@aws-sdk/s3-request-presigner`**, which nothing imports. It is installed in the image (adds size). Remove it if unused.
12. **Payment proof images are public unlisted URLs** in the R2 bucket (decisions.md, phase 3 follow-ups). Receipts can show account numbers. Already tracked.

## Assumptions

- Hosts named in the doc (Railway, Render, Fly) are examples; instructions are written to be host-neutral. Nothing in the image depends on a host.
- `TRUST_PROXY_HOPS=1` at first (decisions.md), with a check after first deploy; see finding 1.
- Atlas M10 as the minimum tier because M0 and M2 have no continuous backup (from memory of Atlas plans; check when buying).
- The base image is `node:22-bookworm-slim` (floating minor tag). Pin a digest if you need byte-for-byte rebuilds.
- Corepack downloads pnpm at build time (needs network during `docker build`). Node 22 images include Corepack; Node 25 and later do not, so do not raise `NODE_VERSION` past 24 without installing it.

## Needs from the lead

- Decide findings 1 to 5 (code changes in files this slice does not own).
- Add the observability variables to the tables in `docs/deploy.md` when that slice merges; the coverage script in the doc fails until they are listed.
- Record in `docs/decisions.md`: the image builds with `pnpm deploy --prod` using `--config.inject-workspace-packages=true` (no change to `pnpm-workspace.yaml`); web and admin are two Vercel projects with `API_URL` set at build and runtime; deploy workflows are manual and gated by `vars.DEPLOY_ENABLED`.

## Follow-up status (lead, 2026-10-19)

- Finding 3 (seed owner-only): done, `SEED_OWNER_ONLY=1`.
- Finding 4 (`API_URL` silently localhost): done, web and admin refuse the default when `NODE_ENV=production`; a build with a blank `API_URL` fails with "API_URL is required in production".
- Finding 6 (`/ready` ping): done, 2 second ping; tested with a hanging ping.
- Findings 1, 2, 5, 7 to 12: open.
