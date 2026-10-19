import { ITEM_NAME_MAX_LENGTH } from "@giftpop/contracts";
import type { Item } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import {
  clampToLimit,
  countState,
  formatCount,
  limitMessage,
  nameableItems,
  resolveItemLimit,
} from "./limits";

function item(overrides: Partial<Item>): Item {
  return {
    id: "a".repeat(24),
    name: "Mug",
    category: "Home",
    shape: "mug",
    color: "#ffffff",
    sizeUnits: 1,
    personalizable: false,
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

describe("formatCount / countState", () => {
  it("formats the count", () => {
    expect(formatCount(0, 200)).toBe("0 / 200");
    expect(formatCount(200, 200)).toBe("200 / 200");
  });
  it("warns near the limit and at it", () => {
    expect(countState(0, 200)).toBe("ok");
    expect(countState(179, 200)).toBe("ok");
    expect(countState(180, 200)).toBe("near");
    expect(countState(199, 200)).toBe("near");
    expect(countState(200, 200)).toBe("full");
    expect(countState(250, 200)).toBe("full");
  });
  it("handles short limits", () => {
    expect(countState(0, 5)).toBe("ok");
    expect(countState(3, 5)).toBe("ok");
    expect(countState(4, 5)).toBe("near");
    expect(countState(5, 5)).toBe("full");
  });
});

describe("limitMessage", () => {
  it("says the limit plainly", () => {
    expect(limitMessage(0, 200)).toBe("You can write up to 200 characters.");
  });
  it("counts down near the limit, singular for one", () => {
    expect(limitMessage(190, 200)).toBe("10 characters left.");
    expect(limitMessage(199, 200)).toBe("1 character left.");
  });
  it("says so at the limit and after a trim", () => {
    expect(limitMessage(200, 200)).toBe("That is the limit: 200 characters.");
    expect(limitMessage(200, 200, true)).toBe(
      "Shortened to fit. You can write up to 200 characters.",
    );
  });
  it("uses singular for a limit of one", () => {
    expect(limitMessage(0, 1)).toBe("1 character left.");
  });
});

describe("clampToLimit", () => {
  it("leaves short text alone", () => {
    expect(clampToLimit("hello", 10)).toEqual({ text: "hello", trimmed: false });
    expect(clampToLimit("hello", 5)).toEqual({ text: "hello", trimmed: false });
  });
  it("cuts long text and reports it", () => {
    expect(clampToLimit("hello world", 5)).toEqual({ text: "hello", trimmed: true });
  });
});

describe("resolveItemLimit", () => {
  it("uses the item's own limit", () => {
    expect(resolveItemLimit(item({ personalizationMaxLength: 12 }))).toBe(12);
  });
  it("falls back to the contract ceiling", () => {
    expect(resolveItemLimit(item({}))).toBe(ITEM_NAME_MAX_LENGTH);
  });
  it("never goes above the ceiling or accepts nonsense", () => {
    expect(resolveItemLimit(item({ personalizationMaxLength: 500 }))).toBe(ITEM_NAME_MAX_LENGTH);
    expect(resolveItemLimit(item({ personalizationMaxLength: 0 }))).toBe(ITEM_NAME_MAX_LENGTH);
  });
});

describe("nameableItems", () => {
  const mug = item({ id: "1".repeat(24), personalizable: true, personalizationMaxLength: 15 });
  const bar = item({ id: "2".repeat(24), name: "Bar" });
  const jar = item({ id: "3".repeat(24), name: "Jar", personalizable: true });

  it("keeps only personalizable items, in slot order, with limits", () => {
    const result = nameableItems(
      [
        { itemId: jar.id, qty: 1, slot: 2 },
        { itemId: bar.id, qty: 1, slot: 1 },
        { itemId: mug.id, qty: 2, slot: 0 },
      ],
      [mug, bar, jar],
    );
    expect(result.map((r) => [r.item.name, r.qty, r.limit])).toEqual([
      ["Mug", 2, 15],
      ["Jar", 1, ITEM_NAME_MAX_LENGTH],
    ]);
  });
  it("skips lines whose item is not in the catalog", () => {
    expect(nameableItems([{ itemId: "9".repeat(24), qty: 1, slot: 0 }], [mug])).toEqual([]);
  });
});
