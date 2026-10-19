import type {
  CatalogResponse,
  Item,
  Packaging,
  PricedItem,
  PricedPackaging,
  QuoteResponse,
} from "@giftpop/contracts";
import { vi } from "vitest";

import type { StorageLike } from "./persistence";
import type { QuoteSchedulerDeps } from "./quote-scheduler";
import { createBuilderStore } from "./store";
import type { BuilderStore, BuilderStoreOptions } from "./store";
import type { BuilderApi } from "./types";

/** Small fixed catalog for the state tests. Test-only. */

export const BOUQUET_ID = "a1a1a1a1a1a1a1a1a1a1a1a1";
export const BOX_ID = "a2a2a2a2a2a2a2a2a2a2a2a2";
export const INACTIVE_PACKAGING_ID = "a3a3a3a3a3a3a3a3a3a3a3a3";
export const CHOC_ID = "b1b1b1b1b1b1b1b1b1b1b1b1";
export const MUG_ID = "b2b2b2b2b2b2b2b2b2b2b2b2";
export const CARD_ID = "b3b3b3b3b3b3b3b3b3b3b3b3";
export const SOAP_ID = "b4b4b4b4b4b4b4b4b4b4b4b4";
export const TEDDY_ID = "b5b5b5b5b5b5b5b5b5b5b5b5";
export const UNKNOWN_ID = "c0c0c0c0c0c0c0c0c0c0c0c0";

function packaging(overrides: Partial<Packaging> & Pick<Packaging, "id" | "name">): Packaging {
  return {
    slug: "pack",
    description: "",
    layoutType: "fan",
    minItems: 2,
    maxItems: 4,
    capacityUnits: 8,
    wrapperColors: [
      { name: "Cream", hex: "#fff8e7" },
      { name: "Red", hex: "#cc0000" },
    ],
    ribbonColors: [
      { name: "Gold", hex: "#d4af37" },
      { name: "Green", hex: "#00aa00" },
    ],
    layers: {},
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

function item(overrides: Partial<Item> & Pick<Item, "id" | "name" | "sizeUnits">): Item {
  return {
    category: "Treats",
    shape: "box",
    color: "#aa5500",
    personalizable: false,
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

function pricedPackaging(p: Packaging, inStock = true): PricedPackaging {
  return { packaging: p, priceMinor: 50000, inStock };
}

function pricedItem(i: Item, inStock = true): PricedItem {
  return { item: i, priceMinor: 20000, inStock };
}

export function makeCatalog(): CatalogResponse {
  return {
    country: "PK",
    currency: "PKR",
    status: "live",
    categories: ["Treats"],
    packagings: [
      pricedPackaging(packaging({ id: BOUQUET_ID, name: "Bouquet" })),
      pricedPackaging(
        packaging({
          id: BOX_ID,
          name: "Gift box",
          minItems: 1,
          maxItems: 3,
          capacityUnits: 5,
          wrapperColors: [{ name: "Blue", hex: "#0000ff" }],
          ribbonColors: [
            { name: "Green", hex: "#00AA00" },
            { name: "Black", hex: "#111111" },
          ],
        }),
      ),
      pricedPackaging(packaging({ id: INACTIVE_PACKAGING_ID, name: "Retired", active: false })),
    ],
    items: [
      pricedItem(
        item({
          id: CHOC_ID,
          name: "Chocolates",
          sizeUnits: 2,
          personalizable: true,
          personalizationMaxLength: 10,
        }),
      ),
      pricedItem(item({ id: MUG_ID, name: "Mug", sizeUnits: 3 })),
      pricedItem(item({ id: CARD_ID, name: "Greeting card", sizeUnits: 1 })),
      pricedItem(item({ id: SOAP_ID, name: "Soap", sizeUnits: 1 }), false),
      pricedItem(item({ id: TEDDY_ID, name: "Teddy", sizeUnits: 2, active: false })),
    ],
  };
}

export function makeQuoteResponse(totalMinor = 1000): QuoteResponse {
  const base = {
    currency: "PKR",
    goodsMinor: totalMinor,
    discountMinor: 0,
    shippingMinor: 0,
    totalMinor,
    dueNowMinor: totalMinor,
    dueOnDeliveryMinor: 0,
  };
  return { country: "PK", currency: "PKR", quotes: [{ ...base, mode: "prepaid" }] };
}

/** A counter-based seed source: 100, 101, 102, ... */
export function counterRandom(start = 100): () => number {
  let next = start;
  return () => next++;
}

/** In-memory stand-in for `sessionStorage`. */
export function fakeStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Map<string, string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

export interface TestStore {
  store: BuilderStore;
  api(): BuilderApi;
  storage: ReturnType<typeof fakeStorage>;
  fetchQuote: ReturnType<typeof vi.fn<QuoteSchedulerDeps["fetchQuote"]>>;
}

/** A hydrated store with a counting seed source, fake storage and a mocked quote call. */
export function newTestStore(options: Partial<BuilderStoreOptions> = {}): TestStore {
  const storage = fakeStorage();
  const fetchQuote = vi.fn<QuoteSchedulerDeps["fetchQuote"]>(() =>
    Promise.resolve(makeQuoteResponse()),
  );
  const store = createBuilderStore({
    country: "PK",
    catalog: makeCatalog(),
    fetchQuote,
    getStorage: () => storage,
    random: counterRandom(),
    ...options,
  });
  store.hydrate();
  return { store, api: () => store.getSnapshot(), storage, fetchQuote };
}
