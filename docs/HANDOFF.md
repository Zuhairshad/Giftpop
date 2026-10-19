# Handoff: where the build stands

Written at the end of the first long session. Read `CLAUDE.md`, `docs/product.md` and `docs/decisions.md` first. Audit reports are in `docs/audit/`.

## State

All six phases are built and merged. `pnpm verify` (lint, typecheck, tests for the whole repo) and `pnpm build` pass, and `pnpm format:check` passes.

| Phase | What | Status |
|---|---|---|
| 0 | Monorepo, contracts, config, CI | Done |
| 1 | Admin login, countries, catalog, assets, seed | Done |
| 2 | Gift builder and renderer | Done |
| 3 | Checkout, orders, payments, tracking, notifications outbox | Done |
| 4 | Admin orders, shipment statuses, dashboard, packing sheet | Done |
| 5 | Home, countries, partners, templates | Done |
| 6 | Hardening and deploy readiness | Done except the items below |

Phase 6 done: Playwright flows (`e2e/`, 4 flows, passed 3 runs in a row in isolated mode), security route-walk test and hardening, observability (request ids, masked logs, optional Sentry, `GET /v1/admin/metrics`), performance report and indexes, deploy files (`apps/api/Dockerfile`, `docs/deploy.md`, disabled deploy workflows), private payment proofs, accessibility audit.

## Second session (2026-10-19)

Done: money formatting fixed for ICU 78 (PKR showed 100 times too high), e2e isolated run seeds before servers answer, accessibility leftovers (items skeleton and `loading.tsx`, checkout error summary, colour names, stepper and template names, admin account menu), performance follow-ups (motion off non-animating routes, `next/image` item cards, indexed admin search), deploy items (owner-only seed, `API_URL` required in production, `/ready` ping), decisions and lessons. Details are in `docs/decisions.md` and the `Follow-up status` sections of the audits.

## Still open

1. **Deploy** (`docs/audit/deploy.md` findings 1, 7 to 12): the proxy shared secret before raising `TRUST_PROXY_HOPS` (owner decision, spans three apps); rate limiters in memory (run one API instance).
2. **Performance**: items and arrange are about 230 kB against the 200 kB budget because they animate (owner decision); zod on the client (31 kB).
3. Security and e2e lows listed in `docs/decisions.md` (accepted for now). Verifier "Should fix": about 12 list-response schemas are wrapped locally in web and admin instead of coming from contracts; some audit reports still list items as open that are fixed (security S6, S7, S10).

## Things only a person can do or confirm

- **Docker was never run** (no daemon in the sandbox). Confirm with `docker build -f apps/api/Dockerfile -t giftpop-api .` and the `docker run` commands in `docs/audit/deploy.md`. The build steps were simulated outside Docker and the bundle booted and passed the health check.
- **GitHub Actions CI has never run.** Push and check the first run. Verify the action tags in `.github/workflows/deploy-api.yml` (`docker/*` actions were written from memory).
- **Product assumptions** marked `ASSUMPTION` in `docs/product.md` (pricing percentages, payment policy) still need a decision. Defaults are in `PAYMENT_POLICY` in `packages/contracts`.
- Google Fonts are fetched at build time (needs network).
- A subagent once replaced `/dev/null` with a plain file in the cloud sandbox. It was not repaired. This only affects that sandbox; do not redirect to `/dev/null` there.
- Production setup: create the private R2 bucket (no custom domain), set `R2_PRIVATE_BUCKET`, set `TRUST_PROXY_HOPS=1`, `ADMIN_ORIGIN` exactly as the browser sees it, `PUBLIC_ASSET_BASE_URL`, `SESSION_SECRET`. Full list in `docs/deploy.md`.

## How to run

```bash
pnpm install
docker compose up -d                      # MongoDB replica set on 27017
cp apps/api/.env.example apps/api/.env    # and the web/admin .env.local files
SEED_OWNER_EMAIL=owner@giftpop.test SEED_OWNER_PASSWORD=dev-owner-password-1 pnpm seed
pnpm dev                                  # web 3000, admin 3001, api 4000
pnpm verify && pnpm build
pnpm e2e                                  # needs the stack up; see e2e/ and docs/audit/e2e.md
```

Without Docker, `node e2e/mongo-memory.cjs` starts an in-memory replica set on 27017. `E2E_ISOLATED=1 pnpm e2e` starts its own stack on ports 3100, 3101 and 4100 with a separate database and resets rate limits per run.

## Gotchas learned the hard way

All are in `CLAUDE.md` Lessons. The ones that bite most: keep the `@tailwindcss/turbopack` rule in each `next.config.ts`; declare every env var in `turbo.json`; `import mongoose from "mongoose"` (not named imports); Playwright `isMobile` hides overflow, measure in a plain context; the full API suite is load sensitive (a few timing and race tests fail rarely when the machine is busy, and pass alone; the race tests accept 409 or 422 for the loser).
