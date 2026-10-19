# Handoff: where the build stands

Written at the end of the first long session. Read `CLAUDE.md`, `docs/product.md` and `docs/decisions.md` first. Audit reports are in `docs/audit/`.

## State

All six phases are built and merged on one branch. `pnpm verify` (lint, typecheck, tests for the whole repo) and `pnpm build` pass, and `pnpm format:check` passes.

| Phase | What | Status |
|---|---|---|
| 0 | Monorepo, contracts, config, CI | Done |
| 1 | Admin login, countries, catalog, assets, seed | Done |
| 2 | Gift builder and renderer | Done |
| 3 | Checkout, orders, payments, tracking, notifications outbox | Done |
| 4 | Admin orders, shipment statuses, dashboard, packing sheet | Done |
| 5 | Home, countries, partners, templates | Done |
| 6 | Hardening and deploy readiness | Mostly done, see below |

Phase 6 done: Playwright flows (`e2e/`, 4 flows, passed 3 runs in a row in isolated mode), security route-walk test and hardening, observability (request ids, masked logs, optional Sentry, `GET /v1/admin/metrics`), performance report and indexes, deploy files (`apps/api/Dockerfile`, `docs/deploy.md`, disabled deploy workflows), private payment proofs, accessibility audit.

## Not finished (do these next)

1. **Accessibility fixes.** The audit is `docs/audit/accessibility.md`. Two builders were applying the fixes when the session ended. Check `git log` for `fix(web): accessibility` and `fix(admin): accessibility` commits and the `## Fix status` sections at the end of that file. If they are missing, apply the patches in the report. Highest priority: **A2**, admin dialogs do not trap Tab when opened with the keyboard (`apps/admin/src/components/ui/dialog.tsx` and `sheet.tsx`). Then the medium items (primary pink contrast W1, admin focus rings A1, skip link A3, destructive button contrast A5, focus after step change W3, nested `<main>` W4).
2. **Run the `verifier` agent across the whole repo** against every phase's definition of done, fix "Must fix", then run the `code-simplifier` agent (never run across the whole repo yet).
3. **Record in `docs/decisions.md`** the Phase 6 decisions and low findings: proof `url` now holds the staff file path and the real key is in the Mongoose-only `storageKey`; R2 proofs use `R2_PRIVATE_BUCKET` (falls back to the public bucket when unset); `ReadableStorage` is separate from `Storage` (merge later); login limiter per IP (30 a minute) added; the global guard rejects any `$` or dotted key in bodies and queries; staff writes need an `Origin` equal to `ADMIN_ORIGIN`; deploy assumptions listed in `docs/audit/deploy.md`; the low findings in `docs/audit/security.md` (S11 to S21) and `docs/audit/e2e.md`.
4. **Performance follow-ups** (not done, in `docs/audit/performance.md`): swap `<img>` for `next/image` in `apps/web/src/features/builder/steps/items/item-art.tsx`; `LazyMotion` in the renderer (about 30 kB); zod is 37 kB on every route through the contracts barrel; admin order search still scans (needs lowercase email plus a `phoneDigits` field and backfill); the admin order list now has the compound indexes.
5. **Deploy blockers and decisions** (`docs/audit/deploy.md`): `scripts/seed` has no owner-only mode, so creating the first production owner also writes the demo catalog; web and admin `API_URL` silently default to localhost in production; `NOTIFICATIONS_WORKER` defaults to off; `/ready` does not ping Mongo; all rate limiters and the login limiter are in memory, so run one API instance.
6. Update `CLAUDE.md` Lessons for Phase 6 (a few ideas: load-sensitive tests need generous timeouts; a limiter default store shared between apps logs `ERR_ERL_STORE_REUSE` in tests; audit fixes in generated shadcn files are lost if regenerated).

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
