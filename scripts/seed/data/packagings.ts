import type { Packaging } from "@giftpop/contracts";

/** Fixed ids so re-running the seed updates the same documents. */
export const BOUQUET_ID = "65a000000000000000000001";
export const BOX_ID = "65a000000000000000000002";

export const PACKAGINGS: Packaging[] = [
  {
    id: BOUQUET_ID,
    slug: "bouquet",
    name: "Bouquet",
    description: "Wrapped in paper and tied with a ribbon. Pick 6 to 10 items.",
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
];
