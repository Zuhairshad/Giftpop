import type { Design, TemplateCategory } from "@giftpop/contracts";

import { COUNTRIES } from "./countries";
import { ITEM_IDS, type ItemKey } from "./items";
import {
  BALLOON_GIFT_ID,
  BASKET_ID,
  BOUQUET_ID,
  BOX_ID,
  FRAMED_GIFT_ID,
  GIFT_TRAY_ID,
  HAT_BOX_ID,
  HEART_BOX_ID,
  MUG_ID,
  PHOTO_BOUQUET_ID,
  SNACK_HAMPER_ID,
} from "./packagings";

/**
 * A ready-made gift the seed writes to `featuredTemplates`. Fixed `id` and `shareId` so a second seed
 * run updates the same documents. `design` uses only seeded packagings and items, with every text
 * field left empty (the customer fills names and the card message at checkout).
 */
export interface SeedTemplate {
  id: string;
  shareId: string;
  title: string;
  description: string;
  category: TemplateCategory | null;
  featured: boolean;
  countries: string[];
  sortOrder: number;
  design: Design;
}

const BIRTHDAY: TemplateCategory = { slug: "birthday", name: "Birthday" };
const ANNIVERSARY: TemplateCategory = { slug: "anniversary", name: "Anniversary" };
const GRADUATION: TemplateCategory = { slug: "graduation", name: "Graduation" };
const THANK_YOU: TemplateCategory = { slug: "thank-you", name: "Thank you" };
const GET_WELL: TemplateCategory = { slug: "get-well", name: "Get well" };

/** Every live country: each gift below only uses items priced and in stock in all of them. */
const LIVE_COUNTRIES = COUNTRIES.filter((country) => country.status === "live").map(
  (country) => country.code,
);

type Line = readonly [item: ItemKey, qty: number];

/** Text fields stay empty: the customer fills names and the card message at checkout. */
function design(
  packagingId: string,
  wrapperColor: string,
  ribbonColor: string,
  arrangementSeed: number,
  lines: readonly Line[],
): Design {
  return {
    packagingId,
    items: lines.map(([item, qty], slot) => ({ itemId: ITEM_IDS[item], qty, slot })),
    wrapperColor,
    ribbonColor,
    arrangementSeed,
    personalisation: { cardMessage: "", recipientName: "", customRequest: "", itemNames: {} },
  };
}

const BLUSH = "#f9c6d3";
const KRAFT = "#c8a27a";
const IVORY = "#f7f1e5";
const SAGE = "#b7c9b0";
const LAVENDER = "#c9b2f2";
const CREAM = "#f3ead8";
const RUBY = "#b3203f";
const HOT_PINK = "#e8467c";
const GOLD = "#d4a82f";
const WHITE = "#ffffff";
const FOREST = "#2f5d46";

interface Row {
  n: number;
  shareId: string;
  title: string;
  description: string;
  category: TemplateCategory;
  featured?: boolean;
  design: Design;
}

/**
 * Items avoided on purpose because a demo price gap hides them in one country (see prices.ts):
 * dark chocolate bar (SA), rose perfume (GB), vanilla candle (PK), heart balloon (CN), masala
 * crisps (AU). That keeps every gift sellable in all nine live countries.
 */
