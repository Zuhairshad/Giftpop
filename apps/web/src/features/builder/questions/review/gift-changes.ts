import type { Design } from "@giftpop/contracts";

export interface QtyChange {
  itemId: string;
  from: number;
  to: number;
}

export interface GiftChanges {
  changed: boolean;
  packagingChanged: boolean;
  /** Item ids that were not in the original gift, in the current design's order. */
  added: string[];
  /** Item ids that were in the original gift and are not now, in the original's order. */
  removed: string[];
  qty: QtyChange[];
  wrapperChanged: boolean;
  ribbonChanged: boolean;
}

function sameColour(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * What the customer changed in a ready-made gift: its packaging, which items it holds and how many
 * of each, and the wrapper and ribbon colours. Names, the card message, where items sit and the
 * arrangement seed are left out on purpose: the customer is meant to fill in the first two, and
 * the last two change neither what is in the gift nor its price.
 */
export function describeGiftChanges(original: Design, current: Design): GiftChanges {
  const before = new Map(original.items.map((line) => [line.itemId, line.qty]));
  const after = new Map(current.items.map((line) => [line.itemId, line.qty]));

  const added = current.items.map((line) => line.itemId).filter((id) => !before.has(id));
  const removed = original.items.map((line) => line.itemId).filter((id) => !after.has(id));
  const qty: QtyChange[] = [];
  for (const [itemId, from] of before) {
    const to = after.get(itemId);
    if (to !== undefined && to !== from) qty.push({ itemId, from, to });
  }

  const packagingChanged = original.packagingId !== current.packagingId;
  const wrapperChanged = !sameColour(original.wrapperColor, current.wrapperColor);
  const ribbonChanged = !sameColour(original.ribbonColor, current.ribbonColor);
  return {
    changed:
      packagingChanged ||
      wrapperChanged ||
      ribbonChanged ||
      added.length > 0 ||
      removed.length > 0 ||
      qty.length > 0,
    packagingChanged,
    added,
    removed,
    qty,
    wrapperChanged,
    ribbonChanged,
  };
}

/**
 * The changes as short lines for the review step ("Added: Pink rose", "Rose: 2 to 3"). `nameOf`
 * turns an item id into a name; it falls back for an item the catalog no longer lists.
 */
export function giftChangeLines(
  changes: GiftChanges,
  nameOf: (itemId: string) => string,
): string[] {
  const lines: string[] = [];
  if (changes.packagingChanged) lines.push("Different packaging");
  for (const itemId of changes.added) lines.push(`Added: ${nameOf(itemId)}`);
  for (const itemId of changes.removed) lines.push(`Removed: ${nameOf(itemId)}`);
  for (const { itemId, from, to } of changes.qty) {
    lines.push(`${nameOf(itemId)}: ${from} to ${to}`);
  }
  if (changes.wrapperChanged) lines.push("Different wrapper colour");
  if (changes.ribbonChanged) lines.push("Different ribbon colour");
  return lines;
}
