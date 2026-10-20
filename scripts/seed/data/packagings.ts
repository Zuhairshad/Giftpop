import type { Packaging } from "@giftpop/contracts";

/**
 * DEMO DATA, replaced by the owner in the admin app. Fixed ids so re-running the seed updates the
 * same documents. Capacities are checked in data.test.ts against the largest item size (3 units):
 * any `minItems` items always fit, and `maxItems` small items fit in every live country.
 */
export const BOUQUET_ID = "65a000000000000000000001";
export const BOX_ID = "65a000000000000000000002";
export const HAT_BOX_ID = "65a000000000000000000003";
export const BASKET_ID = "65a000000000000000000004";
export const MUG_ID = "65a000000000000000000005";
export const HEART_BOX_ID = "65a000000000000000000006";
export const FRAMED_GIFT_ID = "65a000000000000000000007";
export const SNACK_HAMPER_ID = "65a000000000000000000008";
export const PHOTO_BOUQUET_ID = "65a000000000000000000009";
export const GIFT_TRAY_ID = "65a00000000000000000000a";

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
    // Ten 1-unit items take 10 units; six of the largest (3-unit) items take 18.
    capacityUnits: 18,
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
    // Nine 1-unit items take 9 units; four 3-unit items take 12.
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
    // Eight 1-unit items take 8 units; five 3-unit items take 15.
    capacityUnits: 15,
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
    layoutType: "basket",
    minItems: 6,
    maxItems: 9,
    // Nine 1-unit items take 9 units; six 3-unit items take 18.
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
    layoutType: "mug-bouquet",
    minItems: 3,
    maxItems: 5,
    // Five 1-unit items take 5 units; three 3-unit items take 9.
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
  {
    id: HEART_BOX_ID,
    slug: "heart-box",
    name: "Heart box",
    description: "A heart-shaped box with the gifts nestled inside. Pick 5 to 8 items.",
    kind: "box",
    layoutType: "heart-box",
    minItems: 5,
    maxItems: 8,
    // Eight 1-unit items take 8 units; five 3-unit items take 15.
    capacityUnits: 15,
    wrapperColors: [
      { name: "Blush pink", hex: "#f9c6d3" },
      { name: "Ruby red", hex: "#b3203f" },
      { name: "Cream", hex: "#f3ead8" },
    ],
    ribbonColors: [
      { name: "Hot pink", hex: "#e8467c" },
      { name: "Gold", hex: "#d4a82f" },
      { name: "White", hex: "#ffffff" },
    ],
    layers: {},
    active: true,
    sortOrder: 6,
  },
  {
    id: FRAMED_GIFT_ID,
    slug: "framed-gift",
    name: "Framed gift",
    description: "A framed keepsake with small gifts set around it. Pick 3 to 6 items.",
    kind: "box",
    layoutType: "box-grid",
    minItems: 3,
    maxItems: 6,
    // Six 1-unit items take 6 units; three 3-unit items take 9.
    capacityUnits: 10,
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
    sortOrder: 7,
  },
  {
    id: SNACK_HAMPER_ID,
    slug: "snack-hamper",
    name: "Snack hamper",
    description: "A tray-style hamper packed with snacks and treats. Pick 6 to 10 items.",
    kind: "box",
    layoutType: "box-grid",
    minItems: 6,
    maxItems: 10,
    // Ten 1-unit items take 10 units; six 3-unit items take 18.
    capacityUnits: 20,
    wrapperColors: [
      { name: "Blush pink", hex: "#f9c6d3" },
      { name: "Kraft", hex: "#c8a27a" },
      { name: "Sage", hex: "#b7c9b0" },
    ],
    ribbonColors: [
      { name: "Hot pink", hex: "#e8467c" },
      { name: "Gold", hex: "#d4a82f" },
      { name: "Forest", hex: "#2f5d46" },
    ],
    layers: {},
    active: true,
    sortOrder: 8,
  },
  {
    id: PHOTO_BOUQUET_ID,
    slug: "photo-bouquet",
    name: "Photo bouquet",
    description: "A bouquet with a photo card tucked in the middle. Pick 5 to 8 items.",
    kind: "bouquet",
    layoutType: "bouquet-fan",
    minItems: 5,
    maxItems: 8,
    // Eight 1-unit items take 8 units; five 3-unit items take 15.
    capacityUnits: 16,
    wrapperColors: [
      { name: "Blush pink", hex: "#f9c6d3" },
      { name: "Ivory", hex: "#f7f1e5" },
      { name: "Lavender", hex: "#c9b2f2" },
    ],
    ribbonColors: [
      { name: "Hot pink", hex: "#e8467c" },
      { name: "Gold", hex: "#d4a82f" },
      { name: "White", hex: "#ffffff" },
    ],
    layers: {},
    active: true,
    sortOrder: 9,
  },
  {
    id: GIFT_TRAY_ID,
    slug: "gift-tray",
    name: "Gift tray",
    description: "A serving tray laid out with gifts, wrapped in clear film. Pick 4 to 7 items.",
    kind: "basket",
    layoutType: "basket",
    minItems: 4,
    maxItems: 7,
    // Seven 1-unit items take 7 units; four 3-unit items take 12.
    capacityUnits: 14,
    wrapperColors: [
      { name: "Blush pink", hex: "#f9c6d3" },
      { name: "Kraft", hex: "#c8a27a" },
      { name: "Cream", hex: "#f3ead8" },
    ],
    ribbonColors: [
      { name: "Hot pink", hex: "#e8467c" },
      { name: "Gold", hex: "#d4a82f" },
      { name: "White", hex: "#ffffff" },
    ],
    layers: {},
    active: true,
    sortOrder: 10,
  },
];
