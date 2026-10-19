import { money } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { recordPayment } from "../../src/modules/payments/service";

import {
  buildApp,
  makeDesign,
  newStaffId,
  orderBody,
  placeOrder,
  seedWorld,
  storedOrder,
  useFlowDatabase,
} from "./helpers";

useFlowDatabase();
const app = buildApp();

const US_COUNTRY = {
  code: "US",
  name: "United States",
  currency: "USD",
  paymentModes: ["prepaid", "cod"] as ["prepaid", "cod"],
  shipping: { flatMinor: 599, deliveryDays: { min: 3, max: 5 } },
  addressFormat: {
    region: { required: true, label: "State" },
    postalCode: { required: true, label: "ZIP" },
  },
};
const US_ADDRESS = { line1: "1 Main St", city: "Austin", region: "TX", postalCode: "73301" };

async function usOrder() {
  // goods = 1_999 box + 2 x 499 bars + 700 soap = 3_697
  // 20% off goods only = 739.4 -> 739; shipping 599 is not discounted
  // total = 3_697 - 739 + 599 = 3_557, paid in full now
  const { packaging, bar, soap } = await seedWorld({
    country: US_COUNTRY,
    packagingPriceMinor: 1_999,
    barPriceMinor: 499,
    soapPriceMinor: 700,
  });
  const design = makeDesign(packaging, [
    [bar, 2],
    [soap, 1],
  ]);
  const created = await placeOrder(
    app,
    orderBody(design, { country: "US", mode: "prepaid", address: US_ADDRESS }),
  );
  const stored = await storedOrder(created.number);
  return { created, id: stored._id.toHexString() };
}

describe("US pay now (prepaid)", () => {
  it("discounts goods only and asks for the full total now", async () => {
    const { created } = await usOrder();

    expect(created.paymentMode).toBe("prepaid");
    expect(created.quote).toEqual({
      currency: "USD",
      mode: "prepaid",
      goodsMinor: 3_697,
      discountMinor: 739,
      shippingMinor: 599,
      totalMinor: 3_557,
      dueNowMinor: 3_557,
      dueOnDeliveryMinor: 0,
    });
    const stored = await storedOrder(created.number);
    expect(stored.status).toBe("awaiting_payment");
    expect(stored.paymentStatus).toBe("unpaid");
  });

  it("is paid and confirmed once the full total is recorded", async () => {
    const { created, id } = await usOrder();

    const order = await recordPayment(id, money(3_557, "USD"), "manual_transfer", newStaffId());

    expect(order.paymentStatus).toBe("paid");
    expect(order.status).toBe("confirmed");
    const stored = await storedOrder(created.number);
    expect(stored.paymentStatus).toBe("paid");
    expect(stored.status).toBe("confirmed");
  });

  it("stays awaiting payment after a partial payment", async () => {
    const { created, id } = await usOrder();

    const order = await recordPayment(id, money(3_556, "USD"), "manual_transfer", newStaffId());

    expect(order.status).toBe("awaiting_payment");
    expect(order.paymentStatus).not.toBe("paid");
    const stored = await storedOrder(created.number);
    expect(stored.status).toBe("awaiting_payment");
    expect(stored.paymentStatus).not.toBe("paid");
    expect(stored.history).toHaveLength(1);
  });
});
