import { describe, expect, it } from "vitest";

import { makeDesign, makePackaging } from "../../test/fixtures";

import { HEART_BOX_OPENING, heartBox } from "./heart-box";

function placementsFor(count: number, seed: number) {
  return heartBox({
    design: makeDesign(count, seed),
    packaging: makePackaging({ layoutType: "heart-box" }),
  });
}

/** Mirrors the heart: two lobe circles (r 170 at y 530, tops at y 360), then straight sides to the point. */
const LOBE_R = 170;
const LOBE_Y = 530;
const LOBE_DX = 130;
function insideHeart(x: number, y: number, margin = 40): boolean {
  if (y > 650 - margin) return false;
  if (y > LOBE_Y) return Math.abs(x - 500) <= (300 * (650 - y)) / 120 - margin;
  const d = Math.min(
    Math.hypot(x - (500 - LOBE_DX), y - LOBE_Y),
    Math.hypot(x - (500 + LOBE_DX), y - LOBE_Y),
  );
  return d <= LOBE_R - margin;
}

describe("heart-box layout", () => {
  it("exports the opening the art agent draws to", () => {
    expect(HEART_BOX_OPENING).toEqual({
      cx: 500,
      topY: 360,
      dipY: 420,
      bottomY: 650,
      halfWidth: 300,
    });
    expect(Object.isFrozen(HEART_BOX_OPENING)).toBe(true);
  });

  it("is deterministic for the same seed", () => {
    expect(placementsFor(6, 7)).toEqual(placementsFor(6, 7));
  });

  it("differs between seeds", () => {
    expect(placementsFor(6, 1)).not.toEqual(placementsFor(6, 2));
  });

  it("returns nothing for an empty design", () => {
    expect(placementsFor(0, 1)).toEqual([]);
  });

  it("places exactly one entry per expanded item, with unique indexes", () => {
    for (let count = 1; count <= 12; count++) {
      const placements = placementsFor(count, 3);
      expect(placements).toHaveLength(count);
      expect(new Set(placements.map((p) => p.itemIndex)).size).toBe(count);
    }
  });

  it("centres a single item", () => {
    const [p] = placementsFor(1, 5);
    expect(Math.abs((p?.x ?? 0) - 500)).toBeLessThanOrEqual(15);
  });

  it("keeps every item base inside the heart for 1 to 12 items", () => {
    for (let count = 1; count <= 12; count++) {
      for (let seed = 1; seed <= 60; seed++) {
        for (const p of placementsFor(count, seed)) {
          expect(insideHeart(p.x, p.y, 38), `count ${count} seed ${seed} at ${p.x},${p.y}`).toBe(
            true,
          );
        }
      }
    }
  });

  it("paints the back row below the front row, and the front row sits lower on screen", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const placements = placementsFor(8, seed);
      const back = placements.filter((p) => p.z < 100);
      const front = placements.filter((p) => p.z >= 100);
      expect(back.length).toBeGreaterThan(0);
      expect(front.length).toBeGreaterThan(0);
      expect(Math.max(...back.map((p) => p.z))).toBeLessThan(Math.min(...front.map((p) => p.z)));
      const mean = (ps: typeof back) => ps.reduce((s, p) => s + p.y, 0) / ps.length;
      expect(mean(front)).toBeGreaterThan(mean(back));
    }
  });

  it("shrinks items as the count grows", () => {
    expect(placementsFor(9, 1)[0]?.scale ?? 0).toBeLessThan(placementsFor(4, 1)[0]?.scale ?? 0);
  });

  it("stays inside the scene with finite numbers", () => {
    for (let count = 1; count <= 12; count++) {
      for (const p of placementsFor(count, 11)) {
        for (const v of [p.x, p.y, p.rotation, p.scale, p.z]) expect(Number.isFinite(v)).toBe(true);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1000);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1000);
        expect(p.scale).toBeGreaterThan(0);
      }
    }
  });
});
