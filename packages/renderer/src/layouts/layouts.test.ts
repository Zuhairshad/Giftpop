import { describe, expect, it } from "vitest";

import { makeDesign, makePackaging } from "../../test/fixtures";

import { createRng } from "./prng";

import {
  LAYOUT_TYPES,
  LAYOUTS,
  computePlacements,
  expandDesignItems,
  getLayout,
  SCENE_SIZE,
} from "./index";

const MAX_ITEMS = 10;

describe.each(LAYOUT_TYPES)("layout %s", (layoutType) => {
  const packaging = makePackaging({ layoutType, maxItems: MAX_ITEMS });
  const run = (count: number, seed = 1, qty = 1) =>
    computePlacements({ design: makeDesign(count, seed, qty), packaging });

  it("is deterministic for the same design and seed", () => {
    expect(run(7, 42)).toEqual(run(7, 42));
  });

  it("places exactly one placement per item for 1 to maxItems items", () => {
    for (let count = 1; count <= MAX_ITEMS; count += 1) {
      const placements = run(count);
      expect(placements).toHaveLength(count);
      expect(placements.map((p) => p.itemIndex)).toEqual(
        Array.from({ length: count }, (_, i) => i),
      );
    }
  });

  it("expands qty into separate placements", () => {
    expect(run(3, 5, 2)).toHaveLength(6);
  });

  it("returns no placements for an empty design", () => {
    expect(run(0)).toEqual([]);
  });

  it("never produces NaN or Infinity and keeps scale positive", () => {
    for (let count = 1; count <= MAX_ITEMS; count += 1) {
      for (const p of run(count, 99)) {
        for (const value of [p.x, p.y, p.rotation, p.scale, p.z]) {
          expect(Number.isFinite(value)).toBe(true);
        }
        expect(p.scale).toBeGreaterThan(0);
      }
    }
  });

  it("keeps every placement inside the 0 to 1000 scene", () => {
    for (let count = 1; count <= MAX_ITEMS; count += 1) {
      for (const seed of [0, 1, 7, 123456, 0xffffffff]) {
        for (const p of run(count, seed)) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(SCENE_SIZE);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(SCENE_SIZE);
        }
      }
    }
  });

  it("stays inside the scene even when a design exceeds maxItems", () => {
    const placements = run(MAX_ITEMS + 6);
    expect(placements).toHaveLength(MAX_ITEMS + 6);
    for (const p of placements) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(SCENE_SIZE);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(SCENE_SIZE);
    }
  });

  it("changes the arrangement when the seed changes", () => {
    expect(run(6, 1)).not.toEqual(run(6, 2));
  });

  it("follows slot order, not the order lines appear in the design", () => {
    const design = makeDesign(3);
    const reversed = { ...design, items: [...design.items].reverse() };
    expect(computePlacements({ design: reversed, packaging })).toEqual(
      computePlacements({ design, packaging }),
    );
  });
});

describe("expandDesignItems", () => {
  it("expands by qty in slot order", () => {
    const design = makeDesign(2, 1, 2);
    const [a, b] = design.items;
    if (!a || !b) throw new Error("fixture");
    const swapped = {
      ...design,
      items: [
        { ...a, slot: 1 },
        { ...b, slot: 0 },
      ],
    };
    expect(expandDesignItems(swapped)).toEqual([b.itemId, b.itemId, a.itemId, a.itemId]);
  });
});

describe("registry", () => {
  it("resolves every registered layout type to its function", () => {
    expect(LAYOUT_TYPES.length).toBeGreaterThanOrEqual(2);
    for (const layoutType of LAYOUT_TYPES) {
      expect(getLayout(layoutType)).toBe(LAYOUTS[layoutType]);
    }
  });

  it("includes bouquet-fan and box-grid", () => {
    expect([...LAYOUT_TYPES].sort()).toEqual(["bouquet-fan", "box-grid"]);
  });

  it("throws a clear error for an unknown layout type", () => {
    expect(() => getLayout("spiral")).toThrow(/Unknown layoutType "spiral"/);
    expect(() => getLayout("spiral")).toThrow(/bouquet-fan/);
  });

  it("does not treat inherited object keys as layout types", () => {
    expect(() => getLayout("toString")).toThrow(/Unknown layoutType/);
  });

  it("computePlacements throws for a packaging with an unknown layout type", () => {
    expect(() =>
      computePlacements({
        design: makeDesign(2),
        packaging: makePackaging({ layoutType: "nope" }),
      }),
    ).toThrow(/Unknown layoutType "nope"/);
  });
});

describe("createRng", () => {
  it("repeats for the same seed and stays in [0, 1)", () => {
    const a = createRng(5);
    const b = createRng(5);
    for (let i = 0; i < 100; i += 1) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("differs between seeds", () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });
});
