import { describe, expect, it } from "vitest";

import { compareTemplates, planMove } from "./reorder";
import type { OrderedTemplate, SortOrderUpdate } from "./reorder";

function item(id: string, sortOrder: number, day: number): OrderedTemplate {
  return { id, sortOrder, createdAt: `2026-10-${String(day).padStart(2, "0")}T00:00:00.000Z` };
}

/** What the list would show after the updates are saved. */
function apply(list: readonly OrderedTemplate[], updates: readonly SortOrderUpdate[]): string[] {
  const next = new Map(updates.map((update) => [update.id, update.sortOrder]));
  return list
    .map((entry) => ({ ...entry, sortOrder: next.get(entry.id) ?? entry.sortOrder }))
    .sort(compareTemplates)
    .map((entry) => entry.id);
}

describe("planMove", () => {
  const list = [item("a", 10, 1), item("b", 20, 2), item("c", 30, 3)];

  it("swaps two sort orders with two updates when they differ", () => {
    const updates = planMove(list, "b", "up");
    expect(updates).toEqual([
      { id: "b", sortOrder: 10 },
      { id: "a", sortOrder: 20 },
    ]);
    expect(apply(list, updates)).toEqual(["b", "a", "c"]);
  });
  it("moves down", () => {
    const updates = planMove(list, "b", "down");
    expect(apply(list, updates)).toEqual(["a", "c", "b"]);
    expect(updates).toHaveLength(2);
  });
  it("does nothing at the ends or for an unknown id", () => {
    expect(planMove(list, "a", "up")).toEqual([]);
    expect(planMove(list, "c", "down")).toEqual([]);
    expect(planMove(list, "zzz", "up")).toEqual([]);
    expect(planMove([], "a", "up")).toEqual([]);
  });
  it("renumbers by position when sort orders are tied, sending only what changes", () => {
    const tied = [item("a", 0, 1), item("b", 0, 2), item("c", 0, 3)];
    const updates = planMove(tied, "c", "up");
    expect(apply(tied, updates)).toEqual(["a", "c", "b"]);
    expect(updates).toEqual([
      { id: "c", sortOrder: 1 },
      { id: "b", sortOrder: 2 },
    ]);
  });
  it("renumbers when a neighbour shares a value with one of the pair", () => {
    const shared = [item("a", 5, 1), item("b", 5, 2), item("c", 9, 3)];
    expect(apply(shared, planMove(shared, "c", "up"))).toEqual(["a", "c", "b"]);
  });
  it("lands the template one place over for every move of mixed lists", () => {
    const lists = [
      [item("a", 0, 1), item("b", 0, 2), item("c", 1, 3), item("d", 1, 4)],
      [item("a", 2, 1), item("b", 2, 2), item("c", 2, 3), item("d", 7, 4)],
      [item("a", 1, 1), item("b", 2, 2), item("c", 2, 3), item("d", 3, 4)],
      [item("a", -4, 1), item("b", 100, 2), item("c", 101, 3)],
    ];
    for (const entries of lists) {
      for (const [index, entry] of entries.entries()) {
        for (const direction of ["up", "down"] as const) {
          const target = index + (direction === "up" ? -1 : 1);
          const swapWith = entries[target];
          if (!swapWith) continue;
          const expected = entries.map((e) => e.id);
          expected[index] = swapWith.id;
          expected[target] = entry.id;
          expect(apply(entries, planMove(entries, entry.id, direction))).toEqual(expected);
        }
      }
    }
  });
});
