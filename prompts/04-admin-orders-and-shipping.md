# Phase 4: Admin orders and shipment statuses

Start in Plan mode. Read `CLAUDE.md` and `docs/product.md` (sections "Orders" and "Admin") first. Follow the parallel work protocol in `CLAUDE.md` exactly.

**Run this phase with at least 5 `builder` subagents working in parallel in Step B.** Launch them all in one message so they run at the same time.

Requires: phase 3 merged.

## Goal

Staff see every order, know what needs doing, record payments, move orders through production and shipping with courier details, and print a packing sheet that shows exactly what to make.

## Step A: lead, serial

Work on branch `phase-4-admin-orders`.

1. Add contracts: `AdminOrderListQuery` (status, paymentStatus, country, date range, search, cursor pagination), `AdminOrderListItem`, `AdminOrderDetail`, `StatusChangeRequest` (to, note, plus shipment fields when required), `RecordPaymentRequest`, `AddNoteRequest`, `DashboardSummary`.
2. Register empty api modules `admin-orders` and `dashboard`.
3. Create thin admin pages: `(dashboard)/page.tsx`, `(dashboard)/orders/page.tsx`, `(dashboard)/orders/[id]/page.tsx`, `(dashboard)/orders/[id]/packing/page.tsx`, each importing a stub from `src/features/orders/<part>/` or `src/features/dashboard/`.
4. `pnpm verify`, commit.

## Step B: fan out (at least 5 agents, in parallel)

Launch these `builder` agents in one message. Give each the text of its row plus: "Read CLAUDE.md, docs/product.md and the contracts first; edit only the paths you own."

| Agent | You own | Build | Done when |
|---|---|---|---|
| 1 `api-admin-orders` | `apps/api/src/modules/admin-orders/**` | All behind `requireStaff`. `GET /admin/orders` with every filter in the contract, cursor pagination, search by order number, phone or email. `GET /admin/orders/:id` with full detail, proofs and history including actor names. `POST /admin/orders/:id/status` through `assertTransition`, requiring courier and tracking number for `shipped` and a reason for `cancelled`, appending history with the actor, restoring stock on cancel, enqueueing `status_changed`. `POST /admin/orders/:id/payments` calling `recordPayment`. `POST /admin/orders/:id/notes`. | Tests: every forbidden transition rejected, missing shipment fields rejected, history actor recorded, staff vs anonymous, filters combine correctly. |
| 2 `api-dashboard` | `apps/api/src/modules/dashboard/**` | `GET /admin/dashboard`: counts that need action (awaiting payment with a proof uploaded, confirmed to make, packed to ship, delivery failed), today's orders and revenue per currency (never summed across currencies), orders by country for the last 30 days. Uses aggregation with supporting indexes. | Tests with seeded orders across currencies and statuses; `explain()` shows index use for the main queries. |
| 3 `admin-orders-list` | `apps/admin/src/features/orders/list/**` | Orders table: number, date, country flag, customer, total in its currency, payment status pill, order status pill (one colour per status, defined once). Filter bar bound to the URL query so views can be shared, search box, quick tabs for "Needs payment check", "To make", "To ship". Infinite scroll or "Load more" on the cursor. | Filters survive refresh; empty and loading states exist; works at laptop width. |
| 4 `admin-order-detail` | `apps/admin/src/features/orders/detail/**` | Detail page: the exact gift in `<GiftScene/>` from the stored design, item snapshot table, personalisation texts large and copyable, contact and address, payment panel (quote, due now, received, proofs with zoom), status timeline with actors and notes, internal notes box. | Shows an order exactly as the customer built it, even after the item was edited in the catalog. |
| 5 `admin-order-actions` | `apps/admin/src/features/orders/actions/**` | "Change status" menu that only offers allowed next statuses from `canTransition`; the shipped dialog requires courier, tracking number and optional tracking URL; the cancel dialog requires a reason; "Record payment" dialog (amount in the order currency, method, reference); every action shows a toast and refreshes the detail. These components are imported by the detail page through one exported `OrderActions` component. | Forbidden actions are never offered; API errors show in the dialog, not a blank screen. |
| 6 `admin-packing-and-dashboard` | `apps/admin/src/features/orders/packing/**`, `apps/admin/src/features/dashboard/**` | Packing sheet: a print-friendly page (`@media print`) with a large scene, a checklist of items with quantities, wrapper and ribbon colours, personalisation texts in large type, card message, and an address label block. Dashboard: tiles for each "needs action" count linking to the filtered list, today's orders, a small orders-by-country table. | Packing sheet prints on one A4 page for a 10-item bouquet; each dashboard tile opens the matching filtered list. |

## Step C: lead

1. Merge in this order: 1, 2, 3, 4, 5, 6. `pnpm verify` after each.
2. Apply every "Needs from lead" item, including wiring `OrderActions` into the detail page if needed.
3. In a browser: place a PK cash-on-delivery order in the store, upload a proof, then in admin record the advance, move it through to delivered with a courier and tracking number, and confirm each change appears on the customer track page. Print the packing sheet.
4. `verifier`, fix "Must fix", `code-simplifier`.
5. Record assumptions in `docs/decisions.md`, lessons in `CLAUDE.md`. `/commit-push-pr`.

## Definition of done

- Staff can run an order from placed to delivered without touching the database.
- No path lets an order skip the state machine.
- The admin shows the gift exactly as ordered.
- Revenue figures are never mixed across currencies.

## Out of scope

Courier API integrations (statuses are entered by staff), refunds through a gateway.
