import { describe, expect, it } from "vitest";

import { makeDesign, makePackaging } from "../../test/fixtures";

import { BALLOON_GIFT_KNOT, balloonGift } from "./balloon-gift";
import { ITEM_BASE_SIZE } from "./types";

function placementsFor(count: number, seed: number) {
  return balloonGift({
    design: makeDesign(count, seed),
    packaging: makePackaging({ layoutType: "balloon-gift" }),
  });
}

describe("balloon-gift layout", () => {
  it("is deterministic for the same seed and differs between seeds", () => {
    expect(placementsFor(6, 7)).toEqual(placementsFor(6, 7));
    expect(placementsFor(6, 1)).not.toEqual(placementsFor(6, 2));
  });

  it("returns nothing for an empty design", () => {
    expect(placementsFor(0, 1)).toEqual([]);
  });

  it("places one entry per item with unique indexes", () => {
    for (let count = 1; count <= 12; count++) {
      const placements = placementsFor(count, 3);
      expect(placements).toHaveLength(count);
      expect(new Set(placements.map((p) => p.itemIndex)).size).toBe(count);
    }
  });

  it("keeps every balloon inside the scene and above the base box for 1 to 12 items", () => {
    for (let count = 1; count <= 12; count++) {
      for (let seed = 1; seed <= 60; seed++) {
        for (const p of placementsFor(count, seed)) {
          const reach = p.scale * ITEM_BASE_SIZE * 0.5;
          const at = `count ${count} seed ${seed}`;
          for (const v of [p.x, p.y, p.rotation, p.scale, p.z])
            expect(Number.isFinite(v)).toBe(true);
          expect(p.x - reach, at).toBeGreaterThanOrEqual(0);
          expect(p.x + reach, at).toBeLessThanOrEqual(1000);
          expect(p.y - reach, at).toBeGreaterThanOrEqual(0);
          expect(p.y, at).toBeLessThan(BALLOON_GIFT_KNOT.y - 100);
        }
      }
    }
  });

  it("centres a single balloon and shrinks as the count grows", () => {
    const [p] = placementsFor(1, 5);
    expect(Math.abs((p?.x ?? 0) - 500)).toBeLessThanOrEqual(15);
    expect(placementsFor(9, 1)[0]?.scale ?? 0).toBeLessThan(placementsFor(3, 1)[0]?.scale ?? 0);
  });

  it("keeps the cluster centred on the base box", () => {
    const placements = placementsFor(7, 4);
    const mean = placements.reduce((s, p) => s + p.x, 0) / placements.length;
    expect(Math.abs(mean - 500)).toBeLessThan(40);
  });
});
