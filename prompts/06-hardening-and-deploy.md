# Phase 6: Hardening and deploy readiness

Start in Plan mode. Read `CLAUDE.md` first. Follow the parallel work protocol in `CLAUDE.md`, with one change: in this phase most agents **review and report first**, and only fix inside the paths they own.

**Run this phase with at least 5 `builder` subagents working in parallel in Step B.** Launch them all in one message so they run at the same time.

Requires: phases 0 to 5 merged.

## Goal

The whole system is tested end to end, secure, fast, accessible, observable and ready to deploy. Nothing is deployed in this phase.

## Step A: lead, serial

Work on branch `phase-6-hardening`.

1. Install: root `@playwright/test`; api `@sentry/node` (optional, behind an env flag); web and admin `@sentry/nextjs` (same flag).
2. Create `e2e/` with a Playwright config that starts Docker Mongo, seeds, and runs all three apps.
3. Create `docs/audit/` (empty) for agent reports.
4. `pnpm verify`, commit.

## Step B: fan out (at least 5 agents, in parallel)

Launch these `builder` agents in one message. Give each the text of its row plus: "Read CLAUDE.md first; edit only the paths you own; write your findings to your audit file even if you fixed them."

| Agent | You own | Do | Done when |
|---|---|---|---|
| 1 `e2e` | `e2e/**` | Playwright tests on a phone viewport: (a) PK cash-on-delivery order from home to confirmation, (b) US pay-now order from a featured template, (c) staff log in, record the PK advance, move it to delivered with courier details, and the customer track page shows each step, (d) a brand partner request reaches the admin inbox. Stable selectors (roles and labels, not CSS classes). | All four pass three runs in a row. |
| 2 `security` | `apps/api/src/middleware/**`, `apps/api/src/lib/errors.ts`, `apps/api/src/lib/validate.ts`, `apps/api/src/lib/storage/**`, `apps/api/test/security/**`, `docs/audit/security.md` | Check every `/admin` route for `requireStaff` (write a test that walks the registry and fails on any unprotected admin route), CORS allowlist, cookie flags, helmet headers, rate limits on every public POST, request size limits, NoSQL injection (reject `$` keys in bodies), upload checks, error responses never leaking internals, `pnpm audit` findings. Fix inside your paths; report the rest with file and line. | The route-walk test exists and passes; the report lists every finding with severity. |
| 3 `performance` | `docs/audit/performance.md`, `apps/web/next.config.*`, `apps/admin/next.config.*` | Run `next build` for both apps and record route sizes; set image optimisation for the asset host; confirm catalog and templates responses carry cache headers; run `explain()` on the ten most used Mongo queries and list any collection scan; measure the builder's interaction with 10 items on a throttled phone profile. Fix config in your paths; report code changes needed with file and line. | Report has numbers for each check, before and after where you changed something. |
| 4 `accessibility` | `docs/audit/accessibility.md` | Keyboard-only run through the builder, checkout, track, and every admin order action; screen reader labels on the gift scene and item picker; colour contrast in light and dark; reduced motion. Report each issue with the component path and a concrete fix. | Every screen in the main flows has been checked and listed. |
| 5 `deploy` | `apps/api/Dockerfile`, `.dockerignore`, `docs/deploy.md`, `.github/workflows/deploy-*.yml` | Multi-stage Dockerfile for the api (non-root user, healthcheck on `/ready`). `docs/deploy.md`: recommended setup (web and admin on Vercel as two projects, api as a container on a host such as Railway, Render or Fly, MongoDB Atlas with backups, Cloudflare R2 for assets), every env var per app, domain layout (`giftpop.<tld>`, `admin.`, `api.`), cookie domain notes, first-deploy checklist, rollback steps. Workflow files that are disabled until secrets exist. | `docker build` succeeds and the container passes its healthcheck against Docker Mongo. |
| 6 `observability` | `apps/api/src/lib/observability/**`, `docs/audit/observability.md` | Structured logs with request id on every line and no personal data (mask phone and email), optional Sentry init behind `SENTRY_DSN`, a `/metrics`-style JSON of order counts by status for uptime checks (staff only), and a runbook section: what to look at when orders stop arriving. | Logs contain no raw phone numbers or emails in a test run; Sentry is off without a DSN. |

## Step C: lead

1. Merge in this order: 2, 6, 3, 5, 1, 4. `pnpm verify` and `pnpm exec playwright test` after the e2e merge.
2. Fix every **high** and **medium** finding in the audit reports. List low findings in `docs/decisions.md` as accepted or scheduled.
3. Run `verifier` across the whole repo against every phase's definition of done, fix "Must fix", run `code-simplifier`.
4. Update `CLAUDE.md` lessons. `/commit-push-pr`.

## Definition of done

- Four Playwright flows pass reliably.
- No unprotected admin route exists, and a test enforces it.
- Audit reports exist with numbers, and every high and medium item is fixed.
- The api builds as a container; deploy docs cover every env var and step.

## Out of scope

Actually deploying, buying domains, choosing the payment gateway or email provider.
