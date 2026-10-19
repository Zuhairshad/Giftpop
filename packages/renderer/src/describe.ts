import type { Design, Item, Packaging } from "@giftpop/contracts";

/** What a scene draws for an item the catalog list does not contain. */
export const FALLBACK_ITEM = { name: "Unknown item", shape: "other", color: "#b8b8b8" } as const;

/** Describes the gift for assistive tech, for example "Gift in Classic bouquet: 2 x Rose, 1 x Chocolate bar". */
export function describeGift(design: Design, packaging: Packaging, items: readonly Item[]): string {
  const byId = new Map(items.map((item) => [item.id, item]));
  const lines = [...design.items]
    .sort((a, b) => a.slot - b.slot)
    .map((line) => `${line.qty} x ${byId.get(line.itemId)?.name ?? FALLBACK_ITEM.name}`);
  return `Gift in ${packaging.name}: ${lines.length > 0 ? lines.join(", ") : "no items yet"}`;
}
