import { describe, expect, it } from "vitest";

import { displayFractionDigits, formatMoney as formatRaw } from "./format-money";

// Intl puts a no-break space between a currency code and the number; compare with a plain space.
function formatMoney(amountMinor: number, currency: string, locale: string): string {
  return formatRaw(amountMinor, currency, locale).replace(/\u00a0/g, " ");
}

describe("formatMoney", () => {
  it("shows no decimals on a whole amount", () => {
    expect(formatMoney(1232000, "PKR", "en-US")).toBe("PKR 12,320");
    expect(formatMoney(1200, "USD", "en-US")).toBe("$12");
    expect(formatMoney(0, "GBP", "en-GB")).toBe("£0");
  });

  it("shows the currency's minor digits when the minor part is not zero", () => {
    expect(formatMoney(1232050, "PKR", "en-US")).toBe("PKR 12,320.50");
    expect(formatMoney(1250, "USD", "en-US")).toBe("$12.50");
    expect(formatMoney(1201, "USD", "en-US")).toBe("$12.01");
    expect(formatMoney(1, "USD", "en-US")).toBe("$0.01");
  });

  it("never rounds a non-zero minor part away", () => {
    expect(formatMoney(1999999, "PKR", "en-US")).toBe("PKR 19,999.99");
    expect(formatMoney(100000001, "USD", "en-US")).toBe("$1,000,000.01");
  });

  it("uses ISO minor digits for PKR, not Intl's 0 display digits", () => {
    expect(formatMoney(150000, "PKR", "en-US")).toBe("PKR 1,500");
    expect(formatMoney(150050, "PKR", "en-US")).toBe("PKR 1,500.50");
  });

  it("handles a currency with no minor unit (JPY)", () => {
    expect(formatMoney(1250, "JPY", "en-US")).toBe("¥1,250");
    expect(formatMoney(0, "JPY", "en-US")).toBe("¥0");
  });

  it("handles a currency with three minor digits (KWD)", () => {
    expect(formatMoney(12000, "KWD", "en-US")).toBe("KWD 12");
    expect(formatMoney(12500, "KWD", "en-US")).toBe("KWD 12.500");
    expect(formatMoney(12001, "KWD", "en-US")).toBe("KWD 12.001");
  });

  it("formats negative amounts the same way", () => {
    expect(formatMoney(-1200, "USD", "en-US")).toBe("-$12");
    expect(formatMoney(-1250, "USD", "en-US")).toBe("-$12.50");
  });
});

describe("displayFractionDigits", () => {
  it.each([
    [1200, "USD", 0],
    [1250, "USD", 2],
    [-1200, "USD", 0],
    [-5, "USD", 2],
    [1250, "JPY", 0],
    [12000, "KWD", 0],
    [12010, "KWD", 3],
  ])("%i %s shows %i decimals", (amount, currency, expected) => {
    expect(displayFractionDigits(amount, currency)).toBe(expected);
  });
});
