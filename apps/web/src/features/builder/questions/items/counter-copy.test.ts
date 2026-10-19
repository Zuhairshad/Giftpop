import { describe, expect, it } from "vitest";

import { FIXTURE_ITEMS, oid } from "../_dev/fixtures";

import {
  ALL_CATEGORY,
  counterPercent,
  counterText,
  minimumMet,
  pickedInCategory,
  spacesLeftText,
} from "./items-copy";

describe("counter copy", () => {
  it("matches the pattern the e2e helper waits for", () => {
    expect(counterText(4, 6, 10)).toMatch(/\d+ of \d+(–\d+)? picked/);
    expect(counterText(4, 6, 6)).toMatch(/\d+ of \d+(–\d+)? picked/);
  });

  it("counts spaces left, singular and plural, never negative", () => {
    expect(spacesLeftText(8, 10)).toBe("2 spaces left");
    expect(spacesLeftText(9, 10)).toBe("1 space left");
    expect(spacesLeftText(10, 10)).toBe("No spaces left");
    expect(spacesLeftText(12, 10)).toBe("No spaces left");
  });

  it("clamps the progress bar between 0 and 100", () => {
    expect(counterPercent(0, 10)).toBe(0);
    expect(counterPercent(5, 10)).toBe(50);
    expect(counterPercent(12, 10)).toBe(100);
    expect(counterPercent(3, 0)).toBe(0);
  });

  it("shows the check from the minimum on", () => {
    expect(minimumMet(5, 6)).toBe(false);
    expect(minimumMet(6, 6)).toBe(true);
    expect(minimumMet(9, 6)).toBe(true);
  });
});

describe("pickedInCategory", () => {
  const rose = FIXTURE_ITEMS.find((e) => e.item.name === "Rose")!.item;
  const tulip = FIXTURE_ITEMS.find((e) => e.item.name === "Tulip")!.item;
  const gummy = FIXTURE_ITEMS.find((e) => e.item.name === "Gummy jar")!.item;
  const lines = [
    { itemId: rose.id, qty: 2, slot: 0 },
    { itemId: gummy.id, qty: 1, slot: 1 },
    { itemId: tulip.id, qty: 1, slot: 2 },
  ];

  it("adds up quantities inside one category", () => {
    expect(pickedInCategory(lines, FIXTURE_ITEMS, rose.category)).toBe(3);
    expect(pickedInCategory(lines, FIXTURE_ITEMS, gummy.category)).toBe(1);
  });

  it("is 0 for a category with no picks, an unknown one, and All", () => {
    expect(pickedInCategory(lines, FIXTURE_ITEMS, "Care")).toBe(0);
    expect(pickedInCategory(lines, FIXTURE_ITEMS, "Nope")).toBe(0);
    expect(pickedInCategory(lines, FIXTURE_ITEMS, ALL_CATEGORY)).toBe(0);
  });

  it("ignores lines whose item is not in the catalog", () => {
    expect(
      pickedInCategory([{ itemId: oid(9999), qty: 3, slot: 0 }], FIXTURE_ITEMS, rose.category),
    ).toBe(0);
  });
});
