import { describe, expect, it } from "vitest";

import { buildPersonalisationRows, buildReviewLines } from "./review-lines";

const catalog = {
  items: [
    { item: { id: "a".repeat(24), name: "Rose" }, priceMinor: 1, inStock: true },
    { item: { id: "b".repeat(24), name: "Mug" }, priceMinor: 1, inStock: true },
  ],
} as unknown as Parameters<typeof buildReviewLines>[1];

describe("buildReviewLines", () => {
  it("returns lines in slot order with catalog names and custom names", () => {
    const lines = buildReviewLines(
      [
        { itemId: "b".repeat(24), qty: 1, slot: 1 },
        { itemId: "a".repeat(24), qty: 3, slot: 0 },
      ],
      catalog,
      { ["b".repeat(24)]: " Sara " },
    );
    expect(lines).toEqual([
      { itemId: "a".repeat(24), name: "Rose", qty: 3, customName: null },
      { itemId: "b".repeat(24), name: "Mug", qty: 1, customName: "Sara" },
    ]);
  });

  it("copes with an item missing from the catalog", () => {
    const [line] = buildReviewLines([{ itemId: "c".repeat(24), qty: 1, slot: 0 }], catalog, {});
    expect(line?.name).toBe("Unknown item");
  });

  it("treats a blank item name as no name", () => {
    const [line] = buildReviewLines([{ itemId: "a".repeat(24), qty: 1, slot: 0 }], catalog, {
      ["a".repeat(24)]: "   ",
    });
    expect(line?.customName).toBeNull();
  });
});

describe("buildPersonalisationRows", () => {
  it("summarises all three kinds of personalisation", () => {
    const rows = buildPersonalisationRows({
      cardMessage: " Happy birthday ",
      recipientName: "Sara",
      lines: [{ itemId: "x", name: "Mug", qty: 1, customName: "Sara" }],
    });
    expect(rows).toEqual([
      { label: "Card message", value: "Happy birthday" },
      { label: "Recipient", value: "Sara" },
      { label: "Names on items", value: "Mug: Sara" },
    ]);
  });

  it("says None for empty fields", () => {
    const rows = buildPersonalisationRows({ cardMessage: "", recipientName: " ", lines: [] });
    expect(rows.map((r) => r.value)).toEqual(["None", "None", "None"]);
  });

  it("adds a Your request row only when one was written", () => {
    const base = { cardMessage: "", recipientName: "", lines: [] };
    const labels = (customRequest: string) =>
      buildPersonalisationRows({ ...base, customRequest }).map((r) => r.label);
    expect(labels("")).not.toContain("Your request");
    expect(labels("  ")).not.toContain("Your request");
    expect(
      buildPersonalisationRows({ ...base, customRequest: " Gold foil " }).at(-1),
    ).toEqual({ label: "Your request", value: "Gold foil" });
  });
});
