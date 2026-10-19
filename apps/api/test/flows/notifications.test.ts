import { money } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { upsertPrices } from "../../src/modules/catalog/service";
import { transitionOrder } from "../../src/modules/orders/transition";
import { recordPayment } from "../../src/modules/payments/service";

import {
  buildApp,
  itemPrice,
  makeDesign,
  newStaffId,
  orderBody,
  outboxRows,
  placeOrder,
  postOrder,
  seedWorld,
  storedOrder,
  useFlowDatabase,
} from "./helpers";

useFlowDatabase();
const app = buildApp();

async function newOrder() {
  const { packaging, bar, soap } = await seedWorld();
  const design = makeDesign(packaging, [
    [bar, 1],
    [soap, 1],
  ]);
  const created = await placeOrder(app, orderBody(design, { mode: "cod" }));
  const stored = await storedOrder(created.number);
  return { created, orderId: stored._id.toHexString(), world: { packaging, bar, soap } };
}

describe("notification outbox", () => {
  it("leaves an order_created entry for a new order", async () => {
    const { created, orderId } = await newOrder();

    const rows = await outboxRows("order_created");

    expect(rows).toHaveLength(1);
    expect(String(rows[0]?.orderId)).toBe(orderId);
    expect(JSON.stringify(rows[0]?.payload)).toContain(created.number);
  });

  it("leaves a payment_recorded entry when staff record a payment", async () => {
    const { orderId, created } = await newOrder();
    expect(await outboxRows("payment_recorded")).toHaveLength(0);

    // goods 90_000 + 45_000 + 12_000 = 147_000; shipping 25_000; total 172_000; advance 34_400
    await recordPayment(
      orderId,
      money(created.quote.dueNowMinor, "PKR"),
      "manual_transfer",
      newStaffId(),
    );

    const rows = await outboxRows("payment_recorded");
    expect(rows).toHaveLength(1);
    expect(String(rows[0]?.orderId)).toBe(orderId);
  });

  it("leaves a status_changed entry for a change made through transitionOrder", async () => {
    const { orderId } = await newOrder();
    expect(await outboxRows("status_changed")).toHaveLength(0);

    await transitionOrder(orderId, "cancelled", {
      actorId: newStaffId(),
      fields: { reason: "Customer asked" },
    });

    const rows = await outboxRows("status_changed");
    expect(rows).toHaveLength(1);
    expect(String(rows[0]?.orderId)).toBe(orderId);
    expect(rows[0]?.payload["status"]).toBe("cancelled");
  });

  it("never puts staff notes or actor ids in an outbox payload", async () => {
    const { orderId } = await newOrder();
    const staffId = newStaffId();

    await transitionOrder(orderId, "cancelled", {
      actorId: staffId,
      fields: { reason: "Secret staff reason" },
    });

    const text = JSON.stringify(await outboxRows());
    expect(text).not.toContain("Secret staff reason");
    expect(text).not.toContain(staffId);
  });

  it("leaves no outbox entry when the order transaction fails because an item sold out", async () => {
    const { packaging, bar, soap } = await seedWorld();
    await upsertPrices([{ ...itemPrice(bar, "PK", 45_000), stockQty: 1 }]);

    const res = await postOrder(
      app,
      orderBody(
        makeDesign(packaging, [
          [bar, 2],
          [soap, 1],
        ]),
      ),
    );

    expect(res.status).toBe(409);
    expect(await outboxRows()).toHaveLength(0);
  });
});
