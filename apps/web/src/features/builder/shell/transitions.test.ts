import { describe, expect, it } from "vitest";

import { layerOffset, startTracking, trackQuestion, transitionDirection } from "./transitions";

describe("transitionDirection", () => {
  it("goes forward to a later question and back to an earlier one", () => {
    expect(transitionDirection("packaging", "colours")).toBe(1);
    expect(transitionDirection("review", "personalise")).toBe(-1);
    expect(transitionDirection("review", "packaging")).toBe(-1);
    expect(transitionDirection("packaging", "review")).toBe(1);
  });

  it("treats the same question as forward", () => {
    expect(transitionDirection("items", "items")).toBe(1);
  });
});

describe("trackQuestion", () => {
  it("starts without a move", () => {
    expect(startTracking("items", false)).toEqual({
      question: "items",
      hydrated: false,
      direction: 1,
      moved: false,
    });
  });

  it("marks a change after hydration as a move, with its direction", () => {
    const forward = trackQuestion(startTracking("packaging", true), "colours", true);
    expect(forward).toMatchObject({ question: "colours", direction: 1, moved: true });
    const back = trackQuestion(forward, "packaging", true);
    expect(back).toMatchObject({ question: "packaging", direction: -1, moved: true });
  });

  it("does not call a restore from saved state a move", () => {
    const restored = trackQuestion(startTracking("packaging", false), "review", true);
    expect(restored.question).toBe("review");
    expect(restored.moved).toBe(false);
  });

  it("does not move on a render where the question stays", () => {
    const moved = trackQuestion(startTracking("packaging", true), "colours", true);
    const same = trackQuestion(moved, "colours", true);
    expect(same.moved).toBe(false);
    // The direction is kept so a leaving question that is still animating keeps going the same way.
    expect(same.direction).toBe(1);
  });
});

describe("layerOffset", () => {
  it("enters from the right and leaves to the left when going forward", () => {
    expect(layerOffset(1, "enter", 24, false)).toBe(24);
    expect(layerOffset(1, "exit", 24, false)).toBe(-24);
  });

  it("mirrors for Back", () => {
    expect(layerOffset(-1, "enter", 24, false)).toBe(-24);
    expect(layerOffset(-1, "exit", 24, false)).toBe(24);
  });

  it("does not move under reduced motion", () => {
    expect(layerOffset(1, "enter", 24, true)).toBe(0);
    expect(layerOffset(-1, "exit", 24, true)).toBe(0);
  });
});
