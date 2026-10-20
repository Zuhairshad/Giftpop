# Deploying The Giftpop

Nothing here has been deployed yet. This is the recommended setup and the steps to follow. `<tld>` stands for the domain you buy; the examples use `giftpop.<tld>`, `admin.<tld>` and `api.<tld>`.

## Recommended setup

| Part         | Where                                                                   | Why                                                                                   |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `apps/web`   | Vercel project 1, root directory `apps/web`                             | Next.js 16, zero config.                                                              |
| `apps/admin` | Vercel project 2, root directory `apps/admin`                           | Separate URL and login (decisions.md).                                                |
| `apps/api`   | Container (`apps/api/Dockerfile`) on Railway, Render or Fly, one region | Long-running Node process; holds the notification worker and in-memory rate limiters. |
| Database     | MongoDB Atlas, M10 or larger, same region as the API                    | Replica set (transactions are required), continuous backups.                          |
| Assets       | Cloudflare R2 bucket behind a custom domain                             | Rule 9: images live in object storage. The API ships an R2 driver.                    |

Request flow: the browser only talks to its own app. `web` and `admin` rewrite `/api/*` to `${API_URL}/v1/*` (`next.config.ts` in each app). Server Components call `${API_URL}/v1` directly. The browser loads images straight from the R2 domain.

```
browser --> giftpop.<tld>/api/*  --(Vercel rewrite)--> api.<tld>/v1/*  --> MongoDB Atlas
browser --> admin.<tld>/api/*    --(Vercel rewrite)--> api.<tld>/v1/*
browser --> assets.<tld>/<key>.webp   (R2)
```

## Domains and cookies

| Host            | Serves                  | Notes                                                                                                                                   |
| --------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `giftpop.<tld>` | web (Vercel)            | `WEB_ORIGIN`. Also `www.` redirect if wanted.                                                                                           |
| `admin.<tld>`   | admin (Vercel)          | `ADMIN_ORIGIN`.                                                                                                                         |
| `api.<tld>`     | API container           | Public HTTPS (the Vercel servers must reach it). Browsers never call it directly.                                                       |
| `assets.<tld>`  | R2 custom domain        | `PUBLIC_ASSET_BASE_URL`, for example `https://assets.<tld>`. R2 bucket CORS: allow `GET` from the web and admin origins (unverified).   |

Cookies, read from the code:

- Staff session cookie `gp_admin` (`packages/contracts/src/admin.ts`, `apps/api/src/modules/auth/cookie.ts`): `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` 7 days, `Secure` when `NODE_ENV=production`, and **no `Domain` attribute**. The API sends `Set-Cookie` in the response to `admin.<tld>/api/auth/login`; the browser sees that response as coming from `admin.<tld>`, so the cookie is host-only on `admin.<tld>`. It is not sent to `giftpop.<tld>` or `api.<tld>`. Do not add a `Domain=.<tld>` setting: nothing needs it and it would share the session with the store.
- The admin app forwards the cookie to the API from Server Components (`apps/admin/src/lib/session.ts`). `API_URL` must therefore be reachable from Vercel's servers.
- `Secure` means the admin must be served over HTTPS in production. Run production with `NODE_ENV=production` or the cookie is sent without `Secure`.
- Store cookie `gp_country` (`apps/web/src/features/country/cookie.ts`): set by browser code, `Path=/`, `SameSite=Lax`, one year, not `HttpOnly`, not `Secure`, no `Domain`. It holds a country code only.
- `SameSite=Lax` is enough because every browser call is same-origin. Cross-site cookies (`SameSite=None`) are not used and not needed.
- `TRUST_PROXY_HOPS`: the API sees the Vercel server as the client, plus whatever load balancer the API host puts in front. Rate limits are keyed on `req.ip`. Use `1` to start (decisions.md). After the first deploy, check the IP the API logs for two requests from different networks. If they match, customers share one bucket: raise the value by one. See `docs/audit/deploy.md` for why a higher value has a cost on a public API origin.

## Environment variables

The tables list every variable the code reads. "Secret" means the value must never be committed, logged or put in a `NEXT_PUBLIC_*` variable. There are no `NEXT_PUBLIC_*` variables in the code.

### API (`apps/api`, container)

Parsed with zod in `apps/api/src/env.ts`; the process exits on bad config.

