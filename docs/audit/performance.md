# Performance audit (phase 6, row 3)

Date: 2026-10-19. Everything below was measured against an isolated stack: own API on 4200, `next start` (production builds) for web on 3200 and admin on 3201, database `giftpop_perf` on the in-memory replica set. Other agents were using the same machine, so timings carry noise; every throttled figure is three runs, shown individually or as a median. Scripts live in the session scratchpad, outside the repo.

## Summary

| # | Finding | Severity | Where | Status |
|---|---|---|---|---|
| 1 | Customer first-load JS is 227 to 241 kB gzip on the home page, every builder step and checkout (budget 200 kB). Only `/countries` and `/partners*` are under it. | Medium | `packages/renderer/src/scene/AnimatedItem.tsx:3` (motion, 53 kB), `packages/contracts` (zod, 37 kB in every route) | Report, patch below |
| 2 | Item cards and the scene download the full uploaded image (900 to 1600 px) to draw a 112 px card. Items step loads 254.6 kB of images; optimised it would be 83.4 kB. | Medium | `apps/web/src/features/builder/steps/items/item-art.tsx:108-118`, `packages/renderer/src/scene/art.tsx:49-80` | Config done; component patch below |
| 3 | The admin order list (the screen staff open all day) scans all orders and sorts in memory: 20,150 docs examined for 26 returned, 67 ms at 20k orders. Every list filter has the same problem. | High (grows linearly with orders) | `apps/api/src/modules/orders/model.ts:142-151`, `apps/api/src/modules/admin-orders/list.ts:112-120` | Report, index patch below |
| 4 | Order search runs a case-insensitive email regex and an unanchored phone regex: full index scans (20,150 and 40,300 keys). Adding the sort indexes above without fixing search makes search worse (see 4.3). | Medium | `apps/api/src/modules/admin-orders/list.ts:53-62` | Report, patch below |
| 5 | Layout shift: 0.124 on the format step (the "Shipping to X?" banner mounts after hydration and pushes the page), plus 0.144 and 0.177 on the items step on a slow network (footer moves while the step loads). Total 0.445 on Fast 3G. | Medium | `apps/web/src/features/country/country-suggestion.tsx:34-37` | Report |
| 6 | One unreadable stored template turns `GET /templates` into a 500 for the whole country, so the home page hides all templates. | Low | `apps/api/src/modules/templates/service.ts:145` | Report |
| 7 | On Fast 3G with 4x CPU a tap takes 65 ms (median) to reach the scene and 150 ms to paint, with 14 to 27 long tasks (50 to 200 ms each) in a 10-tap phase. The first tap of a session can cost 0.4 to 1.6 s. | Low to medium | builder | Measured, no config fix |

Config changes made (paths I own): `apps/web/next.config.ts` and `apps/admin/next.config.ts` now set `images` (remote host from env, WebP only, one-year cache) and `poweredByHeader: false`. The Tailwind `turbopack.rules` entry is untouched; both builds were re-run and the CSS is byte for byte the same size as before (web 40,004 B, admin 88,534 B, both contain `.flex{display:flex}`).

## 1. Build output and first-load JS

`next build` (Next 16.4.2, Turbopack) needs no running API for either app: every route is dynamic (`ƒ`), so nothing fetches at build time. Only `admin /_not-found` is static. Next 16 no longer prints per-route sizes, so the figures below come from Chromium: cold load (cache disabled, 390 px wide), summing every script response by its gzip transfer size (`Network.loadingFinished.encodedDataLength`). "First-load JS" includes layout chunks. Routes marked `:id` were opened with real records.

### Web (customer app)

