import { describe, expect, it } from "vitest";

import { bentTail, bowLoop, tissueSheet } from "./geometry";

type Geometry = ReturnType<typeof bentTail>;

function meanX(geometry: Geometry): number {
  const p = geometry.getAttribute("position");
  let sum = 0;
  for (let i = 0; i < p.count; i += 1) sum += p.getX(i);
  return sum / p.count;
}

describe("geometry builders", () => {
  it("hangs a ribbon tail down from its top edge and curves it outward", () => {
    const right = bentTail(0.4, 2, 1, 0.5, 0.2);
    const left = bentTail(0.4, 2, -1, 0.5, 0.2);
    const p = right.getAttribute("position");
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < p.count; i += 1) {
      minY = Math.min(minY, p.getY(i));
      maxY = Math.max(maxY, p.getY(i));
    }
    expect(maxY).toBeCloseTo(0, 6);
    expect(minY).toBeLessThan(-1.7);
    expect(meanX(right)).toBeGreaterThan(0.05);
    expect(meanX(left)).toBeLessThan(-0.05);
  });

  it("cuts a V notch into the end of the tail: the centre of the last row sits higher than its edges", () => {
    const p = bentTail(0.4, 2, 1, 0, 0.3).getAttribute("position");
    const lastRow: { x: number; y: number }[] = [];
    // Vertices are ordered row by row from the top; the last row has 9 vertices.
    for (let i = p.count - 9; i < p.count; i += 1) lastRow.push({ x: p.getX(i), y: p.getY(i) });
    const centre = lastRow.reduce((a, b) => (Math.abs(a.x) < Math.abs(b.x) ? a : b));
    const edge = lastRow.reduce((a, b) => (Math.abs(a.x) > Math.abs(b.x) ? a : b));
    expect(centre.y).toBeGreaterThan(edge.y + 0.2);
  });

  it("makes finite bow loops and tissue", () => {
    for (const g of [bowLoop(1), bowLoop(-1), tissueSheet(3, 2)]) {
      const values = Array.from(g.getAttribute("position").array);
      expect(values.length).toBeGreaterThan(30);
      expect(values.every(Number.isFinite)).toBe(true);
    }
  });

  it("mirrors the bow loops about the knot", () => {
    expect(meanX(bowLoop(1))).toBeGreaterThan(0.2);
    expect(meanX(bowLoop(-1))).toBeLessThan(-0.2);
  });
});