| Name                       | Required?                          | Example                                                          | Secret? | What it does                                                                                                                                      |
| -------------------------- | ---------------------------------- | ---------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                 | Yes (set by the image)             | `production`                                                     | No      | `production` turns on `Secure` cookies and refuses `STORAGE_DRIVER=local`.                                                                        |
| `PORT`                     | No (image sets 4000)               | `4000`                                                           | No      | Listen port. Railway, Render and Fly inject their own; the health check follows it.                                                               |
| `MONGODB_URI`              | Yes                                | `mongodb+srv://giftpop:<pw>@cluster0.xxxx.mongodb.net/giftpop`   | Yes     | Atlas connection string including the database name. Must be a replica set.                                                                       |
| `SESSION_SECRET`           | Yes in production                  | 64 hex characters                                                | Yes     | Peppers the hash of staff session tokens, at least 32 characters. Changing it signs every staff member out.                                       |
| `WEB_ORIGIN`               | Yes in practice (defaults to dev)  | `https://giftpop.<tld>`                                          | No      | Store origin: CORS and the tracking link in messages. The default is localhost, so tracking links would be wrong if it is missing.                |
| `ADMIN_ORIGIN`             | Yes in practice (defaults to dev)  | `https://admin.<tld>`                                            | No      | Admin origin for CORS.                                                                                                                            |
| `CORS_ORIGINS`             | No                                 | `https://giftpop.<tld>,https://admin.<tld>`                      | No      | Comma separated origins allowed to call the API. Defaults to `WEB_ORIGIN` and `ADMIN_ORIGIN`. Leave it unset.                                     |
| `TRUST_PROXY_HOPS`         | Yes in production (default 0)      | `1`                                                              | No      | Proxies in front of the API (0 to 5). See Domains and cookies.                                                                                    |
| `NOTIFICATIONS_WORKER`     | Yes (default `off`)                | `on`                                                             | No      | `on` runs the outbox worker in this process. Exactly one instance. With `off` everywhere, no customer message is ever sent.                       |
| `STORAGE_DRIVER`           | Yes in production                  | `r2`                                                             | No      | `local` or `r2`. `local` is refused when `NODE_ENV=production`.                                                                                   |
| `R2_ACCOUNT_ID`            | When `STORAGE_DRIVER=r2`           | `0123456789abcdef0123456789abcdef`                               | No      | Cloudflare account id; the endpoint is `https://<id>.r2.cloudflarestorage.com`.                                                                   |
| `R2_ACCESS_KEY_ID`         | When `STORAGE_DRIVER=r2`           | `a1b2c3...`                                                      | Yes     | R2 API token key id. Scope the token to Object Read and Write on one bucket.                                                                      |
| `R2_SECRET_ACCESS_KEY`     | When `STORAGE_DRIVER=r2`           | `...`                                                            | Yes     | R2 API token secret.                                                                                                                              |
| `R2_BUCKET`                | When `STORAGE_DRIVER=r2`           | `giftpop-assets`                                                 | No      | Bucket name.                                                                                                                                      |
| `R2_PRIVATE_BUCKET`        | No (set it in production)          | `giftpop-private`                                                | No      | Bucket for payment proofs. Never served publicly. Unset falls back to `R2_BUCKET`, which is only safe when the public host does not serve `proofs/`. |
| `PUBLIC_ASSET_BASE_URL`    | Yes with R2 (a localhost value is refused) | `https://assets.<tld>`                                        | No      | Public base URL stored files are served from. Saved into each asset at upload time; changing it later does not rewrite old URLs.                  |
| `UPLOAD_DIR`               | No (image sets `/data/uploads`)    | `/data/uploads`                                                  | No      | Folder for the local driver. Development only; unused with R2.                                                                                    |
| `LOG_LEVEL`                | No (`info`)                        | `info`                                                           | No      | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`.                                                                                   |
| `DB_CONNECT_MAX_ATTEMPTS`  | No (10)                            | `10`                                                             | No      | First MongoDB connection attempts before the process exits.                                                                                       |
| `DB_CONNECT_BASE_DELAY_MS` | No (250)                           | `250`                                                            | No      | First retry delay; doubles each attempt up to 10 seconds.                                                                                         |
| `SENTRY_DSN` | No | `https://key@o0.ingest.sentry.io/0` | Yes | Empty means error reporting is off. |
| `SENTRY_TRACES_SAMPLE_RATE` | No | `0` | No | 0 to 1; default 0. |

