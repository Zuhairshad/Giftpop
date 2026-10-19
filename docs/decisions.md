# Decisions

One line per decision: date, what was decided, why. The lead adds agent assumptions here in Step C of each phase.

- 2026-10-19: MERN with Next.js for both the store and the admin; one Express API serves both. Keeps pricing and order rules in one place.
- 2026-10-19: Admin is a separate Next.js app with its own URL and login.
- 2026-10-19: Builder follows digibouquet's flow: pick a format, pick a set number of items, see them arranged, personalise, share a link.
- 2026-10-19: Items sit in slots chosen by a layout function, not free drag, so every design can be made by hand and rendered the same everywhere.
- 2026-10-19: Prices are set per country in local currency; no currency conversion.
- 2026-10-19: Both Next.js apps proxy `/api/*` to the Express API, so browser calls are same-origin and the admin cookie stays first-party.
