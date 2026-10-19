import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("joins class names with single spaces", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("skips false, null, undefined and empty strings", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("supports conditional classes", () => {
    const active = false;
    expect(cn("base", active && "on", !active && "off")).toBe("base off");
  });

  it("returns an empty string when nothing is left", () => {
    expect(cn(false, null, undefined)).toBe("");
    expect(cn()).toBe("");
  });
});
