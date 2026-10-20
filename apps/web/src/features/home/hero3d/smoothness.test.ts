import { describe, expect, it } from "vitest";

import { BOX, CLOSED_BOX_REACH, DROP, LID, RIBBON } from "./constants";
import { dropEntryTime, FIRST_CONTACT } from "./drop-physics";
import { smootherstep01, softOvershoot } from "./easing";
import { heroStateAt } from "./timeline";

const DT = 1 / 240;

/** Speed of a scalar the timeline produces, by central difference. */
function speed(fn: (t: number) => number, t: number): number {
  return (fn(t + 1e-4) - fn(t - 1e-4)) / 2e-4;
}

describe("easing", () => {
  it("softOvershoot starts and ends at rest, peaks past 1 and lands on exactly 1", () => {
    expect(softOvershoot(0)).toBe(0);
    expect(softOvershoot(1)).toBe(1);
    expect(speed((u) => softOvershoot(u), 1e-3)).toBeLessThan(0.01);
    expect(Math.abs(speed((u) => softOvershoot(u), 1 - 1e-3))).toBeLessThan(0.01);
    let peak = 0;
    for (let u = 0; u <= 1; u += 0.001) peak = Math.max(peak, softOvershoot(u, 0.08));
    expect(peak).toBeCloseTo(1.08, 3);
  });

  it("softOvershoot has no jump in value or speed anywhere", () => {
    for (let u = 0.001; u < 1; u += 0.001) {
      expect(Math.abs(softOvershoot(u + 0.001) - softOvershoot(u))).toBeLessThan(0.006);
      const a = speed((x) => softOvershoot(x), u);
      const b = speed((x) => softOvershoot(x), u + 0.001);
      expect(Math.abs(b - a)).toBeLessThan(0.05);
    }
  });

  it("smootherstep is 0, 1/2 and 1 at 0, 1/2 and 1, flat at both ends", () => {
    expect(smootherstep01(0)).toBe(0);
    expect(smootherstep01(0.5)).toBeCloseTo(0.5, 9);
    expect(smootherstep01(1)).toBe(1);
    expect(speed(smootherstep01, 1e-3)).toBeLessThan(1e-3);
  });
});

describe("motion has no pops", () => {
  it("never moves anything further than a fast object could in one 240 Hz step", () => {
    let prev = heroStateAt(0);
    for (let t = DT; t <= 8; t += DT) {
      const s = heroStateAt(t);
      expect(Math.abs(s.box.y - prev.box.y)).toBeLessThan(0.12);
      expect(Math.abs(s.lid.y - prev.lid.y)).toBeLessThan(0.05);
      expect(Math.abs(s.lid.rotZ - prev.lid.rotZ)).toBeLessThan(0.04);
      s.sprites.forEach((sprite, i) => {
        const before = prev.sprites[i];
        if (!before || before.scale === 0) return;
        expect(Math.hypot(sprite.x - before.x, sprite.y - before.y)).toBeLessThan(0.15);
        expect(Math.abs(sprite.scale - before.scale)).toBeLessThan(0.1);
      });
      prev = s;
    }
  });

  it("lifts the lid from rest and sets it down at rest", () => {
    const lidY = (t: number) => heroStateAt(t).lid.y;
    const lidX = (t: number) => heroStateAt(t).lid.x;
    expect(Math.abs(speed(lidY, LID.start + 2e-4))).toBeLessThan(0.05);
    expect(Math.abs(speed(lidY, LID.end - 2e-4))).toBeLessThan(0.05);
    expect(Math.abs(speed(lidX, LID.end - 2e-4))).toBeLessThan(0.05);
  });

  it("slips the ribbon and grows the tag in without a jolt", () => {
    const tail = (t: number) => heroStateAt(t).ribbon.tail;
    const sway = (t: number) => heroStateAt(t).ribbon.sway;
    const tag = (t: number) => heroStateAt(t).ribbon.tag;
    for (const t of [RIBBON.start + 2e-4, RIBBON.end - 2e-4]) {
      expect(Math.abs(speed(tail, t))).toBeLessThan(0.05);
      expect(Math.abs(speed(sway, t))).toBeLessThan(0.05);
      expect(Math.abs(speed(tag, t))).toBeLessThan(0.05);
    }
    expect(tag(RIBBON.start)).toBe(0);
    expect(tag(RIBBON.end)).toBe(1);
  });

  it("eases the falling tilt flat by the first impact", () => {
    const rot = (t: number) => heroStateAt(t).box.rotZ;
    expect(Math.abs(rot(FIRST_CONTACT.start - 1e-4))).toBeLessThan(1e-3);
    expect(Math.abs(speed(rot, FIRST_CONTACT.start - 2e-4))).toBeLessThan(0.01);
  });
});

describe("dropEntryTime", () => {
  const boxTopAt = (t: number) => BOX.floorY + heroStateAt(t).box.y + CLOSED_BOX_REACH;

  it("starts the clock just before the box shows at the top of the frame", () => {
    for (const top of [3.25, 3.6, 4.2]) {
      const t = dropEntryTime(top);
      expect(t).toBeGreaterThan(0);
      expect(boxTopAt(t)).toBeGreaterThan(top);
      expect(boxTopAt(t + 0.1)).toBeLessThan(top);
    }
  });

  it("starts earlier on a taller stage, and at 0 when the release point is already in view", () => {
    expect(dropEntryTime(4.2)).toBeLessThan(dropEntryTime(3.25));
    expect(dropEntryTime(BOX.floorY + DROP.height + CLOSED_BOX_REACH + 1)).toBe(0);
    expect(dropEntryTime(Number.NaN)).toBe(0);
  });

  it("always leaves some fall before the first impact", () => {
    expect(dropEntryTime(-100)).toBeLessThan(FIRST_CONTACT.start);
  });
});
