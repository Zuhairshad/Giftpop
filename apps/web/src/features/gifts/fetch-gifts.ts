import { PublicTemplateSchema, type CountryCode, type PublicTemplate } from "@giftpop/contracts";
import { z } from "zod";

import { apiRequest } from "@/lib/api";

const REVALIDATE_SECONDS = 300;
const TIMEOUT_MS = 4000;

/** Each entry is validated alone, so one bad row is dropped instead of hiding the whole page. */
const ListSchema = z.array(z.unknown());

/** `apiRequest` only takes a `fetch`, so Next's data cache option rides in on this one. */
const cachedFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, next: { revalidate: REVALIDATE_SECONDS } });

export type GiftsResult = { ok: true; templates: PublicTemplate[] } | { ok: false };

/**
 * The country's whole ready-made list in the API's order (featured first). The page filters by
 * category itself, so one cached call serves every chip. Never throws: an outage is `{ ok: false }`
 * and the page shows its error state.
 */
export async function fetchGifts(country: CountryCode): Promise<GiftsResult> {
  try {
    const entries = await apiRequest(
      `/templates?country=${encodeURIComponent(country)}`,
      ListSchema,
      {
        // Not "no-store": that would switch off the revalidate window above.
        cache: "default",
        fetch: cachedFetch,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    const templates = entries.flatMap((entry) => {
      const parsed = PublicTemplateSchema.safeParse(entry);
      return parsed.success && parsed.data.country === country ? [parsed.data] : [];
    });
    return { ok: true, templates };
  } catch {
    console.warn("gifts: /templates unavailable");
    return { ok: false };
  }
}
