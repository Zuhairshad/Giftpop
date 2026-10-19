import type { Design, DesignItem, Packaging, PricedItem } from "@giftpop/contracts";

/** Fixed, so a format card always shows the same arrangement. */
const SAMPLE_SEED = 7;
const SAMPLE_MIN = 3;
const SAMPLE_MAX = 6;

/** Number of items a preview shows: enough to look real, never more than the format holds. */
export function sampleItemCount(packaging: Pick<Packaging, "minItems" | "maxItems">): number {
  const wanted = Math.max(SAMPLE_MIN, Math.min(packaging.minItems, SAMPLE_MAX));
  return Math.min(packaging.maxItems, wanted);
}

/**
 * Picks items round-robin across categories so the preview has variety, skipping anything
 * out of stock or too big for the space left. Deterministic: no randomness.
 */
function pickSampleItems(packaging: Packaging, items: readonly PricedItem[]): PricedItem[] {
  const buckets = new Map<string, PricedItem[]>();
  for (const entry of items) {
    if (!entry.item.active || !entry.inStock) continue;
    const bucket = buckets.get(entry.item.category) ?? [];
    bucket.push(entry);
    buckets.set(entry.item.category, bucket);
  }
  const queues = [...buckets.values()];

  const picked: PricedItem[] = [];
  const target = sampleItemCount(packaging);
  let usedUnits = 0;
  let progressed = true;
  while (picked.length < target && progressed) {
    progressed = false;
    for (const queue of queues) {
      const next = queue.shift();
      if (!next) continue;
      progressed = true;
      if (usedUnits + next.item.sizeUnits > packaging.capacityUnits) continue;
      picked.push(next);
      usedUnits += next.item.sizeUnits;
      if (picked.length >= target) break;
    }
  }
  return picked;
}

/**
 * A made-up design for a format card preview. Never sent to the server and never priced.
 * With no items in the catalog it is an empty design, which still draws the packaging.
 */
export function buildSampleDesign(packaging: Packaging, items: readonly PricedItem[]): Design {
  const lines: DesignItem[] = pickSampleItems(packaging, items).map((entry, slot) => ({
    itemId: entry.item.id,
    qty: 1,
    slot,
  }));
  return {
    packagingId: packaging.id,
    items: lines,
    wrapperColor: packaging.wrapperColors[0]?.hex ?? "#f7c6d4",
    ribbonColor: packaging.ribbonColors[0]?.hex ?? "#c41f56",
    arrangementSeed: SAMPLE_SEED,
    personalisation: { cardMessage: "", recipientName: "", itemNames: {} },
  };
}
