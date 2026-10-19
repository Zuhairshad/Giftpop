import type { CountryPrice } from "@giftpop/contracts";

import { COUNTRIES } from "./countries";
import { ITEM_IDS, ITEMS } from "./items";
import { BASKET_ID, BOUQUET_ID, BOX_ID, HAT_BOX_ID, MUG_ID, PACKAGINGS } from "./packagings";

/**
 * DEV ONLY prices. Each price is a whole number of "base units" times the
 * country's minor units per base unit. A base unit is roughly one US dollar and
 * the factors below are rough, made-up scales so magnitudes look right in each
 * currency (PKR in thousands, USD in single digits). Nothing converts at runtime:
 * every country stores its own price in its own currency.
 */
const MINOR_PER_BASE_UNIT: Record<string, number> = {
  US: 100, // USD cents
  GB: 80, // GBP pence
  SA: 375, // SAR halala
  IN: 8300, // INR paise
  PK: 28000, // PKR paisa
  CN: 720, // CNY fen
  AU: 150, // AUD cents
  TR: 3400, // TRY kurus
  CA: 135, // CAD cents
};

const ITEM_BASE_PRICE: Record<string, number> = {
  [ITEM_IDS.milkBar]: 4,
  [ITEM_IDS.darkBar]: 5,
  [ITEM_IDS.truffleBox]: 14,
  [ITEM_IDS.pinkRose]: 3,
  [ITEM_IDS.whiteLily]: 4,
  [ITEM_IDS.sunflower]: 3,
  [ITEM_IDS.tulip]: 3,
  [ITEM_IDS.bodyLotion]: 12,
  [ITEM_IDS.candle]: 15,
  [ITEM_IDS.bathSalts]: 10,
  [ITEM_IDS.mug]: 11,
  [ITEM_IDS.teddy]: 16,
  [ITEM_IDS.balloon]: 4,
  [ITEM_IDS.greetingCard]: 3,
  [ITEM_IDS.loveNote]: 2,
};

const PACKAGING_BASE_PRICE: Record<string, number> = {
  [BOUQUET_ID]: 6,
  [BOX_ID]: 8,
  [HAT_BOX_ID]: 9,
  [BASKET_ID]: 10,
  [MUG_ID]: 5,
};

interface Gap {
  country: string;
  itemId: string;
}

/** Deliberate gaps so the builder's disabled reasons ("Out of stock", "Not available in ...") can be tested. */
export const OUT_OF_STOCK: readonly Gap[] = [{ country: "SA", itemId: ITEM_IDS.darkBar }];
export const NO_PRICE: readonly Gap[] = [{ country: "PK", itemId: ITEM_IDS.candle }];

function lookup(table: Record<string, number>, key: string, what: string): number {
  const value = table[key];
  if (value === undefined) throw new Error(`No dev ${what} for ${key}`);
  return value;
}

export function buildPrices(): CountryPrice[] {
  const rows: CountryPrice[] = [];
  for (const country of COUNTRIES) {
    if (country.status !== "live") continue;
    const scale = lookup(MINOR_PER_BASE_UNIT, country.code, "price scale");
    for (const packaging of PACKAGINGS) {
      rows.push({
        kind: "packaging",
        packagingId: packaging.id,
        country: country.code,
        priceMinor: lookup(PACKAGING_BASE_PRICE, packaging.id, "base price") * scale,
        inStock: true,
      });
    }
    for (const item of ITEMS) {
      const isGap = (gap: Gap): boolean => gap.country === country.code && gap.itemId === item.id;
      if (NO_PRICE.some(isGap)) continue;
      rows.push({
        kind: "item",
        itemId: item.id,
        country: country.code,
        priceMinor: lookup(ITEM_BASE_PRICE, item.id, "base price") * scale,
        inStock: !OUT_OF_STOCK.some(isGap),
      });
    }
  }
  return rows;
}

export const PRICES: CountryPrice[] = buildPrices();
