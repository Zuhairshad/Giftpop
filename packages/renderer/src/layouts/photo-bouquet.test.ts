import { describe, expect, it } from "vitest";

import { makeDesign, makePackaging } from "../../test/fixtures";

import { PHOTO_BOUQUET_GATHER, photoBouquet } from "./photo-bouquet";
import { ITEM_BASE_SIZE } from "./types";

function placementsFor(count: number, seed: number) {
  return photoBouquet({
    design: makeDesign(count, seed),
    packaging: makePackaging({ layoutType: "photo-bouquet" }),
  });
}

describe("photo-bouquet layout", () => {
  it("is deterministic for the same seed and differs between seeds", () => {
    expect(placementsFor(6, 7)).toEqual(placementsFor(6, 7));
    expect(placementsFor(6, 1)).not.toEqual(placementsFor(6, 2));
  });

  it("returns nothing for an empty design", () => {
    expect(placementsFor(0, 1)).toEqual([]);
  });

  it("places one entry per item with indexes 0..n-1", () => {
    for (let count = 1; count <= 10; count++) {
      const placements = placementsFor(count, 3);
      expect(placements).toHaveLength(count);
      expect(placements.map((p) => p.itemIndex).sort((a, b) => a - b)).toEqual(
        Array.from({ length: count }, (_, i) => i),
      );
    }
  });

  it("keeps every item inside the scene and above the wrap", () => {
    for (let count = 1; count <= 10; count++) {
      for (let seed = 1; seed <= 60; seed++) {
        for (const p of placementsFor(count, seed)) {
          const reach = p.scale * ITEM_BASE_SIZE * 0.5;
          const at = `count ${count} seed ${seed}`;
          for (const v of [p.x, p.y, p.rotation, p.scale, p.z])
            expect(Number.isFinite(v)).toBe(true);
          expect(p.scale).toBeGreaterThan(0);
          expect(p.x - reach, at).toBeGreaterThanOrEqual(0);
          expect(p.x + reach, at).toBeLessThanOrEqual(1000);
          expect(p.y - reach, at).toBeGreaterThanOrEqual(0);
          expect(p.y, at).toBeLessThan(PHOTO_BOUQUET_GATHER.y - 100);
        }
      }
    }
  });

  it("stands one item highest near the centre of a dome", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const ps = placementsFor(7, seed);
      const top = ps.reduce((a, b) => (b.y < a.y ? b : a));
      expect(Math.abs(top.x - 500)).toBeLessThan(30);
      expect(ps.filter((p) => p !== top).every((p) => p.y > top.y + 20)).toBe(true);
    }
  });

  it("paints lower items in front", () => {
    const ps = placementsFor(8, 4);
    for (const a of ps) for (const b of ps) if (a.y < b.y) expect(a.z).toBeLessThan(b.z);
  });

  it("shrinks as the count grows and stays centred", () => {
    expect(placementsFor(9, 1)[0]?.scale ?? 0).toBeLessThan(placementsFor(3, 1)[0]?.scale ?? 0);
    const ps = placementsFor(7, 4);
    const mean = ps.reduce((s, p) => s + p.x, 0) / ps.length;
    expect(Math.abs(mean - 500)).toBeLessThan(40);
  });
});
