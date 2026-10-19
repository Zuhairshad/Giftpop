import type { PartnerRequest } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { actorLabel, formatDate, formatDateTime, requestTitle } from "./format";

describe("format", () => {
  it("labels staff with a short id", () => {
    expect(actorLabel("64b7f0c2a1d3e4f5a6b7c8d9")).toBe("Staff c8d9");
  });
  it("formats dates in UTC and tolerates bad input", () => {
    expect(formatDate("2026-10-19T23:30:00.000Z")).toBe("19 Oct 2026");
    expect(formatDateTime("2026-10-19T23:30:00.000Z")).toContain("23:30");
    expect(formatDate("junk")).toBe("junk");
  });
  it("titles a brand by name and a country request by country", () => {
    const brand = { kind: "brand", brandName: "Rose Co", country: "PK" } as PartnerRequest;
    const country = { kind: "country", country: "NG" } as PartnerRequest;
    expect(requestTitle(brand, (c) => c)).toBe("Rose Co");
    expect(requestTitle(country, () => "Nigeria")).toBe("Nigeria");
  });
});
