import type { PublicCountry } from "@giftpop/contracts";

/** Splits countries into live and coming soon, each sorted by name. */
export function groupCountries(countries: readonly PublicCountry[]): {
  live: PublicCountry[];
  comingSoon: PublicCountry[];
} {
  const byName = (a: PublicCountry, b: PublicCountry) => a.name.localeCompare(b.name, "en");
  return {
    live: countries.filter((country) => country.status === "live").sort(byName),
    comingSoon: countries.filter((country) => country.status === "coming_soon").sort(byName),
  };
}
