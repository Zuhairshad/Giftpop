import { describe, expect, it } from "vitest";

import { makeDesign, makePackaging } from "../../test/fixtures";

import { SNACK_HAMPER, snackHamper } from "./snack-hamper";
import { ITEM_BASE_SIZE } from "./types";

function placementsFor(count: number, seed: number) {
  return snackHamper({
    design: makeDesign(count, seed),
    packaging: makePackaging({ layoutType: "snack-hamper" }),
  });
}

describe("snack-hamper layout", () => {
  it("is deterministic and differs between seeds", () => {
    expect(placementsFor(6, 7)).toEqual(placementsFor(6, 7));
    expect(placementsFor(6, 1)).not.toEqual(placementsFor(6, 2));
    expect(placementsFor(0, 1)).toEqual([]);
  });

  it("keeps every item finite, inside the crate and behind the front rim for 1 to 10 items", () => {
    for (let count = 1; count <= 10; count++) {
      for (let seed = 1; seed <= 60; seed++) {
        const placements = placementsFor(count, seed);
        expect(placements).toHaveLength(count);
        expect(placements.map((p) => p.itemIndex)).toEqual(
          Array.from({ length: count }, (_, i) => i),
        );
        for (const p of placements) {
          const reach = p.scale * ITEM_BASE_SIZE * 0.5;
          const at = `count ${count} seed ${seed}`;
          for (const v of [p.x, p.y, p.rotation, p.scale, p.z])
            expect(Number.isFinite(v)).toBe(true);
          expect(p.scale).toBeGreaterThan(0);
          expect(p.x - reach * 0.7, at).toBeGreaterThanOrEqual(SNACK_HAMPER.innerLeft - 1);
          expect(p.x + reach * 0.7, at).toBeLessThanOrEqual(SNACK_HAMPER.innerRight + 1);
          expect(p.y - reach, at).toBeGreaterThanOrEqual(0);
          expect(p.y + reach, at).toBeLessThanOrEqual(SNACK_HAMPER.rimY);
        }
      }
    }
  });

  it("packs two rows with the back row higher, smaller in number and underneath", () => {
    const placements = placementsFor(7, 3);
    const back = placements.filter((p) => p.y < 500);
    const front = placements.filter((p) => p.y >= 500);
    expect(back).toHaveLength(3);
    expect(front).toHaveLength(4);
    expect(Math.max(...back.map((p) => p.z))).toBeLessThan(Math.min(...front.map((p) => p.z)));
  });

  it("puts a single item in the middle of the crate", () => {
    const [p] = placementsFor(1, 9);
    expect(Math.abs((p?.x ?? 0) - SNACK_HAMPER.centerX)).toBeLessThan(15);
  });

  it("makes items smaller as the crate fills", () => {
    expect(placementsFor(10, 1)[0]?.scale ?? 0).toBeLessThan(placementsFor(3, 1)[0]?.scale ?? 0);
  });
});