| Route | First-load JS gzip KB | Raw KB | Files | CSS KB | Images KB | Over 200 kB |
|---|---|---|---|---|---|---|
| `/` | 227.4 | 739.6 | 8 | 8.5 | 0 | yes |
| `/PK` | 228.5 | 740.3 | 9 | 8.5 | 219.3 (template scene) | yes |
| `/countries` | 175.5 | 584.7 | 7 | 8.5 | 0 | no |
| `/PK/build/format` | 238.1 | 763.6 | 11 | 8.5 | 192.5 | yes |
| `/PK/build/items` | 239.9 | 770.5 | 11 | 8.5 | 254.6 | yes |
| `/PK/build/arrange` | 238.8 | 766.3 | 11 | 8.5 | 219.3 | yes |
| `/PK/build/personalise` | 238.0 | 763.6 | 11 | 8.5 | 219.3 | yes |
| `/PK/build/review` | 240.1 | 770.6 | 11 | 8.5 | 219.3 | yes |
| `/PK/checkout` | 241.2 | 772.4 | 11 | 8.5 | 219.3 | yes |
| `/g/[shareId]` | 229.7 | 741.9 | 10 | 8.5 | 219.3 | yes |
| `/order/[orderNumber]` | 235.4 | 762.4 | 9 | 8.5 | 0 | yes |
| `/track` | 233.5 | 756.2 | 9 | 8.5 | 0 | yes |
| `/partners` | 175.5 | 584.7 | 7 | 8.5 | 0 | no |
| `/partners/brands`, `/partners/countries` | 180.8 | 597.8 | 8 | 8.5 | 0 | no |

Document size is 4.7 to 10.4 kB per route (HTML, all dynamic, `Cache-Control: private, no-store`, which matches decisions.md: the header reads cookies).

What is in the weight (gzip, found by searching each chunk for library signatures):

| Chunk | gzip KB | Raw KB | Contents | On which routes |
|---|---|---|---|---|
| `1x1cdcr99dmzi.js` | 72.4 | 229.8 | react-dom | all |
| `105cn0boi-v01.js` | 45.6 | 163.0 | Next client runtime | all |
| `273q4dago8yig.js` | 37.4 | 129.9 | zod (contracts schemas used by client code) | all |
| `128x9avcsc19l.js` | 53.1 | 158.6 | motion (`motion/react`) | every route that draws a gift scene (all above except `/countries`, `/partners*`) |

So the floor is 175 kB (React, Next, zod) and the scene adds 53 kB of motion plus about 10 to 25 kB of app code. The customer app is over budget on every route that matters.

Patches (not applied, outside my paths):

1. Motion: use `LazyMotion` with `domAnimation` and the `m` component instead of `motion`. In `packages/renderer/src/scene/AnimatedItem.tsx:3` replace `import { animate, motion, ... } from "motion/react"` by `m` (and `LazyMotion`, `domAnimation` in `AnimatedGiftScene.tsx:4`), wrap the scene root in `<LazyMotion features={domAnimation} strict>`, and change `<motion.g ...>` to `<m.g ...>`. Motion's own docs put `m` plus `domAnimation` at roughly a third of the full `motion` component; I did not build this, so treat 30 kB as an estimate. Also load `AnimatedGiftScene` with `next/dynamic` and keep the static `GiftScene` as the first paint, so motion leaves the critical path entirely.
2. zod: 37 kB reaches every route because client code imports schemas from the `@giftpop/contracts` barrel, which instantiates every schema at load. Either import from contract sub-modules so unused schemas drop out (needs `exports` entries per file in `packages/contracts/package.json`), or move client-side parsing to `zod/mini`. This is a lead decision because it touches contracts. Not measured.
3. Config-level experiments: I checked `experimental.optimizePackageImports`. It cannot help here: admin already imports `@base-ui/react/<part>` sub-paths, `lucide-react` is optimised by Next by default, and motion's weight comes from its feature bundle, not from barrel imports. Not applied.

### Admin

First-load JS gzip KB (login is the floor: react-dom 72.4, Next 44.7, zod 37.1, plus 51 kB of app and form code).

| Route | gzip KB | Raw KB | Files |
|---|---|---|---|
| `/login` | 205.1 | 664.3 | 10 |
| `/` (dashboard) | 274.0 | 854.6 | 16 |
| `/orders` | 291.7 | 905.6 | 17 |
| `/orders/[id]` | 361.9 | 1115.0 | 19 |
| `/orders/[id]/packing` | 326.1 | 1009.7 | 17 |
| `/catalog` | 288.7 | 893.6 | 18 |
| `/catalog/items/[id]`, `/catalog/items/new` | 365.8 | 1119.1 | 21 |
| `/catalog/packaging` | 275.3 | 856.3 | 17 |
| `/catalog/packaging/[id]`, `/catalog/packaging/new` | 365.8 / 365.8 | 1122.6 | 20 |
| `/countries` | 311.0 | 959.0 | 19 |
| `/partners` | 306.7 | 949.7 | 18 |
| `/templates` | 351.3 | 1085.4 | 18 |
| `/staff` | 292.6 | 909.3 | 17 |

