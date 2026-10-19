# Phase 0: Foundation

Start in Plan mode. Read `CLAUDE.md` and `docs/product.md` first. Follow the parallel work protocol in `CLAUDE.md` exactly.

**Run this phase with at least 5 `builder` subagents working in parallel in Step B.** Launch them all in one message so they run at the same time.

## Goal

An empty repo becomes a working monorepo: three apps that boot, two shared packages, all domain contracts written, tests and CI running. No features yet.

## Step A: lead, serial

Work on branch `phase-0-foundation`.

1. `git init` if needed, create `main` with the kit files committed, then branch.
2. Create the pnpm workspace (`pnpm-workspace.yaml` with `apps/*`, `packages/*`) and Turborepo (`turbo.json` with `lint`, `typecheck`, `test`, `build`, `dev`, `verify` tasks).
3. Root `package.json` scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `verify` (runs lint, typecheck, test through turbo), `seed` (`tsx scripts/seed/index.ts`, used from phase 1).
4. `packages/config`: `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`), ESLint flat config (typescript-eslint, react, react-hooks, import order), Prettier config. Every package extends these.
5. Generate the apps with their official tools, then strip demo content:
   - `apps/web`: create-next-app (TypeScript, App Router, Tailwind, `src/`), port 3000.
   - `apps/admin`: create-next-app (same options), port 3001, then initialise shadcn/ui.
   - `apps/api`: plain TypeScript package with `tsx` for dev, `tsup` for build, port 4000.
