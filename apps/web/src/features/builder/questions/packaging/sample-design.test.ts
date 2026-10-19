import { DesignSchema, validateDesign } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { FIXTURE_ITEMS, FIXTURE_PACKAGINGS, fixtureCatalog } from "../_dev/fixtures";

import { buildSampleDesign, sampleItemCount } from "./sample-design";

describe("sampleItemCount", () => {
  it("shows at least 3 items, at most 6, and never more than the format holds", () => {
    expect(sampleItemCount({ minItems: 1, maxItems: 10 })).toBe(3);
    expect(sampleItemCount({ minItems: 4, maxItems: 8 })).toBe(4);
    expect(sampleItemCount({ minItems: 9, maxItems: 12 })).toBe(6);
    expect(sampleItemCount({ minItems: 1, maxItems: 2 })).toBe(2);
  });
});

describe("buildSampleDesign", () => {
  it("builds a valid design for every fixture packaging", () => {
    for (const priced of FIXTURE_PACKAGINGS) {
      const design = buildSampleDesign(priced.packaging, FIXTURE_ITEMS);
      expect(DesignSchema.safeParse(design).success).toBe(true);
      const codes = validateDesign(design, fixtureCatalog()).map((problem) => problem.code);
      expect(codes).not.toContain("TOO_MANY_ITEMS");
      expect(codes).not.toContain("OVER_CAPACITY");
      expect(design.items.length).toBe(sampleItemCount(priced.packaging));
    }
  });

  it("is deterministic", () => {
    const packaging = FIXTURE_PACKAGINGS[1]!.packaging;
    expect(buildSampleDesign(packaging, FIXTURE_ITEMS)).toEqual(
      buildSampleDesign(packaging, FIXTURE_ITEMS),
    );
  });

  it("mixes categories instead of taking the first few items", () => {
    const packaging = FIXTURE_PACKAGINGS[0]!.packaging;
    const design = buildSampleDesign(packaging, FIXTURE_ITEMS);
    const categories = new Set(
      design.items.map(
        (line) => FIXTURE_ITEMS.find((entry) => entry.item.id === line.itemId)?.item.category,
      ),
    );
    expect(categories.size).toBe(design.items.length);
  });

  it("skips out-of-stock items", () => {
    const packaging = FIXTURE_PACKAGINGS[1]!.packaging;
    const design = buildSampleDesign(packaging, FIXTURE_ITEMS);
    const outOfStock = FIXTURE_ITEMS.filter((entry) => !entry.inStock).map((e) => e.item.id);
    for (const line of design.items) expect(outOfStock).not.toContain(line.itemId);
  });

  it("stays inside the capacity of a small packaging", () => {
    const packaging = { ...FIXTURE_PACKAGINGS[0]!.packaging, capacityUnits: 3, maxItems: 7 };
    const design = buildSampleDesign(packaging, FIXTURE_ITEMS);
    const used = design.items.reduce(
      (sum, line) =>
        sum + (FIXTURE_ITEMS.find((e) => e.item.id === line.itemId)?.item.sizeUnits ?? 0),
      0,
    );
    expect(used).toBeLessThanOrEqual(3);
  });

  it("numbers slots 0..n-1 with quantity 1 and uses the first wrapper and ribbon colours", () => {
    const packaging = FIXTURE_PACKAGINGS[0]!.packaging;
    const design = buildSampleDesign(packaging, FIXTURE_ITEMS);
    expect(design.items.map((line) => line.slot)).toEqual(design.items.map((_, i) => i));
    expect(design.items.every((line) => line.qty === 1)).toBe(true);
    expect(design.wrapperColor).toBe(packaging.wrapperColors[0]!.hex);
    expect(design.ribbonColor).toBe(packaging.ribbonColors[0]!.hex);
  });

  it("is an empty design when the catalog has no items", () => {
    const design = buildSampleDesign(FIXTURE_PACKAGINGS[0]!.packaging, []);
    expect(design.items).toEqual([]);
    expect(design.packagingId).toBe(FIXTURE_PACKAGINGS[0]!.packaging.id);
  });
});
