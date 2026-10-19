import { describe, expect, it } from "vitest";

import { computeQuote, money } from "../src/index";
import type { PaymentMode } from "../src/index";

import { quoteInput, usd } from "./helpers";

const MODES: readonly PaymentMode[] = ["prepaid", "cod"];

/** Goods = packaging 2000 + one item; flat 500, free from 5000 goods (before discount). */
function shippingFor(goods: number, mode: PaymentMode): number {
  return computeQuote(
    quoteInput({
      mode,
      packagingPrice: usd(2000),
      itemLines: [{ unitPrice: usd(goods - 2000), qty: 1 }],
      shipping: { flatMinor: 500, freeOverMinor: 5000 },
    }),
  ).shippingMinor;
}

describe("shipping", () => {
  it.each(MODES)("is flat when there is no free threshold (%s)", (mode) => {
    const q = computeQuote(quoteInput({ mode, shipping: { flatMinor: 700 } }));
    expect(q.shippingMinor).toBe(700);
  });

  it.each(MODES)("is flat one minor unit below the threshold (%s)", (mode) => {
    expect(shippingFor(4999, mode)).toBe(500);
  });

  it.each(MODES)("is free exactly at the threshold (%s)", (mode) => {
    expect(shippingFor(5000, mode)).toBe(0);
  });

  it.each(MODES)("is free above the threshold (%s)", (mode) => {
    expect(shippingFor(5001, mode)).toBe(0);
    expect(shippingFor(90000, mode)).toBe(0);
  });

  it("tests the threshold against goods BEFORE the prepaid discount", () => {
    // Goods 5000 -> prepaid discount 1000 -> 4000 after discount, still below 5000.
    const prepaid = computeQuote(
      quoteInput({
        mode: "prepaid",
        packagingPrice: usd(2000),
        itemLines: [{ unitPrice: usd(3000), qty: 1 }],
        shipping: { flatMinor: 500, freeOverMinor: 5000 },
      }),
    );
    expect(prepaid.goodsMinor).toBe(5000);
    expect(prepaid.discountMinor).toBe(1000);
    expect(prepaid.shippingMinor).toBe(0);
    expect(prepaid.totalMinor).toBe(4000);
  });

  it("never lets the payment mode change shipping", () => {
    for (let goods = 2000; goods <= 8000; goods += 250) {
      expect(shippingFor(goods, "prepaid")).toBe(shippingFor(goods, "cod"));
    }
  });

  it("counts personalisation toward the free threshold", () => {
    const q = computeQuote(
      quoteInput({
        packagingPrice: usd(2000),
        itemLines: [{ unitPrice: usd(2900), qty: 1 }],
        personalisationFee: usd(100),
        shipping: { flatMinor: 500, freeOverMinor: 5000 },
      }),
    );
    expect(q.goodsMinor).toBe(5000);
    expect(q.shippingMinor).toBe(0);
  });

  it("free shipping lowers the cod advance base (total has no shipping)", () => {
    const q = computeQuote(
      quoteInput({
        mode: "cod",
        packagingPrice: usd(5000),
        itemLines: [],
        shipping: { flatMinor: 500, freeOverMinor: 5000 },
      }),
    );
    expect(q.totalMinor).toBe(5000);
    expect(q.dueNowMinor).toBe(1000);
  });

  it("is 0 when flat shipping is 0", () => {
    expect(computeQuote(quoteInput({ shipping: { flatMinor: 0 } })).shippingMinor).toBe(0);
  });

  it("uses the packaging currency on the quote", () => {
    const q = computeQuote(
      quoteInput({
        packagingPrice: money(100000, "PKR"),
        itemLines: [{ unitPrice: money(50000, "PKR"), qty: 2 }],
        personalisationFee: money(0, "PKR"),
      }),
    );
    expect(q.currency).toBe("PKR");
  });
});
