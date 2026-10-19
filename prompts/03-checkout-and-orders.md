# Phase 3: Checkout, orders and tracking

Start in Plan mode. Read `CLAUDE.md` and `docs/product.md` (sections "Payment" and "Orders") first. Follow the parallel work protocol in `CLAUDE.md` exactly.

**Run this phase with at least 5 `builder` subagents working in parallel in Step B.** Launch them all in one message so they run at the same time.

Requires: phase 2 merged. Can run in a separate parallel session with phase 5 (`claude --worktree phase-3`); merge phase 3 first.

## Goal

A customer turns a finished design into an order with their address, chooses Pay now (20% off) or Cash on delivery (20% advance), sees what to pay and how, can upload proof of payment, and can track the order. The order is frozen exactly as built.

## Step A: lead, serial

Work on branch `phase-3-orders`.

1. Re-read `order.ts`, `order-status.ts`, `payment.ts`. Add `CreateOrderRequest` (country, paymentMode, design, contact, address validated against the country's `addressFormat`), `CreateOrderResponse` (orderNumber, quote, dueNow, paymentInstructions), `TrackOrderRequest` (orderNumber plus phone or email), `PublicOrderView`, `PaymentProofUpload`.
2. Register empty api modules `orders`, `payments`, `notifications`. Create `apps/api/src/middleware/idempotency.ts` as a stub with its final signature.
3. Create thin web pages `src/app/[country]/checkout/page.tsx`, `src/app/order/[orderNumber]/page.tsx`, `src/app/track/page.tsx`, each importing a stub from `src/features/checkout/`, `src/features/order/`, `src/features/track/`.
4. `pnpm verify`, commit.

## Step B: fan out (at least 5 agents, in parallel)

Launch these `builder` agents in one message. Give each the text of its row plus: "Read CLAUDE.md, docs/product.md and the contracts first; edit only the paths you own."

| Agent | You own | Build | Done when |
|---|---|---|---|
| 1 `api-orders` | `apps/api/src/modules/orders/**`, `apps/api/src/middleware/idempotency.ts` | `POST /orders` in a Mongo transaction: re-validate the design against the database catalog, re-price with `computeQuote`, snapshot every item's name and unit price, decrement stock where tracked, generate a unique order number (`GP-<CC>-<6 base32>`, retry on collision), status `awaiting_payment`, payment status `unpaid`, first history entry, enqueue an `order_created` notification. Idempotency: same `Idempotency-Key` within 24 h returns the first response; same key with a different body returns 409. `POST /orders/track` returns `PublicOrderView` only when the contact matches (same 404 either way, rate-limited). Indexes on number, country + status + createdAt, contact phone and email. | Tests: price tampering ignored, out-of-stock race (two orders for the last unit, one fails), idempotent retry, track with wrong phone gives 404, snapshot unchanged after a catalog price edit. |
| 2 `api-payments` | `apps/api/src/modules/payments/**` | `PaymentProvider` implementations: `manual_transfer` (prepaid: due now is the full total) and `cod` (due now is the 20% advance), both returning the country's `paymentInstructions`; `card` registered but throwing `NOT_AVAILABLE`. Provider chosen from country config and mode, never by country code. `POST /orders/:number/payment-proof` (contact check, image via the assets storage, stored as pending proof on the order). Service function `recordPayment(orderId, amount, method, staffId)` that phase 4 will expose, updating payment status and moving `awaiting_payment` to `confirmed` through the state machine once the due-now amount is covered. | Tests: both modes' due-now amounts, proof upload auth, `recordPayment` partial and full, state transition goes through `assertTransition`. |
| 3 `web-checkout` | `apps/web/src/features/checkout/**` | Checkout page: gift summary with the scene, contact (name, email, phone with country dial code), address form generated from the country's `addressFormat`, payment mode cards showing the exact amounts from the quote, terms line, "Place order". Sends an idempotency key generated once per attempt (kept across retries). Field-level errors from the API shown inline. Redirects to `/order/<number>` on success and clears the builder state. | Address form fields change per country (try PK, GB, US); double-clicking "Place order" creates one order. |
| 4 `web-order-track` | `apps/web/src/features/order/**`, `apps/web/src/features/track/**` | Order page: order number with a copy button, amount to pay now and on delivery, payment instructions, proof-of-payment upload with preview and success state, what happens next. Track page: order number plus phone or email, then status timeline (dates only, no staff notes), courier and tracking link when shipped, the gift scene. | Proof upload works; tracking shows the history after a status change made directly in the database. |
| 5 `api-notifications` | `apps/api/src/modules/notifications/**` | Outbox collection (`type`, `orderId`, `channel`, `payload`, `status`, `attempts`, `nextAttemptAt`). `enqueue()` used by orders and payments. A worker function `processOutbox()` with retry and backoff, a `console` transport for dev and an `email` transport interface (provider chosen later). Templates for `order_created`, `payment_recorded`, `status_changed` in plain text. Start the worker on an interval in `server.ts` only when `NOTIFICATIONS_WORKER=on`. | Tests: enqueue inside a transaction, retry with backoff, a failing transport never blocks order creation. |
| 6 `api-order-flows` | `apps/api/test/flows/**` | End-to-end API tests over the real modules: PK cash on delivery (quote, order, proof, record advance, confirmed), US pay now (20% off), SA with free-shipping threshold, a coming-soon country rejected, a design with an inactive item rejected. | Agents 1, 2 and 5 build those modules at the same time, so in your worktree the tests compile but fail (routes are still stubs). That is expected: write them from `docs/product.md` and the contracts, make lint and typecheck pass, and report them as "written, not runnable until merge". The lead runs them after merging 1, 2 and 5. |

## Step C: lead

1. Merge in this order: 5, 2, 1, 6, 3, 4. `pnpm verify` after each.
2. Apply every "Needs from lead" item. Wire the notification worker into `server.ts` if agent 5 needed it. Run agent 6's flow tests now; a failing flow means a module is wrong, not the test, unless the test contradicts `docs/product.md`.
3. In a browser: build a gift for PK, check out with cash on delivery, upload a proof, then call `recordPayment` from a script and watch the track page update. Repeat for US pay now.
4. `verifier`, fix "Must fix", `code-simplifier`.
5. Record assumptions in `docs/decisions.md`, lessons in `CLAUDE.md`. `/commit-push-pr`.

## Definition of done

- Orders are priced and validated only on the server, created atomically, and idempotent.
- The order keeps the exact design and prices even after the catalog changes.
- Both payment modes give the right amounts for every live country.
- Customers can track an order without an account, and never see staff data.

## Out of scope

Admin order screens (phase 4), card gateway, real email provider.
