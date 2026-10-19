import { describe, expect, it } from "vitest";

import { nextSwatchIndex, readableInk, sameColour } from "./colours";

describe("nextSwatchIndex", () => {
  it("moves with arrows and wraps", () => {
    expect(nextSwatchIndex(0, "ArrowRight", 3)).toBe(1);
    expect(nextSwatchIndex(2, "ArrowRight", 3)).toBe(0);
    expect(nextSwatchIndex(0, "ArrowLeft", 3)).toBe(2);
    expect(nextSwatchIndex(1, "ArrowDown", 3)).toBe(2);
    expect(nextSwatchIndex(1, "ArrowUp", 3)).toBe(0);
  });
  it("jumps with Home and End", () => {
    expect(nextSwatchIndex(1, "Home", 4)).toBe(0);
    expect(nextSwatchIndex(1, "End", 4)).toBe(3);
  });
  it("ignores other keys and an empty palette", () => {
    expect(nextSwatchIndex(0, "a", 3)).toBeNull();
    expect(nextSwatchIndex(0, "ArrowRight", 0)).toBeNull();
  });
});

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
