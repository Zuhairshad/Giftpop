import type { CountryPrice, Item, Packaging } from "@giftpop/contracts";

/** Creates the packaging or replaces it, keyed by `id`. Idempotent. */
export async function upsertPackaging(_packaging: Packaging): Promise<Packaging> {
  throw new Error("not implemented");
}

/** Creates the item or replaces it, keyed by `id`. Idempotent. */
export async function upsertItem(_item: Item): Promise<Item> {
  throw new Error("not implemented");
}

/** Creates or replaces price rows, keyed by country plus item or packaging. Idempotent. */
export async function upsertPrices(_prices: CountryPrice[]): Promise<void> {
  throw new Error("not implemented");
}
