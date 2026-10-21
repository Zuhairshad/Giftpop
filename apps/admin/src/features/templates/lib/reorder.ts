export interface OrderedTemplate {
  id: string;
  sortOrder: number;
  createdAt: string;
}

export interface SortOrderUpdate {
  id: string;
  sortOrder: number;
}

export type MoveDirection = "up" | "down";

/** The list order everywhere: sort order, then oldest first. */
export function compareTemplates(a: OrderedTemplate, b: OrderedTemplate): number {
  return a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt);
}

function orderOf(
  list: readonly OrderedTemplate[],
  overrides: ReadonlyMap<string, number>,
): string[] {
  return list
    .map((item) => ({ ...item, sortOrder: overrides.get(item.id) ?? item.sortOrder }))
    .sort(compareTemplates)
    .map((item) => item.id);
}

function sameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/**
 * The `sortOrder` updates that move one template a place up or down, as few as possible.
 * `ordered` is the list as shown (sorted with `compareTemplates`).
 *
 * 1. Swap the two sort orders: two updates, and nothing else moves.
 * 2. When that does not give the wanted order (the two share a sort order, or a neighbour does),
 *    number the list by position and send only the templates whose number changes.
 *
 * Returns an empty list when the move is impossible (first row up, last row down, unknown id).
 */
export function planMove(
  ordered: readonly OrderedTemplate[],
  id: string,
  direction: MoveDirection,
): SortOrderUpdate[] {
  const from = ordered.findIndex((item) => item.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  const moving = ordered[from];
  const other = ordered[to];
  if (from === -1 || !moving || !other) return [];

  const wanted = ordered.map((item) => item.id);
  wanted[from] = other.id;
  wanted[to] = moving.id;

  if (moving.sortOrder !== other.sortOrder) {
    const swapped = new Map([
      [moving.id, other.sortOrder],
      [other.id, moving.sortOrder],
    ]);
    if (sameOrder(orderOf(ordered, swapped), wanted)) {
      return [
        { id: moving.id, sortOrder: other.sortOrder },
        { id: other.id, sortOrder: moving.sortOrder },
      ];
    }
  }

  const byId = new Map(ordered.map((item) => [item.id, item]));
  return wanted.flatMap((wantedId, position): SortOrderUpdate[] => {
    const item = byId.get(wantedId);
    return item && item.sortOrder !== position ? [{ id: wantedId, sortOrder: position }] : [];
  });
}
