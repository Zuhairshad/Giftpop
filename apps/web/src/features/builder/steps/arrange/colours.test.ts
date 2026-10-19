import { describe, expect, it } from "vitest";

import { readableInk, sameColour } from "./colours";

describe("readableInk", () => {
  it("picks dark ink on light colours and light ink on dark colours", () => {
    expect(readableInk("#ffffff")).toBe("#000000");
    expect(readableInk("#ffe08a")).toBe("#000000");
    expect(readableInk("#000000")).toBe("#ffffff");
    expect(readableInk("#c0392b")).toBe("#ffffff");
  });
  it("falls back to dark ink for a bad value", () => {
    expect(readableInk("red")).toBe("#000000");
  });
});

describe("sameColour", () => {
  it("ignores case", () => {
    expect(sameColour("#C9A977", "#c9a977")).toBe(true);
  });
  it("is false when either is missing or different", () => {
    expect(sameColour(null, "#c9a977")).toBe(false);
    expect(sameColour("#000000", "#ffffff")).toBe(false);
    expect(sameColour(undefined, undefined)).toBe(false);
  });
});
