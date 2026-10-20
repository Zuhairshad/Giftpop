import { describe, expect, it } from "vitest";

import { makeDesign, makePackaging } from "../../test/fixtures";

import { FRAMED_GIFT_WINDOW, framedGift } from "./framed-gift";
import { ITEM_BASE_SIZE } from "./types";

function placementsFor(count: number, seed: number) {
  return framedGift({
    design: makeDesign(count, seed),
    packaging: makePackaging({ layoutType: "framed-gift" }),
  });
}

describe("framed-gift layout", () => {
  it("is deterministic for the same seed and differs between seeds", () => {
    expect(placementsFor(6, 7)).toEqual(placementsFor(6, 7));
    expect(placementsFor(6, 1)).not.toEqual(placementsFor(6, 2));
    expect(placementsFor(1, 1)).not.toEqual(placementsFor(1, 2));
  });

  it("returns nothing for an empty design", () => {
    expect(placementsFor(0, 1)).toEqual([]);
  });

  it("places one entry per item with indexes 0 to n-1", () => {
    for (let count = 1; count <= 10; count++) {
      const placements = placementsFor(count, 3);
      expect(placements.map((p) => p.itemIndex)).toEqual(
        Array.from({ length: count }, (_, i) => i),
      );
    }
  });

  it("keeps every item fully inside the mat window for 1 to 10 items", () => {
    const w = FRAMED_GIFT_WINDOW;
    for (let count = 1; count <= 10; count++) {
      for (let seed = 1; seed <= 60; seed++) {
        for (const p of placementsFor(count, seed)) {
          const reach = p.scale * ITEM_BASE_SIZE * 0.5;
          const at = `count ${count} seed ${seed}`;
          for (const v of [p.x, p.y, p.rotation, p.scale, p.z])
            expect(Number.isFinite(v)).toBe(true);
          expect(p.scale).toBeGreaterThan(0);
          expect(p.x - reach, at).toBeGreaterThanOrEqual(w.x);
          expect(p.x + reach, at).toBeLessThanOrEqual(w.x + w.width);
          expect(p.y - reach, at).toBeGreaterThanOrEqual(w.y);
          expect(p.y + reach, at).toBeLessThanOrEqual(w.y + w.height);
        }
      }
    }
  });

  it("makes one hero larger than the rest for 3 to 6 items", () => {
    for (let count = 3; count <= 6; count++) {
      const scales = placementsFor(count, 4).map((p) => p.scale);
      const hero = Math.max(...scales);
      expect(scales.filter((s) => s === hero)).toHaveLength(1);
      expect(hero).toBeGreaterThan(Math.min(...scales) * 1.4);
    }
  });

  it("hangs 7 to 10 items on two even rows", () => {
    for (let count = 7; count <= 10; count++) {
      const rows = new Set(placementsFor(count, 2).map((p) => Math.round(p.y / 20)));
      expect(rows.size).toBeLessThanOrEqual(4);
      const scales = new Set(placementsFor(count, 2).map((p) => p.scale));
      expect(scales.size).toBeLessThanOrEqual(2);
    }
  });

  it("keeps the arrangement centred in the frame", () => {
    const placements = placementsFor(5, 9);
    const mean = placements.reduce((s, p) => s + p.x, 0) / placements.length;
    expect(Math.abs(mean - 500)).toBeLessThan(40);
  });
});
