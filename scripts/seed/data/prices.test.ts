import { CountryPriceSchema, minorDigits } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { COUNTRIES, ITEM_IDS, ITEMS, NO_PRICE, OUT_OF_STOCK, PACKAGINGS, PRICES } from "./index";

const liveCountries = COUNTRIES.filter((country) => country.status === "live");

function itemPrice(country: string, itemId: string): number | undefined {
  const row = PRICES.find((p) => p.country === country && p.kind === "item" && p.itemId === itemId);
  return row?.priceMinor;
}

describe("prices", () => {
  it("parse with the contract schema", () => {
    for (const price of PRICES) expect(CountryPriceSchema.safeParse(price).success).toBe(true);
  });

  it("have integer, positive minor-unit amounts", () => {
    for (const price of PRICES) {
      expect(Number.isSafeInteger(price.priceMinor)).toBe(true);
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

  it("leaves a few declared gaps: items not sold in some countries, some out of stock", () => {
    expect(NO_PRICE.length).toBeGreaterThanOrEqual(1);
    expect(OUT_OF_STOCK.length).toBeGreaterThanOrEqual(1);
    expect(NO_PRICE.some((g) => g.country === "PK" && g.itemId === ITEM_IDS.candle)).toBe(true);
    expect(OUT_OF_STOCK.some((g) => g.country === "SA" && g.itemId === ITEM_IDS.darkBar)).toBe(
      true,
    );
    const outOfStock = PRICES.filter((p) => !p.inStock);
    expect(outOfStock).toHaveLength(OUT_OF_STOCK.length);
    for (const gap of OUT_OF_STOCK) {
      expect(outOfStock).toContainEqual(
        expect.objectContaining({ kind: "item", country: gap.country, itemId: gap.itemId }),
      );
    }
    // A gap must not also be out of stock: it has no row at all.
    for (const gap of NO_PRICE) {
      expect(OUT_OF_STOCK.some((o) => o.country === gap.country && o.itemId === gap.itemId)).toBe(
        false,
      );
    }
  });

  it("prices PKR, INR and TRY in whole major units, like local shop prices", () => {
    for (const country of COUNTRIES.filter((c) => ["PKR", "INR", "TRY"].includes(c.currency))) {
      const unit = 10 ** minorDigits(country.currency);
      for (const price of PRICES.filter((p) => p.country === country.code)) {
        expect(price.priceMinor % unit).toBe(0);
      }
    }
  });

  it("uses magnitudes that suit each currency", () => {
    const milkBar = ITEM_IDS.milkBar;
    // A chocolate bar costs a few dollars, pounds or riyals, and hundreds of rupees.
    expect(itemPrice("US", milkBar)).toBeGreaterThanOrEqual(200);
    expect(itemPrice("US", milkBar)).toBeLessThanOrEqual(1000);
    expect(itemPrice("PK", milkBar)).toBeGreaterThanOrEqual(20_000);
    expect(itemPrice("PK", milkBar)).toBeLessThanOrEqual(150_000);
    expect(itemPrice("IN", milkBar)).toBeGreaterThanOrEqual(10_000);
    expect(itemPrice("GB", milkBar)).toBeLessThan(itemPrice("US", milkBar) ?? 0);
  });

  it("keeps the price order the same in every country (a perfume costs more than a rose)", () => {
    for (const country of liveCountries) {
      const rose = itemPrice(country.code, ITEM_IDS.pinkRose) ?? 0;
      const perfume = itemPrice(country.code, ITEM_IDS.oudParfum) ?? 0;
      expect(perfume).toBeGreaterThan(rose * 5);
    }
  });
});