### Web (`apps/web`, Vercel project 1)

| Name      | Required?                                  | Example                  | Secret? | What it does                                                                                                                                                                   |
| --------- | ------------------------------------------ | ------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `API_URL` | Yes (the build fails without it; `http://localhost:4000` in development only) | `https://api.<tld>`      | No      | Base URL of the API, no `/v1`. Server-side only. Read when the app builds (the rewrite is fixed at build) and at runtime (Server Components): set it for Production and Preview, and redeploy after changing it. |
| `PUBLIC_ASSET_BASE_URL` | Yes when items have images | `https://assets.<tld>` | No | Same value as the API. The only host `next/image` resizes item images from. Read at build and by `next start`. |
| `NEXT_PUBLIC_ASSET_BASE_URLS` | No (set by `next.config.ts`) | | No | Not set by hand: the web build inlines the parsed `PUBLIC_ASSET_BASE_URL` list under this name so the browser knows which images the optimiser accepts. Public. |

### Admin (`apps/admin`, Vercel project 2)

| Name      | Required?                                  | Example                  | Secret? | What it does                                                         |
| --------- | ------------------------------------------ | ------------------------ | ------- | -------------------------------------------------------------------- |
| `API_URL` | Yes (the build fails without it; `http://localhost:4000` in development only) | `https://api.<tld>`      | No      | Same as web: build-time rewrite target and runtime server calls.     |
| `PUBLIC_ASSET_BASE_URL` | Yes when items have images | `https://assets.<tld>` | No | Same as web. |

### Seed script (`pnpm seed`, run once from a trusted machine, not in the image)

| Name                    | Required?                    | Example                  | Secret? | What it does                                                                                      |
| ----------------------- | ---------------------------- | ------------------------ | ------- | ------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`           | Yes                          | the Atlas string         | Yes     | Database to seed.                                                                                 |
| `SEED_OWNER_EMAIL`      | Yes                          | `owner@<tld>`            | No      | Email of the first owner account. Created only if no staff member has this email.                 |
| `SEED_OWNER_PASSWORD`   | Yes                          | 12 or more characters    | Yes     | Password of that account. Type it with `read -s` so it stays out of shell history.                |
| `SEED_OWNER_ONLY`       | Yes for the first production owner | `1`                | No      | Creates only the owner account; writes no countries, catalog or prices. Allowed in production without `SEED_ALLOW_PRODUCTION`. |
| `SEED_ALLOW_PRODUCTION` | Only to load the demo catalog in production | `1`         | No      | Without it the full seed refuses to run with `NODE_ENV=production`.                               |
| `NODE_ENV`              | No                           | `production`             | No      | Set to `production` so the seed's guard applies.                                                  |

### Tests only (never set in a deployment)

| Name                 | Required? | Example                 | Secret? | What it does                                       |
| -------------------- | --------- | ----------------------- | ------- | -------------------------------------------------- |
| `E2E_WEB_URL`        | No        | `http://localhost:3000` | No      | Playwright base URL for the store.                 |
| `E2E_ADMIN_URL`      | No        | `http://localhost:3001` | No      | Playwright base URL for the admin.                 |
| `E2E_API_URL`        | No        | `http://localhost:4000` | No      | Playwright API URL.                                |
| `E2E_CHROMIUM_PATH`  | No        | `/usr/bin/chromium`     | No      | Use a local Chromium instead of a downloaded one.  |
| `E2E_STAFF_EMAIL`    | No        | `owner@giftpop.test`    | No      | Owner the e2e setup seeds.                         |
| `E2E_STAFF_PASSWORD` | No        | `dev-owner-password-1`  | Yes     | Password for that owner (a throwaway test value).  |
| `E2E_ISOLATED` | No | `1` | No | Start a private stack (API 4100, web 3100, admin 3101, database `giftpop_e2e`), seeded before the API listens. |
| `E2E_MONGODB_URI` | No | `mongodb://127.0.0.1:27017/giftpop_e2e?replicaSet=rs0` | No | Database for the isolated stack. |
| `E2E_UPLOAD_DIR` | No | `$TMPDIR/giftpop-e2e-uploads` | No | Upload folder for the isolated stack. |

### GitHub Actions (repository settings, used by `.github/workflows/deploy-*.yml`)

