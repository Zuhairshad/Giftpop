import type { Packaging } from "@giftpop/contracts";

/** Fixed ids so re-running the seed updates the same documents. */
export const BOUQUET_ID = "65a000000000000000000001";
export const BOX_ID = "65a000000000000000000002";
export const HAT_BOX_ID = "65a000000000000000000003";
export const BASKET_ID = "65a000000000000000000004";
export const MUG_ID = "65a000000000000000000005";

export const PACKAGINGS: Packaging[] = [
  {
    id: BOUQUET_ID,
    slug: "bouquet",
    name: "Bouquet",
    description: "Wrapped in paper and tied with a ribbon. Pick 6 to 10 items.",
    kind: "bouquet",
    layoutType: "bouquet-fan",
    minItems: 6,
    maxItems: 10,
    // The 10 smallest items take 11 units; any 6 items take at most 14.
    capacityUnits: 16,
    wrapperColors: [
      { name: "Blush pink", hex: "#f9c6d3" },
      { name: "Kraft", hex: "#c8a27a" },
      { name: "Ivory", hex: "#f7f1e5" },
      { name: "Sage", hex: "#b7c9b0" },
      { name: "Lavender", hex: "#c9b2f2" },
    ],
    ribbonColors: [
      { name: "Hot pink", hex: "#e8467c" },
      { name: "Gold", hex: "#d4a82f" },
      { name: "White", hex: "#ffffff" },
      { name: "Forest", hex: "#2f5d46" },
    ],
    layers: {},
    active: true,
    sortOrder: 1,
  },
  {
    id: BOX_ID,
    slug: "gift-box",
    name: "Gift box",
    description: "A box with compartments, tied with a ribbon. Pick 4 to 9 items.",
    kind: "box",
    layoutType: "box-grid",
    minItems: 4,
    maxItems: 9,
    // The 9 smallest items take 9 units; any 4 items take at most 11.
    capacityUnits: 18,
    wrapperColors: [
      { name: "Blush pink", hex: "#f9c6d3" },
      { name: "Cream", hex: "#f3ead8" },
      { name: "Charcoal", hex: "#3b3b3f" },
    ],
    ribbonColors: [
      { name: "Hot pink", hex: "#e8467c" },
      { name: "Gold", hex: "#d4a82f" },
      { name: "White", hex: "#ffffff" },
    ],
    layers: {},
    active: true,
    sortOrder: 2,
  },
  {
    id: HAT_BOX_ID,
    slug: "round-hat-box",
    name: "Round hat box",
    description: "A round box with the gifts standing in tissue. Pick 5 to 8 items.",
    kind: "box",
    layoutType: "round-box",
    minItems: 5,
    maxItems: 8,
    // The 8 smallest items take 8 units; any 5 items take at most 12.
    capacityUnits: 14,
    wrapperColors: [
      { name: "Blush pink", hex: "#f9c6d3" },
      { name: "Noir", hex: "#2b1e33" },
      { name: "Cream", hex: "#f3ead8" },
    ],
    ribbonColors: [
      { name: "Hot pink", hex: "#e8467c" },
      { name: "Gold", hex: "#d4a82f" },
      { name: "Lavender", hex: "#9468e8" },
    ],
    layers: {},
    active: true,
    sortOrder: 3,
  },
  {
    id: BASKET_ID,
    slug: "gift-basket",
    name: "Gift basket",
    description: "A woven basket packed full, tied with a ribbon. Pick 6 to 9 items.",
    kind: "basket",
    layoutType: "box-grid",
    minItems: 6,
    maxItems: 9,
    // The 9 smallest items take 9 units; any 6 items take at most 14.
    capacityUnits: 20,
    wrapperColors: [
      { name: "Blush pink", hex: "#f9c6d3" },
      { name: "Kraft", hex: "#c8a27a" },
      { name: "Lavender", hex: "#c9b2f2" },
    ],
    ribbonColors: [
      { name: "Hot pink", hex: "#e8467c" },
      { name: "Gold", hex: "#d4a82f" },
      { name: "White", hex: "#ffffff" },
    ],
    layers: {},
    active: true,
    sortOrder: 4,
  },
  {
    id: MUG_ID,
    slug: "mug-bouquet",
    name: "Mug bouquet",
    description: "A small bouquet tucked into a mug. Pick 3 to 5 items.",
    kind: "mug",
    layoutType: "bouquet-fan",
    minItems: 3,
    maxItems: 5,
    // The 5 smallest items take 5 units; any 3 items take at most 8.
    capacityUnits: 9,
    wrapperColors: [
      { name: "Blush pink", hex: "#f9c6d3" },
      { name: "Kraft", hex: "#c8a27a" },
    ],
    ribbonColors: [
      { name: "Hot pink", hex: "#e8467c" },
      { name: "Gold", hex: "#d4a82f" },
    ],
    layers: {},
    active: true,
    sortOrder: 5,
  },
];
