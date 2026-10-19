import { ORDER_STATUSES, TransitionError } from "@giftpop/contracts";
import { Types } from "mongoose";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { clearDatabase, useTestMongo } from "../../../test/mongo";

import { insertOrder } from "./fixtures";
import { OrderModel } from "./model";
import { transitionOrder } from "./transition";

useTestMongo();
beforeAll(async () => {
  await OrderModel.init();
});
beforeEach(clearDatabase);

const staffId = new Types.ObjectId().toHexString();

describe("transitionOrder", () => {
  it("moves an order forward and appends a history entry with the actor and note", async () => {
    const id = await insertOrder("awaiting_payment");
    const order = await transitionOrder(id, "confirmed", {
      actorId: staffId,
      fields: { note: "Advance received" },
    });
    expect(order.status).toBe("confirmed");
    expect(order.history).toHaveLength(2);
    expect(order.history[1]).toMatchObject({
      from: "awaiting_payment",
      to: "confirmed",
      actorId: staffId,
      note: "Advance received",
    });
  });

  it("records no actor when the system moves the order", async () => {
    const id = await insertOrder("awaiting_payment");
    const order = await transitionOrder(id, "cancelled", {
      actorId: null,
      fields: { reason: "Unpaid after 3 days" },
    });
    expect(order.history.at(-1)).toMatchObject({ actorId: null, note: "Unpaid after 3 days" });
  });

  it("rejects every move the state machine forbids, and changes nothing", async () => {
    const id = await insertOrder("awaiting_payment");
    for (const to of ORDER_STATUSES.filter((s) => s !== "confirmed" && s !== "cancelled")) {
      await expect(transitionOrder(id, to, { actorId: staffId })).rejects.toBeInstanceOf(
        TransitionError,
      );
    }
    const stored = await OrderModel.findById(id).lean();
    expect(stored?.status).toBe("awaiting_payment");
    expect(stored?.history).toHaveLength(1);
  });

  it("needs courier and tracking number to ship, and a reason to cancel", async () => {
    const packed = await insertOrder("packed");
    await expect(
      transitionOrder(packed, "shipped", { actorId: staffId, fields: { courier: "TCS" } }),
    ).rejects.toMatchObject({
      code: "MISSING_TRANSITION_FIELD",
    });
    const confirmed = await insertOrder("confirmed");
    await expect(
      transitionOrder(confirmed, "cancelled", { actorId: staffId }),
    ).rejects.toMatchObject({
      code: "MISSING_TRANSITION_FIELD",
    });
  });

  it("stores the shipment when an order ships", async () => {
    const id = await insertOrder("packed");
    const order = await transitionOrder(id, "shipped", {
      actorId: staffId,
      fields: {
        courier: "TCS",
        trackingNumber: "TCS123",
        trackingUrl: "https://track.example/TCS123",
      },
    });
    expect(order.shipment).toMatchObject({
      courier: "TCS",
      trackingNumber: "TCS123",
      trackingUrl: "https://track.example/TCS123",
    });
    expect(order.shipment?.shippedAt).toMatch(/^\d{4}-\d\d-\d\dT/);
  });

  it("lets only one of two simultaneous identical moves win", async () => {
    const id = await insertOrder("awaiting_payment");
    const results = await Promise.allSettled([
      transitionOrder(id, "confirmed", { actorId: staffId }),
      transitionOrder(id, "confirmed", { actorId: staffId }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    const stored = await OrderModel.findById(id).lean();
    expect(stored?.history).toHaveLength(2);
  });

  it("answers 404 for an unknown order", async () => {
    await expect(
      transitionOrder(new Types.ObjectId().toHexString(), "confirmed", { actorId: null }),
    ).rejects.toMatchObject({
      httpStatus: 404,
    });
  });
});
