# Phase 2: Gift builder (digibouquet-style)

Start in Plan mode. Read `CLAUDE.md` and `docs/product.md` (section "Gift builder") first. Follow the parallel work protocol in `CLAUDE.md` exactly.

**Run this phase with at least 5 `builder` subagents working in parallel in Step B.** Launch them all in one message so they run at the same time.

Requires: phase 1 merged. Reference experience: https://digibouquet.vercel.app (pick a set number of blooms, see them arranged, write a card, share a link). Match its feel: one clear choice per screen, big friendly visuals, the gift always in view.

## Goal

A customer in any live country can go from "pick a format" to a priced, shareable gift: format, items, arrange, personalise, review. The API validates and prices every design.

## Step A: lead, serial

Work on branch `phase-2-builder`.

1. Re-read `design.ts`, `design-rules.ts`, `pricing.ts`. Add `SaveDesignResponse`, `QuoteRequest`, `QuoteResponse` (prepaid and cod quotes side by side) and `SharedDesignView` (design plus the catalog slice needed to render it) if missing.
2. Install: web `zustand`, `motion`, `nanoid` (api too, for share ids).
3. Register empty api modules `designs` and `quotes`.
4. In `apps/web/src/app/[country]/`, create `layout.tsx` (loads the country from `/countries`, 404s unknown codes, redirects coming-soon countries to `/countries`) and thin pages for `build/format`, `build/items`, `build/arrange`, `build/personalise`, `build/review`, each rendering one component imported from `src/features/builder/steps/<step>/index.tsx`. Create those step files as stubs exporting a placeholder component, plus `src/features/builder/state/index.ts` exporting a stub `useBuilder` hook with the final type signature.
5. `pnpm verify`, commit.

## Step B: fan out (at least 5 agents, in parallel)

Launch these `builder` agents in one message. Give each the text of its row plus: "Read CLAUDE.md, docs/product.md and the contracts first; edit only the paths you own."

| Agent | You own | Build | Done when |
|---|---|---|---|
| 1 `api-designs-quotes` | `apps/api/src/modules/designs/**`, `apps/api/src/modules/quotes/**` | `POST /quotes`: loads the country catalog from the database, runs `validateDesign`, returns problems (422) or both quotes via `computeQuote`. `POST /designs`: validates, stores the design with a 10-char `shareId` (nanoid, url-safe), returns it. `GET /designs/:shareId`: `SharedDesignView`, with items no longer sold shown as unavailable rather than failing. Rate-limit both POSTs. Indexes on `shareId`. | Tests: client-sent prices are ignored, each problem code reaches the response, both modes priced correctly for PK and US seed data, unknown share id 404. |
| 2 `web-builder-state` | `apps/web/src/features/builder/state/**` | Zustand store per country: packaging, items with order, colours, seed, personalisation. Actions: choose packaging (keeps compatible items, returns the ones it dropped so the UI can say so), add, remove, reorder, shuffle (new seed), set colours and texts. Persists to `sessionStorage` (wrapped in try/catch). Derived `problems` from `validateDesign` against the loaded catalog. Step guard: a step redirects back when its prerequisites are missing. Debounced quote fetch (300 ms) from `/api/quotes`. | Unit tests for every action, the packaging switch, persistence failure, and the step guard. |
| 3 `web-step-format-items` | `apps/web/src/features/builder/steps/format/**`, `apps/web/src/features/builder/steps/items/**`, `apps/web/src/features/builder/components/progress/**` | Format step: large cards per packaging with a `<GiftScene/>` preview and "Pick 6 to 10" style copy. Items step: category tabs, item grid with image or silhouette, price in local currency (`Intl.NumberFormat`), tap to add, quantity stepper, live counter ("4 of 6–10 picked"), disabled items with their reason, a sticky mini preview of the gift. Step progress bar shared by all steps. | Works at 390px and 1280px; keyboard can add and remove items; the counter and disabled reasons match `problems`. |
| 4 `web-step-arrange-personalise` | `apps/web/src/features/builder/steps/arrange/**`, `apps/web/src/features/builder/steps/personalise/**` | Arrange: big live `<GiftScene/>`, "Shuffle" button, reorder list (drag on desktop, up/down buttons everywhere), wrapper and ribbon colour swatches from the packaging. Personalise: card message with a live character count, recipient name, a name field for each personalisable item, all limits from contracts; the card preview updates as you type. | Shuffle visibly changes the arrangement and is deterministic per seed; limits are enforced with clear messages. |
| 5 `web-review-share` | `apps/web/src/features/builder/steps/review/**`, `apps/web/src/app/g/**` | Review: scene, item list, personalisation summary, two price columns (Pay now: 20% off; Cash on delivery: 20% advance) from the quote, "Save and share" (POST `/designs`, then a copy-link button with a fallback that selects the text), "Continue to checkout" (links to `/[country]/checkout`, built in phase 3). `/g/[shareId]`: full-screen gift reveal (the scene animates in, respecting reduced motion), card message, "Order this gift" (loads the design into the builder at review) and "Make your own". Open Graph title and description. | A shared link opens the identical gift in a fresh browser; quotes show both modes with correct maths. |
| 6 `renderer-motion` | `packages/renderer/**` | Animate items into and out of their slots with `motion` (spring, under 400 ms), animate shuffles, skip all motion under `prefers-reduced-motion`. Scene scales crisply to its container with `ResizeObserver`. Lazy-load images with fixed aspect boxes so nothing jumps. Add layout tests for edge sizes (min and max items for each seeded packaging). | Existing renderer tests still pass; new tests pass; no layout shift when images load. |

## Step C: lead

1. Merge in this order: 6, 2, 1, 3, 4, 5. `pnpm verify` after each.
2. Apply every "Needs from lead" item.
3. Run the full flow in a browser for PK and US on a phone-sized window: format, items, arrange, personalise, review, save, open the share link in a private window. Try to break it: switch packaging after picking 9 items, refresh mid-flow, exceed text limits.
4. `verifier`, fix "Must fix", `code-simplifier`.
5. Record assumptions in `docs/decisions.md`, lessons in `CLAUDE.md`. `/commit-push-pr`.

## Definition of done

- A full gift can be built and shared in every live country with seed data.
- The API rejects every invalid design with a specific problem code; the UI shows the same problems before the API does.
- Prices come only from the API quote.
- Adding a packaging with an existing `layoutType` in admin makes it appear in the builder with no code change.
- The share link shows the same arrangement every time.

## Out of scope

Checkout, payment, orders, home page.