No 200 kB budget is set for admin (staff use it on a desk with a warm cache), so nothing is flagged. The same motion chunk (53 kB) sits on routes that draw scenes (orders detail, catalog forms, templates), and the base-ui chunk (36.6 kB) on routes with dialogs and selects. Order detail and the catalog forms are the heaviest at 362 to 366 kB; the same `LazyMotion` patch applies. Admin's `/orders/:id` and `/orders/:id/packing` previously returned 500 against my synthetic orders (stored shape not valid), and returned 200 with a real order: that was my test data, not a bug.

Before and after for config: identical (same JS bytes in both apps); the config change only affects images and headers.

## 2. Image optimisation

How images are shown today:

- Uploads are normalised to WebP by the API (longest side 1600 px) and stored under random keys. The asset `url` is `PUBLIC_ASSET_BASE_URL` plus the key (R2 public host in production, `http://localhost:4200/v1/assets/files` locally). The API serves local files with `Cache-Control: public, max-age=31536000, immutable`, which is also right for R2.
- `ItemArt` (item cards) uses a plain `<img loading="lazy">` with the original URL at up to 112 px wide. The scene (`SceneImage`, `<image href>` inside SVG) uses the original URL for item images and for the wrapper and ribbon layers. Neither uses `next/image`.

Decision: optimisation is worth turning on, so `unoptimized` is not the right setting. The source files are already WebP, so format conversion adds nothing, but resizing is the win: a 112 px card does not need a 900 to 1600 px file.

Config I set in `apps/web/next.config.ts` and `apps/admin/next.config.ts`:

- `images.remotePatterns` is built from `PUBLIC_ASSET_BASE_URL` (the variable the API already uses; one URL or a comma separated list), parsed with zod. Unset means no remote host is allowed; a malformed value stops the build (tested: `PUBLIC_ASSET_BASE_URL=notaurl next build` fails with a readable message).
- `images.formats: ["image/webp"]`: the input is WebP, so AVIF would only add encode time on a cache miss.
- `images.minimumCacheTTL`: one year, because keys are random and never rewritten.
- `images.dangerouslyAllowLocalIP` is true only when an asset host is `localhost`, `127.0.0.1` or `[::1]` (the local dev stack). Next 16 refuses to fetch from a private address otherwise, and a production asset host is public.

Measured with the optimiser running (`/_next/image`, sent with an `Accept` header that lists WebP, as browsers do; one 900 px, 21,670 B item image). Without that header Next answers JPEG, so measure with it:

| Request | Bytes | Type |
|---|---|---|
| raw asset | 21,670 | webp |
| `w=128` | 2,378 | webp |
| `w=256` | 4,346 | webp |

Images per builder page at 390 px, device scale 2, with every asset request rewritten to `/_next/image` (items `w=256`, layers `w=750`) versus raw:

| Page | Raw KB | Through the optimiser KB | Saved |
|---|---|---|---|
| `/PK/build/format` | 192.5 | 77.5 | 60% |
| `/PK/build/items` | 254.6 | 83.4 | 67% |
| `/PK/build/arrange` | 219.3 | 73.3 | 67% |
| `/PK/build/review` | 219.3 | 73.3 | 67% |

These images are synthetic (900 px, 14 to 22 kB each); real 1600 px product photos will save more. The numbers exclude the first request per size, which pays the resize once on the server and is then cached.

Important: the config alone changes nothing until a component asks for the resized URL. Patches (not applied, outside my paths):

1. `apps/web/src/features/builder/steps/items/item-art.tsx:108-118`: replace the `<img>` with `next/image`:
   ```tsx
   import Image from "next/image";
   <Image src={item.image.url} alt="" width={item.image.width} height={item.image.height}
          sizes="112px" className="size-full object-contain" />
   ```
   (drop the `eslint-disable` comment; `loading="lazy"` is the default).
