import { describe, expect, it } from "vitest";

import { wrapTarget } from "./focus-trap";

const nodes = ["a", "b", "c"];

describe("wrapTarget", () => {
  it("jumps from the last control to the first on Tab", () => {
    expect(wrapTarget({ focusable: nodes, active: "c", container: "box", shift: false })).toBe("a");
  });

  it("jumps from the first control to the last on Shift+Tab", () => {
    expect(wrapTarget({ focusable: nodes, active: "a", container: "box", shift: true })).toBe("c");
  });

  it("treats the dialog box itself as the start when Shift+Tab is pressed on it", () => {
    expect(wrapTarget({ focusable: nodes, active: "box", container: "box", shift: true })).toBe(
      "c",
    );
  });

  it("leaves a move in the middle to the browser", () => {
    expect(
      wrapTarget({ focusable: nodes, active: "b", container: "box", shift: false }),
    ).toBeNull();
    expect(wrapTarget({ focusable: nodes, active: "b", container: "box", shift: true })).toBeNull();
  });

  it("does nothing when nothing inside can take focus", () => {
    expect(wrapTarget({ focusable: [], active: "box", container: "box", shift: false })).toBeNull();
  });

  it("wraps onto itself with a single control", () => {
    expect(wrapTarget({ focusable: ["a"], active: "a", container: "box", shift: false })).toBe("a");
    expect(wrapTarget({ focusable: ["a"], active: "a", container: "box", shift: true })).toBe("a");
  });
});
