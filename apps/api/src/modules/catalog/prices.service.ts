import type { CountryPrice, PriceEntry, PricesResponse } from "@giftpop/contracts";

import { AppError } from "../../lib/errors";
import { CountryModel } from "../countries/model";

import { toObjectId, toPriceDoc, toPriceEntry } from "./mappers";
import { CountryPriceModel, type CountryPriceDoc } from "./model";

/** Creates or replaces price rows, keyed by country plus item or packaging. Idempotent. */
export async function upsertPrices(prices: CountryPrice[]): Promise<void> {
  if (prices.length === 0) return;
  await CountryPriceModel.bulkWrite(
    prices.map(toPriceDoc).map(({ country, kind, targetId, priceMinor, inStock, stockQty }) => ({
      updateOne: {
        filter: { country, kind, targetId },
        // `stockQty` is only written when given, so saving prices never wipes a count.
        update: { $set: { priceMinor, inStock, ...(stockQty === undefined ? {} : { stockQty }) } },
        upsert: true,
      },
    })),
  );
}

/** Every price row for one item or packaging, ordered by country code. */
export async function listPrices(
  kind: CountryPriceDoc["kind"],
  targetId: string,
): Promise<PricesResponse> {
  const docs = await CountryPriceModel.find({ kind, targetId: toObjectId(targetId) })
    .sort({ country: 1 })
    .lean<CountryPriceDoc[]>();
  return { prices: docs.map(toPriceEntry) };
}

/**
 * Bulk upsert for one item or packaging across countries. Rows for countries not
 * in `entries` are left alone. Rejects the whole request (422) if any country
 * does not exist, so nothing is half-saved.
 */
export async function setPrices(
  kind: CountryPriceDoc["kind"],
  targetId: string,
  entries: PriceEntry[],
): Promise<PricesResponse> {
  const codes = entries.map((entry) => entry.country);
  const known = await CountryModel.find({ code: { $in: codes } })
    .select({ code: 1 })
    .lean<{ code: string }[]>();
  const knownCodes = new Set(known.map((country) => country.code));
  const unknown = codes.filter((code) => !knownCodes.has(code));
  if (unknown.length > 0) {
    throw new AppError("VALIDATION_ERROR", 422, `Unknown countries: ${unknown.join(", ")}`, {
      countries: unknown,
    });
  }

  await upsertPrices(
    entries.map((entry): CountryPrice =>
      kind === "item"
        ? { ...entry, kind, itemId: targetId }
        : { ...entry, kind, packagingId: targetId },
    ),
  );
  return listPrices(kind, targetId);
}
