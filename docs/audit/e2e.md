# End-to-end audit (phase 6, `e2e`)

Four Playwright tests on a Pixel 7 phone viewport, run against an isolated stack. Roles, labels and visible text only; no CSS selectors.

## How to run

```
E2E_ISOLATED=1 E2E_CHROMIUM_PATH=/opt/pw-browsers/chromium pnpm e2e
```

- `E2E_ISOLATED=1` makes Playwright start and stop its own API (4100), web (3100) and admin (3101) on database `giftpop_e2e` of the Mongo already listening on 27017 (override with `E2E_MONGODB_URI`; uploads go to `$TMPDIR/giftpop-e2e-uploads`, override with `E2E_UPLOAD_DIR`). Every run therefore gets a new API process and fresh in-memory rate-limit counters (login 5/min, track and proof 10/min, partner requests 3/hour). No limit is weakened.
- Without it, the standard ports are used and running servers are reused (previous behaviour). `E2E_WEB_URL`, `E2E_ADMIN_URL`, `E2E_API_URL` still override the URLs.
- Global setup seeds, resets the shared fixture, ensures one featured US template exists (the seed has none), and visits each route once so dev-server compile time does not land inside a test.

## Tests

| File | Flow |
|---|---|
| `a-pk-cod-order.spec.ts` | Home, See countries, Pakistan, Start building, format, items, arrange (shuffle, move, wrapper colour), personalise, review, checkout with the Pakistan address (Province required, Postal code optional), Cash on delivery, place order, confirmation, proof upload. Writes the order to `e2e/.fixtures/shared.json`. |
| `b-us-template-order.spec.ts` | `/us`, "Start from this: E2E featured bouquet", review loaded from the template, US checkout (State and ZIP required), Pay now, confirmation (full amount due, nothing on delivery). |
| `c-staff-fulfilment.spec.ts` | Staff sign in, find the PK order by searching its number, accept proof, record the advance (amount pre-filled), Start production, Mark as packed, Mark as shipped (empty submit is refused, then courier and tracking number), Out for delivery, Delivered. After every step the customer track page (order number + phone) shows the matching words, courier and tracking number appear after shipping, and the customer window is a plain 390px non-mobile context that asserts `scrollWidth - innerWidth <= 0` on every lookup. |
| `d-brand-partner-request.spec.ts` | Public partners page, brand form, success message, admin partners inbox, open the request, set In talks with a note, save, status shown in the list. |

Each test uses a timestamp suffix in emails and brand names, so a database with earlier runs works. (c) needs (a) in the same run (fixture is reset at the start of each run); (b) and (d) are independent.

## Results (final code, three runs in a row, isolated stack)

| Run | Result | Wall time | a / b / c / d |
|---|---|---|---|
| 1 | 4 passed | 2m37s (Playwright 2.5m) | 29.6s / 5.1s / 26.3s / 10.7s |
| 2 | 4 passed | 1m55s (Playwright 1.9m) | 17.5s / 8.9s / 27.6s / 9.9s |
| 3 | 4 passed | 2m30s (Playwright 2.5m) | 25.8s / 21.2s / 33.9s / 11.7s |

Wall time includes starting three dev servers, seeding and warming. The machine is shared with other agents, so timings vary a lot (the same suite took 1m30s to 3m55s across runs).

Failures seen while building, all fixed in the tests or config (none was an app bug):

1. First click on a format or "Continue" after navigation does nothing until React hydrates in a dev build. Tests press again until the URL changes.
2. A click on the order link in the admin list while the list was still re-filtering was lost. Test waits for the single matching row.
3. Chromium `Target crashed` once on a busy machine (run before the final three). Config now passes `--disable-dev-shm-usage`.
4. Track lookups hit the 10-per-minute limit because the order page load, proof upload and 6 lookups share one IP window. `expectTrackStatus` waits out the minute and presses again if the page says "Too many tries"; the initial pre-staff lookup was dropped.
5. First visit of a route in `next dev` took 15 to 50s on a loaded machine and timed out a navigation. Global setup warms routes; navigation timeout is 60s; test timeout 180s.

## Findings for the lead (no app files were edited)

No missing accessible names blocked a selector. Every control used was reachable by role or label.

| Severity | Finding | Where | Suggested fix |
|---|---|---|---|
| Low | Pre-hydration taps do nothing. On a slow phone a customer tapping a format card or "Continue" before hydration gets no feedback (the format cards are `button`s with `onClick`, not links). | `apps/web/src/features/builder/steps/format/format-view.tsx`, items `gift-summary.tsx` | Accept for now; or render the format cards and Continue as links so they work before hydration. |
| Low | Order, track and proof share the 10-per-minute limiter per IP, and the order page fetch plus a proof upload use about 3 of them. A household behind one NAT, or a customer who opens the order page twice then tracks, hits "Too many tries" quickly. `TRUST_PROXY_HOPS` must be 1 in production or every customer shares one bucket (already in decisions). | `apps/api/src/modules/orders/rate-limit.ts` | Consider a per-order-number limit for the guess protection and a looser per-IP limit. |
| Low | Featured templates are cached 5 minutes in the web app (`revalidate: 300`). A template created or turned off in admin does not change the home for up to 5 minutes. The e2e setup creates the template before any home visit to avoid a stale empty list. | `apps/web/src/features/home/fetch-home-data.ts` | Already in decisions; consider revalidating on admin change. |
| Low | In the admin order list, clicking a row link while the search is still filtering can drop the navigation (URL stays on `?search=`). | `apps/admin/src/features/orders/list` | Cancel the pending search update on link click, or disable links while pending. |
| Info | The review page has two "Continue to checkout" controls (top and bottom). Fine for users; tests take the first. | `review-screen.tsx` | none |
| Info | The items step renders two item counters, one hidden at each breakpoint. Tests filter to the visible one. | `items/gift-summary.tsx` | none |
| Info | The seed loads no featured template, so a fresh local site shows an empty "featured" section on every country. | `scripts/seed` | Optional: seed one template. |

## Needs from lead

- `pnpm e2e` alone uses standard ports and expects the dev stack; the isolated mode needs `E2E_ISOLATED=1`. The lead may want a root script such as `"e2e:isolated"` (not added: package.json is shared).
- `e2e/.gitignore` ignores `.fixtures/` and `test-results/`. Playwright writes `e2e/test-results`, already covered.
- ESLint does not cover `e2e/`; type checking (`pnpm e2e:typecheck`) and Prettier do.
