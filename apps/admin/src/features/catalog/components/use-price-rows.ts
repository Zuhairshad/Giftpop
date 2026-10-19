"use client";

import type { Country, PriceEntry } from "@giftpop/contracts";
import { useState } from "react";

import { buildPriceRows, rowsToPriceEntries } from "../lib/price-grid";
import type { PriceRow } from "../lib/price-grid";

/** State for the price grid: the rows, their errors, and a check that turns them into a request. */
export function usePriceRows(countries: readonly Country[], prices: readonly PriceEntry[]) {
  const [rows, setRows] = useState<PriceRow[]>(() => buildPriceRows(countries, prices));
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** The entries to send, or null when a row is wrong (its error is then shown). */
  function validate(): PriceEntry[] | null {
    const result = rowsToPriceEntries(rows);
    if (!result.ok) {
      setErrors(result.errors);
      return null;
    }
    setErrors({});
    return result.entries;
  }

  /** After a save, every row that has a price now exists on the server. */
  function markSaved() {
    setRows((current) =>
      current.map((row) => ({ ...row, existing: row.existing || row.priceText.trim() !== "" })),
    );
  }

  return { rows, errors, setRows, validate, markSaved };
}
