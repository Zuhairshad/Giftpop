import type { Country } from "@giftpop/contracts";

export interface CountryChoice {
  code: string;
  name: string;
  /** False for a selected country that is no longer live: it can be removed but not re-added. */
  live: boolean;
}

/** Live countries, plus any already selected country that is not live (or not known). */
export function countryChoices(
  countries: readonly Country[],
  selected: readonly string[],
): CountryChoice[] {
  const choices: CountryChoice[] = countries
    .filter((country) => country.status === "live")
    .map((country) => ({ code: country.code, name: country.name, live: true }));
  for (const code of selected) {
    if (choices.some((choice) => choice.code === code)) continue;
    const known = countries.find((country) => country.code === code);
    choices.push({ code, name: known?.name ?? code, live: false });
  }
  return choices;
}

/** Adds or removes a code, keeping the order of `order`. */
export function toggleCountry(
  selected: readonly string[],
  code: string,
  checked: boolean,
  order: readonly string[],
): string[] {
  const next = new Set(selected);
  if (checked) next.add(code);
  else next.delete(code);
  return order.filter((item) => next.has(item));
}
