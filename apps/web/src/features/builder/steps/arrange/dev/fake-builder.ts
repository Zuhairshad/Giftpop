"use client";

/**
 * DEV AND TEST ONLY. A small in-memory `BuilderApi` so the arrange and personalise screens can be
 * run and checked without the real store or API. Production code must never import this file.
 */
import type {
  CatalogResponse,
  Design,
  DesignItem,
  HexColor,
  Item,
  Packaging,
} from "@giftpop/contracts";
import { useCallback, useMemo, useState } from "react";

import { moveInList } from "../reorder";

import type { BuilderApi } from "@/features/builder/state";


const id = (n: number): string => n.toString(16).padStart(24, "0");

export const FAKE_PACKAGING: Packaging = {
  id: id(1),
  slug: "classic-bouquet",
  name: "Classic bouquet",
  description: "",
  layoutType: "bouquet-fan",
  minItems: 3,
  maxItems: 8,
  capacityUnits: 12,
  wrapperColors: [
    { name: "Kraft", hex: "#c9a977" },
    { name: "Blush", hex: "#f4b6c8" },
    { name: "Cream", hex: "#fff3dc" },
    { name: "Midnight", hex: "#2b2d5b" },
    { name: "Sage", hex: "#a9c4a1" },
  ],
  ribbonColors: [
    { name: "Red", hex: "#c0392b" },
    { name: "Gold", hex: "#e0b341" },
    { name: "White", hex: "#ffffff" },
  ],
  layers: {},
  active: true,
  sortOrder: 0,
};

function item(n: number, overrides: Partial<Item>): Item {
  return {
    id: id(100 + n),
    name: "Item",
    category: "Sweet",
    shape: "bar",
    color: "#4a2c1a",
    sizeUnits: 1,
    personalizable: false,
    active: true,
    sortOrder: n,
    ...overrides,
  };
}

export const FAKE_ITEMS: Item[] = [
  item(1, { name: "Dark chocolate bar", shape: "bar", color: "#4a2c1a" }),
  item(2, { name: "Rose", shape: "flower", color: "#e8336d" }),
  item(3, {
    name: "Little mug",
    shape: "mug",
    color: "#7aa7e0",
    personalizable: true,
    personalizationMaxLength: 12,
  }),
  item(4, { name: "Honey jar", shape: "jar", color: "#e0a526" }),
  item(5, {
    name: "Soft bunny",
    shape: "soft-toy",
    color: "#dccbff",
    personalizable: true,
    personalizationMaxLength: 20,
  }),
  item(6, { name: "Balloon", shape: "balloon", color: "#ff7a7a" }),
];

export const FAKE_CATALOG: CatalogResponse = {
  country: "PK",
  currency: "PKR",
  status: "live",
  categories: ["Sweet"],
  packagings: [{ packaging: FAKE_PACKAGING, priceMinor: 100000, inStock: true }],
  items: FAKE_ITEMS.map((entry) => ({ item: entry, priceMinor: 50000, inStock: true })),
};

export function useFakeBuilder(): BuilderApi {
  const [lines, setLines] = useState<DesignItem[]>(
    FAKE_ITEMS.slice(0, 5).map((entry, slot) => ({ itemId: entry.id, qty: 1, slot })),
  );
  const [wrapperColor, setWrapperColor] = useState<HexColor>(FAKE_PACKAGING.wrapperColors[0]!.hex);
  const [ribbonColor, setRibbonColor] = useState<HexColor>(FAKE_PACKAGING.ribbonColors[0]!.hex);
  const [arrangementSeed, setSeed] = useState(1);
  const [cardMessage, setCardMessage] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [itemNames, setItemNames] = useState<Record<string, string>>({});

  const moveItem = useCallback((from: number, to: number) => {
    setLines((current) => moveInList(current, from, to).map((line, slot) => ({ ...line, slot })));
  }, []);

  const design = useMemo<Design>(
    () => ({
      packagingId: FAKE_PACKAGING.id,
      items: lines,
      wrapperColor,
      ribbonColor,
      arrangementSeed,
      personalisation: { cardMessage, recipientName, itemNames },
    }),
    [lines, wrapperColor, ribbonColor, arrangementSeed, cardMessage, recipientName, itemNames],
  );

  return {
    country: "PK",
    catalog: FAKE_CATALOG,
    packaging: FAKE_PACKAGING,
    lines,
    wrapperColor,
    ribbonColor,
    arrangementSeed,
    cardMessage,
    recipientName,
    itemNames,
    itemCount: lines.reduce((sum, line) => sum + line.qty, 0),
    usedUnits: lines.length,
    design,
    problems: [],
    quote: null,
    quoteStatus: "idle",
    addBlockedReason: () => null,
    choosePackaging: () => ({ droppedItemIds: [] }),
    addItem: () => undefined,
    removeItem: () => undefined,
    setQty: () => undefined,
    moveItem,
    shuffle: () => setSeed((seed) => seed + 1),
    setWrapperColor,
    setRibbonColor,
    setCardMessage,
    setRecipientName,
    setItemName: (itemId, text) => setItemNames((names) => ({ ...names, [itemId]: text })),
    loadDesign: () => undefined,
    reset: () => undefined,
  };
}
