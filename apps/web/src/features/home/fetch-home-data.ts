import {
  CatalogResponseSchema,
  type CatalogResponse,
  type CountryCode,
  PublicCountrySchema,
  type PublicCountry,
  PublicTemplateSchema,
  type PublicTemplate,
} from "@giftpop/contracts";
import { z } from "zod";

import { parseServerEnv } from "@/lib/env";

const REVALIDATE_SECONDS = 300;
const TIMEOUT_MS = 4000;

/** Accepts a bare array or `{ templates: [...] }`; each entry is validated alone so one bad row is dropped. */
const ListSchema = z.union([
  z.array(z.unknown()),
  z.object({ templates: z.array(z.unknown()) }).transform((body) => body.templates),
]);

/**
 * GET one API path with Next's data cache (`next.revalidate`). Returns `null` on any failure
 * (network, timeout, non-2xx, bad JSON) so the caller hides the section. Logs only the path.
 */
async function getJson(path: string): Promise<unknown> {
  try {
    const response = await fetch(`${parseServerEnv().API_URL}/v1${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn(`home: ${path.split("?")[0]} answered ${response.status}`);
      return null;
    }
    return (await response.json()) as unknown;
  } catch {
    console.warn(`home: ${path.split("?")[0]} unavailable`);
    return null;
  }
}

export async function fetchTemplates(country: CountryCode): Promise<PublicTemplate[] | null> {
  const list = ListSchema.safeParse(
    await getJson(`/templates?country=${encodeURIComponent(country)}`),
  );
  if (!list.success) return null;
  return list.data.flatMap((entry) => {
    const parsed = PublicTemplateSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function fetchCatalog(country: CountryCode): Promise<CatalogResponse | null> {
  const parsed = CatalogResponseSchema.safeParse(
    await getJson(`/catalog?country=${encodeURIComponent(country)}`),
  );
  return parsed.success ? parsed.data : null;
}

export async function fetchCountry(code: CountryCode): Promise<PublicCountry | null> {
  const list = z.array(z.unknown()).safeParse(await getJson("/countries"));
  if (!list.success) return null;
  for (const entry of list.data) {
    const parsed = PublicCountrySchema.safeParse(entry);
    if (parsed.success && parsed.data.code === code) return parsed.data;
  }
  return null;
}