2. Scene images: `SceneImage` is an SVG `<image>`, which `next/image` cannot render and the renderer package has no Next dependency. Give `GiftScene`/`AnimatedGiftScene` an optional `imageUrl?: (url: string, width: number) => string` prop, call it in `SceneImage` (`href={imageUrl ? imageUrl(url, 750) : url}`), and have the web app pass `(url, w) => \`/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75\``. Allowed widths must be in Next's `deviceSizes` or `imageSizes` (256 and 750 are).
3. Deploy: `PUBLIC_ASSET_BASE_URL` must be set for the web and admin projects at build time and, when self-hosting with `next start`, at run time too (I hit "url parameter is not allowed" until the start command had it). The lead must add it to `turbo.json` (`build.env` and `dev.env`, per the Turbo lesson in CLAUDE.md) and to `docs/deploy.md`.

## 3. Cache headers and web fetch settings

Checked with curl against my API:

| Route | Status | Cache-Control | ETag and 304 |
|---|---|---|---|
| `GET /v1/countries` | 200 | `public, max-age=60, stale-while-revalidate=300` | yes, conditional GET returns 304 |
| `GET /v1/catalog?country=PK` | 200 | same | yes, 304 confirmed |
| `GET /v1/templates?country=PK` | 200 | same | yes |
| `GET /v1/designs/:shareId` | 200 | same | yes |
| asset file | 200 | `public, max-age=31536000, immutable` | weak ETag |
| `POST /v1/quotes` (400) and `GET /v1/catalog?country=XX` (404) | error | none (correct, errors are not cached) | n/a |

The API does not compress responses (a 15-item catalog is 7.2 kB); Next compresses its own HTML and JS (`content-encoding: gzip`). Not worth fixing at this size; add `compression` before catalogs reach a few hundred items, or let the CDN do it.

Web fetch settings against decisions.md ("`/countries` and `/templates` cached 5 minutes in the web app; `/<cc>`, the builder and checkout uncached"):

- `apps/web/src/features/home/fetch-home-data.ts:14,30`: `next: { revalidate: 300 }` with a 4 s timeout (templates, countries, catalog sections on home). Matches.
- `apps/web/src/features/country/fetch-countries.ts:23`: `next: { revalidate: 300 }`. Matches.
- `apps/web/src/app/[country]/layout.tsx:18`, `build/layout.tsx:17`, `checkout/layout.tsx:17`: `cache: "no-store"`. Matches the "change at once" rule. Cost: every country page view makes one `/countries` call (9 documents, about 5 ms) and each builder visit one `/catalog` call.
- `apps/web/src/lib/api.ts:66`: the default is `no-store`.
- The API's `max-age=60` is never used by the web app (its fetches set their own policy); it only matters to a CDN in front of the API.

No mismatch found.

## 4. Mongo `explain("executionStats")`

Load: 20,150 orders over 120 days (150 created today), 5,000 designs, 152 price rows (seed), 30 featured templates, 2,000 partner requests, 300 staff sessions, 20,000 idempotency keys, bulk-inserted with the real models. I read the services to pick the queries; 40 variants are below, grouped. "Ratio" is docsExamined / nReturned.

### 4.1 Fine (index used, ratio about 1)

| Query | Plan | Keys / docs |
|---|---|---|
| country by code (`findOne {code}`) | `EXPRESS_IXSCAN code_1` | 1 / 1 |
| price rows by country (`catalog`, `validateDesign`) | `IXSCAN country_1_kind_1_targetId_1` | 16 / 16 |
| items and packagings by `_id $in`, active, sorted | `IXSCAN _id_` then in-memory sort of the few ids | 6 / 5 |
| prices grid `{kind, targetId}` | `IXSCAN kind_1_targetId_1` | 9 / 9 |
| design by `shareId` | `EXPRESS_IXSCAN shareId_1` | 1 / 1 |
| order by number (track) | `EXPRESS_IXSCAN number_1` | 1 / 1 |
| staff session by `tokenHash` and `expiresAt` | `IXSCAN tokenHash_1` | 1 / 1 |
| staff by `_id` and by email | `IXSCAN` | 1 / 1 |
| idempotency by `{key, route}` | `IXSCAN key_1_route_1` | 0 to 1 |
| dashboard: status counts | covered `IXSCAN {status, createdAt}` | 4,990 keys / 0 docs, 8 to 14 ms |
| dashboard: awaiting proof | covered index | 606 / 0 |
| dashboard: orders today | covered index | 939 / 0 |
| dashboard: revenue today | `IXSCAN payments.recordedAt_1` + fetch | 894 / 894, 8 to 15 ms |

