import { CountryCodeSchema } from "@giftpop/contracts";
import type { CountryCode } from "@giftpop/contracts";

/** Reads a `[country]` URL segment ("pk", "PK") as a country code, or null if it cannot be one. */
export function parseCountryParam(raw: string): CountryCode | null {
  const result = CountryCodeSchema.safeParse(raw.toUpperCase());
  return result.success ? result.data : null;
}
