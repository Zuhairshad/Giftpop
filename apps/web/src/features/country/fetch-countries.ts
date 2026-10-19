import { PublicCountrySchema } from "@giftpop/contracts";
import type { PublicCountry } from "@giftpop/contracts";
import { z } from "zod";

import { parseServerEnv } from "@/lib/env";

const CountriesSchema = z.array(PublicCountrySchema);

/**
 * Lists every country (live and coming soon) for server components, cached for five minutes.
 * `apiRequest` does not pass `next` options, so this does its own fetch and schema parse.
 * Returns an empty list when the API is down, so a page chrome never breaks on it.
 */
export async function fetchCountries(): Promise<PublicCountry[]> {
  const result = await fetchCountriesOrThrow().catch(() => null);
  return result ?? [];
}

/** Same as `fetchCountries` but lets the page show an error state. */
export async function fetchCountriesOrThrow(): Promise<PublicCountry[]> {
  const response = await fetch(`${parseServerEnv().API_URL}/v1/countries`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Countries request failed with ${response.status}`);
  return CountriesSchema.parse(await response.json());
}
