import type { Quote } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { buildAmounts } from "./amounts";

const prepaid: Quote = {
  currency: "PKR",
  mode: "prepaid",
  goodsMinor: 10000,
  discountMinor: 2000,
  shippingMinor: 0,
  totalMinor: 8000,
  dueNowMinor: 8000,
  dueOnDeliveryMinor: 0,
};
const cod: Quote = {
  ...prepaid,
  mode: "cod",
  discountMinor: 0,
  shippingMinor: 500,
  totalMinor: 10500,
  dueNowMinor: 2100,
  dueOnDeliveryMinor: 8400,
};

describe("buildAmounts", () => {
  it("shows the discount, free shipping and nothing on delivery for prepaid", () => {
    const view = buildAmounts(prepaid, "prepaid");
    expect(view.rows.map((r) => r.kind)).toEqual(["plain", "discount", "free", "strong"]);
    expect(view.dueNow.minor).toBe(8000);
    expect(view.dueOnDelivery).toBeNull();
  });
  it("shows the advance and the balance for cod, with no discount row", () => {
    const view = buildAmounts(cod, "cod");
    expect(view.rows.map((r) => r.label)).toEqual(["Gift", "Shipping", "Total"]);
    expect(view.dueNow).toEqual({ label: "To pay now (advance)", minor: 2100 });
    expect(view.dueOnDelivery?.minor).toBe(8400);
    expect(view.currency).toBe("PKR");
  });
});
