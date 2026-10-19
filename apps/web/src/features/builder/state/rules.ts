import { MAX_DESIGN_LINES, MAX_QTY_PER_LINE } from "@giftpop/contracts";
import type { CatalogResponse } from "@giftpop/contracts";

import { countryName, findPackaging, findPricedItem, totals } from "./catalog-lookup";
import type { BuilderData } from "./data";

export interface Addable {
  /** How many more units of this item can be added right now. */
  max: number;
  /** Plain copy for why `max` is 0, or null when something can be added. */
  reason: string | null;
}

/**
 * How many more units of one item the design can take, and why not when none.
 * One place for the rules, used by `addItem`, `setQty` and `addBlockedReason`.
 */
export function addable(data: BuilderData, catalog: CatalogResponse, itemId: string): Addable {
  const packaging = findPackaging(catalog, data.packagingId);
  if (!packaging) return { max: 0, reason: "Pick a format first" };

  const entry = findPricedItem(catalog, itemId);
  if (!entry || !entry.item.active) {
    return { max: 0, reason: `Not available in ${countryName(catalog.country)}` };
  }
  if (!entry.inStock) return { max: 0, reason: "Out of stock" };

  const { itemCount, usedUnits } = totals(data.lines, catalog);
  const byCount = packaging.maxItems - itemCount;
  if (byCount <= 0) return { max: 0, reason: `${packaging.name} is full` };

  const byCapacity = Math.floor((packaging.capacityUnits - usedUnits) / entry.item.sizeUnits);
  if (byCapacity <= 0) return { max: 0, reason: `${packaging.name} has no room left` };

  const line = data.lines.find((candidate) => candidate.itemId === itemId);
  if (!line && data.lines.length >= MAX_DESIGN_LINES) {
    return { max: 0, reason: `A gift can hold up to ${MAX_DESIGN_LINES} different items` };
  }
  const byLine = MAX_QTY_PER_LINE - (line?.qty ?? 0);
  if (byLine <= 0) {
    return { max: 0, reason: `You can add up to ${MAX_QTY_PER_LINE} of one item` };
  }

  return { max: Math.min(byCount, byCapacity, byLine), reason: null };
}

export function addBlockedReason(
  data: BuilderData,
  catalog: CatalogResponse,
  itemId: string,
): string | null {
  const { max, reason } = addable(data, catalog, itemId);
  return max > 0 ? null : reason;
}
