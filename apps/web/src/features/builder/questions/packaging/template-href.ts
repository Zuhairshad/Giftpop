import type { CountryCode } from "@giftpop/contracts";

/**
 * Where "Start from this" goes: the builder opens pre-filled from the saved gift
 * (`/pk/build?from=<shareId>`). The share id is read from the card model's own link, so the
 * home page's link format can change without this one breaking.
 */
export function templateStartHref(country: CountryCode, cardHref: string): string {
  const shareId = new URL(cardHref, "http://giftpop.invalid").searchParams.get("from");
  if (shareId === null || shareId === "") return cardHref;
  return `/${country.toLowerCase()}/build?from=${encodeURIComponent(shareId)}`;
}

/** The link's accessible name begins with its visible text ("Start from this"), per the lessons. */
export function templateLinkLabel(title: string): string {
  return `Start from this: ${title}`;
}
