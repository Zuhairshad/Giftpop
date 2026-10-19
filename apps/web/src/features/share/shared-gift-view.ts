import type { SharedDesignView } from "@giftpop/contracts";

export interface SharedItemRow {
  itemId: string;
  name: string;
  qty: number;
  /** Name the sender put on the item, if any. */
  customName: string | null;
  unavailable: boolean;
}

/** One row per design line, in slot order. */
export function buildSharedItemRows(
  view: Pick<SharedDesignView, "design" | "items" | "unavailableItemIds">,
): SharedItemRow[] {
  const names = new Map(view.items.map((item) => [item.id, item.name]));
  const unavailable = new Set(view.unavailableItemIds);
  const itemNames = view.design.personalisation.itemNames;
  return [...view.design.items]
    .sort((a, b) => a.slot - b.slot)
    .map((line) => ({
      itemId: line.itemId,
      name: names.get(line.itemId) ?? "Unknown item",
      qty: line.qty,
      customName: itemNames[line.itemId]?.trim() || null,
      unavailable: unavailable.has(line.itemId),
    }));
}

export interface SharedGiftState {
  /** Plain sentences to show above the buttons. Empty when everything can still be ordered. */
  notices: string[];
  /** False when this gift cannot be ordered as it is. "Make your own" always stays. */
  canOrder: boolean;
}

export function describeSharedGiftState(
  view: Pick<SharedDesignView, "packaging" | "packagingAvailable">,
  rows: readonly SharedItemRow[],
): SharedGiftState {
  const notices: string[] = [];
  const missing = rows.filter((row) => row.unavailable);
  const hasAvailable = rows.some((row) => !row.unavailable);

  if (!view.packagingAvailable) {
    notices.push(
      `The ${view.packaging.name} is no longer available, so this gift cannot be ordered as it is.`,
    );
  }
  if (missing.length > 0) {
    const names = missing.map((row) => row.name).join(", ");
    notices.push(
      view.packagingAvailable && hasAvailable
        ? `No longer available: ${names}. If you order this gift, those items are left out.`
        : `No longer available: ${names}.`,
    );
  }
  return { notices, canOrder: view.packagingAvailable && hasAvailable };
}
