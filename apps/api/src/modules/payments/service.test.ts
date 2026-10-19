import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { enqueue } from "../notifications/service";
import { insertOrder } from "../orders/fixtures";
import { OrderModel, type OrderDoc } from "../orders/model";

import { recordPayment } from "./service";

vi.mock("../notifications/service", () => ({
  enqueue: vi.fn(async () => undefined),
  processOutbox: vi.fn(async () => 0),
}));

useTestMongo();
beforeEach(async () => {
  await clearDatabase();
  vi.mocked(enqueue).mockClear();
});

const staff = new Types.ObjectId().toHexString();
const pkr = (amountMinor: number) => ({ amountMinor, currency: "PKR" });
// Fixture quote: total 205_000, due now (cod advance) 41_000.

async function load(id: string): Promise<OrderDoc> {
  const doc = await OrderModel.findById(id).lean<OrderDoc>();
  if (!doc) throw new Error("missing");
  return doc;
}

describe("recordPayment", () => {
  it("below the advance leaves the order unpaid and awaiting payment", async () => {
    const id = await insertOrder();
    const order = await recordPayment(id, pkr(10_000), "manual_transfer", staff);
    expect(order.paymentStatus).toBe("unpaid");
    expect(order.status).toBe("awaiting_payment");
    expect(order.payments).toHaveLength(1);
    expect(order.payments[0]).toMatchObject({ kind: "advance", recordedBy: staff });
  });

  it("exactly the advance gives advance_paid and confirms through the state machine", async () => {
    const id = await insertOrder();
    const order = await recordPayment(id, pkr(41_000), "manual_transfer", staff, {
      reference: "TX1",
    });
    expect(order.paymentStatus).toBe("advance_paid");
    expect(order.status).toBe("confirmed");
    expect(order.payments[0]).toMatchObject({ kind: "advance", reference: "TX1" });
    const last = order.history[order.history.length - 1];
    expect(last).toMatchObject({
      from: "awaiting_payment",
      to: "confirmed",
      actorId: staff,
      note: "Payment recorded",
    });
  });

  it("two partial payments add up to the advance", async () => {
    const id = await insertOrder();
    await recordPayment(id, pkr(20_000), "manual_transfer", staff);
    const order = await recordPayment(id, pkr(21_000), "manual_transfer", staff);
    expect(order.paymentStatus).toBe("advance_paid");
    expect(order.status).toBe("confirmed");
  });

  it("the balance after an advance makes it paid, without a second transition", async () => {
    const id = await insertOrder();
    await recordPayment(id, pkr(41_000), "manual_transfer", staff);
    const order = await recordPayment(id, pkr(164_000), "cod", staff);
    expect(order.paymentStatus).toBe("paid");
    expect(order.payments[1]?.kind).toBe("balance");
    expect(order.history.filter((h) => h.to === "confirmed")).toHaveLength(1);
  });

  it("a full payment in one go is paid and kind full", async () => {
    const id = await insertOrder();
    const order = await recordPayment(id, pkr(205_000), "manual_transfer", staff);
    expect(order.paymentStatus).toBe("paid");
    expect(order.payments[0]?.kind).toBe("full");
    expect(order.status).toBe("confirmed");
  });

  it("prepaid needs the full total: a partial amount stays awaiting payment", async () => {
    const quote = {
      currency: "PKR",
      mode: "prepaid" as const,
      goodsMinor: 180_000,
      discountMinor: 36_000,
      shippingMinor: 25_000,
      totalMinor: 169_000,
      dueNowMinor: 169_000,
      dueOnDeliveryMinor: 0,
    };
    const id = await insertOrder("awaiting_payment", { paymentMode: "prepaid", quote });
    const partial = await recordPayment(id, pkr(41_000), "manual_transfer", staff);
    expect(partial.paymentStatus).toBe("unpaid");
    expect(partial.status).toBe("awaiting_payment");
    const order = await recordPayment(id, pkr(128_000), "manual_transfer", staff);
    expect(order.paymentStatus).toBe("paid");
    expect(order.status).toBe("confirmed");
  });

  it("prepaid full total is paid and confirmed", async () => {
    const quote = {
      currency: "PKR",
      mode: "prepaid" as const,
      goodsMinor: 180_000,
      discountMinor: 36_000,
      shippingMinor: 25_000,
      totalMinor: 169_000,
      dueNowMinor: 169_000,
      dueOnDeliveryMinor: 0,
    };
    const id = await insertOrder("awaiting_payment", { paymentMode: "prepaid", quote });
    const order = await recordPayment(id, pkr(169_000), "manual_transfer", staff);
    expect(order.paymentStatus).toBe("paid");
    expect(order.status).toBe("confirmed");
  });

  it("accepts an overpayment and flags it in the note", async () => {
    const id = await insertOrder();
    const order = await recordPayment(id, pkr(210_000), "manual_transfer", staff, { note: "cash" });
    expect(order.paymentStatus).toBe("paid");
    expect(order.payments[0]?.note).toContain("cash");
    expect(order.payments[0]?.note).toContain("Overpayment of 5000");
  });

  it("does not transition an order that is already confirmed", async () => {
    const id = await insertOrder("confirmed");
    const order = await recordPayment(id, pkr(205_000), "manual_transfer", staff);
    expect(order.status).toBe("confirmed");
    expect(order.paymentStatus).toBe("paid");
    expect(order.history).toHaveLength(1);
  });

  it("rejects a cancelled or returned order", async () => {
    for (const status of ["cancelled", "returned"] as const) {
      const id = await insertOrder(status);
      await expect(recordPayment(id, pkr(1000), "cod", staff)).rejects.toMatchObject({
        httpStatus: 422,
      });
      expect((await load(id)).payments).toHaveLength(0);
    }
  });

  it("rejects a wrong currency and non-positive or fractional amounts", async () => {
    const id = await insertOrder();
    await expect(
      recordPayment(id, { amountMinor: 1000, currency: "USD" }, "cod", staff),
    ).rejects.toMatchObject({ httpStatus: 422 });
    for (const bad of [0, -5, 10.5]) {
      await expect(recordPayment(id, pkr(bad), "cod", staff)).rejects.toMatchObject({
        httpStatus: 422,
      });
    }
    expect((await load(id)).payments).toHaveLength(0);
  });

  it("unknown order is 404", async () => {
    await expect(
      recordPayment(new Types.ObjectId().toHexString(), pkr(1000), "cod", staff),
    ).rejects.toMatchObject({ httpStatus: 404 });
  });

  it("keeps both of two simultaneous payments and a consistent status", async () => {
    const id = await insertOrder();
    await Promise.all([
      recordPayment(id, pkr(21_000), "manual_transfer", staff),
      recordPayment(id, pkr(20_000), "manual_transfer", staff),
    ]);
    const doc = await load(id);
    expect(doc.payments).toHaveLength(2);
    expect(doc.paymentStatus).toBe("advance_paid");
    expect(doc.status).toBe("confirmed");
    expect(doc.history.filter((h) => h.to === "confirmed")).toHaveLength(1);
  });

  it("enqueues payment_recorded without staff notes", async () => {
    const id = await insertOrder();
    await recordPayment(id, pkr(41_000), "manual_transfer", staff, { note: "secret staff note" });
    const calls = vi.mocked(enqueue).mock.calls.map(([input]) => input);
    const recorded = calls.find((c) => c.type === "payment_recorded");
    expect(recorded).toMatchObject({
      orderId: id,
      payload: { amount: pkr(41_000), paymentStatus: "advance_paid" },
    });
    expect(JSON.stringify(recorded)).not.toContain("secret staff note");
  });
});
