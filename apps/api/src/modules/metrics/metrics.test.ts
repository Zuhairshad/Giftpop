import { ORDER_STATUSES, type OrderStatus } from "@giftpop/contracts";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { loginAs, seedStaff } from "../auth/auth.test-utils";
import { resetLoginRateLimit } from "../auth/rate-limit";
import { authRouter } from "../auth/router";
import { OutboxModel } from "../notifications/model";
import { insertOrder } from "../orders/fixtures";
import { OrderModel } from "../orders/model";

import { createMetricsRouter } from "./router";
import { METRICS_HINTS, getMetrics } from "./service";

useTestMongo();

const NOW = new Date("2026-10-19T12:00:00.000Z");
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(NOW.getTime() - ms);

const app = createTestApp([
  { path: "/auth", router: authRouter },
  { path: "/admin/metrics", router: createMetricsRouter({ now: () => NOW }) },
]);

beforeAll(async () => {
  await Promise.all([OrderModel.init(), OutboxModel.init()]);
});
beforeEach(async () => {
  resetLoginRateLimit();
  await clearDatabase();
});

const order = (status: OrderStatus, createdAt: Date) => insertOrder(status, { createdAt });
const outbox = (status: "pending" | "sent" | "failed", nextAttemptAt: Date) =>
  OutboxModel.create({ type: "staff_alert", channel: "console", status, nextAttemptAt });

async function signedIn() {
  await seedStaff({ email: "staff@giftpop.test" });
  return loginAs(app, "staff@giftpop.test");
}

describe("GET /v1/admin/metrics", () => {
  it("answers 401 without a session", async () => {
    const res = await request(app).get("/v1/admin/metrics");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("reports an empty database with every status at zero and nulls for ages", async () => {
    const cookie = await signedIn();
    const res = await request(app).get("/v1/admin/metrics").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(Object.keys(res.body.orders.byStatus).sort()).toEqual([...ORDER_STATUSES].sort());
    expect(Object.values(res.body.orders.byStatus).every((n) => n === 0)).toBe(true);
    expect(res.body.orders).toMatchObject({
      createdLast24h: 0,
      createdLast7d: 0,
      oldestAwaitingPaymentAgeMinutes: null,
      oldestConfirmedAgeMinutes: null,
    });
    expect(res.body.outbox).toEqual({ pending: 0, failed: 0, oldestPendingAgeMinutes: null });
    expect(res.body.process).toMatchObject({ mongoReady: true, version: "0.0.0" });
    expect(res.body.process.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(res.body.generatedAt).toBe(NOW.toISOString());
  });

  it("counts orders by status and by age, and finds the oldest stuck orders", async () => {
    await Promise.all([
      order("awaiting_payment", ago(90 * MIN)),
      order("awaiting_payment", ago(10 * MIN)),
      order("confirmed", ago(3 * DAY + 5 * MIN)),
      order("confirmed", ago(2 * HOUR)),
      order("shipped", ago(20 * DAY)),
      order("delivered", ago(40 * DAY)),
      order("cancelled", ago(12 * HOUR)),
    ]);
    const cookie = await signedIn();
    const res = await request(app).get("/v1/admin/metrics").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.orders.byStatus).toMatchObject({
      awaiting_payment: 2,
      confirmed: 2,
      shipped: 1,
      delivered: 1,
      cancelled: 1,
      packed: 0,
      returned: 0,
    });
    // 24 h: two awaiting, confirmed 2 h ago, cancelled 12 h ago. 7 d adds the 3-day-old confirmed.
    expect(res.body.orders.createdLast24h).toBe(4);
    expect(res.body.orders.createdLast7d).toBe(5);
    expect(res.body.orders.oldestAwaitingPaymentAgeMinutes).toBe(90);
    expect(res.body.orders.oldestConfirmedAgeMinutes).toBe(3 * 24 * 60 + 5);
  });

  it("reports the notification outbox backlog", async () => {
    await Promise.all([
      outbox("pending", ago(45 * MIN)),
      outbox("pending", ago(5 * MIN)),
      outbox("pending", new Date(NOW.getTime() + HOUR)), // retry scheduled later: not overdue
      outbox("sent", ago(DAY)),
      outbox("failed", ago(DAY)),
      outbox("failed", ago(2 * DAY)),
    ]);
    const metrics = await getMetrics(NOW);
    expect(metrics.outbox).toEqual({ pending: 3, failed: 2, oldestPendingAgeMinutes: 45 });
  });

  it("never reports a negative age", async () => {
    await outbox("pending", new Date(NOW.getTime() + HOUR));
    expect((await getMetrics(NOW)).outbox.oldestPendingAgeMinutes).toBe(0);
  });

  it("leaves no personal data in the response", async () => {
    await order("confirmed", ago(HOUR));
    const cookie = await signedIn();
    const res = await request(app).get("/v1/admin/metrics").set("Cookie", cookie);
    expect(res.text).not.toMatch(/sara@example\.com|1234567|Garden Road/);
  });
});

describe("metrics queries use indexes", () => {
  const plan = (value: unknown) => JSON.stringify(value);

  it("reads every query through an index with no collection scan", async () => {
    await order("confirmed", ago(HOUR));
    await outbox("pending", ago(HOUR));
    const since = ago(DAY);

    const plans = await Promise.all([
      OrderModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }], {
        hint: METRICS_HINTS.ordersByStatus,
      }).explain("executionStats"),
      OrderModel.collection
        .find({ createdAt: { $gte: since } })
        .hint(METRICS_HINTS.ordersByCreatedAt)
        .explain("executionStats"),
      OrderModel.collection
        .find({ status: "confirmed" })
        .sort({ createdAt: 1 })
        .hint(METRICS_HINTS.ordersByStatus)
        .explain("executionStats"),
      OutboxModel.collection
        .find({ status: "pending" })
        .sort({ nextAttemptAt: 1 })
        .hint(METRICS_HINTS.outboxByStatus)
        .explain("executionStats"),
    ]);

    for (const explained of plans) {
      const text = plan(explained);
      expect(text).toContain("IXSCAN");
      expect(text).not.toContain("COLLSCAN");
      expect(text).not.toContain('"stage":"SORT"');
    }
  });

  it("declares the hinted indexes on the models", async () => {
    const orderKeys = (await OrderModel.collection.indexes()).map((index) => plan(index.key));
    const outboxKeys = (await OutboxModel.collection.indexes()).map((index) => plan(index.key));
    expect(orderKeys).toContain(plan(METRICS_HINTS.ordersByStatus));
    expect(orderKeys).toContain(plan(METRICS_HINTS.ordersByCreatedAt));
    expect(outboxKeys).toContain(plan(METRICS_HINTS.outboxByStatus));
  });
});
