import type { CountryCode } from "@giftpop/contracts";

type LanguageTag = { tag: string; q: number; order: number };

function parseAcceptLanguage(header: string): LanguageTag[] {
  const tags: LanguageTag[] = [];
  header.split(",").forEach((part, order) => {
    const [rawTag, ...params] = part.trim().split(";");
    const tag = rawTag?.trim() ?? "";
    if (!tag || tag === "*") return;
    let q = 1;
    for (const param of params) {
      const match = /^\s*q\s*=\s*([0-9.]+)\s*$/i.exec(param);
      if (match?.[1] !== undefined) {
        const parsed = Number(match[1]);
        q = Number.isFinite(parsed) ? parsed : 0;
      }
    }
    if (q > 0) tags.push({ tag, q, order });
  });
  return tags.sort((a, b) => b.q - a.q || a.order - b.order);
}

/** The region subtag of a language tag ("en-PK" gives PK, "zh-Hans-CN" gives CN), or null. */
function regionOf(tag: string): string | null {
  const [, ...subtags] = tag.split("-");
  const region = subtags.find((subtag) => /^[A-Za-z]{2}$/.test(subtag));
  return region ? region.toUpperCase() : null;
}

/**
 * Picks a country to suggest from an `Accept-Language` header. Only regions that are live count.
 * Returns null when nothing matches. No IP lookup: the visitor always confirms the suggestion.
 */
export function suggestCountry(
  acceptLanguage: string | null | undefined,
  liveCodes: readonly string[],
): CountryCode | null {
  if (!acceptLanguage) return null;
  for (const { tag } of parseAcceptLanguage(acceptLanguage)) {
    const region = regionOf(tag);
    if (region && liveCodes.includes(region)) return region;
  }
  return null;
}
