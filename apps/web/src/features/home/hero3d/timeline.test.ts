import { describe, expect, it } from "vitest";

import { BOX, BURST, DROP, IDLE, LID_CLOSED, LID_REST, REST_BUDGET_SECONDS } from "./constants";
import { CONTACTS, LAST_CONTACT } from "./drop-physics";
import { worldToPoster, posterToWorld } from "./layout";
import { spriteRest, spriteStartTime } from "./sprite-timeline";
import { SPARKLES, SPRITES } from "./sprites";
import { SETTLED_AT, heroStateAt, restState } from "./timeline";
import type { HeroState } from "./timeline";

const STEP = 1 / 240;

function at<T>(list: readonly T[], index: number): T {
  const value = list[index];
  if (value === undefined) throw new Error(`No item at ${index}`);
  return value;
}

function sample(from: number, to: number, fn: (state: HeroState, t: number) => void) {
  for (let t = from; t <= to; t += STEP) fn(heroStateAt(t), t);
}

function numbers(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (Array.isArray(value)) return value.flatMap(numbers);
  if (value && typeof value === "object") return Object.values(value).flatMap(numbers);
  return [];
}

describe("drop physics", () => {
  it("has exactly three contacts: two rebounds, then it settles", () => {
    expect(CONTACTS).toHaveLength(3);
    expect(at(CONTACTS, 0).outSpeed).toBeCloseTo(at(CONTACTS, 0).inSpeed * DROP.restitution[0], 6);
    expect(at(CONTACTS, 1).outSpeed).toBeCloseTo(at(CONTACTS, 1).inSpeed * DROP.restitution[1], 6);
    expect(at(CONTACTS, 2).outSpeed).toBe(0);
  });

  it("starts above the frame and falls with gravity to the first impact", () => {
    expect(heroStateAt(0).box.y).toBeCloseTo(DROP.height, 6);
    const t = at(CONTACTS, 0).start / 2;
    expect(heroStateAt(t).box.y).toBeCloseTo(DROP.height - 0.5 * DROP.gravity * t * t, 6);
    expect(heroStateAt(at(CONTACTS, 0).start + 1e-3).box.y).toBe(0);
  });

  it("touches the floor at each contact and rebounds twice, each lower than the last", () => {
    const peaks: number[] = [];
    let peak = 0;
    let airborne = false;
    sample(at(CONTACTS, 0).start, LAST_CONTACT.takeoff + 0.2, (s) => {
      if (s.box.y > 1e-9) {
        airborne = true;
        peak = Math.max(peak, s.box.y);
      } else if (airborne) {
        peaks.push(peak);
        peak = 0;
        airborne = false;
      }
    });
    expect(peaks).toHaveLength(2);
    expect(at(peaks, 0)).toBeGreaterThan(at(peaks, 1));
    // first rebound apex = (e1 v)^2 / 2g
    const v = at(CONTACTS, 0).outSpeed;
    expect(at(peaks, 0)).toBeCloseTo((v * v) / (2 * DROP.gravity), 1);
  });

  it("never goes below the floor and squashes harder on the first impact", () => {
    let minY = Infinity;
    const squash: number[] = [];
    sample(0, 5, (s) => {
      minY = Math.min(minY, s.box.y);
    });
    for (const c of CONTACTS) {
      squash.push(1 - heroStateAt((c.start + c.takeoff) / 2).box.scaleY);
    }
    expect(minY).toBeGreaterThanOrEqual(0);
    expect(at(squash, 0)).toBeCloseTo(DROP.squash[0].amount, 2);
    expect(at(squash, 0)).toBeGreaterThan(at(squash, 1));
    expect(at(squash, 1)).toBeGreaterThan(at(squash, 2));
    expect(at(squash, 2)).toBeGreaterThan(0);
  });

  it("settles with a wobble whose peaks only shrink, then is exactly still", () => {
    const peaks: number[] = [];
    let prev = 0;
    let rising = true;
    sample(LAST_CONTACT.takeoff, SETTLED_AT, (s) => {
      const a = Math.abs(s.box.rotZ);
      if (rising && a < prev) {
        peaks.push(prev);
        rising = false;
      } else if (!rising && a > prev) rising = true;
      prev = a;
    });
    expect(peaks.length).toBeGreaterThan(2);
    for (let i = 1; i < peaks.length; i += 1) expect(at(peaks, i)).toBeLessThan(at(peaks, i - 1));
    const settled = heroStateAt(SETTLED_AT).box;
    expect(settled).toEqual({ y: 0, scaleX: 1, scaleY: 1, scaleZ: 1, rotZ: 0 });
  });
});

