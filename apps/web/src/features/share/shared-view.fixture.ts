import { SharedDesignViewSchema } from "@giftpop/contracts";
import type { SharedDesignView } from "@giftpop/contracts";

/** Test and dev data only. Never imported by production code. */
export const ID_PACKAGING = "aaaaaaaaaaaaaaaaaaaaaaaa";
export const ID_ROSE = "bbbbbbbbbbbbbbbbbbbbbbbb";
export const ID_MUG = "cccccccccccccccccccccccc";
export const ID_BAR = "dddddddddddddddddddddddd";

function item(id: string, name: string, shape: "flower" | "mug" | "bar") {
  return {
    id,
    name,
    category: "Gifts",
    shape,
    color: "#e8336d",
    sizeUnits: 1,
    personalizable: shape === "mug",
    ...(shape === "mug" ? { personalizationMaxLength: 20 } : {}),
    active: true,
    sortOrder: 0,
  };
}

/** A valid shared view. Pass overrides to change one part. */
export function makeSharedView(overrides: Partial<SharedDesignView> = {}): SharedDesignView {
  return SharedDesignViewSchema.parse({
    shareId: "abcdEFGH12",
    country: "PK",
    currency: "PKR",
    design: {
      packagingId: ID_PACKAGING,
      items: [
        { itemId: ID_MUG, qty: 1, slot: 1 },
        { itemId: ID_ROSE, qty: 3, slot: 0 },
        { itemId: ID_BAR, qty: 2, slot: 2 },
      ],
      wrapperColor: "#ffd3e0",
      ribbonColor: "#e8336d",
      arrangementSeed: 7,
      personalisation: {
        cardMessage: "Happy birthday!",
        recipientName: "Sara",
        itemNames: { [ID_MUG]: "Sara" },
      },
    },
    packaging: {
      id: ID_PACKAGING,
      slug: "classic-bouquet",
      name: "Classic bouquet",
      description: "",
      layoutType: "bouquet-fan",
      minItems: 3,
      maxItems: 10,
      capacityUnits: 12,
      wrapperColors: [{ name: "Blush", hex: "#ffd3e0" }],
      ribbonColors: [{ name: "Pink", hex: "#e8336d" }],
      layers: {},
      active: true,
      sortOrder: 0,
    },
    packagingAvailable: true,
    items: [
      item(ID_ROSE, "Rose", "flower"),
      item(ID_MUG, "Mug", "mug"),
      item(ID_BAR, "Chocolate", "bar"),
    ],
    unavailableItemIds: [],
    createdAt: "2026-10-19T10:00:00.000Z",
    ...overrides,
  });
}
