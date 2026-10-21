import type { PublicTemplate } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { findPublicTemplate, priceLine } from "./price-line";

function shown(id: string, priceMinor: number, currency: string): PublicTemplate {
  return { id, priceMinor, currency } as unknown as PublicTemplate;
}

const base = { countryCode: "PK", countryName: "Pakistan", templateActive: true } as const;

describe("findPublicTemplate", () => {
  it("matches by id and gives null when absent", () => {
    const list = [shown("a", 1, "PKR"), shown("b", 2, "PKR")];
    expect(findPublicTemplate(list, "b")?.priceMinor).toBe(2);
    expect(findPublicTemplate(list, "z")).toBeNull();
    expect(findPublicTemplate([], "a")).toBeNull();
  });
});

describe("priceLine", () => {
  it("formats the API price with the currency's minor digits", () => {
    const line = priceLine({
      ...base,
      price: { state: "ready", shown: shown("a", 450000, "PKR") },
    });
    // Intl puts a no-break space between the code and the amount.
    expect(line.tone).toBe("price");
    expect(line.text.replace(/\u00a0/g, " ")).toBe("PKR 4,500.00 in Pakistan");
  });
  it("uses the digits of the currency, not the display digits", () => {
    const text = (priceMinor: number, currency: string) =>
      priceLine({ ...base, price: { state: "ready", shown: shown("a", priceMinor, currency) } })
        .text;
    expect(text(4500, "JPY")).toContain("4,500 in");
    expect(text(4500, "JPY")).not.toContain("4,500.");
    expect(text(4500, "KWD")).toContain("4.500 in");
  });
  it("says why a template is not shown, without a price", () => {
    const live = priceLine({ ...base, price: { state: "ready", shown: null } });
    expect(live.tone).toBe("hidden");
    expect(live.text).toBe(
      "Not shown in PK: an item has no price or stock there, or the gift no longer fits its packaging",
    );
    const off = priceLine({
      ...base,
      templateActive: false,
      price: { state: "ready", shown: null },
    });
    expect(off.text).toBe("Not shown in PK: this template is hidden");
  });
  it("reports an error for one country in words", () => {
    expect(
      priceLine({ ...base, price: { state: "error", message: "Could not reach the server." } }),
    ).toEqual({ tone: "error", text: "Could not check Pakistan: Could not reach the server." });
  });
  it("shows a loading line", () => {
    expect(priceLine({ ...base, price: { state: "loading" } }).tone).toBe("loading");
  });
});
