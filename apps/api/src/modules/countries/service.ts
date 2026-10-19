import type {
  Country,
  CountryCode,
  CreateCountryRequest,
  PublicCountry,
  UpdateCountryRequest,
} from "@giftpop/contracts";

import { AppError, isDuplicateKeyError } from "../../lib/errors";

import { toCountry, toPublicCountry } from "./mappers";
import { CountryModel, type CountryDoc } from "./model";

/** Creates the country or replaces its settings, keyed by `code`. Idempotent. */
export async function upsertCountry(country: Country): Promise<Country> {
  const doc = await CountryModel.findOneAndReplace({ code: country.code }, country, {
    upsert: true,
    returnDocument: "after",
  }).lean<CountryDoc>();
  return toCountry(doc);
}

/** Every country, live and coming soon, without payment instructions. */
export async function listPublicCountries(): Promise<PublicCountry[]> {
  const docs = await CountryModel.find().sort({ name: 1 }).lean<CountryDoc[]>();
  return docs.map(toPublicCountry);
}

/** Every country with payment instructions, for staff. */
export async function listCountries(): Promise<Country[]> {
  const docs = await CountryModel.find().sort({ name: 1 }).lean<CountryDoc[]>();
  return docs.map(toCountry);
}

export async function createCountry(request: CreateCountryRequest): Promise<Country> {
  try {
    const created = await CountryModel.create(request);
    return toCountry(created.toObject());
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError("CONFLICT", 409, `Country ${request.code} already exists`);
    }
    throw error;
  }
}

/**
 * Merge-update: each field sent replaces that field; fields not sent are left alone.
 * Nested objects (`shipping`, `addressFormat`) are replaced whole.
 */
export async function updateCountry(
  code: CountryCode,
  patch: UpdateCountryRequest,
): Promise<Country> {
  const changes = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  );
  const query =
    Object.keys(changes).length === 0
      ? CountryModel.findOne({ code })
      : CountryModel.findOneAndUpdate({ code }, { $set: changes }, { returnDocument: "after" });
  const doc = await query.lean<CountryDoc>();
  if (!doc) throw new AppError("NOT_FOUND", 404, `No country with code ${code}`);
  return toCountry(doc);
}
