import type { PublicCountry } from "@giftpop/contracts";

/** Every country by name, for the brand form. */
export function sortByName(countries: readonly PublicCountry[]): PublicCountry[] {
  return [...countries].sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/** Countries a person can ask us to launch in: anything that is not live yet. */
export function notLiveCountries(countries: readonly PublicCountry[]): PublicCountry[] {
  return sortByName(countries.filter((country) => country.status !== "live"));
}

/**
 * The `?country=XX` prefill rule: use it only when it names a country in `available`
 * (case-insensitive). Anything else, including a live country or a list, means no prefill.
 */
export function prefillCountry(
  param: string | string[] | undefined,
  available: readonly PublicCountry[],
): string {
  if (typeof param !== "string") return "";
  const code = param.trim().toUpperCase();
  return available.some((country) => country.code === code) ? code : "";
}
