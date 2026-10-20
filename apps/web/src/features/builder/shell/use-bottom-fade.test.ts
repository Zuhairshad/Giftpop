import { describe, expect, it } from "vitest";

import { hasMoreBelow } from "./use-bottom-fade";

describe("hasMoreBelow", () => {
  it("is true while content continues past the bottom edge", () => {
    expect(hasMoreBelow(900, 400, 0)).toBe(true);
    expect(hasMoreBelow(900, 400, 495)).toBe(true);
  });

  it("is false at the end, within a few pixels, and when nothing overflows", () => {
    expect(hasMoreBelow(900, 400, 500)).toBe(false);
    expect(hasMoreBelow(900, 400, 497)).toBe(false);
    expect(hasMoreBelow(300, 400, 0)).toBe(false);
  });
});