6. Create `packages/contracts` and `packages/renderer` package shells (package.json, tsconfig, vitest config, `src/index.ts`).
7. Install every dependency this phase needs, so no agent touches a lockfile:
   - api: express, mongoose, zod, pino, pino-http, helmet, cors, cookie-parser, express-rate-limit; dev: vitest, supertest, mongodb-memory-server, tsx, tsup, @types/*.
   - web and admin: zod, the workspace packages; admin also its shadcn components (button, input, table, dialog, dropdown-menu, badge, card, sidebar, sonner).
   - renderer: react (peer), motion; dev: vitest, @testing-library/react, jsdom.
   - contracts: zod; dev: vitest.
8. Write **all domain contracts** in `packages/contracts/src/`, one file each, every schema exported with its inferred type. Follow `docs/product.md` exactly:
   - `money.ts`: `Money { amountMinor: int, currency: ISO-4217 }`, helpers to add money and take a percentage, using integer maths and round-half-up.
   - `country.ts`: country document, `CountryCode` enum of the 9 launch codes plus a general ISO code schema for coming-soon countries, `addressFormat`, `shipping`, `paymentModes`, `status`.
   - `catalog.ts`: `Packaging` (layoutType, minItems, maxItems, capacityUnits, colour options, layers), `Item` (category, shape, color, sizeUnits, personalizable + maxLength, image asset ref), `CountryPrice` (itemId or packagingId, country, priceMinor, inStock), `Asset` (url, width, height, anchor {x,y} as 0–1).
   - `design.ts`: `Design` (packagingId, items with qty and slot order, wrapperColor, ribbonColor, arrangementSeed, personalisation: card message, recipient name, per-item names). Limits as named constants.
   - `design-rules.ts`: pure `validateDesign(design, catalogForCountry)` returning a list of typed problems (`TOO_FEW_ITEMS`, `TOO_MANY_ITEMS`, `OVER_CAPACITY`, `ITEM_UNAVAILABLE`, `OUT_OF_STOCK`, `TEXT_TOO_LONG`, `PACKAGING_UNAVAILABLE`). Used by both API and web.
   - `pricing.ts`: `PAYMENT_POLICY` (prepaid 20% off goods, cod 20% advance, both marked ASSUMPTION in a comment), pure `computeQuote({ packagingPrice, itemLines, personalisationFee, shipping, mode, policy })` returning goods, discount, shipping, total, dueNow, dueOnDelivery.
   - `order-status.ts`: status enum, transition map from `docs/product.md`, `canTransition(from, to)`, `assertTransition`, required fields per target (`shipped` needs courier and tracking number, `cancelled` needs a reason).
   - `order.ts`: order document (number, country, contact, address, design, item snapshots, quote, paymentMode, paymentStatus, status, history, shipment, payments), create-order request, public tracking view.
   - `payment.ts`: payment status enum, payment record, `PaymentProvider` interface (`prepare`, `instructions`) with modes `manual_transfer`, `cod`, `card`.
   - `partner.ts`, `template.ts`, `admin.ts` (staff user, role, session, login request).
   - `api.ts`: error shape `{ error: { code, message, details? } }`, pagination request and response, `Idempotency-Key` header name.
   - `index.ts` re-exports everything.
9. In `apps/api/src/modules/index.ts`, create an empty module registry (an array of `{ path, router }`) that `app.ts` will mount. In `apps/admin/src/config/nav.ts`, create the nav list: Dashboard, Orders, Catalog, Countries, Partners, Templates, Staff.
10. Run `pnpm verify` (it may have few tests yet, but lint and typecheck must pass). Commit: `chore: monorepo foundation and contracts`.

## Step B: fan out (at least 5 agents, in parallel)

Launch these `builder` agents in one message. Give each the text of its row plus this sentence: "Read CLAUDE.md, docs/product.md and the contracts first; edit only the paths you own."

| Agent | You own | Build | Done when |
|---|---|---|---|
| 1 `api-foundation` | `apps/api/**` except `src/modules/index.ts` | `env.ts` (zod-validated env), `logger.ts` (pino), `db.ts` (mongoose connect, retry, close), `app.ts` (`createApp()` with helmet, json limit 100kb, cookie-parser, pino-http with request id, mounts the module registry under `/v1`, 404 and error middleware), `server.ts` (listen, graceful shutdown on SIGTERM), `lib/errors.ts` (`AppError`), `lib/validate.ts` (zod body/query/params middleware), `GET /health` and `GET /ready` (checks Mongo). `test/setup.ts` starts mongodb-memory-server as a replica set. `apps/api/.env.example`. | Tests cover health, ready, 404 shape, validation error shape, error middleware hiding stacks. |
| 2 `web-shell` | `apps/web/**` | Visual direction inspired by digibouquet: soft, playful, illustrated, mobile-first, the Giftpop pink as accent. Design tokens in `src/styles/tokens.css` (light and dark). Fonts via `next/font`. Root layout with header (logo text, country placeholder) and footer. `next.config` rewrites `/api/:path*` to `${API_URL}/v1/:path*`. `src/lib/api.ts`: typed client that takes a zod schema and parses responses. Placeholder pages: `/`, `/[country]/build`, `/g/[shareId]`, `/track`, `/partners`. `apps/web/.env.example`. | Builds, every placeholder route renders, `lib/api.ts` has unit tests with a mocked fetch. |
| 3 `admin-shell` | `apps/admin/**` except `src/config/nav.ts` | Functional shadcn look, neutral palette. `(auth)/login` page (form only, no backend yet). `(dashboard)` layout with sidebar driven by `config/nav.ts`, page header, empty placeholder page per nav item. Same `/api` rewrite and typed `lib/api.ts` as web, with `credentials: "include"`. `apps/admin/.env.example`. | Builds, sidebar links all resolve, login form validates with the contract schema. |
| 4 `renderer` | `packages/renderer/**` | `layouts/types.ts` (`Placement { itemIndex, x, y, rotation, scale, z }` in a 0–1000 scene space), `layouts/bouquet-fan.ts` (items fan out from a gather point, wrapper front layer covers stems), `layouts/box-grid.ts` (top-down grid sized from capacity), `layouts/index.ts` registry keyed by `layoutType`. Same `design` + `arrangementSeed` always gives the same placements (seeded PRNG, no `Math.random`). `GiftScene.tsx`: renders packaging back layer, items, front layer as absolutely positioned images scaled to its container; uses placeholder silhouettes (`placeholders/`) when an asset is missing; `aria-label` lists the items. | Unit tests: determinism, item count 1 to maxItems, no NaN, every placement inside the scene, seed changes the arrangement. A small story page or test renders `GiftScene` with placeholders. |
| 5 `contracts-tests` | `packages/contracts/test/**` | Tests only, written against `docs/product.md`, not against the code: pricing for both modes (discount only on goods, advance is 20% of total, integer rounding, zero items edge, shipping free-over threshold), every allowed and every forbidden status transition, required fields for `shipped` and `cancelled`, every `validateDesign` problem code, schema rejects floats for money. | Tests run. Any test that fails because the code disagrees with `docs/product.md` is listed under "Needs from lead" with the rule it breaks. |
| 6 `infra` | `docker-compose.yml`, `.github/**`, `README.md`, root `.env.example` | MongoDB in Docker as a single-node replica set with a healthcheck. GitHub Actions: pnpm install with cache, `pnpm verify`, `pnpm build` on every PR. README: prerequisites (Node LTS, pnpm, Docker, `jq` for the format hook), first-time setup, how to run each app, how to run the phase prompts. | `docker compose up -d` gives a Mongo that `apps/api` connects to with the documented URL. CI file passes `actionlint` if available. |

## Step C: lead

1. Merge branches in this order: 5, 4, 1, 2, 3, 6. Run `pnpm verify` after each merge and fix breakages before the next.
2. Apply every "Needs from lead" item. If `contracts-tests` found the code disagreeing with `docs/product.md`, fix the code, not the test.
3. Start `docker compose up -d` and `pnpm dev`. Confirm web on 3000, admin on 3001, `GET localhost:4000/health` returns ok and `/ready` reports Mongo connected.
4. Run the `verifier` agent with this phase's definition of done. Fix everything under "Must fix".
5. Run the `code-simplifier` agent.
6. Add agent assumptions to `docs/decisions.md`. Add any mistake you corrected to the Lessons section of `CLAUDE.md`.
7. Run `/commit-push-pr`.

## Definition of done

- `pnpm verify` and `pnpm build` pass from a clean clone.
- All three apps boot; health and ready endpoints work against Docker Mongo.
- Every contract in Step A.8 exists, is exported from `@giftpop/contracts`, and has tests for its logic.
- Layout engines are deterministic and tested.
- CI runs verify and build on PRs.

## Out of scope

Auth, catalog, builder screens, orders, deployment.
