import { describe, expect, it } from "vitest";

import { makeDesign, makePackaging } from "../../test/fixtures";

import { GIFT_TRAY, giftTray, trayRows, trayScale } from "./gift-tray";
import { ITEM_BASE_SIZE } from "./types";

function placementsFor(count: number, seed: number) {
  return giftTray({
    design: makeDesign(count, seed),
    packaging: makePackaging({ layoutType: "gift-tray" }),
  });
}

describe("gift-tray layout", () => {
  it("is deterministic and varies with the seed", () => {
    expect(placementsFor(6, 7)).toEqual(placementsFor(6, 7));
    expect(placementsFor(6, 1)).not.toEqual(placementsFor(6, 2));
  });

  it("returns nothing for an empty design", () => {
    expect(placementsFor(0, 1)).toEqual([]);
  });

  it("places one entry per item with indexes 0..n-1", () => {
    for (let count = 1; count <= 10; count++) {
      const ps = placementsFor(count, 3);
      expect(ps.map((p) => p.itemIndex)).toEqual(Array.from({ length: count }, (_, i) => i));
    }
  });

  it("keeps every item inside the tray ends and rims for 1 to 10 items", () => {
    for (let count = 1; count <= 10; count++) {
      for (let seed = 1; seed <= 60; seed++) {
        for (const p of placementsFor(count, seed)) {
          const reach = p.scale * ITEM_BASE_SIZE * 0.5;
          const at = `count ${count} seed ${seed}`;
          for (const v of [p.x, p.y, p.rotation, p.scale, p.z])
            expect(Number.isFinite(v)).toBe(true);
          expect(p.scale).toBeGreaterThan(0);
          expect(p.x - reach, at).toBeGreaterThanOrEqual(GIFT_TRAY.left + 30);
          expect(p.x + reach, at).toBeLessThanOrEqual(GIFT_TRAY.right - 30);
          expect(p.y, at).toBeLessThan(GIFT_TRAY.frontY);
          expect(p.y, at).toBeGreaterThan(GIFT_TRAY.backY - 120);
        }
      }
    }
  });

  it("lays out a landscape arrangement: wider than tall", () => {
    for (let count = 2; count <= 10; count++) {
      const ps = placementsFor(count, 5);
      const xs = ps.map((p) => p.x);
      const ys = ps.map((p) => p.y);
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(Math.max(...ys) - Math.min(...ys));
    }
    expect(trayRows(3)).toEqual([3]);
    expect(trayRows(5)).toEqual([2, 3]);
    expect(trayRows(10)).toEqual([5, 5]);
  });

  it("keeps the arrangement centred and only lightly overlapping", () => {
    for (const count of [3, 4, 7, 10]) {
      const ps = placementsFor(count, 4);
      const mean = ps.reduce((s, p) => s + p.x, 0) / ps.length;
      expect(Math.abs(mean - 500)).toBeLessThan(30);
      const scale = ps[0]?.scale ?? 1;
      const firstY = ps[0]?.y ?? 0;
      const row = ps.filter((p) => Math.abs(p.y - firstY) < 30).sort((a, b) => a.x - b.x);
      for (let i = 1; i < row.length; i++) {
        const gap = (row[i]?.x ?? 0) - (row[i - 1]?.x ?? 0);
        expect(gap).toBeGreaterThan(ITEM_BASE_SIZE * scale * 0.6);
      }
    }
  });

  it("shrinks items as the row gets longer and never grows past the cap", () => {
    expect(trayScale(10)).toBeLessThan(trayScale(3));
    for (let n = 2; n <= 10; n++) expect(trayScale(n)).toBeLessThanOrEqual(trayScale(n - 1));
    expect(trayScale(1)).toBeLessThanOrEqual(1.25);
  });

  it("keeps items upright", () => {
    for (const p of placementsFor(8, 9)) expect(Math.abs(p.rotation)).toBeLessThanOrEqual(3);
  });
});