Templates public list (`{active, countries}` sort `sortOrder,title`) examines 24 docs for 5 returned (ratio 4.8, `IXSCAN active_1_sortOrder_1`, in-memory sort). Fine at tens of templates; no action.

### 4.2 Collection scans and high ratios (before, 20,150 orders)

| Query | Plan | Returned | Keys | Docs | Ratio | ms |
|---|---|---|---|---|---|---|
| orders list, no filter | SORT > **COLLSCAN** | 26 | 0 | 20,150 | 775 | 67 |
| orders list, status | SORT > FETCH > IXSCAN `status_1_createdAt_-1` | 26 | 2,250 | 2,250 | 86.5 | 65 |
| orders list, country + status | SORT > IXSCAN `country_1_status_1_createdAt_-1` | 26 | 250 | 250 | 9.6 | 7 |
| orders list, country only | SORT > IXSCAN (same, prefix) | 26 | 2,170 | 2,170 | 83.5 | 14 |
| orders list, paymentStatus | SORT > IXSCAN `paymentStatus_1_status_1` | 26 | 9,161 | 9,161 | 352 | 51 |
| orders list, paymentStatus + status | same | 26 | 1,225 | 1,225 | 47 | 15 |
| orders list, date range | SORT > IXSCAN `createdAt_-1` | 26 | 1,570 | 1,570 | 60 | 52 |
| orders list, hasPendingProof true | SORT > **COLLSCAN** | 26 | 0 | 20,150 | 775 | 18 |
| orders list, hasPendingProof false | SORT > **COLLSCAN** | 26 | 0 | 20,150 | 775 | 19 |
| orders list, page 2 (cursor) | SUBPLAN OR > FETCH > IXSCAN `createdAt_-1` x2, then SORT | 26 | 19,650 | 19,650 | 756 | 80 |
| orders list, status + cursor | SORT > IXSCAN `status_1_createdAt_-1` | 26 | 5,570 | 5,570 | 214 | 99 |
| orders search, email | SUBPLAN OR > IXSCAN `number_1` + `contact.email_1` | 3 | **20,150** | 3 | 1 | 71 |
| orders search, number | same | 1 | 20,151 | 1 | 1 | 9 |
| orders search, phone | OR of three IXSCANs | 0 | **40,300** | 0 | n/a | 47 |
| dashboard: orders by country, 30 days | `IXSCAN createdAt_-1` + fetch | 9 | 8,575 | 8,575 | 953 (group input) | 27 to 38 |
| partners, no filter | SORT > **COLLSCAN** | 20 | 0 | 2,000 | 100 | 3 |
| partners, status only | SORT > **COLLSCAN** | 20 | 0 | 2,000 | 100 | 0 |
| partners, kind | SORT > IXSCAN `kind_1_status_1_createdAt_-1` | 20 | 1,333 | 1,333 | 67 | 2 |
| partners, country | SORT > IXSCAN `country_1` | 20 | 219 | 219 | 11 | 0 |
| partners, `countDocuments {status}` | **COLLSCAN** | 477 | 0 | 2,000 | 4.2 | 0 |
| countries list (sort name), templates admin list | SORT > COLLSCAN | 9 and 30 | 0 | 9 and 30 | 1 | 0 |

The list query has two causes. First, it sorts by `{createdAt: -1, _id: -1}` (the `_id` tie-break for the cursor), and none of the existing indexes end in `_id`, so MongoDB can never use an index for the sort and falls back to fetching every match and sorting it in memory. The single-field `createdAt_-1` index is useless for that sort. Second, the cursor filter is a two-branch `$or`, which the planner executes as two scans plus a sort. At 20k orders this costs 7 to 99 ms; the cost is proportional to the number of orders that match the filter. The countries list and the templates admin list are collection scans over 9 and 30 documents and need nothing.

