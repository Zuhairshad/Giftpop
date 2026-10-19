import type { CatalogResponse, PricedPackaging } from "@giftpop/contracts";

/** "Pick 6 to 10", or "Pick exactly 4" when the format takes a fixed number. */
export function pickRangeCopy(minItems: number, maxItems: number): string {
  if (minItems === maxItems) return `Pick exactly ${minItems}`;
  return `Pick ${minItems} to ${maxItems}`;
}

export interface PackagingAvailability {
  available: boolean;
  /** Plain reason shown on a disabled card, or null when it can be chosen. */
  reason: string | null;
}

export function packagingAvailability(priced: PricedPackaging): PackagingAvailability {
  if (!priced.packaging.active) return { available: false, reason: "Not available right now" };
  if (!priced.inStock) return { available: false, reason: "Out of stock" };
  return { available: true, reason: null };
}

/** Active packagings first in the catalog's own order; the API already sorts by `sortOrder`. */
export function visiblePackagings(catalog: Pick<CatalogResponse, "packagings">): PricedPackaging[] {
  return catalog.packagings.filter((priced) => priced.packaging.active);
}

/** Names of the dropped items, in the order they were dropped; unknown ids are skipped. */
export function droppedItemNames(
  droppedItemIds: readonly string[],
  catalog: Pick<CatalogResponse, "items">,
): string[] {
  const names = new Map(catalog.items.map((entry) => [entry.item.id, entry.item.name]));
  return droppedItemIds.flatMap((id) => {
    const name = names.get(id);
    return name ? [name] : [];
  });
}

/** Names with a count when the same item is listed twice, for example "Rose, Rose" becomes "Rose (2)". */
function joinNames(names: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts].map(([name, count]) => (count > 1 ? `${name} (${count})` : name)).join(", ");
}

/**
 * Inline notice shown after switching to a smaller format, or null when nothing was dropped.
 * Example: "Mini box could not fit everything, so 2 items were taken out: Rose, Gummy jar."
 */
export function droppedItemsNotice(packagingName: string, names: readonly string[]): string | null {
  if (names.length === 0) return null;
  const noun = names.length === 1 ? "item was" : "items were";
  return `${packagingName} could not fit everything, so ${names.length} ${noun} taken out: ${joinNames(names)}.`;
}
