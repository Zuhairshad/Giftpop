import { CARD_MESSAGE_MAX_LENGTH, RECIPIENT_NAME_MAX_LENGTH } from "@giftpop/contracts";
import type { CatalogResponse, ColourOption, DesignItem, HexColor } from "@giftpop/contracts";

import { findPackaging, findPricedItem } from "./catalog-lookup";
import { renumber } from "./data";
import type { BuilderData } from "./data";
import { itemNameLimit } from "./design-data";
import { addable } from "./rules";
import { truncateText } from "./text";

/**
 * Pure state changes. Each takes the current data and returns the next data
 * (the same object when nothing changed). Randomness comes in as an argument.
 */

export interface ChoosePackagingOutcome {
  data: BuilderData;
  /** Items that lost at least one unit because they did not fit the new packaging. */
  droppedItemIds: string[];
}

function sameColor(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function offered(options: readonly ColourOption[], color: string | null): HexColor | null {
  if (color === null) return null;
  return options.find((option) => sameColor(option.hex, color))?.hex ?? null;
}

function withoutKeys(
  names: Readonly<Record<string, string>>,
  keep: (itemId: string) => boolean,
): Record<string, string> {
  return Object.fromEntries(Object.entries(names).filter(([itemId]) => keep(itemId)));
}

export function choosePackaging(
  data: BuilderData,
  catalog: CatalogResponse,
  packagingId: string,
  newSeed: () => number,
): ChoosePackagingOutcome {
  const packaging = findPackaging(catalog, packagingId);
  if (!packaging || !packaging.active) return { data, droppedItemIds: [] };

  const kept: DesignItem[] = [];
  const droppedItemIds: string[] = [];
  let count = 0;
  let units = 0;
  let full = false;
  for (const line of data.lines) {
    const size = findPricedItem(catalog, line.itemId)?.item.sizeUnits;
    if (size === undefined) {
      // The catalog no longer sells it; it cannot be placed, and it does not use up room.
      droppedItemIds.push(line.itemId);
      continue;
    }
    let qty = 0;
    if (!full) {
      const byCount = packaging.maxItems - count;
      const byCapacity = Math.floor((packaging.capacityUnits - units) / size);
      qty = Math.max(0, Math.min(line.qty, byCount, byCapacity));
    }
    if (qty < line.qty) {
      droppedItemIds.push(line.itemId);
      full = true;
    }
    if (qty > 0) {
      kept.push({ itemId: line.itemId, qty, slot: kept.length });
      count += qty;
      units += (size ?? 0) * qty;
    }
  }

  const keptIds = new Set(kept.map((line) => line.itemId));
  return {
    droppedItemIds,
    data: {
      ...data,
      packagingId: packaging.id,
      lines: kept,
      wrapperColor:
        offered(packaging.wrapperColors, data.wrapperColor) ??
        packaging.wrapperColors[0]?.hex ??
        null,
      ribbonColor:
        offered(packaging.ribbonColors, data.ribbonColor) ?? packaging.ribbonColors[0]?.hex ?? null,
      // A random seed is made once, when the visitor first chooses a format.
      arrangementSeed: data.packagingId === null ? newSeed() : data.arrangementSeed,
      itemNames: withoutKeys(data.itemNames, (itemId) => keptIds.has(itemId)),
    },
  };
}

export function addItem(data: BuilderData, catalog: CatalogResponse, itemId: string): BuilderData {
  return setQty(data, catalog, itemId, (data.lines.find((l) => l.itemId === itemId)?.qty ?? 0) + 1);
}

export function removeItem(
  data: BuilderData,
  catalog: CatalogResponse,
  itemId: string,
): BuilderData {
  const line = data.lines.find((candidate) => candidate.itemId === itemId);
  if (!line) return data;
  return setQty(data, catalog, itemId, line.qty - 1);
}

/** Sets a line's quantity: 0 removes it; more than the rules allow is cut to what fits. */
export function setQty(
  data: BuilderData,
  catalog: CatalogResponse,
  itemId: string,
  requested: number,
): BuilderData {
  if (!Number.isFinite(requested)) return data;
  const wanted = Math.max(0, Math.trunc(requested));
  const index = data.lines.findIndex((candidate) => candidate.itemId === itemId);
  const current = index === -1 ? 0 : (data.lines[index]?.qty ?? 0);
  if (wanted === current) return data;

  if (wanted === 0) {
    return {
      ...data,
      lines: renumber(data.lines.filter((line) => line.itemId !== itemId)),
      itemNames: withoutKeys(data.itemNames, (id) => id !== itemId),
    };
  }

  const qty =
    wanted < current
      ? wanted
      : current + Math.min(wanted - current, addable(data, catalog, itemId).max);
  if (qty === current) return data;
  if (index === -1) {
    return { ...data, lines: [...data.lines, { itemId, qty, slot: data.lines.length }] };
  }
  return { ...data, lines: data.lines.map((line, i) => (i === index ? { ...line, qty } : line)) };
}

export function moveItem(data: BuilderData, fromIndex: number, toIndex: number): BuilderData {
  const last = data.lines.length - 1;
  const valid = (n: number) => Number.isInteger(n) && n >= 0 && n <= last;
  if (!valid(fromIndex) || !valid(toIndex) || fromIndex === toIndex) return data;
  const next = [...data.lines];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return data;
  next.splice(toIndex, 0, moved);
  return { ...data, lines: renumber(next) };
}

export function shuffle(data: BuilderData, newSeed: () => number): BuilderData {
  let seed = newSeed();
  for (let attempt = 0; attempt < 5 && seed === data.arrangementSeed; attempt += 1) {
    seed = newSeed();
  }
  return { ...data, arrangementSeed: seed };
}

export function setWrapperColor(
  data: BuilderData,
  catalog: CatalogResponse,
  color: HexColor,
): BuilderData {
  const hex = offered(findPackaging(catalog, data.packagingId)?.wrapperColors ?? [], color);
  return hex === null || hex === data.wrapperColor ? data : { ...data, wrapperColor: hex };
}

export function setRibbonColor(
  data: BuilderData,
  catalog: CatalogResponse,
  color: HexColor,
): BuilderData {
  const hex = offered(findPackaging(catalog, data.packagingId)?.ribbonColors ?? [], color);
  return hex === null || hex === data.ribbonColor ? data : { ...data, ribbonColor: hex };
}

export function setCardMessage(data: BuilderData, text: string): BuilderData {
  const cardMessage = truncateText(text, CARD_MESSAGE_MAX_LENGTH);
  return cardMessage === data.cardMessage ? data : { ...data, cardMessage };
}

export function setRecipientName(data: BuilderData, text: string): BuilderData {
  const recipientName = truncateText(text, RECIPIENT_NAME_MAX_LENGTH);
  return recipientName === data.recipientName ? data : { ...data, recipientName };
}

/** Names an item in the gift. Ignored for items that are not in the gift or cannot be named. */
export function setItemName(
  data: BuilderData,
  catalog: CatalogResponse,
  itemId: string,
  text: string,
): BuilderData {
  if (!data.lines.some((line) => line.itemId === itemId)) return data;
  const name = truncateText(text, itemNameLimit(catalog, itemId));
  if (name === (data.itemNames[itemId] ?? "")) return data;
  const rest = withoutKeys(data.itemNames, (id) => id !== itemId);
  return { ...data, itemNames: name === "" ? rest : { ...rest, [itemId]: name } };
}
