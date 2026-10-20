import type { PricedItem } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { FIXTURE_ITEMS } from "../_dev/fixtures";

import { ALL_CATEGORY } from "./items-copy";
import { groupListByCategory, listIntro, pickerStyleOf, splitByPickerStyle } from "./list-items";

function at(index: number): PricedItem {
  const entry = FIXTURE_ITEMS[index];
  if (!entry) throw new Error(`no fixture item ${index}`);
  return entry;
}

function styled(
  entry: PricedItem,
  pickerStyle: "tile" | "list" | undefined,
  category?: string,
): PricedItem {
  const item = { ...entry.item, category: category ?? entry.item.category };
  if (pickerStyle) item.pickerStyle = pickerStyle;
  else delete item.pickerStyle;
  return { ...entry, item };
}

const names = (entries: readonly PricedItem[]) => entries.map((entry) => entry.item.name);

describe("pickerStyleOf", () => {
  it("reads a missing picker style as tile", () => {
    expect(pickerStyleOf(styled(at(0), undefined))).toBe("tile");
  });

  it("returns the stored style", () => {
    expect(pickerStyleOf(styled(at(0), "tile"))).toBe("tile");
    expect(pickerStyleOf(styled(at(0), "list"))).toBe("list");
  });
});

describe("splitByPickerStyle", () => {
  it("puts list items in the list and everything else in the grid, in catalog order", () => {
    const a = styled(at(0), undefined);
    const b = styled(at(1), "list");
    const c = styled(at(2), "tile");
    const d = styled(at(3), "list");
    const split = splitByPickerStyle([a, b, c, d]);
    expect(names(split.tiles)).toEqual([a.item.name, c.item.name]);
    expect(names(split.list)).toEqual([b.item.name, d.item.name]);
  });

  it("handles an empty tab and a tab with only list items", () => {
    expect(splitByPickerStyle([])).toEqual({ tiles: [], list: [] });
    const only = [styled(at(0), "list"), styled(at(1), "list")];
    expect(splitByPickerStyle(only).tiles).toEqual([]);
    expect(splitByPickerStyle(only).list).toHaveLength(2);
  });
});

describe("groupListByCategory", () => {
  const tabs = [ALL_CATEGORY, "Flowers", "Sweets", "Cards"];
  const card = styled(at(0), "list", "Cards");
  const fudge = styled(at(1), "list", "Sweets");
  const rose = styled(at(2), "list", "Flowers");
  const toffee = styled(at(3), "list", "Sweets");

  it("returns nothing for no rows", () => {
    expect(groupListByCategory([], tabs, ALL_CATEGORY)).toEqual([]);
  });

  it("groups by category in tab order on All, with headings", () => {
    const groups = groupListByCategory([card, fudge, rose, toffee], tabs, ALL_CATEGORY);
    expect(groups.map((group) => group.heading)).toEqual(["Flowers", "Sweets", "Cards"]);
    expect(groups.map((group) => names(group.entries))).toEqual([
      [rose.item.name],
      [fudge.item.name, toffee.item.name],
      [card.item.name],
    ]);
  });

  it("puts a category the tabs do not know last", () => {
    const odd = styled(at(4), "list", "Mystery");
    const groups = groupListByCategory([odd, card], tabs, ALL_CATEGORY);
    expect(groups.map((group) => group.heading)).toEqual(["Cards", "Mystery"]);
  });

  it("uses one group without a heading on a category tab", () => {
    const groups = groupListByCategory([fudge, toffee], tabs, "Sweets");
    expect(groups).toEqual([{ heading: null, entries: [fudge, toffee] }]);
  });
});

describe("listIntro", () => {
  it("asks about more items under the grid", () => {
    expect(listIntro(true)).toEqual({
      heading: "Want something not shown above?",
      line: "More things we can add to your gift:",
    });
  });

  it("does not point above when there is no grid", () => {
    const intro = listIntro(false);
    expect(intro.heading).toBeNull();
    expect(intro.line).not.toMatch(/above|more/i);
  });
});