### 4.3 Proposed indexes (before and after)

I created these indexes in `giftpop_perf` and re-ran the queries. Patch for `apps/api/src/modules/orders/model.ts` (replacing lines 142 to 144 and 148 once the dashboard hints are updated):

```ts
// Admin list: every filter combination ends in the list's own sort, createdAt desc then _id desc.
orderSchema.index({ createdAt: -1, _id: -1 });
orderSchema.index({ status: 1, createdAt: -1, _id: -1 });
orderSchema.index({ country: 1, createdAt: -1, _id: -1 });
orderSchema.index({ country: 1, status: 1, createdAt: -1, _id: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1, _id: -1 });
orderSchema.index({ "proofs.status": 1, createdAt: -1, _id: -1 });
// Dashboard "orders by country": covered, no document fetch.
orderSchema.index({ createdAt: -1, country: 1 });
```

Patch for `apps/api/src/modules/partners/model.ts` (lines 57 to 58):

```ts
partnerRequestSchema.index({ createdAt: -1, _id: -1 });
partnerRequestSchema.index({ status: 1, createdAt: -1, _id: -1 });
partnerRequestSchema.index({ kind: 1, createdAt: -1, _id: -1 });
```

Dashboard: change the `hint` in `apps/api/src/modules/dashboard/queries.ts:87` to `{ createdAt: -1, country: 1 }`. Hints at lines 30, 49 can stay or move to the new three-key indexes. After the new indexes ship, the old `{country,status,createdAt}`, `{paymentStatus,status}`, `{status,createdAt}` and `{createdAt}` indexes become redundant; drop them in the same change as the hint edits (`model.init()` creates missing indexes but never drops one, so removal needs a deploy step). I did not test the dashboard with the other hints changed.

After (same data, new indexes in place):

| Query | Plan | Keys / docs examined | ms |
|---|---|---|---|
| orders list, no filter | LIMIT > FETCH > IXSCAN `createdAt_-1__id_-1` | 26 / 26 | 2 |
| status | IXSCAN status+createdAt+_id | 26 / 26 | 5 |
| country + status | IXSCAN country+status+createdAt+_id | 26 / 26 | 2 |
| country only | IXSCAN country+createdAt+_id | 26 / 26 | 1 |
| paymentStatus | IXSCAN paymentStatus+createdAt+_id | 26 / 26 | 8 |
| paymentStatus + status | same, status filtered in fetch | 40 / 40 | 2 |
| date range | IXSCAN createdAt+_id | 26 / 26 | 8 |
| hasPendingProof true | IXSCAN proofs.status+createdAt+_id | 26 / 26 | 2 |
| hasPendingProof false | IXSCAN createdAt+_id, filtered | 28 / 28 | 0 |
| cursor, page 2 | **SORT_MERGE** of two IXSCANs, limit pushed down | 26 / 26 | 6 |
| status + cursor | IXSCAN status+createdAt+_id | 26 / 26 | 10 |
| cursor rewritten as `createdAt $lte` + `$or` | single IXSCAN | 27 / 27 | 1 |
| partners, no filter / status / kind | IXSCAN on the new keys | 20 / 20 | 0 to 4 |
| partners, `countDocuments {status}` | IXSCAN (index-only count) | 477 / 477 | 0 |
| dashboard, orders by country 30 days (hint `{createdAt:-1, country:1}`) | covered | 8,571 keys / **0 docs** | 13 |

Ratio goes from 9 to 775 down to about 1 for every list variant.

Caveat that must ship with the index patch: once the sort-friendly indexes exist, the planner starts the search queries on the `createdAt` index and walks all documents (20,150 docs examined for 1 to 3 returned, 80 to 173 ms) because their case-insensitive regexes cannot narrow an index anyway. Search must be fixed in the same change.

Patch for `apps/api/src/modules/admin-orders/list.ts:53-62` (search):

