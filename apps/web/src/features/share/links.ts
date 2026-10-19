import type { CountryCode, ShareId } from "@giftpop/contracts";

/** Path of the shared gift page, for example `/g/abc123XYZ_`. */
export function shareHref(shareId: ShareId): string {
  return `/g/${shareId}`;
}

/** Absolute share link. `origin` comes from `window.location.origin` in the browser. */
export function shareUrl(origin: string, shareId: ShareId): string {
  return `${origin.replace(/\/+$/, "")}${shareHref(shareId)}`;
}

/** "Order this gift": the review step loads the shared design from `?from=`. */
export function orderThisGiftHref(country: CountryCode, shareId: ShareId): string {
  return `/${country.toLowerCase()}/build/review?from=${encodeURIComponent(shareId)}`;
}

/** "Make your own": start the builder at the first step. */
export function makeYourOwnHref(country: CountryCode): string {
  return `/${country.toLowerCase()}/build/format`;
}

/** The review step without any `?from=`. */
export function reviewHref(country: CountryCode): string {
  return `/${country.toLowerCase()}/build/review`;
}

/** Checkout page (arrives in phase 3). */
export function checkoutHref(country: CountryCode): string {
  return `/${country.toLowerCase()}/checkout`;
}
