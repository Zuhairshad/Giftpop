import { PublicCountrySchema } from "@giftpop/contracts";
import type { PublicCountry } from "@giftpop/contracts";
import { z } from "zod";

import { apiRequest } from "@/lib/api";

export type CountriesResult = { ok: true; countries: PublicCountry[] } | { ok: false };

/** Server-side read of `GET /countries` (live and coming soon). A failure is a value, not a crash. */
export async function loadCountries(): Promise<CountriesResult> {
  try {
    const countries = await apiRequest("/countries", z.array(PublicCountrySchema));
    return { ok: true, countries };
  } catch {
    return { ok: false };
  }
}
