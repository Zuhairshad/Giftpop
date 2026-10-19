import type { CountryCode } from "@giftpop/contracts";

/**
 * URL of the builder for a country, for example `/pk/build`, or `/pk/build?from=<shareId>` to
 * open it pre-filled from a saved design.
 */
export function builderHref(country: CountryCode, from?: string): string {
  const base = `/${country.toLowerCase()}/build`;
  return from === undefined ? base : `${base}?from=${encodeURIComponent(from)}`;
}
