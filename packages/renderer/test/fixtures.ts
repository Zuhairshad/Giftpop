import type { Design, Item, Packaging } from "@giftpop/contracts";

export function objectId(n: number): string {
  return n.toString(16).padStart(24, "0");
}

export function makePackaging(overrides: Partial<Packaging> = {}): Packaging {
  return {
    id: objectId(9000),
    slug: "classic-bouquet",
    name: "Classic bouquet",
    description: "",
    kind: "box",
    layoutType: "bouquet-fan",
    minItems: 1,
    maxItems: 10,
    capacityUnits: 30,
    wrapperColors: [{ name: "Kraft", hex: "#c8a97e" }],
    ribbonColors: [{ name: "Red", hex: "#c0392b" }],
    layers: {},
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

const SHAPES: Item["shape"][] = [
  "bar",
  "bottle",
  "jar",
  "box",
  "mug",
  "flower",
  "card",
  "soft-toy",
  "balloon",
  "other",
];

export function makeItems(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({
    id: objectId(i + 1),
    name: `Item ${i + 1}`,
    category: "treats",
    shape: SHAPES[i % SHAPES.length] ?? "other",
    color: "#e08a9b",
    sizeUnits: 1,
    personalizable: false,
    active: true,
    sortOrder: i,
  }));
}

/** One line per item, qty 1, slots in item order. */
export function makeDesign(itemCount: number, seed = 1, qtyEach = 1): Design {
  return {
    packagingId: objectId(9000),
    items: makeItems(itemCount).map((item, slot) => ({ itemId: item.id, qty: qtyEach, slot })),
    wrapperColor: "#c8a97e",
    ribbonColor: "#c0392b",
    arrangementSeed: seed,
    personalisation: { cardMessage: "", recipientName: "", customRequest: "", itemNames: {} },
  };
}
