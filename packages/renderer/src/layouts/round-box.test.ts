import { describe, expect, it } from "vitest";

import { makeDesign, makePackaging } from "../../test/fixtures";

import { ROUND_BOX_OPENING, roundBox } from "./round-box";

function placementsFor(count: number, seed: number) {
  return roundBox({
    design: makeDesign(count, seed),
    packaging: makePackaging({ layoutType: "round-box" }),
  });
}

describe("round-box layout", () => {
  it("puts up to three items in one row and more in a back and a front row", () => {
    expect(new Set(placementsFor(3, 1).map((p) => p.z >= 100)).size).toBe(1);
    expect(new Set(placementsFor(8, 1).map((p) => p.z >= 100)).size).toBe(2);
  });

  it("keeps every item centred over the box opening", () => {
    for (let count = 1; count <= 8; count++) {
      for (let seed = 1; seed <= 30; seed++) {
        for (const p of placementsFor(count, seed)) {
          expect(Math.abs(p.x - ROUND_BOX_OPENING.cx)).toBeLessThanOrEqual(ROUND_BOX_OPENING.rx);
        }
      }
    }
  });
});
