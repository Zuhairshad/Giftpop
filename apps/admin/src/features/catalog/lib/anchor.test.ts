import { describe, expect, it } from "vitest";

import {
  ANCHOR_STEP,
  ANCHOR_STEP_LARGE,
  anchorToPercent,
  DEFAULT_ANCHOR,
  fromPercentValue,
  normaliseAnchor,
  nudgeAnchor,
  pointerToAnchor,
  sameAnchor,
  toPercentValue,
} from "./anchor";

const rect = { left: 100, top: 50, width: 200, height: 400 };

describe("pointerToAnchor", () => {
  it("maps the centre, corners and edges", () => {
    expect(pointerToAnchor({ clientX: 200, clientY: 250 }, rect)).toEqual({ x: 0.5, y: 0.5 });
    expect(pointerToAnchor({ clientX: 100, clientY: 50 }, rect)).toEqual({ x: 0, y: 0 });
    expect(pointerToAnchor({ clientX: 300, clientY: 450 }, rect)).toEqual({ x: 1, y: 1 });
  });

  it("clamps a pointer that leaves the image", () => {
    expect(pointerToAnchor({ clientX: -500, clientY: 9000 }, rect)).toEqual({ x: 0, y: 1 });
  });

  it("rounds to three decimals", () => {
    expect(pointerToAnchor({ clientX: 100 + 200 / 3, clientY: 50 }, rect).x).toBe(0.333);
  });

  it("returns the default for an image with no size", () => {
    expect(pointerToAnchor({ clientX: 5, clientY: 5 }, { ...rect, width: 0 })).toEqual(
      DEFAULT_ANCHOR,
    );
  });
});

describe("nudgeAnchor", () => {
  it("moves one step per arrow key", () => {
    const start = { x: 0.5, y: 0.5 };
    expect(nudgeAnchor(start, "ArrowRight")).toEqual({ x: 0.5 + ANCHOR_STEP, y: 0.5 });
    expect(nudgeAnchor(start, "ArrowLeft")).toEqual({ x: 0.5 - ANCHOR_STEP, y: 0.5 });
    expect(nudgeAnchor(start, "ArrowUp")).toEqual({ x: 0.5, y: 0.5 - ANCHOR_STEP });
    expect(nudgeAnchor(start, "ArrowDown")).toEqual({ x: 0.5, y: 0.5 + ANCHOR_STEP });
  });

  it("moves further with Shift", () => {
    expect(nudgeAnchor({ x: 0.5, y: 0.5 }, "ArrowRight", true).x).toBeCloseTo(
      0.5 + ANCHOR_STEP_LARGE,
    );
  });

  it("stops at the image edge", () => {
    expect(nudgeAnchor({ x: 1, y: 1 }, "ArrowRight")).toEqual({ x: 1, y: 1 });
    expect(nudgeAnchor({ x: 0, y: 0 }, "ArrowUp")).toEqual({ x: 0, y: 0 });
  });

  it("does not drift after many nudges", () => {
    let anchor = { x: 0, y: 0 };
    for (let i = 0; i < 30; i += 1) anchor = nudgeAnchor(anchor, "ArrowRight");
    expect(anchor.x).toBe(0.3);
  });

  it("ignores other keys", () => {
    const start = { x: 0.2, y: 0.8 };
    expect(nudgeAnchor(start, "Enter")).toBe(start);
  });
});

describe("helpers", () => {
  it("normalises out-of-range and NaN values", () => {
    expect(normaliseAnchor({ x: -1, y: 2 })).toEqual({ x: 0, y: 1 });
    expect(normaliseAnchor({ x: Number.NaN, y: 0.12345 })).toEqual({ x: 0, y: 0.123 });
  });

  it("converts to CSS percent", () => {
    expect(anchorToPercent({ x: 0.25, y: 1 })).toEqual({ left: "25%", top: "100%" });
  });

  it("converts to and from whole percent", () => {
    expect(toPercentValue(0.756)).toBe(76);
    expect(fromPercentValue(76)).toBe(0.76);
    expect(fromPercentValue(150)).toBe(1);
    expect(fromPercentValue(-4)).toBe(0);
  });

  it("compares anchors", () => {
    expect(sameAnchor({ x: 0.5, y: 1 }, { x: 0.5, y: 1 })).toBe(true);
    expect(sameAnchor({ x: 0.5, y: 1 }, { x: 0.5, y: 0.99 })).toBe(false);
  });
});
