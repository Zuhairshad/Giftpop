import type { Country, PriceEntry } from "@giftpop/contracts";

import { majorToMinor, minorToMajor } from "./minor-units";

/** One editable row of the per-country price and stock grid. */
export interface PriceRow {
  country: string;
  countryName: string;
  currency: string;
  /** What staff typed, in major units ("12.50"). Empty means not sold here. */
  priceText: string;
  inStock: boolean;
  /** The API already has a price row for this country. */
  existing: boolean;
}

/** One row per country, filled from the prices the API already holds. */
export function buildPriceRows(
  countries: readonly Country[],
  prices: readonly PriceEntry[],
): PriceRow[] {
  const byCountry = new Map(prices.map((entry) => [entry.country, entry]));
  return countries.map((country) => {
    const entry = byCountry.get(country.code);
    return {
      country: country.code,
      countryName: country.name,
      currency: country.currency,
      priceText: entry ? minorToMajor(entry.priceMinor) : "",
      inStock: entry ? entry.inStock : true,
      existing: entry !== undefined,
    };
  });
}

export type PriceRowsResult =
  { ok: true; entries: PriceEntry[] } | { ok: false; errors: Record<string, string> };

/**
 * Turns the grid into the bulk request. An empty price on a country with no saved
 * price is skipped. A saved price cannot be removed from here, so clearing one is an error.
 */
export function rowsToPriceEntries(rows: readonly PriceRow[]): PriceRowsResult {
  const entries: PriceEntry[] = [];
  const errors: Record<string, string> = {};

  for (const row of rows) {
    if (row.priceText.trim() === "") {
      if (row.existing) {
        errors[row.country] = "Enter a price. A saved price cannot be removed here.";
      }
      continue;
    }
    const priceMinor = majorToMinor(row.priceText);
    if (priceMinor === null) {
      errors[row.country] = "Enter an amount like 12.50.";
      continue;
    }
    entries.push({ country: row.country, priceMinor, inStock: row.inStock });
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, entries };
}
