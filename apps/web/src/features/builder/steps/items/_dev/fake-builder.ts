/**
 * Test and dev only. A working in-memory `BuilderApi` so the step screens can be tested and
 * previewed before the real store exists. Production code never imports from this folder.
 */
import { validateDesign } from "@giftpop/contracts";
import type {
  CatalogResponse,
  Design,
  DesignItem,
  HexColor,
  Packaging,
  PricedItem,
} from "@giftpop/contracts";
import { useCallback, useMemo, useState } from "react";

import type { BuilderApi, ChoosePackagingResult } from "../../../state";

export interface FakeBuilderStart {
  packagingId?: string;
  /** Item ids with quantities, in slot order. */
  picks?: readonly { itemId: string; qty: number }[];
}

function sizeOf(catalog: CatalogResponse, itemId: string): number {
  return catalog.items.find((entry) => entry.item.id === itemId)?.item.sizeUnits ?? 0;
}

function totals(catalog: CatalogResponse, lines: readonly DesignItem[]) {
  let count = 0;
  let units = 0;
  for (const line of lines) {
    count += line.qty;
    units += sizeOf(catalog, line.itemId) * line.qty;
  }
  return { count, units };
}

function renumber(lines: readonly Omit<DesignItem, "slot">[]): DesignItem[] {
  return lines.map((line, slot) => ({ ...line, slot }));
}

export function blockedReasonFor(
  catalog: CatalogResponse,
  packaging: Packaging,
  lines: readonly DesignItem[],
  entry: PricedItem | undefined,
): string | null {
  if (!entry) return `Not available in ${catalog.country}`;
  if (!entry.inStock) return "Out of stock";
  const { count, units } = totals(catalog, lines);
  if (count + 1 > packaging.maxItems || units + entry.item.sizeUnits > packaging.capacityUnits) {
    return "Box is full";
  }
  return null;
}

export function useFakeBuilder(catalog: CatalogResponse, start: FakeBuilderStart = {}): BuilderApi {
  const initialPackaging =
    catalog.packagings.find((p) => p.packaging.id === start.packagingId)?.packaging ?? null;
  const [packaging, setPackaging] = useState<Packaging | null>(initialPackaging);
  const [lines, setLines] = useState<DesignItem[]>(() =>
    renumber(start.picks?.map(({ itemId, qty }) => ({ itemId, qty })) ?? []),
  );
  const [wrapperColor, setWrapperColor] = useState<HexColor | null>(
    initialPackaging?.wrapperColors[0]?.hex ?? null,
  );
  const [ribbonColor, setRibbonColor] = useState<HexColor | null>(
    initialPackaging?.ribbonColors[0]?.hex ?? null,
  );

  const design = useMemo<Design | null>(
    () =>
      packaging
        ? {
            packagingId: packaging.id,
            items: lines,
            wrapperColor: wrapperColor ?? packaging.wrapperColors[0]?.hex ?? "#ffffff",
            ribbonColor: ribbonColor ?? packaging.ribbonColors[0]?.hex ?? "#000000",
            arrangementSeed: 1,
            personalisation: { cardMessage: "", recipientName: "", itemNames: {} },
          }
        : null,
    [packaging, lines, wrapperColor, ribbonColor],
  );
  const problems = useMemo(
    () => (design ? validateDesign(design, catalog) : []),
    [design, catalog],
  );
  const { count, units } = totals(catalog, lines);

  const choosePackaging = useCallback(
    (packagingId: string): ChoosePackagingResult => {
      const next = catalog.packagings.find((p) => p.packaging.id === packagingId)?.packaging;
      if (!next) return { droppedItemIds: [] };
      const kept: DesignItem[] = [];
      const dropped: string[] = [];
      let keptCount = 0;
      let keptUnits = 0;
      for (const line of lines) {
        const size = sizeOf(catalog, line.itemId);
        let qty = 0;
        while (
          qty < line.qty &&
          keptCount + 1 <= next.maxItems &&
          keptUnits + size <= next.capacityUnits
        ) {
          qty += 1;
          keptCount += 1;
          keptUnits += size;
        }
        if (qty > 0) kept.push({ ...line, qty });
        for (let i = qty; i < line.qty; i += 1) dropped.push(line.itemId);
      }
      setPackaging(next);
      setLines(renumber(kept));
      setWrapperColor(next.wrapperColors[0]?.hex ?? null);
      setRibbonColor(next.ribbonColors[0]?.hex ?? null);
      return { droppedItemIds: dropped };
    },
    [catalog, lines],
  );

  const addBlockedReason = useCallback(
    (itemId: string) =>
      packaging
        ? blockedReasonFor(
            catalog,
            packaging,
            lines,
            catalog.items.find((entry) => entry.item.id === itemId),
          )
        : "Choose a format first",
    [catalog, packaging, lines],
  );

  const addItem = useCallback(
    (itemId: string) => {
      if (addBlockedReason(itemId) !== null) return;
      setLines((current) => {
        const existing = current.find((line) => line.itemId === itemId);
        if (existing) {
          return current.map((line) =>
            line.itemId === itemId ? { ...line, qty: line.qty + 1 } : line,
          );
        }
        return renumber([...current, { itemId, qty: 1 }]);
      });
    },
    [addBlockedReason],
  );

  const setQty = useCallback((itemId: string, qty: number) => {
    setLines((current) =>
      renumber(
        current.flatMap((line) =>
          line.itemId !== itemId ? [line] : qty > 0 ? [{ ...line, qty }] : [],
        ),
      ),
    );
  }, []);

  const removeItem = useCallback(
    (itemId: string) => {
      const qty = lines.find((line) => line.itemId === itemId)?.qty ?? 0;
      setQty(itemId, qty - 1);
    },
    [lines, setQty],
  );

  const noop = useCallback(() => undefined, []);

  return {
    country: catalog.country,
    catalog,
    packaging,
    lines,
    wrapperColor,
    ribbonColor,
    arrangementSeed: 1,
    cardMessage: "",
    recipientName: "",
    itemNames: {},
    itemCount: count,
    usedUnits: units,
    design,
    problems,
    quote: null,
    quoteStatus: "idle",
    addBlockedReason,
    choosePackaging,
    addItem,
    removeItem,
    setQty,
    moveItem: noop,
    shuffle: noop,
    setWrapperColor,
    setRibbonColor,
    setCardMessage: noop,
    setRecipientName: noop,
    setItemName: noop,
    loadDesign: noop,
    reset: noop,
    question: "items",
    goToQuestion: noop,
    nextQuestion: noop,
    previousQuestion: noop,
  };
}
