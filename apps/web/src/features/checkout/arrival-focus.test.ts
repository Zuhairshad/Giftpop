import { describe, expect, it } from "vitest";

import { shouldFocusOnArrival } from "./arrival-focus";

const base = { arrivedInApp: true, focusIsLost: true, hasHeading: true };

describe("shouldFocusOnArrival", () => {
  it("focuses the heading after an in-app arrival that dropped focus", () => {
    expect(shouldFocusOnArrival(base)).toBe(true);
  });

  it("leaves focus alone on a full page load", () => {
    expect(shouldFocusOnArrival({ ...base, arrivedInApp: false })).toBe(false);
  });

  it("never takes focus from a control the visitor is on", () => {
    expect(shouldFocusOnArrival({ ...base, focusIsLost: false })).toBe(false);
  });

  it("does nothing without a heading", () => {
    expect(shouldFocusOnArrival({ ...base, hasHeading: false })).toBe(false);
  });
});
