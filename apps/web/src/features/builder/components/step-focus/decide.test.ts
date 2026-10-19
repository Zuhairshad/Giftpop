import { describe, expect, it } from "vitest";

import { shouldFocusHeading } from "./decide";

const base = {
  previousPath: "/pk/build/format",
  path: "/pk/build/items",
  focusIsLost: true,
  hasHeading: true,
};

describe("shouldFocusHeading", () => {
  it("moves focus to the heading after a step change that dropped focus", () => {
    expect(shouldFocusHeading(base)).toBe(true);
  });

  it("does nothing on the first view after a full page load", () => {
    expect(shouldFocusHeading({ ...base, previousPath: null })).toBe(false);
  });

  it("does nothing when the path did not change", () => {
    expect(shouldFocusHeading({ ...base, path: base.previousPath })).toBe(false);
  });

  it("leaves focus alone when the user already has it somewhere", () => {
    expect(shouldFocusHeading({ ...base, focusIsLost: false })).toBe(false);
  });

  it("does nothing when the page has no heading", () => {
    expect(shouldFocusHeading({ ...base, hasHeading: false })).toBe(false);
  });

  it("works from the last builder step into checkout", () => {
    expect(
      shouldFocusHeading({ ...base, previousPath: "/pk/build/review", path: "/pk/checkout" }),
    ).toBe(true);
  });
});
