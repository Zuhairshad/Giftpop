import { describe, expect, it } from "vitest";

import {
  PAYMENT_POLICY,
  PaymentPolicySchema,
  QuoteSchema,
  computeQuote,
  computeQuotes,
  money,
} from "../src/index";
import type { PaymentMode } from "../src/index";

import { DOC_POLICY, quoteInput, usd } from "./helpers";

const MODES: readonly PaymentMode[] = ["prepaid", "cod"];

describe("PAYMENT_POLICY", () => {
  it("is 20% off goods for prepaid and a 20% advance for cod (docs/product.md)", () => {
    expect(PAYMENT_POLICY).toEqual(DOC_POLICY);
  });

  it("passes its own schema", () => {
    expect(PaymentPolicySchema.parse(PAYMENT_POLICY)).toEqual(PAYMENT_POLICY);
  });

  it.each([-1, 101, 20.5, Number.NaN])("schema rejects percent %s", (percent) => {
    expect(
      PaymentPolicySchema.safeParse({
        prepaid: { goodsDiscountPercent: percent },
        cod: { advancePercent: 20 },
      }).success,
    ).toBe(false);
    expect(
      PaymentPolicySchema.safeParse({
        prepaid: { goodsDiscountPercent: 20 },
        cod: { advancePercent: percent },
      }).success,
    ).toBe(false);
  });

  it("schema accepts 0 and 100", () => {
    expect(
      PaymentPolicySchema.safeParse({
        prepaid: { goodsDiscountPercent: 0 },
        cod: { advancePercent: 100 },
      }).success,
    ).toBe(true);
  });

  it("the shipped policy produces the documented quotes", () => {
    const base = quoteInput();
    expect(computeQuote({ ...base, mode: "prepaid", policy: PAYMENT_POLICY })).toEqual(
      computeQuote({ ...base, mode: "prepaid", policy: DOC_POLICY }),
    );
    expect(computeQuote({ ...base, mode: "cod", policy: PAYMENT_POLICY })).toEqual(
      computeQuote({ ...base, mode: "cod", policy: DOC_POLICY }),
    );
  });

  it("changing the policy object changes the quote (no percentage is hard-coded in pricing)", () => {
    const base = quoteInput();
    const other = { prepaid: { goodsDiscountPercent: 10 }, cod: { advancePercent: 30 } };
    expect(computeQuote({ ...base, mode: "prepaid", policy: other }).discountMinor).toBe(550);
    expect(computeQuote({ ...base, mode: "cod", policy: other }).dueNowMinor).toBe(1800);
  });
});

describe("quote output", () => {
  it.each(MODES)("passes QuoteSchema (%s)", (mode) => {
    const q = computeQuote(quoteInput({ mode }));
    expect(QuoteSchema.parse(q)).toEqual(q);
  });
});

describe("currency and integer guards", () => {
  it("throws when an item line is in another currency", () => {
    expect(() =>
      computeQuote(quoteInput({ itemLines: [{ unitPrice: money(1000, "GBP"), qty: 1 }] })),
    ).toThrow(RangeError);
  });

  it("throws when the personalisation fee is in another currency", () => {
    expect(() => computeQuote(quoteInput({ personalisationFee: money(0, "GBP") }))).toThrow(
      RangeError,
    );
  });

  it.each(MODES)("throws on a non-integer packaging price (%s)", (mode) => {
    expect(() =>
      computeQuote(quoteInput({ mode, packagingPrice: { amountMinor: 10.5, currency: "USD" } })),
    ).toThrow(RangeError);
  });

  it("throws on a non-integer unit price", () => {
    expect(() =>
      computeQuote(
        quoteInput({ itemLines: [{ unitPrice: { amountMinor: 99.9, currency: "USD" }, qty: 1 }] }),
      ),
    ).toThrow(RangeError);
  });

  it("throws on a non-integer quantity", () => {
    expect(() =>
      computeQuote(quoteInput({ itemLines: [{ unitPrice: usd(100), qty: 1.5 }] })),
    ).toThrow(RangeError);
  });

  it("throws on a non-integer personalisation fee", () => {
    expect(() =>
      computeQuote(quoteInput({ personalisationFee: { amountMinor: 0.5, currency: "USD" } })),
    ).toThrow(RangeError);
  });

  it.each(MODES)("throws on non-integer flat shipping (%s)", (mode) => {
    expect(() => computeQuote(quoteInput({ mode, shipping: { flatMinor: 5.5 } }))).toThrow(
      RangeError,
    );
  });

  it("throws on a non-integer policy percentage", () => {
    expect(() =>
      computeQuote(
        quoteInput({
          mode: "prepaid",
          policy: { prepaid: { goodsDiscountPercent: 20.5 }, cod: { advancePercent: 20 } },
        }),
      ),
    ).toThrow(RangeError);
    expect(() =>
      computeQuote(
        quoteInput({
          mode: "cod",
          policy: { prepaid: { goodsDiscountPercent: 20 }, cod: { advancePercent: 150 } },
        }),
      ),
    ).toThrow(RangeError);
  });

  it("computeQuotes propagates the same errors", () => {
    const base = {
      ...quoteInput(),
      itemLines: [{ unitPrice: money(1, "GBP"), qty: 1 }],
    };
    expect(() => computeQuotes(base, ["prepaid", "cod"])).toThrow(RangeError);
  });
});
