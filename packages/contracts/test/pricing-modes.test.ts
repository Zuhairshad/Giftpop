import { describe, expect, it } from "vitest";

import { computeQuote, computeQuotes } from "../src/index";

import { DOC_POLICY, quoteInput, usd } from "./helpers";

// Default fixture: packaging 2500 + 3 x 1000 = goods 5500, flat shipping 500.

describe("prepaid: 20% off goods only, pay everything now", () => {
  const quote = computeQuote(quoteInput({ mode: "prepaid" }));

  it("discounts goods and never shipping", () => {
    expect(quote.goodsMinor).toBe(5500);
    expect(quote.discountMinor).toBe(1100);
    expect(quote.shippingMinor).toBe(500);
    expect(quote.totalMinor).toBe(5500 - 1100 + 500);
  });

  it("charges the full total now and nothing on delivery", () => {
    expect(quote.dueNowMinor).toBe(quote.totalMinor);
    expect(quote.dueOnDeliveryMinor).toBe(0);
    expect(quote.mode).toBe("prepaid");
    expect(quote.currency).toBe("USD");
  });

  it("discount does not change with shipping", () => {
    const pricey = computeQuote(quoteInput({ shipping: { flatMinor: 9999 } }));
    expect(pricey.discountMinor).toBe(1100);
    expect(pricey.totalMinor).toBe(5500 - 1100 + 9999);
  });

  it("discounts personalisation along with packaging and items", () => {
    const quote2 = computeQuote(quoteInput({ personalisationFee: usd(300) }));
    expect(quote2.goodsMinor).toBe(5800);
    expect(quote2.discountMinor).toBe(1160);
    expect(quote2.totalMinor).toBe(5800 - 1160 + 500);
  });

  it("rounds the discount half up to a whole minor unit", () => {
    const low = computeQuote(
      quoteInput({ packagingPrice: usd(1002), itemLines: [], shipping: { flatMinor: 0 } }),
    );
    expect(low.discountMinor).toBe(200); // 200.4
    expect(low.totalMinor).toBe(802);
    const high = computeQuote(
      quoteInput({ packagingPrice: usd(1003), itemLines: [], shipping: { flatMinor: 0 } }),
    );
    expect(high.discountMinor).toBe(201); // 200.6
    expect(high.totalMinor).toBe(802);
  });

  it("rounds an exact .5 up (50% policy on 1001 gives 501)", () => {
    const quote3 = computeQuote(
      quoteInput({
        packagingPrice: usd(1001),
        itemLines: [],
        shipping: { flatMinor: 0 },
        policy: { prepaid: { goodsDiscountPercent: 50 }, cod: { advancePercent: 20 } },
      }),
    );
    expect(quote3.discountMinor).toBe(501);
    expect(quote3.totalMinor).toBe(500);
  });
});

describe("cod: no discount, 20% of the total now", () => {
  const quote = computeQuote(quoteInput({ mode: "cod" }));

  it("gives no discount", () => {
    expect(quote.discountMinor).toBe(0);
    expect(quote.totalMinor).toBe(5500 + 500);
    expect(quote.mode).toBe("cod");
  });

  it("takes 20% of the total (goods plus shipping) as the advance", () => {
    expect(quote.dueNowMinor).toBe(1200);
    expect(quote.dueOnDeliveryMinor).toBe(4800);
  });

  it("the advance includes shipping, not just goods", () => {
    const q = computeQuote(
      quoteInput({
        mode: "cod",
        packagingPrice: usd(1000),
        itemLines: [],
        shipping: { flatMinor: 503 },
      }),
    );
    expect(q.totalMinor).toBe(1503);
    expect(q.dueNowMinor).toBe(301); // 300.6 rounds up; 20% of goods alone would be 200
    expect(q.dueOnDeliveryMinor).toBe(1202);
  });

  it("rounds the advance half up", () => {
    const down = computeQuote(
      quoteInput({
        mode: "cod",
        packagingPrice: usd(1002),
        itemLines: [],
        shipping: { flatMinor: 0 },
      }),
    );
    expect(down.dueNowMinor).toBe(200); // 200.4
    expect(down.dueOnDeliveryMinor).toBe(802);
    const up = computeQuote(
      quoteInput({
        mode: "cod",
        packagingPrice: usd(1003),
        itemLines: [],
        shipping: { flatMinor: 0 },
      }),
    );
    expect(up.dueNowMinor).toBe(201); // 200.6
    expect(up.dueOnDeliveryMinor).toBe(802);
  });

  it("rounds an exact .5 up (10% policy on a total of 15 gives 2)", () => {
    const q = computeQuote(
      quoteInput({
        mode: "cod",
        packagingPrice: usd(15),
        itemLines: [],
        shipping: { flatMinor: 0 },
        policy: { prepaid: { goodsDiscountPercent: 20 }, cod: { advancePercent: 10 } },
      }),
    );
    expect(q.dueNowMinor).toBe(2);
    expect(q.dueOnDeliveryMinor).toBe(13);
  });
});

