import type { CountryCode } from "@giftpop/contracts";

import type { BuilderStep } from "./types";

/**
 * URL of the builder for a country, for example `/pk/build`, or `/pk/build?from=<shareId>` to
 * open it pre-filled from a saved design.
 */
export function builderHref(country: CountryCode, from?: string): string {
  const base = `/${country.toLowerCase()}/build`;
  return from === undefined ? base : `${base}?from=${encodeURIComponent(from)}`;
}

/**
 * @deprecated The builder is one route now: this returns `builderHref(country)` whatever the step,
 * so no link points at an old step URL. Use `builderHref` (and `goToQuestion`) instead.
 */
export function stepHref(country: CountryCode, _step: BuilderStep): string {
  return builderHref(country);
}
