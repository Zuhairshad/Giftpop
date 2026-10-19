import {
  CARD_MESSAGE_MAX_LENGTH,
  HexColorSchema,
  ITEM_NAME_MAX_LENGTH,
  MAX_DESIGN_LINES,
  MAX_QTY_PER_LINE,
  RECIPIENT_NAME_MAX_LENGTH,
} from "@giftpop/contracts";
import type { CatalogResponse, Design, DesignItem } from "@giftpop/contracts";

import { findPackaging, findPricedItem } from "./catalog-lookup";
import { emptyData, INITIAL_SEED, MAX_SEED, renumber } from "./data";
import type { BuilderData } from "./data";
import { truncateText } from "./text";

/** The longest name allowed on one item: its own limit, never above the contract ceiling. */
export function itemNameLimit(catalog: CatalogResponse, itemId: string): number {
  const item = findPricedItem(catalog, itemId)?.item;
  if (!item?.personalizable) return 0;
  return Math.min(item.personalizationMaxLength ?? 0, ITEM_NAME_MAX_LENGTH);
}

/**
 * Turns a saved design into builder data. Items the catalog does not know are
 * ignored. A packaging the catalog does not know gives an empty builder.
 */
export function dataFromDesign(design: Design, catalog: CatalogResponse): BuilderData {
  const packaging = findPackaging(catalog, design.packagingId);
  if (!packaging) return emptyData();

  const seen = new Set<string>();
  const lines: DesignItem[] = [];
  const bySlot = [...design.items].sort((a, b) => a.slot - b.slot);
  for (const line of bySlot) {
    if (seen.has(line.itemId) || !findPricedItem(catalog, line.itemId)) continue;
    if (lines.length >= MAX_DESIGN_LINES) break;
    seen.add(line.itemId);
    const qty = Math.min(Math.max(Math.trunc(line.qty), 1), MAX_QTY_PER_LINE);
    lines.push({ itemId: line.itemId, qty, slot: lines.length });
  }

  const itemNames: Record<string, string> = {};
  for (const line of lines) {
    const name = truncateText(
      design.personalisation.itemNames[line.itemId] ?? "",
      itemNameLimit(catalog, line.itemId),
    );
    if (name !== "") itemNames[line.itemId] = name;
  }

  const seed = design.arrangementSeed;
  return {
    packagingId: packaging.id,
    lines: renumber(lines),
    wrapperColor: HexColorSchema.safeParse(design.wrapperColor).success
      ? design.wrapperColor
      : (packaging.wrapperColors[0]?.hex ?? null),
    ribbonColor: HexColorSchema.safeParse(design.ribbonColor).success
      ? design.ribbonColor
      : (packaging.ribbonColors[0]?.hex ?? null),
    arrangementSeed: Number.isInteger(seed) && seed >= 0 && seed <= MAX_SEED ? seed : INITIAL_SEED,
    cardMessage: truncateText(design.personalisation.cardMessage, CARD_MESSAGE_MAX_LENGTH),
    recipientName: truncateText(design.personalisation.recipientName, RECIPIENT_NAME_MAX_LENGTH),
    itemNames,
  };
}

/** True when the packaging and every item of the design are still in the catalog. */
export function designFitsCatalog(design: Design, catalog: CatalogResponse): boolean {
  if (!findPackaging(catalog, design.packagingId)) return false;
  return design.items.every((line) => findPricedItem(catalog, line.itemId) !== undefined);
}
