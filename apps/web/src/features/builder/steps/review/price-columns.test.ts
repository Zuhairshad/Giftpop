import type { Quote } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { buildPriceColumns } from "./price-columns";

const PREPAID: Quote = {
  currency: "PKR",
  mode: "prepaid",
  goodsMinor: 500000,
  discountMinor: 100000,
  shippingMinor: 30000,
  totalMinor: 430000,
  dueNowMinor: 430000,
  dueOnDeliveryMinor: 0,
};

const COD: Quote = {
  currency: "PKR",
  mode: "cod",
  goodsMinor: 500000,
  discountMinor: 0,
  shippingMinor: 30000,
  totalMinor: 530000,
  dueNowMinor: 106000,
  dueOnDeliveryMinor: 424000,
};

describe("buildPriceColumns", () => {
  it("builds both columns in quote order", () => {
    const columns = buildPriceColumns([PREPAID, COD]);
    expect(columns.map((c) => [c.mode, c.title])).toEqual([
      ["prepaid", "Pay now"],
      ["cod", "Cash on delivery"],
    ]);
  });

  it("shows the pay now discount as a line taken from discountMinor", () => {
    const [prepaid] = buildPriceColumns([PREPAID]);
    expect(prepaid?.rows).toEqual([
      { kind: "money", label: "Gift", minor: 500000 },
      { kind: "discount", label: "Pay now discount", minor: 100000 },
      { kind: "money", label: "Shipping", minor: 30000 },
    ]);
    expect(prepaid?.total.minor).toBe(430000);
    expect(prepaid?.dueNow).toEqual({ label: "Due now", minor: 430000 });
    expect(prepaid?.dueOnDelivery).toBeNull();
  });

  it("shows the advance and the amount due on delivery for cash on delivery", () => {
    const [cod] = buildPriceColumns([COD]);
    expect(cod?.rows.some((r) => r.kind === "discount")).toBe(false);
    expect(cod?.dueNow).toEqual({ label: "Advance due now", minor: 106000 });
    expect(cod?.dueOnDelivery).toEqual({ label: "Due on delivery", minor: 424000 });
  });

  it("only shows modes the quote contains", () => {
    expect(buildPriceColumns([COD]).map((c) => c.mode)).toEqual(["cod"]);
    expect(buildPriceColumns([PREPAID]).map((c) => c.mode)).toEqual(["prepaid"]);
    expect(buildPriceColumns([])).toEqual([]);
  });

  it("says free shipping instead of a zero amount", () => {
    const [prepaid] = buildPriceColumns([{ ...PREPAID, shippingMinor: 0 }]);
    expect(prepaid?.rows).toContainEqual({ kind: "free", label: "Shipping" });
  });

  it("leaves out a discount line when the quote has no discount", () => {
    const [prepaid] = buildPriceColumns([{ ...PREPAID, discountMinor: 0 }]);
    expect(prepaid?.rows.some((r) => r.kind === "discount")).toBe(false);
  });

  it("passes the quote's amounts through without maths", () => {
    // Deliberately inconsistent numbers: the view model must not "fix" them.
    const odd: Quote = { ...COD, totalMinor: 1, dueNowMinor: 2, dueOnDeliveryMinor: 3 };
    const [cod] = buildPriceColumns([odd]);
    expect([cod?.total.minor, cod?.dueNow.minor, cod?.dueOnDelivery?.minor]).toEqual([1, 2, 3]);
  });

  it("keeps the first quote when a mode repeats", () => {
    const columns = buildPriceColumns([PREPAID, { ...PREPAID, totalMinor: 1 }]);
    expect(columns).toHaveLength(1);
    expect(columns[0]?.total.minor).toBe(430000);
  });
});
