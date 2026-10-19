# The Giftpop

Customers pick a country, build a gift visually (pick a format, pick items, see it arranged, personalise) and order it. Staff receive the order in a separate admin app, make and pack it by hand, and ship it with custom shipment statuses.

## Repo layout

| Path                 | What                                                         |
| -------------------- | ------------------------------------------------------------ |
| `apps/web`           | Customer store and gift builder (Next.js)                    |
| `apps/admin`         | Admin panel, own URL and login (Next.js, shadcn/ui)          |
| `apps/api`           | The only backend, serves both apps (Express, Mongoose)       |
| `packages/contracts` | Zod schemas, shared types, pricing math, order state machine |
| `packages/renderer`  | Layout engines and `<GiftScene/>`                            |
| `packages/config`    | Shared tsconfig, ESLint, Prettier                            |
| `scripts/seed`       | Local dev data loader (`pnpm seed`)                          |
| `prompts`            | Phase prompts for building the product with Claude Code      |

## Prerequisites

- Node.js 22 (LTS) or newer
- pnpm 10 (`corepack enable` picks the version pinned in `package.json`)
- Docker, for MongoDB
- `jq`, used by the Claude Code format hook

## First-time setup

```bash
pnpm install
docker compose up -d        # MongoDB as a replica set (rs0) on port 27017
cp apps/api/.env.example   apps/api/.env
cp apps/web/.env.example   apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
pnpm seed                   # countries, packaging, items and prices
pnpm dev                    # starts all three apps
```

The root `.env.example` lists the variables the apps share. Do not put secrets in any `.env.example`.

| App   | URL                   |
| ----- | --------------------- |
| web   | http://localhost:3000 |
| admin | http://localhost:3001 |
| api   | http://localhost:4000 |

MongoDB URL: `mongodb://localhost:27017/giftpop?replicaSet=rs0`. The replica set is required because the API uses transactions. `docker compose ps` shows `healthy` once the node is primary. To wipe local data, run `docker compose down -v`.

## Commands

| Command                      | What it does                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `pnpm dev`                   | Runs web, admin and api                                                         |
| `pnpm verify`                | Lint, typecheck and tests for the whole repo. Run before saying work is done    |
| `pnpm build`                 | Builds every app and package                                                    |
| `pnpm --filter <pkg> verify` | Same as verify for one package, for example `pnpm --filter @giftpop/api verify` |
| `pnpm seed`                  | Loads local dev data                                                            |
| `pnpm format`                | Formats the repo with Prettier                                                  |

CI (`.github/workflows/ci.yml`) runs `pnpm verify` and `pnpm build` on every pull request and on pushes to `main`.

## Building with the phase prompts

The product is built in phases, one prompt per phase, with parallel agents. Read [`prompts/README.md`](prompts/README.md) for the order and how to run each one.

## Where the rules live

- [`CLAUDE.md`](CLAUDE.md): stack, non-negotiable rules, code style, testing, parallel work protocol
- [`docs/product.md`](docs/product.md): countries, pricing, payment, builder, orders
- [`docs/decisions.md`](docs/decisions.md): technical and product decisions made along the way
