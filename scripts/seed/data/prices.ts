import type { CountryPrice } from "@giftpop/contracts";

import { COUNTRIES } from "./countries";
import { ITEM_IDS, ITEMS, type ItemKey } from "./items";
import { BASKET_ID, BOUQUET_ID, BOX_ID, HAT_BOX_ID, MUG_ID, PACKAGINGS } from "./packagings";

/**
 * DEMO prices, replaced by the owner in the admin app. Each price is a whole number of "base
 * units" times the country's minor units per base unit. A base unit is roughly half a US dollar
 * of local shop price: the factors follow rough local price levels, not exchange rates, so a
 * chocolate bar is about USD 4, GBP 3.20, PKR 560 or INR 200. Every currency here has 2 minor
 * digits (`minorDigits`), and PKR, INR and TRY factors are whole major units so prices read
 * like shop prices. Nothing converts at runtime: every country stores its own price.
 */
const MINOR_PER_BASE_UNIT: Record<string, number> = {
  US: 50, // USD cents
  GB: 40, // GBP pence
  SA: 200, // SAR halala
  IN: 2500, // INR paise
  PK: 7000, // PKR paisa
  CN: 300, // CNY fen
  AU: 75, // AUD cents
  TR: 1200, // TRY kurus
  CA: 70, // CAD cents
};

const ITEM_BASE_PRICE: Record<ItemKey, number> = {
  milkBar: 8,
  darkBar: 10,
  truffleBox: 28,
  nameBar: 16,
  waferFingers: 6,
  caramelBar: 8,
  whiteBar: 8,
  chocAlmonds: 12,
  pinkRose: 6,
  whiteLily: 8,
  sunflower: 6,
  tulip: 6,
  satinRose: 8,
  babysBreath: 4,
  lavenderBunch: 6,
  roseParfum: 70,
  oudParfum: 90,
  bodyMist: 28,
  miniSpray: 18,
  deodorant: 12,
  candle: 30,
  roseCandle: 34,
  travelCandle: 16,
  teaLights: 6,
  diffuser: 36,
  barNecklace: 50,
  cloverBracelet: 40,
  pearlStuds: 30,
  charmKeychain: 8,
  bodyLotion: 24,
  lipGloss: 18,
  brushSet: 40,
  bathSalts: 20,
  scrunchies: 10,
  clawClip: 10,
  redVelvetCupcake: 8,
  vanillaCupcake: 8,
  cookieTin: 22,
  popcorn: 6,
  masalaCrisps: 4,
  gummyBears: 5,
  teddy: 32,
  plushBunny: 26,
  balloon: 8,
  starBalloon: 8,
  plushKeyring: 8,
  mug: 24,
  glassCup: 28,
  tumbler: 40,
  greetingCard: 6,
  photoFrame: 32,
  loveNote: 4,
  openWhenLetters: 12,
  giftWrap: 4,
  crunchyChips: 5,
  photoBar: 16,
  photoCard: 8,
  nameMug: 26,
  plushPuppy: 28,
  cheesePuffs: 5,
  chocPretzels: 8,
  cakeTopper: 6,
  waferRolls: 7,
  chocCoins: 9,
  satinScrunchie: 6,
  hairBow: 6,
  pillarCandle: 14,
  waxMelts: 10,
  polaroids: 10,
  frostedCup: 22,
  numberBalloon: 10,
};

const PACKAGING_BASE_PRICE: Record<string, number> = {
  [BOUQUET_ID]: 12,
  [BOX_ID]: 16,
  [HAT_BOX_ID]: 18,
  [BASKET_ID]: 20,
  [MUG_ID]: 10,
};

interface Gap {
  country: string;
  itemId: string;
}

/** Deliberate gaps so the builder's disabled reasons ("Out of stock", "Not available in ...") show. */
export const OUT_OF_STOCK: readonly Gap[] = [
  { country: "SA", itemId: ITEM_IDS.darkBar },
  { country: "GB", itemId: ITEM_IDS.roseParfum },
];
export const NO_PRICE: readonly Gap[] = [
  { country: "PK", itemId: ITEM_IDS.candle },
  { country: "CN", itemId: ITEM_IDS.balloon },
  { country: "AU", itemId: ITEM_IDS.masalaCrisps },
];

const KEY_BY_ID = new Map<string, ItemKey>(
  (Object.entries(ITEM_IDS) as [ItemKey, string][]).map(([key, id]) => [id, key]),
);

function lookup<K extends string>(table: Record<K, number>, key: K, what: string): number {
  const value: number | undefined = table[key];
  if (value === undefined) throw new Error(`No demo ${what} for ${key}`);
  return value;
}

function itemBasePrice(itemId: string): number {
  const key = KEY_BY_ID.get(itemId);
  if (key === undefined) throw new Error(`No item key for ${itemId}`);
  return lookup(ITEM_BASE_PRICE, key, "base price");
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
        priceMinor: itemBasePrice(item.id) * scale,
        inStock: !OUT_OF_STOCK.some(isGap),
      });
    }
  }
  return rows;
}

export const PRICES: CountryPrice[] = buildPrices();
