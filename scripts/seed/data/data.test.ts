import {
  CountryPriceSchema,
  CountrySchema,
  ITEM_SHAPES,
  ItemSchema,
  LAUNCH_COUNTRY_CODES,
  ObjectIdSchema,
  PackagingSchema,
} from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import {
  BOUQUET_ID,
  BOX_ID,
  COUNTRIES,
  ITEMS,
  NO_PRICE,
  OUT_OF_STOCK,
  PACKAGINGS,
  PRICES,
} from "./index";

const liveCountries = COUNTRIES.filter((country) => country.status === "live");

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

describe("countries", () => {
  it("parse with the contract schema", () => {
    for (const country of COUNTRIES) expect(CountrySchema.safeParse(country).success).toBe(true);
  });

  it("are exactly the nine launch countries, all live with both payment modes", () => {
    expect(COUNTRIES.map((country) => country.code).sort()).toEqual(
      [...LAUNCH_COUNTRY_CODES].sort(),
    );
    for (const country of COUNTRIES) {
      expect(country.status).toBe("live");
      expect([...country.paymentModes].sort()).toEqual(["cod", "prepaid"]);
    }
  });

  it("use the documented currencies", () => {
    const currencies = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.currency]));
    expect(currencies).toEqual({
      US: "USD",
      GB: "GBP",
      SA: "SAR",
      IN: "INR",
      PK: "PKR",
      CN: "CNY",
      AU: "AUD",
      TR: "TRY",
      CA: "CAD",
    });
  });

  it("use the documented address formats", () => {
    const format = (code: string) => COUNTRIES.find((c) => c.code === code)?.addressFormat;
    expect(format("US")).toEqual({
      region: { required: true, label: "State" },
      postalCode: { required: true, label: "ZIP" },
    });
    expect(format("GB")).toEqual({
      region: { required: false, label: "County" },
      postalCode: { required: true, label: "Postcode" },
    });
    expect(format("CA")?.region.label).toBe("Province");
    expect(format("AU")?.postalCode.label).toBe("Postcode");
    expect(format("IN")?.postalCode.label).toBe("PIN code");
    expect(format("PK")?.postalCode).toEqual({ required: false, label: "Postal code" });
    expect(format("SA")?.region.label).toBe("Region");
    expect(format("TR")?.region.label).toBe("Province");
    expect(format("CN")?.region.label).toBe("Province");
  });

  it("give every country neutral payment instructions with a placeholder account", () => {
    for (const country of COUNTRIES) {
      const text = country.paymentInstructions;
      expect(text).toContain("account 0000 0000 0000");
      expect(text).toContain("reference: your order number");
      expect(text).not.toMatch(/DEV ONLY/i);
      // Only zeros: no digit sequence that could be a real account number.
      expect(text).not.toMatch(/[1-9]/);
    }
  });

  it("has a free-shipping threshold for SA and none for PK", () => {
    const find = (code: string) => COUNTRIES.find((c) => c.code === code);
    expect(find("SA")?.shipping.freeOverMinor).toBeGreaterThan(0);
    expect(find("PK")?.shipping.freeOverMinor).toBeUndefined();
  });
});

describe("packagings", () => {
  it("parse with the contract schema", () => {
    for (const packaging of PACKAGINGS) {
      expect(PackagingSchema.safeParse(packaging).success).toBe(true);
    }
  });

  it("have unique valid ids and slugs", () => {
    for (const packaging of PACKAGINGS)
      expect(ObjectIdSchema.safeParse(packaging.id).success).toBe(true);
    expect(new Set(PACKAGINGS.map((p) => p.id)).size).toBe(PACKAGINGS.length);
    expect(new Set(PACKAGINGS.map((p) => p.slug)).size).toBe(PACKAGINGS.length);
  });

  it("are a bouquet-fan bouquet (6 to 10) and a box-grid box (4 to 9)", () => {
    const bouquet = PACKAGINGS.find((p) => p.id === BOUQUET_ID);
    const box = PACKAGINGS.find((p) => p.id === BOX_ID);
    expect(bouquet).toMatchObject({ layoutType: "bouquet-fan", minItems: 6, maxItems: 10 });
    expect(box).toMatchObject({ layoutType: "box-grid", minItems: 4, maxItems: 9 });
    expect(PACKAGINGS.find((p) => p.slug === "round-hat-box")).toMatchObject({
      layoutType: "round-box",
    });
    expect(PACKAGINGS.find((p) => p.kind === "basket")).toMatchObject({ layoutType: "basket" });
    expect(PACKAGINGS.find((p) => p.kind === "mug")).toMatchObject({ layoutType: "mug-bouquet" });
  });

  it("group every packaging by kind", () => {
    const kinds = Object.fromEntries(PACKAGINGS.map((p) => [p.slug, p.kind]));
    expect(kinds).toEqual({
      bouquet: "bouquet",
      "gift-box": "box",
      "round-hat-box": "box",
      "gift-basket": "basket",
      "mug-bouquet": "mug",
    });
  });

  it("list pink as the first wrapper and ribbon accent colour", () => {
    for (const packaging of PACKAGINGS) {
      expect(packaging.wrapperColors.length).toBeGreaterThan(0);
      expect(packaging.ribbonColors.length).toBeGreaterThan(0);
      expect(packaging.wrapperColors[0]?.name.toLowerCase()).toContain("pink");
      expect(packaging.ribbonColors[0]?.name.toLowerCase()).toContain("pink");
    }
  });

  it("can be filled to minItems with the largest items and to maxItems with the smallest", () => {
    const sizes = ITEMS.map((item) => item.sizeUnits).sort((a, b) => a - b);
    for (const packaging of PACKAGINGS) {
      expect(sizes.length).toBeGreaterThanOrEqual(packaging.maxItems);
      const smallestMax = sum(sizes.slice(0, packaging.maxItems));
      const largestMin = sum(sizes.slice(sizes.length - packaging.minItems));
      expect(smallestMax).toBeLessThanOrEqual(packaging.capacityUnits);
      // Any valid minimum-size pick fits, so the builder never traps a customer.
      expect(largestMin).toBeLessThanOrEqual(packaging.capacityUnits);
    }
  });
});

