import { Box3, Vector3 } from "three";
import { describe, expect, it } from "vitest";

import { boxShell, roundedSlab } from "./box-geometry";

function bounds(geometry: ReturnType<typeof boxShell>) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox ?? new Box3();
  return { min: box.min, size: box.getSize(new Vector3()) };
}

describe("box geometry", () => {
  const size = { width: 3.36, depth: 2.2, height: 2.36, wall: 0.1, corner: 0.07, bevel: 0.025 };

  it("builds the open box at its exact outside size, standing on y = 0", () => {
    const { min, size: s } = bounds(boxShell(size));
    expect(s.x).toBeCloseTo(size.width, 3);
    expect(s.y).toBeCloseTo(size.height, 3);
    expect(s.z).toBeCloseTo(size.depth, 3);
    expect(min.y).toBeCloseTo(0, 6);
  });

  it("leaves the top open: no vertex near the middle of the top face", () => {
    const p = boxShell(size).getAttribute("position");
    for (let i = 0; i < p.count; i += 1) {
      const inside = Math.abs(p.getX(i)) < 1.4 && Math.abs(p.getZ(i)) < 0.9;
      expect(inside).toBe(false);
    }
  });

  it("builds a bevelled slab at its exact size", () => {
    const { min, size: s } = bounds(roundedSlab(3, 2, 0.1, 0.05, 0.02));
    expect(s.x).toBeCloseTo(3, 3);
    expect(s.y).toBeCloseTo(0.1, 3);
    expect(s.z).toBeCloseTo(2, 3);
    expect(min.y).toBeCloseTo(0, 6);
  });

  it("is finite for a tiny corner and no bevel", () => {
    const values = Array.from(
      boxShell({ ...size, corner: 0, bevel: 0 }).getAttribute("position").array,
    );
    expect(values.every(Number.isFinite)).toBe(true);
  });
});
