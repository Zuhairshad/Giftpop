import { money } from "../src/index";
import type {
  CountryCatalog,
  Design,
  Item,
  Money,
  Packaging,
  PaymentPolicy,
  PricedItem,
  PricedPackaging,
  QuoteInput,
} from "../src/index";

/** The documented policy (docs/product.md, "Payment"), written out here on purpose. */
export const DOC_POLICY: PaymentPolicy = {
  prepaid: { goodsDiscountPercent: 20 },
  cod: { advancePercent: 20 },
};

export function usd(amountMinor: number): Money {
  return money(amountMinor, "USD");
}

/** Goods = 2500 + 3 x 1000 = 5500; flat shipping 500. */
export function quoteInput(overrides: Partial<QuoteInput> = {}): QuoteInput {
  return {
    packagingPrice: usd(2500),
    itemLines: [{ unitPrice: usd(1000), qty: 3 }],
    personalisationFee: usd(0),
    shipping: { flatMinor: 500 },
    mode: "prepaid",
    policy: DOC_POLICY,
    ...overrides,
  };
}

/** Builds a 24-char hex id from a small number. */
export function id(n: number): string {
  return n.toString(16).padStart(24, "0");
}

export const PACKAGING_ID = id(1);

const WHITE = { name: "White", hex: "#ffffff" };

export function makePackaging(overrides: Partial<Packaging> = {}): Packaging {
  return {
    id: PACKAGING_ID,
    slug: "gift-box",
    name: "Gift box",
    description: "",
    layoutType: "grid",
    minItems: 2,
    maxItems: 4,
    capacityUnits: 8,
    wrapperColors: [WHITE],
    ribbonColors: [WHITE],
    layers: {},
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

export function makeItem(n: number, overrides: Partial<Item> = {}): Item {
  return {
    id: id(100 + n),
    name: `Item ${n}`,
    category: "sweets",
    shape: "bar",
    color: "#aa5500",
    sizeUnits: 2,
    personalizable: false,
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

export function pricedItem(item: Item, overrides: Partial<PricedItem> = {}): PricedItem {
  return { item, priceMinor: 1000, inStock: true, ...overrides };
}

export function pricedPackaging(
  packaging: Packaging,
  overrides: Partial<PricedPackaging> = {},
): PricedPackaging {
  return { packaging, priceMinor: 2500, inStock: true, ...overrides };
}

/** Catalog with the default packaging (2 to 4 items, capacity 8) and items 1..6 (2 units each). */
export function makeCatalog(overrides: Partial<CountryCatalog> = {}): CountryCatalog {
  return {
    country: "PK",
    currency: "PKR",
    packagings: [pricedPackaging(makePackaging())],
    items: [1, 2, 3, 4, 5, 6].map((n) => pricedItem(makeItem(n))),
    ...overrides,
  };
}

export function makeDesign(
  lines: ReadonlyArray<{ n: number; qty?: number }> = [{ n: 1 }, { n: 2 }],
  overrides: Partial<Design> = {},
): Design {
  return {
    packagingId: PACKAGING_ID,
    items: lines.map((line, slot) => ({ itemId: id(100 + line.n), qty: line.qty ?? 1, slot })),
    wrapperColor: "#ffffff",
    ribbonColor: "#ff0000",
    arrangementSeed: 1,
    personalisation: { cardMessage: "", recipientName: "", itemNames: {} },
    ...overrides,
  };
}
