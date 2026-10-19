# Decisions

One line per decision: date, what was decided, why. The lead adds agent assumptions here in Step C of each phase.

- 2026-10-19: MERN with Next.js for both the store and the admin; one Express API serves both. Keeps pricing and order rules in one place.
- 2026-10-19: Admin is a separate Next.js app with its own URL and login.
- 2026-10-19: Builder follows digibouquet's flow: pick a format, pick a set number of items, see them arranged, personalise, share a link.
- 2026-10-19: Items sit in slots chosen by a layout function, not free drag, so every design can be made by hand and rendered the same everywhere.
- 2026-10-19: Prices are set per country in local currency; no currency conversion.
- 2026-10-19: Both Next.js apps proxy `/api/*` to the Express API, so browser calls are same-origin and the admin cookie stays first-party.
- 2026-10-19: TypeScript is pinned to 6.0.3 and ESLint to 9.39.5: typescript-eslint does not support TypeScript 7 yet, and eslint-plugin-import does not support ESLint 10, so import order uses eslint-plugin-import-x.
- 2026-10-19: `packages/contracts` and `packages/renderer` export TypeScript source directly. Next uses `transpilePackages`, the API bundles them with tsup `noExternal`. No build-order coupling between lint, typecheck and test.
- 2026-10-19: Dates in contracts are ISO strings (the wire format); models convert to and from Date.
- 2026-10-19: `layoutType` is a plain string in contracts, validated against the renderer registry by the API, so a new layout type needs no contract change.
- 2026-10-19: A design stores one line per item (`itemId`, `qty`, unique `slot`); slot order, not array order, sets the arrangement.
- 2026-10-19: Shipping is free when goods before discount reach `freeOverMinor`, so the payment mode never changes shipping. No personalisation fee yet; `computeQuote` takes one.
- 2026-10-19: Naming a non-personalizable item reports `TEXT_TOO_LONG` (its limit is 0). An out-of-stock packaging reports `OUT_OF_STOCK`; a missing or inactive one reports only `PACKAGING_UNAVAILABLE`.
- 2026-10-19: `computeQuote` rejects non-integer shipping amounts, and `money()` normalises `-0` to `0`.
- 2026-10-19: `TransitionError` (contracts) is mapped by the API error middleware to INVALID_TRANSITION (409) or MISSING_TRANSITION_FIELD (422). An oversized body returns VALIDATION_ERROR with status 413.
- 2026-10-19: The API requires `MONGODB_URI` (no default) and refuses to start without it. `/health` and `/ready` live at the app root, not under `/v1`. `server.ts` loads `apps/api/.env` itself; Turbo's strict env mode hides shell variables from `pnpm dev`.
- 2026-10-19: Env files: `.env` for the API, `.env.local` for the Next apps. Server Components call `${API_URL}/v1` directly; browsers use the `/api` rewrite. Phase 1 must forward the session cookie from admin Server Components explicitly.
- 2026-10-19: `GiftScene` takes `{ design, packaging, items }` because a design holds only item ids. Placement anchors are the item's anchor point in a 0 to 1000 scene; real layer images are not tinted by wrapper or ribbon colour.
- 2026-10-19: Local Mongo is `mongo:8.3.13` as a single-node replica set `rs0`, no auth. Port 27017 must not be exposed publicly.
