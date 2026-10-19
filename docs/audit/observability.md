# Observability audit and runbook

Slice: `observability` (phase 6). Written so the runbook part (from "Runbook" down) can move to `docs/runbook.md` unchanged.

## What was built

| Piece | Where | Behaviour |
|---|---|---|
| Request id | `apps/api/src/lib/observability/request.ts` | Accepts `X-Request-Id` only if it matches `[A-Za-z0-9_-]{1,64}`, else generates a UUID. Returned as the `x-request-id` response header. Kept in `AsyncLocalStorage`, so any `logger.*` call made while serving the request carries `requestId`, even in services. `req.log` is a child logger with the id bound. |
| Access log | same | One line per request, message `request completed`: `method`, `route` (pattern such as `/v1/orders/track`, or `unmatched`), `status`, `durationMs`. Never the raw URL or query string. Level is info for 2xx/3xx, warn for 4xx, error for 5xx. `/health` and `/ready` log at debug when they succeed. An aborted connection adds `aborted: true`. |
| Masking | `lib/observability/mask.ts`, `logger.ts` | Every log call is masked: keys `phone, email, contact, address, line1, line2, cardMessage, recipientName, itemNames, password*, *token*, *secret*, cookie, authorization, set-cookie, x-api-key` are replaced by `[redacted]` at any depth (case and `-`/`_` ignored); emails become `[email]`; phone-looking digit runs (7 to 15 digits) become `[phone]`, in strings, message text, and error `message`, `stack`, extra fields and `cause`. `requestId` is exempt so digits in it survive. The notification console transport keeps its own masking. |
| Optional Sentry | `lib/observability/sentry.ts` | `initObservability(env)` returns `false` and imports nothing unless `SENTRY_DSN` is set (dynamic import). When on: `sendDefaultPii: false` plus the SDK 11 `dataCollection` switches all off (see decision below), `maxBreadcrumbs: 0`, and `beforeSend` removes request body, cookies, headers, query string, user, breadcrumbs and extra, and masks the rest like logs. |
| Reporting | same | `reportError(err, requestId)` tags `request_id`; no-op without a DSN; ignores `AppError`, `ZodError` and `TransitionError`. |
| Metrics | `modules/metrics/` | `GET /v1/admin/metrics`, staff only, JSON, `Cache-Control: no-store`. |
| Env | `apps/api/src/env.ts` | `SENTRY_DSN` (empty means off, must be a URL), `SENTRY_TRACES_SAMPLE_RATE` (0 to 1, default 0). `LOG_LEVEL` already existed. |

Tests: `log-capture.test.ts` runs an order placement (with email, phone, address, card message), a staff login, a track lookup by phone, a failing request whose error echoes an email and phone, and a service log through supertest into an in-memory pino stream. It asserts every line is JSON with a `requestId` and that none of the raw phone, email, address, card message or password strings appear. `sentry.test.ts` proves the SDK module factory is never evaluated and `init` is never called without a DSN.

### Wiring the lead must do (files this slice does not own)

