import type { ItemPickerStyle, PricedItem } from "@giftpop/contracts";

import { ALL_CATEGORY } from "./items-copy";

/** How an item is offered in the picker. An item stored without the field is a tile. */
export function pickerStyleOf(entry: PricedItem): ItemPickerStyle {
  return entry.item.pickerStyle ?? "tile";
}

export interface PickerSplit {
  /** Shown in the illustrated grid. */
  tiles: PricedItem[];
  /** Shown as written rows under the grid. */
  list: PricedItem[];
}

/** Splits one tab's items into grid tiles and written rows, keeping the catalog order. */
export function splitByPickerStyle(entries: readonly PricedItem[]): PickerSplit {
  const tiles: PricedItem[] = [];
  const list: PricedItem[] = [];
  for (const entry of entries) {
    (pickerStyleOf(entry) === "list" ? list : tiles).push(entry);
  }
  return { tiles, list };
}

export interface ListGroup {
  /** Small heading over the rows, or null when the tab already names the category. */
  heading: string | null;
  entries: PricedItem[];
}

/**
 * Written rows grouped by category, in tab order (`tabs` is what `categoryTabs` returns).
 * On "All" each group gets its category as a heading; on one category's tab the tab already
 * says it, so there is a single group with no heading. A category missing from `tabs` goes last.
 */
export function groupListByCategory(
  entries: readonly PricedItem[],
  tabs: readonly string[],
  selected: string,
): ListGroup[] {
  if (entries.length === 0) return [];
  if (selected !== ALL_CATEGORY) return [{ heading: null, entries: [...entries] }];
  const byCategory = new Map<string, PricedItem[]>();
  for (const entry of entries) {
    const group = byCategory.get(entry.item.category);
    if (group) group.push(entry);
    else byCategory.set(entry.item.category, [entry]);
  }
  const rank = (category: string): number => {
    const index = tabs.indexOf(category);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return [...byCategory.entries()]
    .map(([category, group], order) => ({ category, group, order }))
    .sort((a, b) => rank(a.category) - rank(b.category) || a.order - b.order)
    .map(({ category, group }) => ({ heading: category, entries: group }));
}

export interface ListIntro {
  /** "Want something not shown above?", only when there are tiles above. */
  heading: string | null;
  line: string;
}

/**
 * Words over the written list. Under the grid it invites the customer to look further; when a
 * tab has only written items, there is nothing "above", so it just introduces the list.
 */
export function listIntro(hasTiles: boolean): ListIntro {
  return hasTiles
    ? { heading: "Want something not shown above?", line: "More things we can add to your gift:" }
    : { heading: null, line: "Things we can add to your gift:" };
}
