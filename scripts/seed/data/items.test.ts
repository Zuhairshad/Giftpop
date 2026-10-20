import { ITEM_SHAPES, ItemSchema, ObjectIdSchema } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { ITEM_IDS, ITEMS, PACKAGINGS } from "./index";

function countBy<T>(values: T[], key: (value: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[key(value)] = (counts[key(value)] ?? 0) + 1;
  return counts;
}

describe("items", () => {
  it("parse with the contract schema", () => {
    for (const item of ITEMS) expect(ItemSchema.safeParse(item).success).toBe(true);
  });

  it("have unique valid ids and names, distinct from packaging ids", () => {
    for (const item of ITEMS) expect(ObjectIdSchema.safeParse(item.id).success).toBe(true);
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    expect(new Set(ITEMS.map((i) => i.name.toLowerCase())).size).toBe(ITEMS.length);
    const packagingIds = new Set(PACKAGINGS.map((p) => p.id));
    for (const item of ITEMS) expect(packagingIds.has(item.id)).toBe(false);
  });

  it("seeds every id in ITEM_IDS exactly once", () => {
    expect(ITEMS.map((i) => i.id).sort()).toEqual(Object.values(ITEM_IDS).sort());
  });

  it("keeps the ids of the original 15 demo items, so re-seeding updates them", () => {
    const ids = new Set(ITEMS.map((i) => i.id));
    for (let n = 101; n <= 115; n += 1) expect(ids.has(`65b000000000000000000${n}`)).toBe(true);
  });

  it("is a demo catalogue of 40 to 60 items over 8 to 10 categories", () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(40);
    expect(ITEMS.length).toBeLessThanOrEqual(60);
    const perCategory = countBy(ITEMS, (i) => i.category);
    expect(Object.keys(perCategory).length).toBeGreaterThanOrEqual(8);
    expect(Object.keys(perCategory).length).toBeLessThanOrEqual(10);
    for (const count of Object.values(perCategory)) expect(count).toBeGreaterThanOrEqual(3);
  });

  it("uses valid shapes, including every shape added for the fuller catalogue", () => {
    for (const item of ITEMS) expect(ITEM_SHAPES).toContain(item.shape);
    const shapes = new Set(ITEMS.map((i) => i.shape));
    for (const shape of ["perfume", "candle", "jewellery", "cosmetic", "cupcake", "frame"]) {
      expect(shapes.has(shape as (typeof ITEM_SHAPES)[number])).toBe(true);
    }
  });

  it("is all active, has no images and sizes from 1 to 3", () => {
    for (const item of ITEMS) {
      expect(item.image).toBeUndefined();
      expect(item.active).toBe(true);
      expect([1, 2, 3]).toContain(item.sizeUnits);
    }
  });

  it("sets a picker style on every item: 25 to 30 tiles and 20 to 25 list items", () => {
    const perStyle = countBy(ITEMS, (i) => i.pickerStyle ?? "missing");
    expect(perStyle.missing).toBeUndefined();
    expect(perStyle.tile).toBeGreaterThanOrEqual(25);
    expect(perStyle.tile).toBeLessThanOrEqual(30);
    expect(perStyle.list).toBeGreaterThanOrEqual(20);
    expect(perStyle.list).toBeLessThanOrEqual(25);
  });

  it("gives every category at least one tile, listed before its list items", () => {
    for (const category of new Set(ITEMS.map((i) => i.category))) {
      const inCategory = ITEMS.filter((i) => i.category === category).sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      expect(inCategory[0]?.pickerStyle).toBe("tile");
      const firstList = inCategory.findIndex((i) => i.pickerStyle === "list");
      if (firstList >= 0) {
        expect(inCategory.slice(firstList).every((i) => i.pickerStyle === "list")).toBe(true);
      }
    }
  });

  it("has a unique sort order within each category", () => {
    const keys = ITEMS.map((i) => `${i.category}:${i.sortOrder}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("makes mugs, cards and frames personalizable, each with a name limit", () => {
    const personalizable = ITEMS.filter((item) => item.personalizable);
    expect(personalizable.length).toBeGreaterThanOrEqual(5);
    for (const item of personalizable) expect(item.personalizationMaxLength).toBeGreaterThan(0);
    for (const shape of ["mug", "card", "frame"]) {
      expect(personalizable.some((i) => i.shape === shape)).toBe(true);
    }
    for (const item of ITEMS.filter((i) => !i.personalizable)) {
      expect(item.personalizationMaxLength).toBeUndefined();
    }
  });

  it("uses generic names, not brand names", () => {
    const brands =
      /dairy milk|kit ?kat|ferrero|rocher|kinder|snickers|nivea|hershey|lindt|victoria'?s secret|lay'?s|toblerone|cadbury|nutella/i;
    for (const item of ITEMS) expect(item.name).not.toMatch(brands);
  });
});
