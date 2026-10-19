// Test helpers for the quotes and designs tests. Not imported by app code.
import type { Country, CountryPrice, Design, Item, Packaging } from "@giftpop/contracts";

import { initCatalogModels, makeItem, makePackaging } from "../catalog/fixtures";
import { upsertItem, upsertPackaging, upsertPrices } from "../catalog/service";
import { makeCountry } from "../countries/fixtures";
import { upsertCountry } from "../countries/service";

export { initCatalogModels };

export interface World {
  country: Country;
  packaging: Packaging;
  /** Priced 45_000 in the default PK world; size 1. */
  bar: Item;
  /** Priced 12_000; size 2. */
  soap: Item;
}

export interface WorldOptions {
  country?: Partial<Country>;
  packagingPriceMinor?: number;
  barPriceMinor?: number;
  soapPriceMinor?: number;
}

/**
 * One live country with one packaging (pick 2 to 4 items, 8 units) and two
 * priced items. Defaults are PK-style: prices in paisa-like minor units.
 */
export async function seedWorld(options: WorldOptions = {}): Promise<World> {
  const country = await upsertCountry(makeCountry(options.country));
  const packaging = await upsertPackaging(
    makePackaging({ name: "Box", minItems: 2, maxItems: 4, capacityUnits: 8 }),
  );
  const bar = await upsertItem(makeItem({ name: "Bar", sizeUnits: 1 }));
  const soap = await upsertItem(makeItem({ name: "Soap", sizeUnits: 2, category: "care" }));
  await upsertPrices([
    {
      kind: "packaging",
      packagingId: packaging.id,
      country: country.code,
      priceMinor: options.packagingPriceMinor ?? 90_000,
      inStock: true,
    },
    {
      kind: "item",
      itemId: bar.id,
      country: country.code,
      priceMinor: options.barPriceMinor ?? 45_000,
      inStock: true,
    },
    {
      kind: "item",
      itemId: soap.id,
      country: country.code,
      priceMinor: options.soapPriceMinor ?? 12_000,
      inStock: true,
    },
  ]);
  return { country, packaging, bar, soap };
}

export function itemPrice(
  item: Item,
  country: string,
  priceMinor: number,
  inStock = true,
): CountryPrice {
  return { kind: "item", itemId: item.id, country, priceMinor, inStock };
}

/** A design with one line per `[item, qty]`, slotted in order. */
export function makeDesign(
  packaging: Packaging,
  lines: ReadonlyArray<readonly [Item, number]>,
  overrides: Partial<Design> = {},
): Design {
  return {
    packagingId: packaging.id,
    items: lines.map(([item, qty], slot) => ({ itemId: item.id, qty, slot })),
    wrapperColor: "#c9a977",
    ribbonColor: "#c0392b",
    arrangementSeed: 7,
    personalisation: { cardMessage: "Happy birthday", recipientName: "Sara", itemNames: {} },
    ...overrides,
  };
}
