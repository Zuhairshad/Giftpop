import { describe, expect, it } from "vitest";

import { COUNTRIES, ITEMS, PACKAGINGS, PRICES } from "./index";

const liveCountries = COUNTRIES.filter((country) => country.status === "live");
const largestSize = Math.max(...ITEMS.map((item) => item.sizeUnits));

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** Sizes of the distinct items a customer can add in one country: priced there and in stock. */
function availableSizes(country: string): number[] {
  const sizeById = new Map(ITEMS.map((item) => [item.id, item.sizeUnits]));
  return PRICES.filter((p) => p.country === country && p.kind === "item" && p.inStock)
    .map((p) => (p.kind === "item" ? (sizeById.get(p.itemId) ?? Infinity) : Infinity))
    .sort((a, b) => a - b);
}

describe("packaging capacity", () => {
  it("fits minItems of the largest item, so any minimum pick (even repeats) fits", () => {
    for (const packaging of PACKAGINGS) {
      expect(packaging.minItems * largestSize).toBeLessThanOrEqual(packaging.capacityUnits);
    }
  });

  it("can be filled to maxItems with distinct small items in every live country", () => {
    for (const country of liveCountries) {
      const sizes = availableSizes(country.code);
      for (const packaging of PACKAGINGS) {
        expect(sizes.length).toBeGreaterThanOrEqual(packaging.maxItems);
        expect(sum(sizes.slice(0, packaging.maxItems))).toBeLessThanOrEqual(
          packaging.capacityUnits,
        );
      }
    }
  });

  it("still limits a gift: maxItems of the largest item never fits", () => {
    for (const packaging of PACKAGINGS) {
      expect(packaging.maxItems * largestSize).toBeGreaterThan(packaging.capacityUnits);
    }
  });
});