1. `apps/api/src/modules/index.ts`: add `import { metricsRouter } from "./metrics/router";` and the registry line `{ path: "/admin/metrics", router: metricsRouter },` next to the other staff-only entries.
2. `apps/api/src/server.ts`: after `parseEnv`, before creating the app: `await initObservability(env);` (import from `./lib/observability/sentry`). In `shutdown`, `await flushObservability()` before `process.exit` is optional.
3. `apps/api/src/middleware/error.ts` (security agent's file): in `errorHandler`, inside the existing `if (status >= 500)` block, add `reportError(error, req.id);` (import from `../lib/observability/sentry`). `req.id` is set by the new request middleware; `req.log` is unchanged.
4. Contracts: add `MetricsResponseSchema` (proposal below) and replace the `TODO(contracts)` interface in `modules/metrics/service.ts`; then `res.json(MetricsResponseSchema.parse(...))` in the router.
5. `.env.example` / `docs/deploy.md`: document `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`, `LOG_LEVEL`.
6. `turbo.json`: declare `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE` under `env` (CLAUDE.md lesson on Turbo hiding env vars).

Edits made to `app.ts` (two): removed the `pino-http` and `node:crypto` imports and replaced the `app.use(pinoHttp({...}))` block with `app.use(requestObservability({ logger }));` (same position, first middleware). Added one import line. `pino-http` stays in `package.json` but is no longer used by the API (lead may remove it).

### Proposed contract

```ts
// packages/contracts/src/metrics.ts
import { z } from "zod";
import { OrderStatusSchema } from "./order-status";

const Minutes = z.number().int().min(0).nullable();

export const MetricsResponseSchema = z.object({
  generatedAt: z.iso.datetime(),
  orders: z.object({
    byStatus: z.record(OrderStatusSchema, z.number().int().min(0)),
    createdLast24h: z.number().int().min(0),
    createdLast7d: z.number().int().min(0),
    oldestAwaitingPaymentAgeMinutes: Minutes,
    oldestConfirmedAgeMinutes: Minutes,
  }),
  outbox: z.object({
    pending: z.number().int().min(0),
    failed: z.number().int().min(0),
    oldestPendingAgeMinutes: Minutes,
  }),
  process: z.object({
    uptimeSeconds: z.number().int().min(0),
    mongoReady: z.boolean(),
    version: z.string(),
  }),
});
export type MetricsResponse = z.infer<typeof MetricsResponseSchema>;
```

### Findings and decisions

- Sentry SDK 11 has no `sendDefaultPii` option in its types; it uses `dataCollection`. The code passes both (`sendDefaultPii: false` is harmless) and sets every `dataCollection` switch to off. Medium: if a future SDK upgrade drops `sendDefaultPii` silently, `dataCollection` and `beforeSend` still hold the line.
- Error messages are the main leak risk (Mongo duplicate key errors carry `keyValue` with the user's email, zod issues can echo input). The mask covers error fields and `keyValue` by key; any other service that logs a raw request body is covered by key masking only if it uses the listed key names. Rule for new code: never log `req.body`, `req.query` or `req.params` directly.
- Names (`contact.name`, `recipientName` is masked, but a free-text `name` key is not) are not detected by pattern. Do not log customer names.
- Metrics cost: one covered `$group` over the `{status, createdAt}` index (O(orders) index keys, no document reads), two counts on the `createdAt` index, four single-key index reads. Fine to poll every minute up to a few hundred thousand orders; beyond that, replace the group with per-status counters. Each query hints its index (tests run `explain` and fail on `COLLSCAN` or an in-memory `SORT`).
- "Oldest confirmed" is measured from the order's creation time, not from when it was confirmed (no indexed confirm time exists). An order that waited a long time for payment therefore looks old the moment it is confirmed. Treat it as an upper bound.
- `oldestPendingAgeMinutes` is how long the most overdue pending outbox entry has waited past its `nextAttemptAt` (0 when nothing is due). A message in a healthy retry back-off is not counted as stuck.
- Probes (`/health`, `/ready`) are logged at debug, not info, to keep the log readable; failures still log at warn or error.
- The route pattern comes from the matched Express route. Routers mounted with a parameter in the mount path would show the real value; none do today (checked `modules/index.ts`).

## Runbook

### Quick map

- Logs are JSON lines (pino). Find the request with the `x-request-id` header value: `requestId:"<id>"`. Every line of that request, including service-level and error lines, has it.
- `GET /health` is liveness (no database). `GET /ready` is readiness (needs Mongo). `GET /v1/admin/metrics` needs a staff session cookie.
- Sentry (if `SENTRY_DSN` is set) holds 5xx errors tagged `request_id`.

### Orders stopped arriving

Work top to bottom; stop when you find the cause.

1. **Is the API up?** `GET /health` (200 `ok`) then `GET /ready`. `/ready` 503 means Mongo is not connected: go to step 6.
2. **Can a customer reach it?** Open the store, build a gift, check the browser network tab for `POST /api/orders`. A browser-side failure (CORS, wrong `API_URL`, web app down) never reaches the API log: if there are no `request completed` lines with `route:"/v1/orders"` at all, the problem is before the API (DNS, web rewrite, firewall).
3. **`POST /v1/orders` status mix.** Search logs for `route:"/v1/orders"` and group by `status`. 5xx: open one line, take its `requestId`, read the `Unhandled error` line for that id (message and stack are masked but useful). 4xx: see steps 4 to 5 and 7.
4. **Idempotency 409 spike.** Many 409 on the order route means clients reuse an `Idempotency-Key` with a changed body, or a parallel double submit. Normal at a low rate (double clicks). A spike after a web deploy usually means the checkout generates the key once per page load instead of per attempt. A stuck marker is taken over after 60 s.
5. **Sold out everywhere.** A flood of 409 with stock details, or 422 `DESIGN_INVALID`, means price rows have `inStock: false` or `stockQty` 0 (stock is reserved at order time, cancelled orders release it). Check the catalog in the admin for the packaging and the best-selling items in that country. A country flipped to `coming_soon` answers 422 `VALIDATION_ERROR`.
6. **Mongo.** `/ready` 503, or 5xx with `MongoServerSelectionError` / `NotWritablePrimary` / `not primary` in the error line: a primary election or network problem. Check Atlas (or the replica set) for the state; the API retries on its own and `/ready` recovers. Orders need a transaction, so a secondary-only state fails all order writes while reads may still work. If `process.mongoReady` is false in metrics, the same applies.
7. **Rate limiter sharing one bucket.** 429 on `POST /v1/orders` (20 per minute per IP), `/v1/quotes` (60), `/v1/designs` (20), track (10) for many different customers means the API sees one client IP, the web server's. Set `TRUST_PROXY_HOPS` to the number of proxies in front of the API (1 behind the web rewrite, 2 with a load balancer in front of that) and restart. Symptom in logs: many 429 lines in a short time on a quiet site.
8. **Asset storage failing.** Does not block orders, but images vanish and uploads fail: look for 5xx on `/v1/assets` and `STORAGE_DRIVER`/R2 errors in the error line. Check R2 credentials, bucket and `PUBLIC_ASSET_BASE_URL`. A scene without images shows placeholders, so customers may still order.
9. **Orders arrive but nothing happens next.** Look at the metrics: `outbox.pending` growing and `oldestPendingAgeMinutes` rising means the worker is off or failing (`NOTIFICATIONS_WORKER=on` in exactly one instance). `outbox.failed` rising means the transport rejects messages. Orders themselves are safe: a transport failure never touches an order.
10. **Still nothing.** Compare `orders.createdLast24h` with the same hour yesterday. If metrics say orders are being created but staff do not see them, the admin app is pointing at the wrong API or the staff session expired (7 days).

### What the metrics mean

| Field | Meaning | Suggested alert |
|---|---|---|
| `orders.byStatus.<status>` | Orders now in that status (all ten always present). | Informational. Chart `awaiting_payment`, `confirmed`, `packed`. |
| `orders.createdLast24h`, `createdLast7d` | Orders placed in the window. | Page if `createdLast24h` is 0 for more than 12 h during business hours on a day when the 7-day average is above 5 per day. |
| `orders.oldestAwaitingPaymentAgeMinutes` | Age of the oldest order still waiting for payment (null when none). | Warn above 2880 (2 days): staff are not recording payments, or customers are not paying. |
| `orders.oldestConfirmedAgeMinutes` | Age of the oldest order still `confirmed` (null when none), measured from creation. | Warn above 4320 (3 days): paid orders are not being made. |
| `outbox.pending` | Messages waiting to be sent. | Warn above 50. |
| `outbox.failed` | Messages that gave up after the retry schedule (kept 30 days). | Warn above 0 (any new one); investigate the transport. |
| `outbox.oldestPendingAgeMinutes` | Minutes the most overdue pending message has waited past its due time. | Page above 15: the worker is not running. |
| `process.uptimeSeconds` | Seconds since this process started. | Repeated small values mean crash loops. |
| `process.mongoReady` | Mongoose connection state is connected. | Page when false for more than 2 minutes. |
| `process.version` | `apps/api` package version. | Confirms which build is live after a deploy or rollback. |

Poll once a minute with a staff session cookie (create a dedicated staff account for the monitor; it only needs the `staff` role). Treat 401 as "monitor credentials expired" (sessions last 7 days), not as an outage. For a plain uptime check use `/ready`, which needs no login.

### Finding one customer's order without logging personal data

The logs never hold names, emails or phone numbers, so search by identifiers that are safe:

1. Ask the customer for the **order number** (`GP-PK-7K2M9Q`, shown on the confirmation page and in messages) and the time they tried, and the **request id** if the page showed one (the browser's network tab shows the `x-request-id` response header).
2. In the admin, open Orders and search the order number (exact). If they only know their contact, staff can search by the email or phone in the admin search box: it matches exactly and the search text is never written to the logs (access lines carry only the route pattern).
3. For a failed attempt with no order number: take the time window and the customer's request id, and read all log lines with that `requestId`. The access line shows `route`, `status` and `durationMs`; an error line shows the masked failure.
4. Without a request id, filter access lines by `route:"/v1/orders"`, `status:>=400` and the time window; there is at most a handful per minute outside an incident.
5. Do not paste customer details into log search, tickets or Sentry. If a customer sends a screenshot with a request id, use only the id.

### Operating notes

- Raise detail temporarily with `LOG_LEVEL=debug` (adds probe lines). Masking stays on at every level.
- To prove masking after a change, run `pnpm --filter @giftpop/api test -- log-capture`.
- Turning Sentry on: set `SENTRY_DSN` (and optionally `SENTRY_TRACES_SAMPLE_RATE`, 0 to 1; traces cost quota, keep 0 to 0.1) and restart. Removing the DSN turns it fully off again; the SDK is not loaded.