const ROWS: Row[] = [
  {
    n: 1,
    shareId: "gift-bday-choc-bouquet",
    title: "Birthday chocolate bouquet",
    description:
      "Six kinds of chocolate and a gold star balloon, wrapped like flowers with a card.",
    category: BIRTHDAY,
    featured: true,
    design: design(BOUQUET_ID, BLUSH, HOT_PINK, 1101, [
      ["milkBar", 1],
      ["caramelBar", 1],
      ["whiteBar", 1],
      ["waferFingers", 1],
      ["chocAlmonds", 1],
      ["starBalloon", 1],
      ["greetingCard", 1],
    ]),
  },
  {
    n: 2,
    shareId: "gift-bday-cupcake-box",
    title: "Birthday cupcake box",
    description: "Four cupcakes with a cake topper, gummy bears and a card, all in one box.",
    category: BIRTHDAY,
    design: design(BOX_ID, CREAM, GOLD, 1102, [
      ["redVelvetCupcake", 2],
      ["vanillaCupcake", 2],
      ["cakeTopper", 1],
      ["gummyBears", 1],
      ["greetingCard", 1],
    ]),
  },
  {
    n: 3,
    shareId: "gift-bday-balloon-pop",
    title: "Birthday balloon surprise",
    description:
      "A star balloon and a number balloon over a plush bunny, a chocolate bar and a card.",
    category: BIRTHDAY,
    design: design(BALLOON_GIFT_ID, LAVENDER, HOT_PINK, 1103, [
      ["starBalloon", 1],
      ["numberBalloon", 1],
      ["plushBunny", 1],
      ["milkBar", 1],
      ["greetingCard", 1],
    ]),
  },
  {
    n: 4,
    shareId: "gift-bday-party-snacks",
    title: "Birthday party snack hamper",
    description:
      "Popcorn, chips, cheese puffs, gummy bears, pretzels and chocolate for a party night.",
    category: BIRTHDAY,
    design: design(SNACK_HAMPER_ID, KRAFT, FOREST, 1104, [
      ["popcorn", 1],
      ["crunchyChips", 1],
      ["cheesePuffs", 1],
      ["gummyBears", 1],
      ["chocPretzels", 1],
      ["waferRolls", 1],
      ["milkBar", 1],
    ]),
  },
  {
    n: 5,
    shareId: "gift-anniv-rose-heart",
    title: "Anniversary rose heart box",
    description:
      "Roses, hazelnut truffles, a rose candle and pearl earrings in a heart-shaped box.",
    category: ANNIVERSARY,
    featured: true,
    design: design(HEART_BOX_ID, RUBY, GOLD, 1105, [
      ["pinkRose", 2],
      ["truffleBox", 1],
      ["roseCandle", 1],
      ["pearlStuds", 1],
      ["loveNote", 1],
    ]),
  },
  {
    n: 6,
    shareId: "gift-anniv-photo-frame",
    title: "Anniversary photo frame",
    description: "A wooden frame with photo prints, truffles, a rose candle and a love note.",
    category: ANNIVERSARY,
    design: design(FRAMED_GIFT_ID, CREAM, GOLD, 1106, [
      ["photoFrame", 1],
      ["polaroids", 1],
      ["truffleBox", 1],
      ["roseCandle", 1],
      ["loveNote", 1],
    ]),
  },
  {
    n: 7,
    shareId: "gift-anniv-rose-bouquet",
    title: "Anniversary rose bouquet",
    description: "Pink and satin roses with baby's breath and a photo card, hand tied.",
    category: ANNIVERSARY,
    design: design(PHOTO_BOUQUET_ID, IVORY, HOT_PINK, 1107, [
      ["pinkRose", 3],
      ["satinRose", 2],
      ["babysBreath", 1],
      ["photoCard", 1],
    ]),
  },
  {
    n: 8,
    shareId: "gift-grad-gold-tray",
    title: "Graduation gold tray",
    description: "A travel tumbler, a cookie tin, gold chocolate coins and open-when letters.",
    category: GRADUATION,
    featured: true,
    design: design(GIFT_TRAY_ID, CREAM, GOLD, 1108, [
      ["tumbler", 1],
      ["cookieTin", 1],
      ["chocCoins", 1],
      ["openWhenLetters", 1],
      ["greetingCard", 1],
    ]),
  },
  {
    n: 9,
    shareId: "gift-grad-party-basket",
    title: "Graduation celebration basket",
    description: "Sunflowers, a tumbler, cookies and gold coins in a basket to mark the big day.",
    category: GRADUATION,
    design: design(BASKET_ID, KRAFT, GOLD, 1109, [
      ["tumbler", 1],
      ["cookieTin", 1],
      ["chocCoins", 1],
      ["sunflower", 2],
      ["charmKeychain", 1],
      ["greetingCard", 1],
    ]),
  },
  {
    n: 10,
    shareId: "gift-grad-mug-bouquet",
    title: "Graduation mug bouquet",
    description: "A name mug filled with gold coins, a star balloon and a card.",
    category: GRADUATION,
    design: design(MUG_ID, KRAFT, GOLD, 1110, [
      ["nameMug", 1],
      ["chocCoins", 1],
      ["starBalloon", 1],
      ["greetingCard", 1],
    ]),
  },
  {
    n: 11,
    shareId: "gift-thanks-sunflowers",
    title: "Thank-you sunflower mug",
    description: "A ceramic mug with two sunflowers and a chocolate bar, to say thanks.",
    category: THANK_YOU,
    design: design(MUG_ID, BLUSH, GOLD, 1111, [
      ["mug", 1],
      ["sunflower", 2],
      ["milkBar", 1],
    ]),
  },
  {
    n: 12,
    shareId: "gift-thanks-treats-box",
    title: "Thank-you treats hat box",
    description: "A cookie tin, two chocolate bars, tea lights and lavender in a round hat box.",
    category: THANK_YOU,
    design: design(HAT_BOX_ID, CREAM, GOLD, 1112, [
      ["cookieTin", 1],
      ["whiteBar", 1],
      ["caramelBar", 1],
      ["teaLights", 1],
      ["lavenderBunch", 1],
      ["greetingCard", 1],
    ]),
  },
  {
    n: 13,
    shareId: "gift-thanks-candle-bath",
    title: "Thank-you candle and bath basket",
    description: "A rose candle, bath salts, body lotion and pretzels for a quiet evening.",
    category: THANK_YOU,
    design: design(BASKET_ID, LAVENDER, WHITE, 1113, [
      ["roseCandle", 1],
      ["bathSalts", 1],
      ["bodyLotion", 1],
      ["travelCandle", 1],
      ["chocPretzels", 1],
      ["greetingCard", 1],
    ]),
  },
  {
    n: 14,
    shareId: "gift-well-sunshine",
    title: "Get well sunshine bouquet",
    description: "Sunflowers, red tulips and baby's breath with a card to brighten a sick day.",
    category: GET_WELL,
    featured: true,
    design: design(BOUQUET_ID, SAGE, GOLD, 1114, [
      ["sunflower", 3],
      ["tulip", 2],
      ["babysBreath", 1],
      ["greetingCard", 1],
    ]),
  },
  {
    n: 15,
    shareId: "gift-well-comfort-box",
    title: "Get well comfort box",
    description: "Bath salts, a travel candle, tea lights, a plush bunny and gummy bears.",
    category: GET_WELL,
    design: design(BOX_ID, CREAM, WHITE, 1115, [
      ["bathSalts", 1],
      ["travelCandle", 1],
      ["teaLights", 1],
      ["plushBunny", 1],
      ["gummyBears", 1],
      ["loveNote", 1],
    ]),
  },
  {
    n: 16,
    shareId: "gift-well-cheer-tray",
    title: "Get well cheer-up tray",
    description: "Popcorn, pretzels, gummy bears, lavender and open-when letters on a tray.",
    category: GET_WELL,
    design: design(GIFT_TRAY_ID, BLUSH, HOT_PINK, 1116, [
      ["popcorn", 1],
      ["chocPretzels", 1],
      ["gummyBears", 1],
      ["lavenderBunch", 1],
      ["openWhenLetters", 1],
    ]),
  },
];

/**
 * DEMO DATA, replaced by the owner in the admin app. Fixed ids (65b000000000000000000001 upward,
 * below the item ids that start at …101) and share ids, so re-running the seed updates the same
 * documents. The page order is category by category (sortOrder 10, 20, ...); staff picks go first.
 */
export const TEMPLATES: SeedTemplate[] = ROWS.map((row) => ({
  id: `65b${row.n.toString(16).padStart(21, "0")}`,
  shareId: row.shareId,
  title: row.title,
  description: row.description,
  category: row.category,
  featured: row.featured ?? false,
  countries: LIVE_COUNTRIES,
  sortOrder: row.n * 10,
  design: row.design,
}));
