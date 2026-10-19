import type { Country } from "@giftpop/contracts";

/** Creates the country or replaces its settings, keyed by `code`. Idempotent. */
export async function upsertCountry(_country: Country): Promise<Country> {
  throw new Error("not implemented");
}