| Name                     | Kind     | Needed by | What it does                                                              |
| ------------------------ | -------- | --------- | ------------------------------------------------------------------------- |
| `DEPLOY_ENABLED`         | Variable | all three | Set to `true` to let the deploy workflows run. Anything else skips them.  |
| `VERCEL_CLI_VERSION`     | Variable | web, admin | Exact Vercel CLI version to run.                                         |
| `VERCEL_TOKEN`           | Secret   | web, admin | Vercel access token.                                                     |
| `VERCEL_ORG_ID`          | Secret   | web, admin | Vercel team or user id.                                                  |
| `VERCEL_PROJECT_ID_WEB`  | Secret   | web       | Id of the web project.                                                    |
| `VERCEL_PROJECT_ID_ADMIN`| Secret   | admin     | Id of the admin project.                                                  |

The API workflow pushes to GHCR with the built-in `GITHUB_TOKEN`; it needs no secret.

### Proving no variable is missing

This script lists every variable name the code and config files mention and fails when one is not written in backticks in this document. Run it from the repository root. It was run against this document: it prints `OK` and the count.

```sh
#!/usr/bin/env bash
set -euo pipefail
names=$(
  {
    grep -rhoE 'process\.env(\.|\["?)[A-Z][A-Z0-9_]+' apps scripts packages e2e \
      --include='*.ts' --include='*.tsx' --include='*.mjs' \
      --exclude='*.test.*' --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist \
      | sed -E 's/process\.env(\.|\["?)//'
    grep -rhoE '(source|env)(\.|\[")[A-Z][A-Z0-9_]+' apps/web/src/lib apps/admin/src/lib scripts/seed \
      --include='*.ts' --exclude='*.test.*' | sed -E 's/^(source|env)(\.|\[")//'
    grep -hoE '^  [A-Z][A-Z0-9_]+:' apps/api/src/env.ts | tr -d ' :'
    grep -rhoE 'NEXT_PUBLIC_[A-Z0-9_]+' apps packages scripts \
      --include='*.ts' --include='*.tsx' --include='*.mjs' --include='.env*' \
      --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist || true
    grep -hoE '"[A-Z][A-Z0-9_]+"' turbo.json | tr -d '"'
    grep -hoE '^#? ?[A-Z][A-Z0-9_]+=' .env.example apps/*/.env.example | tr -d '# ='
  } | sort -u
)
missing=0
for name in $names; do
  if ! grep -q "\`$name\`" docs/deploy.md; then echo "MISSING from docs/deploy.md: $name"; missing=1; fi
done
[ "$missing" -eq 0 ] && echo "OK: $(echo "$names" | wc -l | tr -d ' ') variables documented"
exit "$missing"
```

## Docker image

Build and run from the repository root:

```sh
docker build -f apps/api/Dockerfile -t giftpop-api .
docker run --rm -p 4000:4000 --stop-timeout 20 \
  -e MONGODB_URI='mongodb://host.docker.internal:27017/giftpop?replicaSet=rs0' \
  -e SESSION_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  -e STORAGE_DRIVER=local -e NODE_ENV=development \
  giftpop-api
docker ps   # STATUS shows (healthy) after about a minute
```

- Base image `node:22-bookworm-slim` (Debian, glibc). `sharp` and `argon2` ship prebuilt glibc binaries, so no compiler is needed. Alpine (musl) was not used because it would need different prebuilt binaries for both and gains little.
- pnpm is the version in the root `package.json` `packageManager` field, fetched by Corepack.
- Build stages: install with the lockfile frozen (`pnpm install --frozen-lockfile --filter "@giftpop/api..."`), bundle with tsup, then `pnpm deploy --prod` copies only production dependencies. The runtime image holds `dist/server.js` and `node_modules`; no pnpm, no sources, no tests, no `.env`. `.dockerignore` keeps `.env` files and the other apps out of the build context.
- Runs as the non-root `node` user, `NODE_ENV=production`, `PORT=4000`.
- `HEALTHCHECK` fetches `http://127.0.0.1:$PORT/ready` with Node (the slim image has no curl). `/ready` answers 503 while the MongoDB connection is down or MongoDB does not answer a `ping` within 2 seconds, so on a host use `/health` (process only) as the liveness check and `/ready` as the readiness check, or a short MongoDB blip restarts the container.
- Signals: `CMD` is the exec form, so `node` is PID 1 and receives `SIGTERM` directly. `server.ts` handles `SIGTERM` and `SIGINT` (stop the worker, close the server, close MongoDB, exit) and forces exit after 10 seconds. No init wrapper is needed because the API starts no child processes; `docker run --init` also works. Give the host a stop timeout above 10 seconds (the example uses 20).
- `/data/uploads` is declared a volume for the local storage driver. That driver is for development and the API refuses it when `NODE_ENV=production`; production stores nothing on disk.

