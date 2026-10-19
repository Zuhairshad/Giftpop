import { describe, expect, it } from "vitest";

import { formatMoney } from "./format-money";

describe("formatMoney", () => {
  it("shows two decimals for most currencies", () => {
    expect(formatMoney(1250, "USD", "en-US")).toBe("$12.50");
    expect(formatMoney(0, "GBP", "en-GB")).toBe("£0.00");
  });
  it("uses the currency's own minor unit size", () => {
    expect(formatMoney(1250, "JPY", "en-US")).toBe("¥1,250");
  });
  it("groups thousands for large Pakistani amounts", () => {
    expect(formatMoney(150000, "PKR", "en-US")).toContain("1,500.00");
  });
});
