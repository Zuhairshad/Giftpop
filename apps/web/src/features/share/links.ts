import type { CountryCode, ShareId } from "@giftpop/contracts";

import { builderHref } from "@/features/builder/state";

/** Path of the shared gift page, for example `/g/abc123XYZ_`. */
export function shareHref(shareId: ShareId): string {
  return `/g/${shareId}`;
}

/** Absolute share link. `origin` comes from `window.location.origin` in the browser. */
export function shareUrl(origin: string, shareId: ShareId): string {
  return `${origin.replace(/\/+$/, "")}${shareHref(shareId)}`;
}

/** "Order this gift": the builder loads the shared design from `?from=`. */
export function orderThisGiftHref(country: CountryCode, shareId: ShareId): string {
  return builderHref(country, shareId);
}

/** "Make your own": an empty builder. */
export function makeYourOwnHref(country: CountryCode): string {
  return builderHref(country);
}

/** Checkout page (arrives in phase 3). */
export function checkoutHref(country: CountryCode): string {
  return `/${country.toLowerCase()}/checkout`;
}
