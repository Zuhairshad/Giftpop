# Phase 8: Ready-made gifts catalog

Start in Plan mode. Read `CLAUDE.md`, `docs/product.md` ("Featured templates", builder step 1) and `docs/decisions.md` (search "Templates:" and "Phase 5 routes") first. Follow the parallel work protocol in `CLAUDE.md` exactly. Commit as the owner only: no "Co-Authored-By", no "Generated with Claude Code" lines, and tell every agent the same. Do not push until the owner says "push".

**Run Step B with at least 5 `builder` subagents in parallel**, launched in one message.

## Goal

A customer who does not want to build can browse a catalog of finished gifts, see the picture and the price in their country, and order one in a couple of taps. They can still change it if they want. Staff curate the catalog from the admin.

## What already exists (do not rebuild)

- `packages/contracts/src/template.ts`: `FeaturedTemplate` (title, description, shareId, design, countries, active, sortOrder), `PublicTemplate` (design + packaging + items), template start request and response.
- `apps/api/src/modules/templates/`: staff CRUD under `/admin`, public `GET /templates?country=`, `POST /templates/:id/start`. The public list already hides a template unless it is active, listed for the country and sellable there (`validateDesign` against the live catalog).
- `apps/web/src/features/builder/questions/packaging/templates-section.tsx`: the strip in the builder's first question. Cards link to `/<cc>/build?from=<shareId>`.
- `apps/admin/src/features/templates/**`: manager, dialog, preview, "create from share link".
- Orders freeze the design JSON, so a ready-made gift ordered today never changes later.

## Gaps this phase closes

1. No dedicated browsing page, only a strip inside the builder.
2. No price on the cards. Rule 3: the server owns money, so the price comes from the API, never the browser.
3. No categories or occasions (birthday, anniversary, Eid, graduation, get well, thank you).
4. The seed loads no templates, so a fresh database shows nothing.
5. Staff can only create a template by pasting a share link.
6. The card does not say what is inside.

## Decisions to take from the owner before Step B (ask, do not guess)

- **a.** Is "Order this gift" a direct path to checkout, or does every ready-made gift open the builder's review step as today? Recommended: keep the review step (it collects recipient and card message and allows edits) and make "Order this gift" the primary button there.
- **b.** Can a customer change a ready-made gift's contents? Recommended: yes, same builder, and the price follows the quote.
- **c.** Which categories? Propose 6 to 8 and wait for the owner's pick. Per rule 7 keep them as data, not a hard-coded enum.
- **d.** Text fields (name on a mug, card message) stay empty for the customer to fill. Recommended: yes, they are required at checkout anyway.

## Step A: lead, serial

Work on branch `phase-8-ready-made`.

1. Contracts (`packages/contracts`): add `category` and `featured` to `FeaturedTemplate`, the create and update schemas, and `PublicTemplate`. Add `priceMinor` (integer, rule 4) to `PublicTemplate`, computed by the API with `contracts/pricing` for the country's first allowed payment mode from catalog prices only. Add `itemSummary` (item names, up to 4, plus a "+N more" count). Update contract tests and every helper that builds these shapes.
2. Add a "Ready-made gifts" section to `docs/product.md` and a line to `docs/decisions.md`.
3. Stubs: web route `src/app/[country]/gifts/page.tsx` importing a stub, a web header nav entry, an admin template-manager stub, an empty `scripts/seed/data/templates.ts` registered in `scripts/seed/data/index.ts`.
4. `pnpm verify`, commit.

## Step B: fan out (at least 5 agents, in parallel, each in a worktree)

Give each agent the text of its row plus: "Read CLAUDE.md, docs/product.md and the contracts first; edit only the paths you own; commit a WIP commit after every green package verify; commit as the owner only, no attribution lines."

| Agent | You own | Build | Done when |
|---|---|---|---|
| 1 `api-templates` | `apps/api/src/modules/templates/**` | Compute `priceMinor`, `itemSummary` and `category` in `listPublicTemplates`; add a `?category=` filter; keep the 5-minute cache and the sellability rule; add category storage or a seeded list, whichever the contract chose. | Tests: price equals a real `POST /quotes` for the same design; filter works; a template disappears when an item loses its price in that country; a price sent by the client is ignored. |
| 2 `web-gifts-page` | `apps/web/src/app/[country]/gifts/**`, `apps/web/src/features/gifts/**` | Server-rendered catalog: category chips as real links (shareable URLs), responsive grid of cards with the `GiftScene` picture, title, "What is inside", price in the country currency, one primary button. Empty state, loading skeleton, error boundary. | At 390px `scrollWidth <= innerWidth`; long titles wrap (`wrap-anywhere`); keyboard and labels work; Lighthouse accessibility at least 95 on `next build` + `next start`. |
| 3 `web-builder-entry` | `apps/web/src/features/builder/questions/packaging/**`, `apps/web/src/features/home/**` | Show the price on the strip's cards, add "See all ready-made gifts" linking to `/<cc>/gifts`, link from the home page. Keep `aria-label`s that begin with the visible text. | `template-href` tests updated; e2e `b-us-template-order` still passes. |
| 4 `admin-templates-ui` | `apps/admin/src/features/templates/**` | Category and featured controls, ordering (`sortOrder`), a second creation path "Create from a gift I built in the builder" next to pasting a link, and the live price per listed country so staff see what customers see. | Staff can publish, reorder, hide and recategorise; the server staff guard is untouched (rule 10). |
| 5 `seed-templates` | `scripts/seed/data/templates.ts`, `scripts/seed/data/*.test.ts` | 12 to 16 realistic ready-made gifts across the existing formats, listed for the live countries, built only from seeded items and packagings with fixed ids. No brand names. | A test parses each with the contract schemas and proves each is sellable in every listed country; the seed writes them idempotently. |
| 6 `e2e-ready-made` | new files under `e2e/tests/**` | Playwright: browse `/<cc>/gifts`, filter by category, open one, order it end to end with cash on delivery, see the frozen design in admin. Overflow check at 320, 360, 375 and 390 in a non-mobile context. | Passes in the isolated run (`E2E_ISOLATED=1`). Stop any hand-started dev stack first. |

Agents never edit contracts, `package.json` files, the lockfile, `apps/api/src/modules/index.ts`, nav config or docs. They list the need in their report.

## Step C: lead

1. Merge in this order: 1, 5, 2, 3, 4, 6. `pnpm verify` after each.
2. Start `pnpm dev` and call `GET /v1/templates?country=PK` (green tests do not prove the server boots).
3. Seed a throwaway local database, never the production Atlas one, and never print `MONGODB_URI`.
4. Browser run: screenshot `/pk/gifts` at 390 and 1280 with the mouse parked off every control, and with the OS forced to dark (the store is light only). Then run the `verifier`, then the `code-simplifier`. Report what you could not see rendered.