describe("timeline", () => {
  it("keeps the order: ribbon, then lid, then burst, then rest", () => {
    expect(LAST_CONTACT.takeoff).toBeLessThan(1.6);
    expect(heroStateAt(1.5).ribbon.tail).toBe(0);
    expect(heroStateAt(1.9).ribbon.tail).toBeCloseTo(1, 6);
    expect(heroStateAt(1.89).lid.y).toBeLessThan(LID_CLOSED.y + 0.2);
    expect(heroStateAt(2.5).lid.y).toBeCloseTo(LID_REST.y, 6);
    expect(heroStateAt(2.0).sprites.every((s) => s.scale === 0)).toBe(true);
    expect(heroStateAt(2.4).sprites.some((s) => s.scale > 0)).toBe(true);
  });

  it("bursts 8 to 9 sprites staggered by 60 ms inside 2.1 to 3.2 s", () => {
    expect(SPRITES.length).toBeGreaterThanOrEqual(8);
    expect(SPRITES.length).toBeLessThanOrEqual(9);
    const starts = SPRITES.map(spriteStartTime).sort((a, b) => a - b);
    expect(at(starts, 0)).toBeCloseTo(BURST.start, 9);
    for (let i = 1; i < starts.length; i += 1) {
      expect(at(starts, i) - at(starts, i - 1)).toBeCloseTo(0.06, 9);
    }
    expect(at(starts, starts.length - 1) + BURST.flight).toBeLessThanOrEqual(3.2 + 1e-9);
  });

  it("is at rest well under the 4 s budget", () => {
    expect(SETTLED_AT).toBeLessThan(REST_BUDGET_SECONDS);
    expect(SETTLED_AT).toBeLessThanOrEqual(3.8);
    expect(IDLE.rampEnd).toBeLessThanOrEqual(3.8);
    const a = heroStateAt(SETTLED_AT, { idle: false });
    const b = heroStateAt(SETTLED_AT + 100, { idle: false });
    expect(b).toEqual({ ...a, time: b.time });
  });

  it("rest pose is the poster layout", () => {
    const rest = restState();
    SPRITES.forEach((def, i) => {
      const s = at(rest.sprites, i);
      const poster = worldToPoster(s.x, s.y);
      expect(poster.x).toBeCloseTo(def.x, 6);
      expect(poster.y).toBeCloseTo(def.y, 6);
      expect(s.scale).toBe(1);
      expect(s.rotZ).toBeCloseTo((-def.rotDeg * Math.PI) / 180, 9);
      expect(s.x).toBeCloseTo(spriteRest(def).x, 9);
      expect(s.y).toBeCloseTo(spriteRest(def).y, 9);
    });
    SPARKLES.forEach((def, i) => {
      const w = posterToWorld(def.x, def.y);
      expect(at(rest.sparkles, i).x).toBeCloseTo(w.x, 9);
      expect(at(rest.sparkles, i).y).toBeCloseTo(w.y, 9);
      expect(at(rest.sparkles, i).scale).toBeCloseTo(1, 9);
    });
    expect(rest.lid).toEqual({
      x: LID_REST.x,
      y: LID_REST.y,
      z: LID_REST.z,
      rotZ: (LID_REST.rotDeg * Math.PI) / 180,
      scaleX: 1,
      scaleZ: 1,
    });
    expect(rest.ribbon.tail).toBeCloseTo(1, 9);
    expect(rest.ribbon.sway).toBeCloseTo(0, 9);
    expect(rest.box.y).toBe(0);
    // the box floor is where the poster draws its bottom edge (y 608)
    expect(worldToPoster(0, BOX.floorY).y).toBeCloseTo(608, 6);
  });

  it("is deterministic", () => {
    for (const t of [0, 0.3, 1.2, 2.7, 3.5, 9.25]) {
      expect(heroStateAt(t)).toEqual(heroStateAt(t));
    }
  });

  it("floats gently when idle, fading in without a jump", () => {
    const before = heroStateAt(IDLE.rampStart, { idle: true });
    const rest = heroStateAt(IDLE.rampStart, { idle: false });
    expect(before.sprites).toEqual(rest.sprites);
    const mid = heroStateAt(IDLE.rampEnd + IDLE.floatPeriod / 4);
    const rest2 = heroStateAt(IDLE.rampEnd + IDLE.floatPeriod / 4, { idle: false });
    const dy = mid.sprites.map((s, i) => Math.abs(s.y - at(rest2.sprites, i).y));
    expect(Math.max(...dy)).toBeGreaterThan(0.01);
    expect(Math.max(...dy)).toBeLessThanOrEqual(IDLE.floatAmplitude + 1e-9);
    expect(mid.box.y).toBe(0);
  });

  it("never produces NaN or Infinity, at 0, negative, huge and non-finite times", () => {
    for (const t of [0, -5, 1e-9, 0.5, 3.8, 1e4, 1e9, Number.NaN, Infinity]) {
      for (const n of numbers(heroStateAt(t))) expect(Number.isFinite(n)).toBe(true);
    }
    sample(0, 6, (s) => {
      for (const n of numbers(s)) expect(Number.isFinite(n)).toBe(true);
    });
  });

  it("keeps the box fully above the frame at t = 0", () => {
    // top of the frame is half the poster height above the centre
    const topOfFrame = 3.25;
    expect(BOX.floorY + DROP.height).toBeGreaterThan(topOfFrame);
  });
});