describe("shared quote rules", () => {
  it("dueNow + dueOnDelivery equals the total, all integers, for every mode and goods amount", () => {
    for (let packaging = 0; packaging <= 400; packaging += 7) {
      for (const mode of ["prepaid", "cod"] as const) {
        const q = computeQuote(
          quoteInput({
            mode,
            packagingPrice: usd(packaging),
            itemLines: [{ unitPrice: usd(33), qty: 3 }],
            shipping: { flatMinor: 51 },
          }),
        );
        expect(q.dueNowMinor + q.dueOnDeliveryMinor).toBe(q.totalMinor);
        for (const value of Object.values(q)) {
          if (typeof value === "number") expect(Number.isInteger(value)).toBe(true);
        }
        expect(q.totalMinor).toBe(q.goodsMinor - q.discountMinor + q.shippingMinor);
      }
    }
  });

  it("zero item lines: goods are packaging plus personalisation only", () => {
    const q = computeQuote(quoteInput({ itemLines: [], personalisationFee: usd(500) }));
    expect(q.goodsMinor).toBe(3000);
    expect(q.discountMinor).toBe(600);
    expect(q.totalMinor).toBe(3000 - 600 + 500);
  });

  it("zero goods leaves only shipping, with no discount", () => {
    const base = quoteInput({ packagingPrice: usd(0), itemLines: [] });
    const prepaid = computeQuote({ ...base, mode: "prepaid" });
    expect(prepaid).toMatchObject({ goodsMinor: 0, discountMinor: 0, totalMinor: 500 });
    const cod = computeQuote({ ...base, mode: "cod" });
    expect(cod).toMatchObject({ goodsMinor: 0, totalMinor: 500, dueNowMinor: 100 });
    expect(cod.dueOnDeliveryMinor).toBe(400);
  });

  it("multiplies each item line by its quantity", () => {
    const q = computeQuote(
      quoteInput({
        itemLines: [
          { unitPrice: usd(250), qty: 4 },
          { unitPrice: usd(125), qty: 2 },
        ],
      }),
    );
    expect(q.goodsMinor).toBe(2500 + 1000 + 250);
  });

  it("policy percentages come from the input, not from the code", () => {
    const flat = computeQuote(
      quoteInput({
        mode: "prepaid",
        policy: { prepaid: { goodsDiscountPercent: 0 }, cod: { advancePercent: 100 } },
      }),
    );
    expect(flat.discountMinor).toBe(0);
    expect(flat.totalMinor).toBe(6000);
    const full = computeQuote(
      quoteInput({
        mode: "cod",
        policy: { prepaid: { goodsDiscountPercent: 0 }, cod: { advancePercent: 100 } },
      }),
    );
    expect(full.dueNowMinor).toBe(6000);
    expect(full.dueOnDeliveryMinor).toBe(0);
    const none = computeQuote(
      quoteInput({
        mode: "cod",
        policy: { prepaid: { goodsDiscountPercent: 0 }, cod: { advancePercent: 0 } },
      }),
    );
    expect(none.dueNowMinor).toBe(0);
    expect(none.dueOnDeliveryMinor).toBe(6000);
  });
});

describe("computeQuotes", () => {
  const base = {
    packagingPrice: usd(2500),
    itemLines: [{ unitPrice: usd(1000), qty: 3 }],
    personalisationFee: usd(0),
    shipping: { flatMinor: 500 },
    policy: DOC_POLICY,
  };

  it("returns one quote per mode, in the order asked", () => {
    expect(computeQuotes(base, ["prepaid", "cod"]).map((q) => q.mode)).toEqual(["prepaid", "cod"]);
    expect(computeQuotes(base, ["cod", "prepaid"]).map((q) => q.mode)).toEqual(["cod", "prepaid"]);
  });

  it("matches computeQuote for each mode", () => {
    const [prepaid, cod] = computeQuotes(base, ["prepaid", "cod"]);
    expect(prepaid).toEqual(computeQuote({ ...base, mode: "prepaid" }));
    expect(cod).toEqual(computeQuote({ ...base, mode: "cod" }));
  });

  it("handles one mode and no modes", () => {
    expect(computeQuotes(base, ["cod"])).toHaveLength(1);
    expect(computeQuotes(base, [])).toEqual([]);
  });

  it("uses the policy it is given", () => {
    const [prepaid] = computeQuotes({ ...base, policy: DOC_POLICY }, ["prepaid"]);
    expect(prepaid?.discountMinor).toBe(1100);
  });
});
