import { describe, expect, it } from "vitest";

import { moveAnnouncement, moveInList, stepTarget } from "./reorder";

describe("stepTarget", () => {
  it("moves one place either way", () => {
    expect(stepTarget(2, "up", 5)).toBe(1);
    expect(stepTarget(2, "down", 5)).toBe(3);
  });
  it("returns null at the ends", () => {
    expect(stepTarget(0, "up", 5)).toBeNull();
    expect(stepTarget(4, "down", 5)).toBeNull();
  });
  it("returns null for a single line or a bad index", () => {
    expect(stepTarget(0, "down", 1)).toBeNull();
    expect(stepTarget(-1, "down", 3)).toBeNull();
    expect(stepTarget(3, "up", 3)).toBeNull();
    expect(stepTarget(1.5, "up", 3)).toBeNull();
  });
});

describe("moveInList", () => {
  it("moves forward and backward", () => {
    expect(moveInList(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveInList(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });
  it("does not change the input and ignores bad moves", () => {
    const input = ["a", "b"];
    expect(moveInList(input, 0, 1)).toEqual(["b", "a"]);
    expect(input).toEqual(["a", "b"]);
    expect(moveInList(input, 0, 5)).toEqual(["a", "b"]);
    expect(moveInList(input, 1, 1)).toEqual(["a", "b"]);
  });
});

describe("moveAnnouncement", () => {
  it("uses 1-based positions", () => {
    expect(moveAnnouncement("Rose", 0, 6)).toBe("Rose moved to position 1 of 6");
  });
});