1. Store the email lower-cased (`normaliseEmail` already exists in `orders/contact.ts:8`; apply it when the order is created in `orders/service.ts`) and compare exactly: `{ "contact.email": search.trim().toLowerCase() }`, dropping `$regex`/`$options: "i"`. Measured with exact email plus number: 4 keys, 4 docs examined, 21 ms, against 20,150 keys with the regex. Orders created before the change need a one-off `updateMany` that lower-cases `contact.email`.
2. Store `contact.phoneDigits` (the output of `normalisePhone`) and index it; search `{ "contact.phoneDigits": digits }`. Today's regex `^\D*d\D*i\D*...$` scans the whole `contact.phone_1` index (40,300 keys across the three OR branches). It also needs a backfill for old orders.
3. Leave `{ number: search.toUpperCase() }` as is (already exact).

### 4.4 Other query notes

- `findActiveSession` (`auth/sessions.ts:43-48`) runs two queries per admin request (session, then staff by `_id`); both are single-key lookups, fine.
- The quote and order paths read the catalog again on every request (`loadValidatedDesign`: country, price rows, items, packaging; 11 to 25 ms warm, 135 ms cold). A 60 second in-process cache keyed by country, cleared by catalog and price writes, would remove most of it; not needed yet.

## 5. Builder on a throttled phone profile

Profile: Chromium (not mobile-emulated), 390 x 844, CDP `Emulation.setCPUThrottlingRate` 4, Fast 3G (`latency 562.5 ms`, down 1.6 Mbit/s x 0.9, up 750 kbit/s x 0.9), production build, cold cache, API on the same machine. Flow per run: open the format step, dismiss the country banner, choose Bouquet, tap 10 different items one second apart (real mouse events on the item cards), continue to arrange, personalise, review. The "scene" is the gift thumbnail in the items step's summary bar (an SVG). Measurements come from in-page observers: click to first DOM change inside an SVG ("tap to scene"), a double `requestAnimationFrame` after that ("tap to paint"), `longtask`, `layout-shift` and Event Timing entries.

Unthrottled for reference (one run): tap to scene median 7 ms, tap to paint median 19 ms, click event duration median 40 ms, max 88 ms, quote shown 141 ms after continuing to review.

Throttled, three runs each. "Before" is the code and config as found. "After" is with my config change (images only). The config has no runtime effect on interaction because no component uses `next/image` yet, so the difference between the two columns is noise from other agents sharing the machine.

| Metric | Before (3 runs) | After (3 runs) |
|---|---|---|
| Page loaded (format step usable) | 6.5, 6.5, 5.0 s | 9.8, 5.3, 5.3 s |
| Format to items navigation (tap to paint) | 2.06, 1.98, 2.12 s | 1.90, 2.31, 1.62 s |
| Tap to scene updating, median of 30 taps | 65 ms (max 321) | 69 ms (max 638) |
| Tap to paint, median of 30 taps | 150 ms (max 1,134) | 148 ms (max 1,639) |
| First tap, scene / paint | 321/1134, 173/211, 244/381 ms | 638/1639, 50/57, 143/277 ms |
| Taps 2 to 10, median paint per run | 165, 124, 99 ms | 270, 99, 166 ms |
| Click event duration (Event Timing), median / max | 136 / 1,600 ms | 168 / 1,776 ms |
| Long tasks during the 10 taps, count (total ms) | 21 (3,823), 17 (2,083), 14 (1,540) | 27 (5,037), 14 (1,506), 24 (3,131) |
| Longest long task in the tap phase | 1,277 ms | 1,424 ms |
| Long tasks during load, count (total ms) | 13 (1,550), 27 (4,228), 14 (1,835) | 13 (2,720), 12 (2,437), 12 (1,707) |
| Total blocking time, whole session | 4.2, 4.3, 2.2 s | 6.3, 3.0, 4.3 s |
| Layout shift (CLS) | 0.445 in all three | 0.445 in all three |
| Review step, continue to price shown | 1.36, 1.44, 1.57 s | 1.43, 1.57, 1.67 s |
| Review step opened cold (reload), price shown | 3.0, 2.6, 2.0 s after navigation start | 3.0, 2.4, 2.7 s |
| `/api/quotes` request duration, throttled | 579 to 646 ms (562 ms is the emulated latency) | 585 to 913 ms |
| Transferred in the run | 422 to 424 KB | 421 to 424 KB |

Reading the numbers:

- A normal tap (taps 2 to 10) reaches the scene in about 20 to 200 ms and paints in about 40 to 445 ms. That is acceptable for a tap. The first tap of a session is the outlier (up to 638 ms to the scene and 1.6 s to paint in 2 of 6 runs; the longest task in the tap phase is 1.3 to 1.4 s), which fits the first scene draw and motion initialising under 4x CPU. The `LazyMotion` patch in section 1 targets that cost.
- Long tasks: 14 to 27 per 10-tap phase, each 50 to 200 ms, plus the one outlier. Total blocking time 2.2 to 6.3 s over the whole session is high; most is hydration and the scene, matching the 240 kB of JS.
- Quote latency: the quote request is debounced 300 ms and fires on every change on the items step, so by the time the customer reaches review the price is already in memory (about 1.4 to 1.7 s of this is the page transition, not the request). Opened cold, the price appears 2.0 to 3.3 s after navigation starts, of which 0.58 to 0.65 s is the request on Fast 3G (almost all emulated latency; the API answers in about 11 to 25 ms warm, 120 ms through the web rewrite on first use). The API time is not the bottleneck.
- CLS 0.445 is poor (limit 0.1). The first 0.124 is the "Shipping to United States?" banner (`country-suggestion.tsx:34-37` renders `null` on the server and the banner after hydration, so it pushes the whole page down; seen at 1.2 s even unthrottled). Fix: render the banner `position: fixed` or inside a container with a reserved `min-height`, or place it below the fold. The next 0.144 and 0.177 are the footer jumping on `/pk/build/items` while the step's content arrives over a slow connection. I did not root-cause that one; adding a `loading.tsx` skeleton with the grid's height for `app/[country]/build/items` is the first thing to try.

## What I changed

- `apps/web/next.config.ts` and `apps/admin/next.config.ts`: `images` block (remote host from `PUBLIC_ASSET_BASE_URL`, WebP only, one-year TTL, local IP allowed only for localhost hosts) and `poweredByHeader: false`. Builds re-run with and without the variable; both CSS bundles are unchanged and contain Tailwind output.
- This report.

## Incidental findings for others

- Accessibility: the builder pages render a nested `<main>` (the layout's `<main id="main">` wraps a page-level `<main>`; seen on `/PK/build/arrange`). Two main landmarks per page.
- Templates (item 6): wrap the loop body in `templates/service.ts:145` in a try/catch that logs and `continue`s, so one bad row hides one template instead of all.

## Follow-up status (lead, 2026-10-19)

Measured with a production build served by `next start`, bytes the browser downloaded for each route (gzip level 9), 390 px window, after building a gift.

| Route | Before kB | After kB | Motion loaded after |
|---|---|---|---|
| `/` | 224.1 | 168.1 | no |
| `/pk` | 224.5 | 168.5 | no |
| `/countries` | 172.7 | 167.7 | no |
| `/track` | 229.7 | 180.2 | no |
| `/pk/build/items` | 237.3 | 238.0 | yes (animates) |
| `/pk/build/arrange` | 236.0 | 230.7 | yes (animates) |
| `/pk/build/review` | 237.2 | 187.1 | no |
| `/pk/checkout` | 236.9 | 188.0 | no |

- `LazyMotion` + `m`: done. On its own it saved 3.7 kB (motion chunk 51.3 to 47.6), not the estimated 30 kB, because `animate`, motion values and `AnimatePresence` stay. The big win is that `GiftScene` now loads the animated scene lazily from a client module, so routes with only static scenes never download motion.
- zod: `contracts` is `sideEffects: false` (zod chunk 36.1 to 31.2 kB). The rest stays while client code parses API responses with contract schemas; `zod/mini` would be a contracts-wide change (lead decision, not done).
- Item cards: `next/image` with `sizes="112px"` (unit test checks the `/_next/image` URL; the seed has no item images, so not measured in a browser). Scene images (patch 2): done through a `GiftScene` `imageUrl` prop that rewrites the asset URLs before rendering; only hosts under `PUBLIC_ASSET_BASE_URL` are resized, others load as they are.
- Admin order search: exact match on indexed `searchKeys` with a boot backfill; a test asserts the plan has no `COLLSCAN`.
- Items step layout shift: 0 (see the accessibility fix status).
