import { ORDER_STATUSES, type OrderStatus } from "@giftpop/contracts";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { insertOrder } from "../orders/fixtures";
import { OrderModel } from "../orders/model";

import { api, createAdminApp, signIn, type StaffSession } from "./admin-orders.test-utils";

useTestMongo();
beforeAll(async () => {
  await OrderModel.init();
});
beforeEach(clearDatabase);

const app = createAdminApp();

/** Written out by hand from docs/product.md, not read from the contract. */
const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  awaiting_payment: ["confirmed", "cancelled"],
  confirmed: ["in_production", "cancelled"],
  in_production: ["packed", "cancelled"],
  packed: ["shipped"],
  shipped: ["out_for_delivery", "returned"],
  out_for_delivery: ["delivered", "delivery_failed"],
  delivery_failed: ["out_for_delivery", "returned"],
  delivered: [],
  returned: [],
  cancelled: [],
};

const FULL = { courier: "TCS", trackingNumber: "TCS1", reason: "Customer asked" };

let session: StaffSession;
beforeEach(async () => {
  session = await signIn(app);
});

describe("POST /:id/status over the full 10 x 10 table", () => {
  for (const from of ORDER_STATUSES) {
    it(`from ${from}: allows exactly ${ALLOWED[from].join(", ") || "nothing"}`, async () => {
      for (const to of ORDER_STATUSES) {
        const id = await insertOrder(from, { paymentStatus: "advance_paid" });
        const res = await api(app, session).post(`/${id}/status`, { to, ...FULL });
        if (ALLOWED[from].includes(to)) {
          expect(res.status, `${from} -> ${to}`).toBe(200);
          expect(res.body.status).toBe(to);
        } else {
          expect(res.status, `${from} -> ${to}`).toBe(409);
          expect(res.body.error.code).toBe("INVALID_TRANSITION");
          const stored = await OrderModel.findById(id).lean();
          expect(stored?.status).toBe(from);
          expect(stored?.history).toHaveLength(1);
        }
      }
    });
  }
});

describe("POST /:id/status fields and history", () => {
  it("needs a courier and a tracking number to ship (422)", async () => {
    const id = await insertOrder("packed");
    for (const body of [{ to: "shipped" }, { to: "shipped", courier: "TCS" }]) {
      const res = await api(app, session).post(`/${id}/status`, body);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("MISSING_TRANSITION_FIELD");
    }
    const noCourier = await api(app, session).post(`/${id}/status`, {
      to: "shipped",
      trackingNumber: "X1",
    });
    expect(noCourier.status).toBe(422);
    expect((await OrderModel.findById(id).lean())?.status).toBe("packed");
  });

  it("needs a reason to cancel (422)", async () => {
    const id = await insertOrder("confirmed");
    const res = await api(app, session).post(`/${id}/status`, { to: "cancelled" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("MISSING_TRANSITION_FIELD");
  });

  it("stores the shipment with its tracking link when shipping", async () => {
    const id = await insertOrder("packed");
    const res = await api(app, session).post(`/${id}/status`, {
      to: "shipped",
      courier: "TCS",
      trackingNumber: "TCS123",
      trackingUrl: "https://track.example/TCS123",
    });
    expect(res.status).toBe(200);
    expect(res.body.shipment).toMatchObject({
      courier: "TCS",
      trackingNumber: "TCS123",
      trackingUrl: "https://track.example/TCS123",
    });
    expect(res.body.shipment.shippedAt).toEqual(expect.any(String));
  });

  it("records who made the change, by id and name", async () => {
    const id = await insertOrder("awaiting_payment", { paymentStatus: "advance_paid" });
    const res = await api(app, session).post(`/${id}/status`, {
      to: "confirmed",
      note: "Checked the transfer",
    });
    expect(res.status).toBe(200);
    expect(res.body.history).toHaveLength(2);
    expect(res.body.history[0].actorName).toBeNull();
    expect(res.body.history[1]).toMatchObject({
      from: "awaiting_payment",
      to: "confirmed",
      actorId: session.id,
      actorName: "Amina Staff",
      note: "Checked the transfer",
    });
  });

  it("refuses to confirm an order that has no payment recorded (422) and changes nothing", async () => {
    const id = await insertOrder("awaiting_payment", { paymentStatus: "unpaid" });
    const res = await api(app, session).post(`/${id}/status`, { to: "confirmed" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("PAYMENT_REQUIRED");
    expect(res.body.error.message).toMatch(/record the payment/i);
    const stored = await OrderModel.findById(id).lean();
    expect(stored?.status).toBe("awaiting_payment");
    expect(stored?.history).toHaveLength(1);
  });

  it("still lets staff cancel an unpaid order", async () => {
    const id = await insertOrder("awaiting_payment", { paymentStatus: "unpaid" });
    const res = await api(app, session).post(`/${id}/status`, {
      to: "cancelled",
      reason: "No reply",
    });
    expect(res.status).toBe(200);
  });

  it("answers 400 for a bad body or id and 404 for an unknown order", async () => {
    const id = await insertOrder("awaiting_payment");
    expect((await api(app, session).post(`/${id}/status`, { to: "nowhere" })).status).toBe(400);
    expect((await api(app, session).post(`/${id}/status`, {})).status).toBe(400);
    expect(
      (await api(app, session).post(`/${id}/status`, { to: "shipped", trackingUrl: "nope" }))
        .status,
    ).toBe(400);
    expect((await api(app, session).post("/not-an-id/status", { to: "confirmed" })).status).toBe(
      400,
    );
    const unknown = await api(app, session).post(`/${"b".repeat(24)}/status`, {
      to: "confirmed",
    });
    expect(unknown.status).toBe(404);
  });
});
