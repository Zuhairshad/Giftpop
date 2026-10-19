# The Giftpop

Customers pick a country, build a gift visually (digibouquet-style: pick a format, pick items, see it arranged, personalise), and order it. Staff receive the order in a separate admin app, make and pack it by hand, and ship it with custom shipment statuses. No Shopify: everything is ours.

Domain rules live in `docs/product.md`. Read it before touching pricing, orders, countries or the builder.

## Stack

| Path | What | Tech |
|---|---|---|
| `apps/web` | Customer store and gift builder | Next.js (App Router), React, TypeScript, Tailwind |
| `apps/admin` | Separate admin panel, own URL and login | Next.js (App Router), TypeScript, Tailwind, shadcn/ui |
| `apps/api` | The only backend, serves both apps | Node, Express, Mongoose, MongoDB |
| `packages/contracts` | Zod schemas, inferred types, pricing math, order state machine | TypeScript, zod |
| `packages/renderer` | Layout engines and `<GiftScene/>`, used by web and admin | React, TypeScript |
| `packages/config` | Shared tsconfig, ESLint, Prettier | |

Monorepo: pnpm workspaces + Turborepo. Node LTS. Use current stable versions; check before pinning.

## Commands

- `pnpm verify` runs lint, typecheck and tests for the whole repo. **Run it before saying any work is done.**
- `pnpm --filter <pkg> verify` runs the same for one package. Use it while working.
- `pnpm dev` starts web (3000), admin (3001), api (4000). `docker compose up -d` starts MongoDB first.
- `pnpm seed` loads countries, packaging, items and prices for local dev.

## Non-negotiable rules

1. **Contracts first.** Every request body, response, Mongo document shape and shared type comes from `packages/contracts`. Never redeclare a type that exists there. If a contract is missing, stop and report it; do not invent a local one.
2. **Validate at every boundary.** API parses every input with the contract's zod schema. Env vars are parsed with zod at boot; the app refuses to start on bad config.
3. **The server owns money.** Prices are read from the database and computed by `contracts/pricing`. The browser never sends a price, and the API ignores one if it does.
4. **Money is integer minor units** (cents, paisa, halala) with an ISO currency code. No floats, no rounding outside `contracts/pricing`.
5. **Orders are frozen.** An order stores the exact design JSON, a snapshot of each item's name and unit price, the quote, and an append-only status history. Later catalog edits never change an old order.
6. **Status changes go through the state machine** in `contracts/order-status`. No code sets `order.status` directly.
7. **Countries are data, not code.** No `if (country === "PK")`. Country behaviour (currency, rates, payment modes, address format, launch status) lives in the `countries` collection. Adding a country must need zero code changes.
8. **Formats are data plus one layout function.** A new packaging is a database row that names an existing `layoutType`. A new layout type is one pure function in `packages/renderer/layouts` plus its tests, registered in one map.
9. **Assets live in object storage**, never in MongoDB. The API normalises uploads to WebP and stores width, height and anchor point.
10. **Admin routes require an authenticated staff session** checked on the server. Never rely on the admin app hiding a button.
11. **No secrets in the browser.** Only `NEXT_PUBLIC_*` values reach client code, and none of them are secrets.

## Code style

- TypeScript `strict`, no `any`, no `@ts-ignore`. Use `unknown` and narrow it.
- Named exports. One component or module concern per file. Files over ~250 lines get split.
- API modules live in `apps/api/src/modules/<name>/` with `router.ts`, `service.ts`, `model.ts`, `*.test.ts`. Routers parse and respond; services hold logic; models hold Mongoose schemas and indexes.
- Errors: throw `AppError(code, httpStatus, message)`; one error middleware turns it into `{ error: { code, message, details? } }`. Never leak stack traces.
- Next.js: Server Components by default; `"use client"` only where there is interaction. Data fetching goes through each app's `lib/api.ts` typed client.
- UI copy is plain and specific. Buttons say what they do ("Place order", "Mark as shipped").
- Accessibility: every control has a label, focus is visible, motion respects `prefers-reduced-motion`.

## Testing

- Pure logic (pricing, state machine, layouts, validators): Vitest unit tests, including edge cases.
- API: Vitest + Supertest + mongodb-memory-server (replica set, so transactions work). Every route gets a happy path, a validation failure and an auth failure where relevant.
- UI: test the logic, not the markup. Playwright covers the main purchase and fulfilment flows (phase 6).
- A bug fix starts with a failing test.

## Parallel work protocol (every phase prompt follows this)

Each phase runs as **Step A, then Step B, then Step C**.

- **Step A, lead only, serial.** Plan in Plan mode. Add or update contracts. Install every dependency the phase needs. Create the stub files that more than one agent would otherwise touch (route registry, nav entries, module folders with empty routers). Run `pnpm verify`. Commit on the phase branch.
- **Step B, fan out at least 5 `builder` subagents in parallel**, in one message, each with `isolation: worktree`. Each agent gets an exact list of paths it owns. An agent edits only its own paths.
- **Step C, lead only.** Merge each agent branch in the listed order, run `pnpm verify` after each merge, fix breakages, run the `verifier` agent, then the `code-simplifier` agent, then `/commit-push-pr`.

Shared files that only the lead edits, in Step A or C: root and app `package.json`, `pnpm-lock.yaml`, everything in `packages/contracts`, `apps/api/src/modules/index.ts`, admin nav config, `CLAUDE.md`, `docs/`.

If an agent needs a dependency, a contract change or a shared-file edit, it does not make it. It finishes what it can and lists the need in its report.

## When you are unsure

- Product question (a rule, a price, a country behaviour): do not guess. Use the assumption already written in `docs/product.md`, or stop and ask.
- Technical question with a reversible answer: choose the simplest option that keeps the rules above, and record it in your report so the lead can add it to `docs/decisions.md`.

## Lessons

Add a line here whenever Claude made a mistake that a rule would have prevented.

- Overwriting a generated config (`next.config.ts`) dropped the `@tailwindcss/turbopack` loader rule, so Tailwind silently stopped processing CSS. Diff against the generator's output before replacing a generated file.
- Turbo hides env vars that `turbo.json` does not declare, so `API_URL` never reached `next build` and `MONGODB_URI` never reached `pnpm dev`. Declare every env var an app reads under `env` for its tasks; the API loads `apps/api/.env` itself.
- A subagent ran `rm -f` on a system path (`/dev/null`) inside a compound command and replaced the device with a plain file. Agents never delete or recreate paths outside the repo; delete only named files inside it.
- `import { models } from "mongoose"` passed every Vitest run but crashed `pnpm dev` and would crash the built server: mongoose is CommonJS and Node's native ESM loader cannot see `models` or `connection` as named exports. Green tests do not prove the server boots; before saying an API phase is done, start it with `pnpm dev` and call it. An ESLint rule in `apps/api` now bans those two named imports.
- A long unbroken string (a pasted card message) stretched the whole phone layout to 1500px even though the text used `break-words`: `overflow-wrap: break-word` does not lower the minimum width of grid and flex parents. Use `wrap-anywhere` for any text a customer types, and check `document.documentElement.scrollWidth <= window.innerWidth` at 390px in the browser run.
- Comparing the HTML of two scenes said "different" when the animated and static renderers draw the same positions differently. Test determinism by comparing where each item lands on screen, normalised to the scene box.

