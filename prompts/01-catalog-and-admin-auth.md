# Phase 1: Admin login, countries and catalog

Start in Plan mode. Read `CLAUDE.md` and `docs/product.md` first. Follow the parallel work protocol in `CLAUDE.md` exactly.

**Run this phase with at least 5 `builder` subagents working in parallel in Step B.** Launch them all in one message so they run at the same time.

Requires: phase 0 merged.

## Goal

Staff can log in to the admin app, manage countries, packaging, items, per-country prices, stock and images. The store can read a country's catalog from one fast endpoint. Seed data makes local dev realistic.

## Step A: lead, serial

Work on branch `phase-1-catalog`.

1. Re-read the catalog, country, asset and admin contracts. Add anything this phase needs (for example `CatalogForCountry` response, image upload response, list query schemas). Contracts change only here.
2. Install: api `argon2`, `multer`, `sharp`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`; admin `react-hook-form`, `@hookform/resolvers`, `@tanstack/react-table`; root `tsx` if missing.
3. Create module folders with empty routers and register them in `apps/api/src/modules/index.ts`: `auth`, `staff`, `countries`, `catalog`, `assets`. Create `apps/api/src/middleware/require-staff.ts` as a stub that exports `requireStaff(role?)` (agent 1 implements it; others import it now). Also create stub service files with their final exported signatures, throwing "not implemented", so the seed script can compile against them: `modules/auth/service.ts` (`createOwner`), `modules/countries/service.ts` (`upsertCountry`), `modules/catalog/service.ts` (`upsertPackaging`, `upsertItem`, `upsertPrices`).
4. Add env keys to the api env schema: `SESSION_SECRET`, `ADMIN_ORIGIN`, `WEB_ORIGIN`, `STORAGE_DRIVER` (`local` | `r2`), `R2_*`, `PUBLIC_ASSET_BASE_URL`. Update `.env.example`.
5. `pnpm verify`, commit `chore: phase 1 scaffolding`.

## Step B: fan out (at least 5 agents, in parallel)

Launch these `builder` agents in one message. Give each the text of its row plus: "Read CLAUDE.md, docs/product.md and the contracts first; edit only the paths you own."

| Agent | You own | Build | Done when |
|---|---|---|---|
| 1 `api-auth` | `apps/api/src/modules/auth/**`, `apps/api/src/modules/staff/**`, `apps/api/src/middleware/require-staff.ts` | Staff model (email unique, argon2 hash, role, active). Sessions in Mongo (random 32-byte token, stored hashed, 7-day expiry, TTL index). `POST /auth/login` (rate-limited 5/min per IP+email, same error for wrong email or password), `POST /auth/logout`, `GET /auth/me`. Cookie `gp_admin`: httpOnly, Secure in production, SameSite=Lax, path `/`. `requireStaff(role?)` loads the session and rejects with 401/403. Staff CRUD for owners only. A `createOwner` function the seed script can call. | Tests: login ok, wrong password, rate limit, expired session, staff vs owner access, logout invalidates the session. |
| 2 `api-catalog` | `apps/api/src/modules/countries/**`, `apps/api/src/modules/catalog/**` | Models with indexes: countries, packaging, items, countryPrices (unique on country + item or packaging). Admin CRUD (all behind `requireStaff`; countries need `owner`). Bulk upsert of prices for one item across countries. Public `GET /catalog?country=xx`: country, active packaging and items that have a price in that country, prices, stock, categories; `Cache-Control: public, max-age=60, stale-while-revalidate=300`. `GET /countries` public list with status. | Tests: unknown country 404, coming-soon country returns status without catalog, item without a price is excluded, admin routes reject anonymous users. |
| 3 `api-assets` | `apps/api/src/modules/assets/**`, `apps/api/src/lib/storage/**` | `Storage` interface with `local` (writes to `uploads/`, served at `/v1/assets/files/*` in dev only) and `r2` (S3 client) drivers. `POST /assets` (staff only, multipart, max 8 MB, png/webp/jpeg only, checks magic bytes): sharp converts to WebP, caps longest side at 1600px, keeps alpha, records width and height, default anchor `{x: 0.5, y: 1}`. `PATCH /assets/:id` to change the anchor. | Tests: rejects wrong type, oversize and anonymous; a transparent PNG comes back as WebP with alpha and correct dimensions. |
| 4 `admin-auth-ui` | `apps/admin/src/app/(auth)/**`, `apps/admin/src/middleware.ts`, `apps/admin/src/lib/session.ts`, `apps/admin/src/app/(dashboard)/staff/**` | Login wired to the API with clear error messages. Next middleware redirects to `/login` when `gp_admin` is missing; `lib/session.ts` fetches `/auth/me` on the server and redirects on 401. Logout in the user menu. Staff page (owner only): list, invite with temporary password, deactivate. | Logging in lands on the dashboard; refresh keeps you in; logout returns to login; a staff user cannot open the staff page. |
| 5 `admin-catalog-ui` | `apps/admin/src/app/(dashboard)/catalog/**`, `apps/admin/src/app/(dashboard)/countries/**`, `apps/admin/src/features/catalog/**` | Countries page: table, edit dialog (status, payment modes, shipping flat and free-over, delivery days, address format, payment instructions). Items: table with search and category filter; edit page with details, image uploader showing the result inside `<GiftScene/>` with a draggable anchor marker, and a per-country price and stock grid saved in one bulk call. Packaging: same pattern plus layoutType select (from the renderer registry), min/max items, capacity, colour options, back and front layer images. | Every form validates with the contract schema; saving shows a toast; a new item with a price in PK appears in `/catalog?country=pk`. |
| 6 `seed-data` | `scripts/seed/**` | Idempotent seed (safe to run twice): the 9 countries with currencies and address formats from `docs/product.md`, clearly fake dev shipping rates marked `DEV ONLY`; an owner account from `SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD`; 2 packaging (a `bouquet-fan` bouquet, 6 to 10 items; a `box-grid` box, 4 to 9 items); about 15 items across chocolates, flowers, care, accessories, cards with shapes and colours but no images; prices for every live country. | Data lives in `scripts/seed/data/*.ts`, typed with the contracts; `scripts/seed/index.ts` calls only the stub service functions from Step A. In your worktree those throw, so check that it typechecks and report it as "runs after merge". After merge, `pnpm seed` twice gives the same data. |

## Step C: lead

1. Merge in this order: 1, 2, 3, 6, 4, 5. `pnpm verify` after each merge.
2. Apply every "Needs from lead" item.
3. Run `docker compose up -d`, `pnpm seed`, `pnpm dev`. Log in as the seeded owner, create an item with an uploaded image and a PK price, and confirm it appears in `/catalog?country=pk` and renders in `<GiftScene/>`.
4. Run `verifier` with this definition of done, fix "Must fix", run `code-simplifier`.
5. Record assumptions in `docs/decisions.md`, lessons in `CLAUDE.md`. `/commit-push-pr`.

## Definition of done

- Every admin API route rejects anonymous requests and wrong roles, with tests.
- Staff can manage countries, packaging, items, prices, stock and images end to end.
- Adding a new country and pricing items for it needs no code change.
- `/catalog?country=xx` returns only what can be sold there, with cache headers.
- Seed is idempotent.

## Out of scope

Store builder screens, orders, partner forms.