What was and was not verified is in `docs/audit/deploy.md`: Docker itself was not run in the sandbox where this was written.

## MongoDB Atlas

**Status:** an M0 free cluster ("giftpop" project, cluster "giftpop", AWS `us-east-1`) is live and seeded with the full catalog, for early development only. It has no continuous backup and is not sized for production load. Before launch, upgrade it to M10+ (Atlas lets you scale a cluster up in place, no new connection string) and turn on Cloud Backup as below.

- Cluster M10 or larger (M0 and M2 have no continuous backup), MongoDB 8, same region as the API. It is a replica set by default, which order creation needs.
- Turn on Cloud Backup with point-in-time recovery. Test a restore into a scratch cluster once before launch.
- Database user: `readWrite` on the `giftpop` database only. Put the database name in `MONGODB_URI` (`.../giftpop`).
- Network access: allow the API host's outbound IPs. If the host has no fixed outbound IPs, use Atlas private networking where the host supports it, or `0.0.0.0/0` with a long random password and nothing else exposed. Never expose a self-hosted Mongo port.
- Indexes build when the API boots (`model.init()` for every model, `server.ts`). Do not set `autoIndex` off.

## Cloudflare R2

1. Create a bucket (for example `giftpop-assets`) and attach a custom domain `assets.<tld>` (public access through the domain, not the `r2.dev` URL).
2. Create an API token with Object Read and Write on that bucket only. Its key id and secret are `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`; the account id is `R2_ACCOUNT_ID`.
3. Set `STORAGE_DRIVER=r2`, `R2_BUCKET` and `PUBLIC_ASSET_BASE_URL=https://assets.<tld>` on the API.
4. The driver is `apps/api/src/lib/storage/r2.ts` (AWS SDK S3 client, region `auto`). Uploaded images are WebP with a one-year immutable cache header.
5. Payment proof images are private (see below). Create a second bucket with no custom domain and no public access, set `R2_PRIVATE_BUCKET` to it, and give the API token Object Read and Write on both buckets.

### Private proofs

Payment proofs (receipts can show account numbers) never get a public URL. New proofs are written to `R2_PRIVATE_BUCKET` (local driver: the `private/` folder of `UPLOAD_DIR`, which `GET /v1/assets/files/*` refuses) with `Cache-Control: private, no-store`. The order stores only the storage key. Staff see the image through `GET /v1/admin/orders/:id/proofs/:proofId/file`, which needs a staff session and streams the bytes with `private, no-store` and `nosniff`. Customers get no proof URL in any response. If `R2_PRIVATE_BUCKET` is unset the proofs go into `R2_BUCKET`; that is only safe when the public asset host does not serve the `proofs/` prefix, so set a private bucket in production.

Proofs uploaded before this change still have an old public URL and their objects sit under `proofs/` in the public bucket. Staff can still open them (the key is derived from the old URL, and the file route reads it from private storage). Move them once: run `migrateProofsToPrivate(getStorage(), getPrivateStorage())` from `apps/api/src/modules/payments/migrate-proofs.ts` (for example from a small script run against production with the same env). It is idempotent, copies each object and records its key, and never deletes. When it reports `missing: 0, unreadable: 0`, delete the old `proofs/` objects from the public bucket by hand, because the old URLs stay reachable until then. It is not wired to any boot step and was not run against real data.

## First-deploy checklist

