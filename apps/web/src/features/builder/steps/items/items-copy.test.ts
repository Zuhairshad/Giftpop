import type { DesignProblem } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { FIXTURE_ITEMS, fixtureCatalog, oid } from "./_dev/fixtures";
import {
  ALL_CATEGORY,
  addControlState,
  addLabel,
  categoryTabs,
  continueState,
  counterText,
  filterItemsByCategory,
  isTabKey,
  nextTabIndex,
  quantityLabel,
  quantityOf,
  removeLabel,
} from "./items-copy";

describe("counterText", () => {
  it("uses an en dash between min and max", () => {
    expect(counterText(4, 6, 10)).toBe("4 of 6–10 picked");
    expect(counterText(0, 3, 7)).toBe("0 of 3–7 picked");
  });

  it("shows a single number for a fixed-size format", () => {
    expect(counterText(2, 4, 4)).toBe("2 of 4 picked");
  });
});

describe("categoryTabs", () => {
  const catalog = fixtureCatalog();

  it("puts All first and keeps the catalog's category order", () => {
    expect(categoryTabs(catalog.categories, catalog.items)).toEqual([
      ALL_CATEGORY,
      "Flowers",
      "Sweets",
      "Toys",
      "Care",
      "Cards",
    ]);
  });

  it("leaves out a category with no items and removes duplicates", () => {
    expect(categoryTabs(["Flowers", "Flowers", "Ghost"], catalog.items)).toEqual([
      ALL_CATEGORY,
      "Flowers",
      "Sweets",
      "Toys",
      "Care",
      "Cards",
    ]);
  });

  it("adds a category that only appears on items", () => {
    expect(categoryTabs(["Flowers"], catalog.items)).toContain("Sweets");
  });

  it("is only All for an empty catalog", () => {
    expect(categoryTabs([], [])).toEqual([ALL_CATEGORY]);
  });
});

describe("filterItemsByCategory", () => {
  it("returns everything for All", () => {
    expect(filterItemsByCategory(FIXTURE_ITEMS, ALL_CATEGORY)).toHaveLength(FIXTURE_ITEMS.length);
  });

  it("returns only the matching category", () => {
    const sweets = filterItemsByCategory(FIXTURE_ITEMS, "Sweets");
    expect(sweets.length).toBe(3);
    expect(sweets.every((entry) => entry.item.category === "Sweets")).toBe(true);
  });

  it("matches the category exactly as stored", () => {
    expect(filterItemsByCategory(FIXTURE_ITEMS, "sweets")).toEqual([]);
  });

  it("does not change the input", () => {
    const copy = [...FIXTURE_ITEMS];
    filterItemsByCategory(FIXTURE_ITEMS, ALL_CATEGORY).reverse();
    expect(FIXTURE_ITEMS).toEqual(copy);
  });
});

describe("quantityOf", () => {
  const lines = [
    { itemId: oid(101), qty: 2, slot: 0 },
    { itemId: oid(104), qty: 1, slot: 1 },
  ];

  it("reads the quantity of a picked item and zero for the rest", () => {
    expect(quantityOf(lines, oid(101))).toBe(2);
    expect(quantityOf(lines, oid(999))).toBe(0);
  });
});

describe("addControlState", () => {
  it("lets an item be added when nothing blocks it", () => {
    expect(addControlState(null, 0)).toEqual({ canAdd: true, reason: null, cardDisabled: false });
  });

  it("disables the whole card for an unpicked item that is blocked, and shows the reason", () => {
    expect(addControlState("Out of stock", 0)).toEqual({
      canAdd: false,
      reason: "Out of stock",
      cardDisabled: true,
    });
    expect(addControlState("Not available in Pakistan", 0).reason).toBe(
      "Not available in Pakistan",
    );
  });

  it("keeps a picked item's card active when only adding more is blocked", () => {
    expect(addControlState("Box is full", 2)).toEqual({
      canAdd: false,
      reason: "Box is full",
      cardDisabled: false,
    });
  });
});

describe("labels", () => {
  it("names the action and the item", () => {
    expect(addLabel("Rose", 0)).toBe("Add Rose");
    expect(addLabel("Rose", 2)).toBe("Add one more Rose");
    expect(removeLabel("Rose")).toBe("Remove one Rose");
    expect(quantityLabel("Rose", 2)).toBe("Rose: 2 picked");
  });
});

describe("tab keyboard", () => {
  it("recognises only arrow, Home and End keys", () => {
    expect(isTabKey("ArrowRight")).toBe(true);
    expect(isTabKey("End")).toBe(true);
    expect(isTabKey("Enter")).toBe(false);
    expect(isTabKey("ArrowDown")).toBe(false);
  });

  it("moves right and left, wrapping at the ends", () => {
    expect(nextTabIndex(0, "ArrowRight", 3)).toBe(1);
    expect(nextTabIndex(2, "ArrowRight", 3)).toBe(0);
    expect(nextTabIndex(1, "ArrowLeft", 3)).toBe(0);
    expect(nextTabIndex(0, "ArrowLeft", 3)).toBe(2);
  });

  it("jumps to the first and last tab", () => {
    expect(nextTabIndex(1, "Home", 4)).toBe(0);
    expect(nextTabIndex(1, "End", 4)).toBe(3);
  });

  it("stays at 0 when there are no tabs", () => {
    expect(nextTabIndex(0, "ArrowRight", 0)).toBe(0);
  });
});

describe("continueState blocking rules", () => {
  it("blocks on an item that went out of stock but not on text length", () => {
    expect(
      continueState([{ code: "OUT_OF_STOCK", message: "Rose is out of stock.", itemId: "a" }])
        .enabled,
    ).toBe(false);
    expect(
      continueState([{ code: "TEXT_TOO_LONG", message: "Too long.", field: "cardMessage" }])
        .enabled,
    ).toBe(true);
  });
});

describe("continueState", () => {
  const problem = (code: DesignProblem["code"], message: string): DesignProblem => ({
    code,
    message,
  });

  it("is enabled with no problems", () => {
    expect(continueState([])).toEqual({ enabled: true, message: null });
  });

  it("is disabled with the first count-rule message", () => {
    expect(
      continueState([
        problem("TOO_FEW_ITEMS", "Pick at least 3 items (you have 1)."),
        problem("OVER_CAPACITY", "Too big."),
      ]),
    ).toEqual({ enabled: false, message: "Pick at least 3 items (you have 1)." });
  });

  it.each(["TOO_FEW_ITEMS", "TOO_MANY_ITEMS", "OVER_CAPACITY"] as const)("blocks on %s", (code) => {
    expect(continueState([problem(code, "msg")]).enabled).toBe(false);
  });

  it("ignores problems that are not about the count, such as personalisation", () => {
    expect(continueState([problem("TEXT_TOO_LONG", "Too long")]).enabled).toBe(true);
  });
});
