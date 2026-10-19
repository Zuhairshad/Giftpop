import { ITEM_NAME_MAX_LENGTH } from "@giftpop/contracts";
import type { DesignItem, Item } from "@giftpop/contracts";

export type CountState = "ok" | "near" | "full";

/** "12 / 200" */
export function formatCount(length: number, limit: number): string {
  return `${length} / ${limit}`;
}

/** ok until 90% of the limit, near from there, full at or past the limit. */
export function countState(length: number, limit: number): CountState {
  if (length >= limit) return "full";
  return length >= Math.floor(limit * 0.9) ? "near" : "ok";
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** The sentence under a field. `trimmed` is true right after a paste was cut to fit. */
export function limitMessage(length: number, limit: number, trimmed = false): string {
  if (trimmed) return `Shortened to fit. You can write up to ${plural(limit, "character")}.`;
  const state = countState(length, limit);
  if (state === "full") return `That is the limit: ${plural(limit, "character")}.`;
  if (state === "near") return `${plural(limit - length, "character")} left.`;
  return `You can write up to ${plural(limit, "character")}.`;
}

/** Cuts `value` to `limit` characters and says whether it had to. */
export function clampToLimit(value: string, limit: number): { text: string; trimmed: boolean } {
  return value.length > limit
    ? { text: value.slice(0, limit), trimmed: true }
    : { text: value, trimmed: false };
}

/** An item's own name limit, never above the contract ceiling. */
export function resolveItemLimit(item: Pick<Item, "personalizationMaxLength">): number {
  const own = item.personalizationMaxLength;
  if (own === undefined || !Number.isInteger(own) || own <= 0) return ITEM_NAME_MAX_LENGTH;
  return Math.min(own, ITEM_NAME_MAX_LENGTH);
}

export interface NameableItem {
  item: Item;
  qty: number;
  limit: number;
}

/** Picked items that can carry a name, in slot order, with their limits. */
export function nameableItems(
  lines: readonly DesignItem[],
  catalogItems: readonly Item[],
): NameableItem[] {
  const byId = new Map(catalogItems.map((item) => [item.id, item]));
  return [...lines]
    .sort((a, b) => a.slot - b.slot)
    .flatMap((line) => {
      const item = byId.get(line.itemId);
      return item?.personalizable ? [{ item, qty: line.qty, limit: resolveItemLimit(item) }] : [];
    });
}
