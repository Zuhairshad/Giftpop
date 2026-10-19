# Phase 5: Home page, countries, partnerships and templates

Start in Plan mode. Read `CLAUDE.md` and `docs/product.md` (sections "Countries", "Partnerships", "Featured templates") first. Follow the parallel work protocol in `CLAUDE.md` exactly.

**Run this phase with at least 5 `builder` subagents working in parallel in Step B.** Launch them all in one message so they run at the same time.

Requires: phase 2 merged. Can run in its own session in parallel with phase 3 (`claude --worktree phase-5`); merge phase 3 first, then rebase this branch on `main` before Step C.

## Goal

The store has a real front door: pick your country, see what you can make, start from a featured template, and two partnership routes (brands that want their products in gifts, and people who want The Giftpop in a country that is not live yet). Staff manage both from the admin.

## Step A: lead, serial

Work on branch `phase-5-home-partners`.

1. Re-read `partner.ts` and `template.ts`. Add list and update request schemas for both if missing.
2. Register empty api modules `partners` and `templates`.
3. Create thin pages: web `src/app/page.tsx`, `src/app/countries/page.tsx`, `src/app/partners/brands/page.tsx`, `src/app/partners/countries/page.tsx`; admin `(dashboard)/partners/page.tsx`, `(dashboard)/templates/page.tsx`. Each imports a stub from its feature folder.
4. Leave a clearly marked hero slot component, `apps/web/src/features/home/hero/index.tsx`, exporting a static placeholder. **The hero motion piece is a separate decision; do not build it in this phase.**
5. `pnpm verify`, commit.

## Step B: fan out (at least 5 agents, in parallel)

Launch these `builder` agents in one message. Give each the text of its row plus: "Read CLAUDE.md, docs/product.md and the contracts first; edit only the paths you own."

| Agent | You own | Build | Done when |
|---|---|---|---|
| 1 `web-home` | `apps/web/src/features/home/**` except `hero/` | Home sections under the hero slot: "How it works" (choose, build, we make and deliver), featured templates for the visitor's country from `GET /templates`, a gift-format strip linking into the builder, a partnership band with both calls to action, footer. Server-rendered, with revalidation every 5 minutes. | Lighthouse performance and accessibility at least 90 on mobile for `/`; no client JavaScript for static sections. |
| 2 `web-country` | `apps/web/src/features/country/**`, `apps/web/src/app/countries/**`, `apps/web/src/middleware.ts` | Country picker in the header and a full `/countries` page: live countries with flag, currency and delivery estimate; coming-soon countries with "Bring The Giftpop here". The choice is stored in a `gp_country` cookie; middleware sends `/` visitors with a cookie straight to their country's home; first-time visitors get a suggestion from `Accept-Language` that they confirm (no IP geolocation). One `formatMoney(money, locale)` helper used everywhere. | Changing country changes prices and currency across the store; coming-soon countries cannot reach the builder. |
| 3 `web-partner-forms` | `apps/web/src/features/partners/**`, `apps/web/src/app/partners/**` | Two forms from the contracts (brand and country), with a short pitch at the top of each, inline validation, a hidden honeypot field, and a success state that says what happens next. The country form lists only countries that are not live. | Invalid input never reaches the API; a bot filling the honeypot gets a fake success and nothing is stored. |
| 4 `api-partners` | `apps/api/src/modules/partners/**` | `POST /partner-requests` (public, rate-limited 3 per hour per IP, honeypot check, normalised email), enqueue a notification to staff. Staff routes: list with kind, status and country filters, detail, status change through `new`, `in_talks`, `accepted`, `declined`, notes with actor. | Tests: rate limit, honeypot, invalid kind, staff-only routes, status history. |
| 5 `api-templates` | `apps/api/src/modules/templates/**` | Staff mark a saved design as a template with title, description and country list; public `GET /templates?country=xx` returns only templates whose items are all still sold in that country, with cache headers; `POST /templates/:id/start` returns a fresh design copy for the builder. | Tests: a template disappears for a country when one of its items loses its price there; staff-only writes. |
| 6 `admin-partners-templates-ui` | `apps/admin/src/features/partners/**`, `apps/admin/src/features/templates/**` | Partners inbox: tabs for brand and country, filters, detail drawer with every field, status change and notes. Templates: list, "Create from share link" (paste a `/g/<shareId>` link), edit title, description and countries, preview with `<GiftScene/>`, remove. | Staff can triage a partner request and publish a template end to end. |

## Step C: lead

1. Merge in this order: 4, 5, 2, 3, 1, 6. `pnpm verify` after each.
2. Apply every "Needs from lead" item. Wire "Start from this" on templates into the builder state (load design, open the review step).
3. In a browser: switch countries and watch prices change; submit both partner forms and triage them in admin; publish a template from a share link and start a gift from it on the home page.
4. `verifier`, fix "Must fix", `code-simplifier`.
5. Record assumptions in `docs/decisions.md`, lessons in `CLAUDE.md`. `/commit-push-pr`.

## Definition of done

- Launching a new country is an admin change: set it live, price items, and it appears on `/countries` and in the picker.
- Both partnership forms store requests that staff can work through in admin.
- Featured templates only show where they can actually be sold.

## Out of scope

The hero motion piece, blog or CMS pages, marketing emails.
