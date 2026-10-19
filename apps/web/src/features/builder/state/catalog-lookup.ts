import type {
  CatalogResponse,
  DesignItem,
  Packaging,
  PricedItem,
  PricedPackaging,
} from "@giftpop/contracts";

export function findPricedItem(catalog: CatalogResponse, itemId: string): PricedItem | undefined {
  return catalog.items.find((entry) => entry.item.id === itemId);
}

export function findPricedPackaging(
  catalog: CatalogResponse,
  packagingId: string | null,
): PricedPackaging | undefined {
  if (packagingId === null) return undefined;
  return catalog.packagings.find((entry) => entry.packaging.id === packagingId);
}

export function findPackaging(
  catalog: CatalogResponse,
  packagingId: string | null,
): Packaging | null {
  return findPricedPackaging(catalog, packagingId)?.packaging ?? null;
}

/** Total picked (sum of qty) and the space they use. Items the catalog does not know take no space. */
export function totals(
  lines: readonly DesignItem[],
  catalog: CatalogResponse,
): { itemCount: number; usedUnits: number } {
  let itemCount = 0;
  let usedUnits = 0;
  for (const line of lines) {
    itemCount += line.qty;
    usedUnits += (findPricedItem(catalog, line.itemId)?.item.sizeUnits ?? 0) * line.qty;
  }
  return { itemCount, usedUnits };
}

/** "Pakistan" for "PK"; the code itself if the runtime does not know it. */
export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
