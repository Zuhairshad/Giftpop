import { DashboardSummarySchema, type OrderStatus } from "@giftpop/contracts";
import { Types } from "mongoose";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { loginAs, seedStaff } from "../auth/auth.test-utils";
import { resetLoginRateLimit } from "../auth/rate-limit";
import { authRouter } from "../auth/router";
import { insertOrder } from "../orders/fixtures";
import { OrderModel, type OrderDoc, type OrderPaymentDoc } from "../orders/model";

import {
  awaitingProofQuery,
  ordersByCountryQuery,
  ordersTodayQuery,
  revenueTodayQuery,
  statusCountsQuery,
  type DashboardQuery,
} from "./queries";
import { createDashboardRouter } from "./router";

useTestMongo();

const NOW = new Date("2026-10-19T12:00:00.000Z");
const DAY = 86_400_000;
const app = createTestApp([
  { path: "/auth", router: authRouter },
  { path: "/admin/dashboard", router: createDashboardRouter({ now: () => NOW }) },
]);

let cookie: string;
beforeAll(async () => {
  await OrderModel.init();
});
beforeEach(async () => {
  resetLoginRateLimit();
  await clearDatabase();
  await seedStaff();
  cookie = await loginAs(app, "owner@giftpop.test");
});

async function summary() {
  const res = await request(app).get("/v1/admin/dashboard").set("Cookie", cookie);
  expect(res.status).toBe(200);
  return DashboardSummarySchema.parse(res.body);
}

function order(status: OrderStatus, overrides: Partial<OrderDoc> = {}): Promise<string> {
  // Default to an old order so it does not count towards "today" or the 30-day window.
  return insertOrder(status, { createdAt: new Date(NOW.getTime() - 90 * DAY), ...overrides });
}

function payment(
  kind: OrderPaymentDoc["kind"],
  currency: OrderPaymentDoc["amount"]["currency"],
  amountMinor: number,
  recordedAt: Date,
): OrderPaymentDoc {
  return {
    _id: new Types.ObjectId(),
    kind,
    method: "manual_transfer",
    amount: { amountMinor, currency },
    recordedBy: new Types.ObjectId(),
    recordedAt,
  };
}

const proof = (status: "pending" | "accepted" | "rejected") => ({
  _id: new Types.ObjectId(),
  url: "https://example.test/p.webp",
  status,
  uploadedAt: NOW,
});

describe("GET /v1/admin/dashboard", () => {
  it("answers 401 without a session", async () => {
    const res = await request(app).get("/v1/admin/dashboard");
    expect(res.status).toBe(401);
  });

  it("returns zeros and empty arrays for an empty database", async () => {
    expect(await summary()).toEqual({
      needsAction: { awaitingPaymentWithProof: 0, toMake: 0, toShip: 0, deliveryFailed: 0 },
      today: { orders: 0, revenue: [] },
      ordersByCountry: [],
    });
  });

  it("counts each needs-action bucket and ignores orders that do not belong", async () => {
    await order("awaiting_payment", { proofs: [proof("pending")] });
    await order("awaiting_payment", { proofs: [proof("accepted"), proof("pending")] });
    await order("awaiting_payment", { proofs: [proof("accepted"), proof("rejected")] });
    await order("awaiting_payment");
    await order("confirmed", { proofs: [proof("pending")] });
    await order("confirmed");
    await order("confirmed");
    await order("packed");
    await order("shipped");
    await order("delivery_failed");
    await order("delivery_failed");
    await order("delivery_failed");
    await order("delivered");
    const { needsAction } = await summary();
    expect(needsAction).toEqual({
      awaitingPaymentWithProof: 2,
      toMake: 3,
      toShip: 1,
      deliveryFailed: 3,
    });
  });

  it("counts today's orders by UTC day, around midnight", async () => {
    const midnight = new Date("2026-10-19T00:00:00.000Z");
    await order("confirmed", { createdAt: new Date(midnight.getTime() - 1) });
    await order("confirmed", { createdAt: midnight });
    await order("confirmed", { createdAt: new Date("2026-10-19T23:59:59.999Z") });
    await order("confirmed", { createdAt: new Date("2026-10-20T00:00:00.000Z") });
    expect((await summary()).today.orders).toBe(2);
  });

  it("sums revenue per currency, never across currencies, and skips refunds and other days", async () => {
    const today = new Date("2026-10-19T08:00:00.000Z");
    const yesterday = new Date("2026-10-18T23:59:59.999Z");
    await order("confirmed", {
      country: "PK",
      payments: [
        payment("advance", "PKR", 41_000, today),
        payment("balance", "PKR", 10_000, today),
        payment("refund", "PKR", 5_000, today),
        payment("full", "PKR", 99_000, yesterday),
      ],
    });
    await order("confirmed", { country: "PK", payments: [payment("full", "PKR", 1_000, today)] });
    await order("confirmed", { country: "US", payments: [payment("full", "USD", 2_500, today)] });
    await order("confirmed", { country: "GB", payments: [payment("full", "GBP", 3_000, today)] });
    const { today: t } = await summary();
    expect(t.revenue).toEqual([
      { currency: "GBP", amountMinor: 3_000 },
      { currency: "PKR", amountMinor: 52_000 },
      { currency: "USD", amountMinor: 2_500 },
    ]);
  });

  it("includes the 30-day boundary and orders cancelled, ordered most first then by code", async () => {
    const edge = new Date(NOW.getTime() - 30 * DAY);
    await order("confirmed", { country: "PK", createdAt: edge });
    await order("confirmed", { country: "PK", createdAt: new Date(edge.getTime() - 1) });
    await order("cancelled", { country: "GB", createdAt: new Date(NOW.getTime() - DAY) });
    await order("confirmed", { country: "US", createdAt: new Date(NOW.getTime() - DAY) });
    await order("confirmed", { country: "AE", createdAt: NOW });
    await order("confirmed", { country: "PK", createdAt: new Date(NOW.getTime() - 2 * DAY) });
    expect((await summary()).ordersByCountry).toEqual([
      { country: "PK", orders: 2 },
      { country: "AE", orders: 1 },
      { country: "GB", orders: 1 },
      { country: "US", orders: 1 },
    ]);
  });
});

describe("dashboard queries use an index", () => {
  const queries: [string, DashboardQuery][] = [
    ["status counts", statusCountsQuery()],
    ["awaiting with proof", awaitingProofQuery()],
    ["orders today", ordersTodayQuery(NOW)],
    ["revenue today", revenueTodayQuery(NOW)],
    ["orders by country", ordersByCountryQuery(NOW)],
  ];

  it.each(queries)("%s: IXSCAN and no COLLSCAN", async (_name, query) => {
    await order("confirmed");
    const plan = await OrderModel.collection
      .aggregate(query.pipeline, { hint: query.hint })
      .explain("queryPlanner");
    const text = JSON.stringify(plan);
    expect(text).toMatch(/IXSCAN|COUNT_SCAN/);
    expect(text).not.toContain("COLLSCAN");
  });
});
