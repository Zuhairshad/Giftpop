import type { Country } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { buildPriceRows, rowsToPriceEntries } from "./price-grid";

function country(code: string, currency: string): Country {
  return {
    code,
    name: `Country ${code}`,
    currency,
    status: "live",
    paymentModes: ["prepaid", "cod"],
    shipping: { flatMinor: 500, deliveryDays: { min: 2, max: 4 } },
    addressFormat: {
      region: { required: false, label: "Region" },
      postalCode: { required: true, label: "Postcode" },
    },
    paymentInstructions: "",
  };
}

const countries = [country("US", "USD"), country("PK", "PKR"), country("GB", "GBP")];

describe("buildPriceRows", () => {
  it("makes one row per country and fills saved prices", () => {
    const rows = buildPriceRows(countries, [{ country: "PK", priceMinor: 125050, inStock: false }]);
    expect(rows.map((row) => row.country)).toEqual(["US", "PK", "GB"]);
    expect(rows[1]).toMatchObject({
      priceText: "1250.50",
      inStock: false,
      existing: true,
      currency: "PKR",
    });
    expect(rows[0]).toMatchObject({ priceText: "", inStock: true, existing: false });
  });
});

describe("rowsToPriceEntries", () => {
  it("sends integer minor units and skips countries with no price", () => {
    const rows = buildPriceRows(countries, []);
    rows[0] = { ...rows[0]!, priceText: "12.50" };
    rows[1] = { ...rows[1]!, priceText: "3500", inStock: false };
    expect(rowsToPriceEntries(rows)).toEqual({
      ok: true,
      entries: [
        { country: "US", priceMinor: 1250, inStock: true },
        { country: "PK", priceMinor: 350000, inStock: false },
      ],
    });
  });

  it("flags an invalid amount", () => {
    const rows = buildPriceRows(countries, []);
    rows[0] = { ...rows[0]!, priceText: "twelve" };
    const result = rowsToPriceEntries(rows);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(["US"]);
  });

  it("refuses to clear a saved price", () => {
    const rows = buildPriceRows(countries, [{ country: "GB", priceMinor: 900, inStock: true }]);
    rows[2] = { ...rows[2]!, priceText: "" };
    const result = rowsToPriceEntries(rows);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.GB).toMatch(/cannot be removed/);
  });

  it("gives an empty entry list when nothing is priced", () => {
    expect(rowsToPriceEntries(buildPriceRows(countries, []))).toEqual({ ok: true, entries: [] });
  });
});
