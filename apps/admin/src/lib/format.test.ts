import { describe, expect, it } from "vitest";

import { flagEmoji, formatDate, formatDateTime, formatMoney } from "./format";

describe("formatMoney", () => {
  it("uses the currency's own decimals", () => {
    expect(formatMoney(1250, "USD")).toBe("$12.50");
    expect(formatMoney(1250, "JPY")).toBe("¥1,250");
  });
});

describe("flagEmoji", () => {
  it("turns an ISO code into a flag and ignores anything else", () => {
    expect(flagEmoji("PK")).toBe("🇵🇰");
    expect(flagEmoji("gb")).toBe("🇬🇧");
    expect(flagEmoji("PAK")).toBe("");
    expect(flagEmoji("")).toBe("");
  });
});

describe("dates", () => {
  it("prints in UTC so server and browser agree", () => {
    expect(formatDate("2026-10-19T23:30:00.000Z")).toBe("19 Oct 2026");
    expect(formatDateTime("2026-10-19T14:05:00.000Z")).toBe("19 Oct 2026, 14:05 UTC");
  });
  it("returns an empty string for a bad date", () => {
    expect(formatDate("nope")).toBe("");
    expect(formatDateTime("nope")).toBe("");
  });
});
