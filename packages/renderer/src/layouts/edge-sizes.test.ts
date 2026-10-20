import type { Design, Packaging } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { makeDesign, makePackaging, objectId } from "../../test/fixtures";

import { computePlacements, expandDesignItems, SCENE_SIZE } from "./index";
import type { Placement } from "./index";

// Values copied from scripts/seed/data/packagings.ts (the seeded bouquet and gift box).
const BOUQUET: Packaging = makePackaging({
  slug: "bouquet",
  name: "Bouquet",
  layoutType: "bouquet-fan",
  minItems: 6,
  maxItems: 10,
  capacityUnits: 18,
});
const GIFT_BOX: Packaging = makePackaging({
  slug: "gift-box",
  name: "Gift box",
  layoutType: "box-grid",
  minItems: 4,
  maxItems: 9,
  capacityUnits: 18,
});

/** A design with exactly `total` items spread over lines of mixed qty (1, 2, 3, 1, 2, 3, ...). */
function designWithTotal(total: number, seed: number): Design {
  const base = makeDesign(total, seed);
  const items: Design["items"] = [];
  let remaining = total;
  for (let slot = 0; remaining > 0; slot += 1) {
    const qty = Math.min(remaining, (slot % 3) + 1);
    items.push({ itemId: objectId(slot + 1), qty, slot });
    remaining -= qty;
  }
  return { ...base, items, arrangementSeed: seed };
}

function key(p: Placement): string {
  return `${p.x},${p.y}`;
}

function describeSize(name: string, packaging: Packaging, total: number) {
  describe(`${name} with ${total} items`, () => {
    const design = designWithTotal(total, 7);
    const placements = computePlacements({ design, packaging });

    it("has mixed quantities and the exact item count", () => {
      expect(design.items.some((line) => line.qty > 1)).toBe(true);
      expect(design.items.some((line) => line.qty === 1)).toBe(true);
      expect(expandDesignItems(design)).toHaveLength(total);
      expect(placements).toHaveLength(total);
      expect(placements.map((p) => p.itemIndex)).toEqual(
        Array.from({ length: total }, (_, i) => i),
      );
    });

    it("keeps every placement inside the scene with finite numbers", () => {
      for (const p of placements) {
        for (const value of [p.x, p.y, p.rotation, p.scale, p.z]) {
          expect(Number.isFinite(value)).toBe(true);
        }
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(SCENE_SIZE);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(SCENE_SIZE);
        expect(p.scale).toBeGreaterThan(0);
      }
    });

    it("never puts two items at the same position", () => {
      expect(new Set(placements.map(key)).size).toBe(total);
    });

    it("gives every item its own paint order", () => {
      expect(new Set(placements.map((p) => p.z)).size).toBe(total);
    });

    it("is deterministic for a seed", () => {
      expect(computePlacements({ design: designWithTotal(total, 7), packaging })).toEqual(
        placements,
      );
    });

    it("moves items when the seed changes", () => {
      const shuffled = computePlacements({ design: designWithTotal(total, 8), packaging });
      expect(shuffled).toHaveLength(total);
      expect(shuffled.map(key)).not.toEqual(placements.map(key));
      expect(shuffled.some((p, i) => key(p) !== key(placements[i] as Placement))).toBe(true);
    });
  });
}

describe("layouts at the seeded packaging edge sizes", () => {
  describeSize("bouquet-fan bouquet", BOUQUET, BOUQUET.minItems);
  describeSize("bouquet-fan bouquet", BOUQUET, BOUQUET.maxItems);
  describeSize("box-grid gift box", GIFT_BOX, GIFT_BOX.minItems);
  describeSize("box-grid gift box", GIFT_BOX, GIFT_BOX.maxItems);

  it("keeps a box-grid item in its cell as items are added up to the maximum", () => {
    const cellOf = (total: number) =>
      computePlacements({ design: designWithTotal(total, 3), packaging: GIFT_BOX }).map(
        (p) => p.scale,
      );
    // The grid is sized from maxItems, so item size never changes while filling the box.
    expect(new Set(cellOf(GIFT_BOX.minItems))).toEqual(new Set(cellOf(GIFT_BOX.maxItems)));
  });
});