describe("items", () => {
  it("parse with the contract schema", () => {
    for (const item of ITEMS) expect(ItemSchema.safeParse(item).success).toBe(true);
  });

  it("have unique valid ids and names", () => {
    for (const item of ITEMS) expect(ObjectIdSchema.safeParse(item.id).success).toBe(true);
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    expect(new Set(ITEMS.map((i) => i.name)).size).toBe(ITEMS.length);
    const packagingIds = new Set(PACKAGINGS.map((p) => p.id));
    for (const item of ITEMS) expect(packagingIds.has(item.id)).toBe(false);
  });

  it("cover the five categories with no images and sizes from 1 to 3", () => {
    expect(new Set(ITEMS.map((i) => i.category))).toEqual(
      new Set(["Chocolates", "Flowers", "Care", "Accessories", "Cards"]),
    );
    for (const item of ITEMS) {
      expect(item.image).toBeUndefined();
      expect(item.sizeUnits).toBeGreaterThanOrEqual(1);
      expect(item.sizeUnits).toBeLessThanOrEqual(3);
      expect(ITEM_SHAPES).toContain(item.shape);
    }
  });

  it("has a few personalizable items, each with a name limit", () => {
    const personalizable = ITEMS.filter((item) => item.personalizable);
    expect(personalizable.length).toBeGreaterThanOrEqual(2);
    for (const item of personalizable) expect(item.personalizationMaxLength).toBeGreaterThan(0);
  });
});

describe("prices", () => {
  it("parse with the contract schema", () => {
    for (const price of PRICES) expect(CountryPriceSchema.safeParse(price).success).toBe(true);
  });

  it("have integer, positive minor-unit amounts", () => {
    for (const price of PRICES) {
      expect(Number.isInteger(price.priceMinor)).toBe(true);
      expect(price.priceMinor).toBeGreaterThan(0);
    }
  });

  it("are unique per country and item or packaging", () => {
    const keys = PRICES.map((p) =>
      p.kind === "item"
        ? `${p.country}:item:${p.itemId}`
        : `${p.country}:packaging:${p.packagingId}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("only refer to seeded countries, items and packagings", () => {
    const countries = new Set(COUNTRIES.map((c) => c.code));
    const itemIds = new Set(ITEMS.map((i) => i.id));
    const packagingIds = new Set(PACKAGINGS.map((p) => p.id));
    for (const price of PRICES) {
      expect(countries.has(price.country)).toBe(true);
      if (price.kind === "item") expect(itemIds.has(price.itemId)).toBe(true);
      else expect(packagingIds.has(price.packagingId)).toBe(true);
    }
  });

  it("cover every live country for every packaging and item except the deliberate gaps", () => {
    const has = (country: string, id: string) =>
      PRICES.some(
        (p) =>
          p.country === country && (p.kind === "item" ? p.itemId === id : p.packagingId === id),
      );
    for (const country of liveCountries) {
      for (const packaging of PACKAGINGS) expect(has(country.code, packaging.id)).toBe(true);
      for (const item of ITEMS) {
        const gap = NO_PRICE.some((g) => g.country === country.code && g.itemId === item.id);
        expect(has(country.code, item.id)).toBe(!gap);
      }
    }
  });

  it("leaves exactly the declared gaps: one item without a PK price, one out of stock in SA", () => {
    expect(NO_PRICE).toHaveLength(1);
    expect(NO_PRICE[0]?.country).toBe("PK");
    expect(OUT_OF_STOCK).toHaveLength(1);
    expect(OUT_OF_STOCK[0]?.country).toBe("SA");
    const outOfStock = PRICES.filter((p) => !p.inStock);
    expect(outOfStock).toHaveLength(OUT_OF_STOCK.length);
    expect(outOfStock[0]).toMatchObject({
      kind: "item",
      country: "SA",
      itemId: OUT_OF_STOCK[0]?.itemId,
    });
  });

  it("keeps enough in-stock priced items in every country to fill every packaging", () => {
    for (const country of liveCountries) {
      const available = PRICES.filter(
        (p) => p.country === country.code && p.kind === "item" && p.inStock,
      );
      for (const packaging of PACKAGINGS) {
        expect(available.length).toBeGreaterThanOrEqual(packaging.maxItems);
      }
    }
  });

  it("uses magnitudes that suit each currency", () => {
    const priceOf = (country: string, id: string) =>
      PRICES.find((p) => p.country === country && p.kind === "item" && p.itemId === id)?.priceMinor;
    const milkBar = ITEMS[0]?.id ?? "";
    expect(priceOf("US", milkBar)).toBeLessThan(priceOf("PK", milkBar) ?? 0);
    expect(priceOf("PK", milkBar)).toBeGreaterThanOrEqual(100_000);
  });
});