1. Buy the domain. Create the Atlas cluster, user and network rule. Create the R2 bucket and token.
2. Generate `SESSION_SECRET` (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
3. Build and push the API image (run the "Deploy API image" workflow, or `docker build` and `docker push` by hand).
4. Create the API service from that image on the host. Set every API variable above. `NOTIFICATIONS_WORKER=on`, instance count 1. Health check path `/health` (liveness) and `/ready` (readiness), stop timeout over 10 seconds. Add the custom domain `api.<tld>`.
5. Check logs: `MongoDB connected`, then `API listening`. A wrong variable prints a list and the process exits.
6. Seed the first owner from a trusted machine with a clone of the repository (the image does not contain the seed):

   ```sh
   read -rs SEED_OWNER_PASSWORD && export SEED_OWNER_PASSWORD
   NODE_ENV=production SEED_OWNER_ONLY=1 \
   MONGODB_URI='<atlas string>' SEED_OWNER_EMAIL='owner@<tld>' pnpm seed
   ```

   `SEED_OWNER_ONLY=1` creates the owner and nothing else; the real catalog is entered in the admin. It never changes an existing account, so running it twice is harmless. Only use `SEED_ALLOW_PRODUCTION=1` (without `SEED_OWNER_ONLY`) if you want the demo catalog live. Do not keep an `apps/api/.env` pointing at another database next to it (shell variables win over that file, but be sure).
7. Create the two Vercel projects (root directory `apps/web` and `apps/admin`, "Include source files outside of the Root Directory" on, Node 22, install command `pnpm install --frozen-lockfile`). Set `API_URL=https://api.<tld>` and `PUBLIC_ASSET_BASE_URL=https://assets.<tld>` for Production and Preview in both, then deploy. Add the domains. Or enable the deploy workflows (set the variables and secrets above, then `DEPLOY_ENABLED=true`).
8. DNS: `giftpop.<tld>` and `admin.<tld>` to Vercel (CNAME to the target Vercel shows), `api.<tld>` to the API host, `assets.<tld>` to R2 (done by Cloudflare). Wait for certificates.
9. Check CORS origins: `WEB_ORIGIN` and `ADMIN_ORIGIN` on the API are exactly the HTTPS origins (no trailing slash, no path).
10. Confirm backups are on in Atlas and that the notification worker runs in one instance only.
11. Run the smoke test below.

### Smoke test

- `https://api.<tld>/health` returns `{"status":"ok"}` and `/ready` returns `{"status":"ready"}`.
- `https://giftpop.<tld>/countries` lists the live countries; the country home loads templates and formats.
- Build a gift, see the price quote, place a test order for a test country, and open the tracking link from the confirmation.
- Sign in at `https://admin.<tld>/login`. The `gp_admin` cookie is `Secure`, `HttpOnly`, host `admin.<tld>`. Reload: still signed in. Sign out: cookie gone.
- In the admin, find the test order, record a payment, move it through the statuses to shipped. The customer notification appears (check the transport's logs).
- Upload an item image. The URL is on `assets.<tld>` and loads in the store.
- Six wrong logins for one email within a minute: the sixth returns 429.
- Stop the API container: the host sends `SIGTERM` and the log shows `Shutting down`, then exit code 0.

## Rollback

- API: every build is tagged `sha-<full commit sha>` in GHCR (and `latest`). Point the host at the previous `sha-` tag and redeploy. Do not roll back with `latest`.
- Web and admin: in Vercel, open the project's Deployments, pick the last good deployment and choose Instant Rollback (or "Promote to Production"). Each project is rolled back on its own.
- Database: there is no down-migration. Keep schema changes additive and backward compatible so the previous API image still works against the new data: add optional fields, add indexes, never rename or remove a field in the same release that stops using it. An index is built on boot, so a new unique index fails the boot if the data already has duplicates: check with an aggregation first. If a bad write happened, restore from an Atlas point-in-time snapshot into a new cluster, compare, then copy back or switch `MONGODB_URI`.
- Orders are frozen (rule 5), so a catalog rollback never changes an order that already exists.

## Cost and scale

- Run one API instance. The login limiter and every other rate limiter keep counts in process memory, so a second instance doubles the limits and a restart resets them (decisions.md, phase 1 audit). Idempotency markers are in MongoDB and are safe across instances. The notification worker must run in exactly one instance. During a rolling deploy two instances overlap for a moment: choose "stop then start" on the host, or accept that a message can be sent twice (delivery is at least once).
- One small container (0.5 to 1 GB memory; `sharp` image processing is the heaviest work, 50 megapixel uploads can need more), one Atlas M10, two Vercel projects (Pro if the team needs more than one seat), R2 (no egress fees, pay for storage and operations).
- Before running more than one API instance: move the rate-limit stores to Mongo or Redis, and split the worker into its own process or service.
